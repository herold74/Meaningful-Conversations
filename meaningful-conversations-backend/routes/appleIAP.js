const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');
const {
  verifyTransaction,
  decodeNotificationPayload,
  decodeJWSPayload,
  mapAppleProduct,
  mapNotificationType,
  getAppleConfig,
} = require('../services/appleIAPService');

// POST /api/apple-iap/verify-receipt
// Called by the iOS app after a successful StoreKit 2 purchase
router.post('/verify-receipt', auth, async (req, res) => {
  try {
    const { transactionId, productId } = req.body;
    if (!transactionId || !productId) {
      return res.status(400).json({ error: 'Missing transactionId or productId.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const existing = await prisma.purchase.findUnique({
      where: { appleTransactionId: transactionId },
    });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already processed.', alreadyProcessed: true });
    }

    const productMapping = mapAppleProduct(productId);
    if (!productMapping) {
      console.error(`❌ Unknown Apple product: ${productId}`);
      return res.status(400).json({ error: 'Unknown product.' });
    }

    let transactionInfo;
    try {
      transactionInfo = await verifyTransaction(transactionId);
    } catch (verifyError) {
      console.error('❌ Apple receipt verification failed:', verifyError.message);
      return res.status(502).json({ error: 'Receipt verification failed.' });
    }

    if (transactionInfo.bundleId !== getAppleConfig().bundleId) {
      console.error(`❌ Bundle ID mismatch: ${transactionInfo.bundleId}`);
      return res.status(400).json({ error: 'Invalid receipt.' });
    }

    if (transactionInfo.productId !== productId) {
      console.error(`❌ Product ID mismatch: ${transactionInfo.productId} vs ${productId}`);
      return res.status(400).json({ error: 'Product mismatch.' });
    }

    // Apply product effect
    const updateData = buildUserUpdate(productMapping, transactionInfo, user);
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { ...updateData, purchasePlatform: 'ios' },
    });

    // Calculate subscription expiration for record
    const expiresAt = transactionInfo.expiresDate
      ? new Date(transactionInfo.expiresDate)
      : null;

    await prisma.purchase.create({
      data: {
        customerEmail: user.email,
        customerName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null,
        productId,
        amount: 0, // Apple handles pricing; actual amount not available server-side
        currency: 'EUR',
        platform: 'ios',
        appleTransactionId: transactionId,
        appleOriginalTransactionId: transactionInfo.originalTransactionId || transactionId,
        subscriptionStatus: productMapping.type === 'subscription' ? 'active' : null,
        renewsAt: expiresAt,
        paypalPayload: transactionInfo,
      },
    });

    const { passwordHash, ...userPayload } = updatedUser;
    console.log(`✅ Apple IAP verified: ${transactionId} → user ${req.userId} — ${productId}`);
    res.json({
      success: true,
      user: userPayload,
      tier: productMapping.tier,
      expiresAt: expiresAt || updateData.premiumExpiresAt || updateData.accessExpiresAt || null,
    });
  } catch (error) {
    console.error('❌ Apple verify-receipt error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/apple-iap/notification
// Apple Server-to-Server Notification v2
// Configured in App Store Connect → Subscription Settings → Server Notification URL
router.post('/notification', async (req, res) => {
  try {
    const { signedPayload } = req.body;
    if (!signedPayload) {
      return res.status(400).json({ error: 'Missing signedPayload' });
    }

    const notification = decodeNotificationPayload(signedPayload);
    const { notificationType, subtype, data } = notification;

    console.log(`📥 Apple notification: ${notificationType}${subtype ? '/' + subtype : ''}`);

    if (!data?.signedTransactionInfo) {
      console.warn('⚠️ No transaction info in notification');
      return res.status(200).json({ status: 'ok' });
    }

    const transactionInfo = decodeJWSPayload(data.signedTransactionInfo);
    const renewalInfo = data.signedRenewalInfo
      ? decodeJWSPayload(data.signedRenewalInfo)
      : null;

    const action = mapNotificationType(notificationType, subtype);
    const originalTransactionId = transactionInfo.originalTransactionId;

    // Find the purchase by original transaction ID
    const purchase = await prisma.purchase.findFirst({
      where: { appleOriginalTransactionId: originalTransactionId, platform: 'ios' },
      orderBy: { createdAt: 'desc' },
    });

    if (!purchase) {
      console.warn(`⚠️ No purchase found for originalTransactionId: ${originalTransactionId}`);
      return res.status(200).json({ status: 'ok' });
    }

    // Find the user who made this purchase
    const user = await prisma.user.findFirst({
      where: { email: purchase.customerEmail },
    });

    if (!user) {
      console.warn(`⚠️ No user found for email: ${purchase.customerEmail}`);
      return res.status(200).json({ status: 'ok' });
    }

    const productMapping = mapAppleProduct(transactionInfo.productId);

    switch (action) {
      case 'renewed':
      case 'new_purchase':
      case 'resubscribed': {
        const newExpiry = transactionInfo.expiresDate
          ? new Date(transactionInfo.expiresDate) : null;
        const renewDate = renewalInfo?.renewalDate
          ? new Date(renewalInfo.renewalDate) : null;

        if (productMapping) {
          const updateData = buildUserUpdate(productMapping, transactionInfo, user);
          await prisma.user.update({ where: { id: user.id }, data: updateData });
        }

        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            subscriptionStatus: 'active',
            renewsAt: renewDate || newExpiry,
          },
        });
        console.log(`✅ Subscription ${action}: ${originalTransactionId} → ${user.email}`);
        break;
      }

      case 'grace_period': {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { subscriptionStatus: 'grace_period' },
        });
        console.log(`⚠️ Grace period: ${originalTransactionId} → ${user.email}`);
        break;
      }

      case 'expired':
      case 'cancelled': {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { subscriptionStatus: action, renewsAt: null },
        });

        if (productMapping) {
          await revokeAccess(user, productMapping);
        }
        console.log(`🔒 Access revoked (${action}): ${originalTransactionId} → ${user.email}`);
        break;
      }

      case 'refunded': {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { subscriptionStatus: 'refunded', status: 'REFUNDED', renewsAt: null },
        });

        if (productMapping) {
          await revokeAccess(user, productMapping);
        }
        console.log(`💸 Refund processed: ${originalTransactionId} → ${user.email}`);
        break;
      }

      case 'will_cancel': {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { subscriptionStatus: 'cancelled' },
        });
        console.log(`📋 Will cancel at period end: ${originalTransactionId} → ${user.email}`);
        break;
      }

      case 'will_renew': {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { subscriptionStatus: 'active' },
        });
        console.log(`🔄 Auto-renew re-enabled: ${originalTransactionId} → ${user.email}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Apple notification: ${notificationType}/${subtype}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Apple notification error:', error);
    res.status(200).json({ status: 'ok' }); // Always 200 so Apple doesn't retry indefinitely
  }
});

// POST /api/apple-iap/restore
// Called when user taps "Restore Purchases" — verifies all provided transaction IDs
router.post('/restore', auth, async (req, res) => {
  try {
    const { transactionIds } = req.body;
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'No transactions to restore.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    let restored = 0;

    for (const txId of transactionIds) {
      const existing = await prisma.purchase.findUnique({
        where: { appleTransactionId: txId },
      });
      if (existing) {
        restored++;
        continue;
      }

      try {
        const transactionInfo = await verifyTransaction(txId);
        if (transactionInfo.bundleId !== getAppleConfig().bundleId) continue;

        const productMapping = mapAppleProduct(transactionInfo.productId);
        if (!productMapping) continue;

        // For subscriptions, check if still active
        if (productMapping.type === 'subscription' && transactionInfo.expiresDate) {
          if (new Date(transactionInfo.expiresDate) < new Date()) continue;
        }

        const updateData = buildUserUpdate(productMapping, transactionInfo, user);
        await prisma.user.update({
          where: { id: req.userId },
          data: { ...updateData, purchasePlatform: 'ios' },
        });

        await prisma.purchase.create({
          data: {
            customerEmail: user.email,
            productId: transactionInfo.productId,
            amount: 0,
            currency: 'EUR',
            platform: 'ios',
            appleTransactionId: txId,
            appleOriginalTransactionId: transactionInfo.originalTransactionId || txId,
            subscriptionStatus: productMapping.type === 'subscription' ? 'active' : null,
            renewsAt: transactionInfo.expiresDate ? new Date(transactionInfo.expiresDate) : null,
            paypalPayload: transactionInfo,
          },
        });
        restored++;
      } catch (err) {
        console.warn(`⚠️ Could not restore transaction ${txId}:`, err.message);
      }
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const { passwordHash, ...userPayload } = updatedUser;

    console.log(`🔄 Restore: ${restored}/${transactionIds.length} transactions for user ${req.userId}`);
    res.json({ success: true, restored, total: transactionIds.length, user: userPayload });
  } catch (error) {
    console.error('❌ Apple restore error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- Helper: build user update object from product mapping ---

function buildUserUpdate(productMapping, transactionInfo, user) {
  const updateData = { updatedAt: new Date() };

  if (productMapping.tier === 'registered' && productMapping.type === 'non_consumable') {
    updateData.accessExpiresAt = null; // Lifetime
  } else if (productMapping.tier === 'registered' && productMapping.type === 'subscription') {
    const expiresAt = transactionInfo.expiresDate
      ? new Date(transactionInfo.expiresDate)
      : new Date(Date.now() + productMapping.days * 86400000);
    updateData.accessExpiresAt = expiresAt;
  } else if (productMapping.tier === 'premium') {
    const expiresAt = transactionInfo.expiresDate
      ? new Date(transactionInfo.expiresDate)
      : new Date(Date.now() + productMapping.days * 86400000);
    updateData.isPremium = true;
    updateData.premiumExpiresAt = expiresAt;
  } else if (productMapping.tier === 'bot') {
    const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
    if (!unlocked.includes(productMapping.botId)) {
      unlocked.push(productMapping.botId);
    }
    updateData.unlockedCoaches = JSON.stringify(unlocked);
  }

  return updateData;
}

// --- Helper: revoke access when subscription expires/is refunded ---

async function revokeAccess(user, productMapping) {
  const updateData = {};

  if (productMapping.tier === 'premium') {
    // Check if user has any other active Apple subscriptions
    const activeSubscriptions = await prisma.purchase.count({
      where: {
        customerEmail: user.email,
        platform: 'ios',
        subscriptionStatus: 'active',
      },
    });

    if (activeSubscriptions === 0) {
      updateData.isPremium = false;
      updateData.premiumExpiresAt = new Date();
    }
  } else if (productMapping.tier === 'registered' && productMapping.type === 'subscription') {
    const activeRegistered = await prisma.purchase.count({
      where: {
        customerEmail: user.email,
        platform: 'ios',
        subscriptionStatus: 'active',
        productId: { startsWith: 'mc.registered' },
      },
    });

    // Only revoke if user has no lifetime registered status
    if (activeRegistered === 0 && user.accessExpiresAt) {
      updateData.accessExpiresAt = new Date();
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data: updateData });
  }
}

module.exports = router;
