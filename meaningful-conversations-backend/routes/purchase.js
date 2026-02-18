const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');
const { purchaseLimiter } = require('../middleware/rateLimiter');
const { sendPurchaseEmail, sendAdminNotification } = require('../services/mailService');

// --- Product Catalog ---

const PRODUCTS = {
  REGISTERED_1M: {
    id: 'REGISTERED_1M', name: 'Registriert 1-Monats-Pass', price: 3.90,
    category: 'access', duration: '1M', days: 30,
    description: 'Meaningful Conversations — Registered 1 Month',
  },
  REGISTERED_LIFETIME: {
    id: 'REGISTERED_LIFETIME', name: 'Registered Lifetime', price: 14.90,
    category: 'access', duration: null,
    description: 'Meaningful Conversations — Registered Lifetime',
  },
  ACCESS_PASS_1M: {
    id: 'ACCESS_PASS_1M', name: 'Premium 1-Monats-Pass', price: 9.90,
    category: 'premium', duration: '1M', days: 30,
    description: 'Meaningful Conversations — Premium 1 Month',
  },
  ACCESS_PASS_3M: {
    id: 'ACCESS_PASS_3M', name: 'Premium 3-Monats-Pass', price: 24.90,
    category: 'premium', duration: '3M', days: 90,
    description: 'Meaningful Conversations — Premium 3 Months',
  },
  ACCESS_PASS_1Y: {
    id: 'ACCESS_PASS_1Y', name: 'Premium 1-Jahres-Pass', price: 79.90,
    category: 'premium', duration: '1Y', days: 365,
    description: 'Meaningful Conversations — Premium 1 Year',
  },
  KENJI_UNLOCK: {
    id: 'KENJI_UNLOCK', name: 'Kenji Coach Unlock', price: 3.90,
    category: 'bot', botId: 'kenji-stoic',
    description: 'Meaningful Conversations — Kenji Coach',
  },
  CHLOE_UNLOCK: {
    id: 'CHLOE_UNLOCK', name: 'Chloe Coach Unlock', price: 3.90,
    category: 'bot', botId: 'chloe-cbt',
    description: 'Meaningful Conversations — Chloe Coach',
  },
};

const LOYALTY_PRICES = { '1M': 7.90, '3M': 18.90, '1Y': 59.90 };
const BOT_CREDIT = 3.90;
const MIN_PRICE = 0.10;

// Product ID Mapping (PayPal Button IDs → internal botIds, used by legacy webhook)
const PRODUCT_MAPPING = {
  'REGISTERED_1M':        'REGISTERED_1M',
  'REGISTERED_LIFETIME':  'REGISTERED_LIFETIME',
  'ACCESS_PASS_1M':       'ACCESS_PASS_1M',
  'ACCESS_PASS_3M':       'ACCESS_PASS_3M',
  'ACCESS_PASS_1Y':       'ACCESS_PASS_1Y',
  'UPGRADE_LT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_LT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_LT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  'UPGRADE_BOT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_BOT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_BOT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  'UPGRADE_LT_BOT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_LT_BOT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_LT_BOT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  'KENJI_UNLOCK':         'kenji-stoic',
  'CHLOE_UNLOCK':         'chloe-cbt'
};

// --- Price Calculation ---

function getUserTier(user) {
  if (user.isAdmin || user.isDeveloper) return 'admin';
  if (user.isClient) return 'client';
  if (user.isPremium) {
    const premiumExpired = user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date();
    if (!premiumExpired) return 'premium';
  }
  return 'registered';
}

function isLifetimeRegistered(user) {
  return !user.accessExpiresAt && !user.isClient && !user.isAdmin;
}

function getOwnedPremiumBots(user) {
  const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
  return unlocked.filter(b => ['kenji-stoic', 'chloe-cbt'].includes(b));
}

function calculatePrice(user, productId) {
  const product = PRODUCTS[productId];
  if (!product) return null;

  let price = product.price;
  let originalPrice = product.price;
  let discountReasons = [];

  if (product.category === 'premium') {
    if (isLifetimeRegistered(user) && LOYALTY_PRICES[product.duration]) {
      price = LOYALTY_PRICES[product.duration];
      discountReasons.push('loyalty');
    }

    const ownedBots = getOwnedPremiumBots(user);
    if (ownedBots.length > 0) {
      const credit = ownedBots.length * BOT_CREDIT;
      const effectiveCredit = Math.min(credit, price - MIN_PRICE);
      if (effectiveCredit > 0) {
        price = price - effectiveCredit;
        discountReasons.push('bot_credit');
      }
    }
  }

  price = Math.round(price * 100) / 100;

  return { price, originalPrice, discountReasons };
}

// --- PayPal REST API v2 helpers ---

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';
let cachedToken = null;
let tokenExpiresAt = 0;

async function getPayPalAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured');

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token request failed: ${res.status}`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// --- Helper: check if product is still applicable for user ---

function checkProductEligibility(user, productId) {
  const product = PRODUCTS[productId];
  if (!product) return { eligible: false, reason: 'Unknown product.' };
  const tier = getUserTier(user);

  if (productId === 'REGISTERED_LIFETIME') {
    if (isLifetimeRegistered(user)) {
      return { eligible: false, reason: 'You already have Registered Lifetime access.' };
    }
    if (tier === 'client' || tier === 'admin') {
      return { eligible: false, reason: 'Your current access level already includes this.' };
    }
  }

  if (productId === 'REGISTERED_1M') {
    if (isLifetimeRegistered(user)) {
      return { eligible: false, reason: 'You already have Registered Lifetime access.' };
    }
    if (tier === 'client' || tier === 'admin') {
      return { eligible: false, reason: 'Your current access level already includes this.' };
    }
  }

  if (product.category === 'premium') {
    if (tier === 'client' || tier === 'admin') {
      return { eligible: false, reason: 'Your current access level already includes Premium.' };
    }
  }

  if (product.category === 'bot') {
    if (tier === 'client' || tier === 'admin') {
      return { eligible: false, reason: 'Your current access level already includes all bots.' };
    }
    if (tier === 'premium') {
      return { eligible: false, reason: 'Premium access already includes all bots.' };
    }
    const ownedBots = getOwnedPremiumBots(user);
    if (ownedBots.includes(product.botId)) {
      return { eligible: false, reason: 'You already own this bot.' };
    }
    const hasActiveAccess = !user.accessExpiresAt || new Date(user.accessExpiresAt) > new Date();
    if (!hasActiveAccess) {
      return { eligible: false, reason: 'Please purchase an access pass first.' };
    }
  }

  return { eligible: true };
}

// --- Helper: apply product effect to user ---

async function applyProductEffect(userId, productId) {
  const product = PRODUCTS[productId];
  if (!product) throw new Error(`Unknown product: ${productId}`);

  let updateData = { updatedAt: new Date() };
  let botIdForCode = productId;

  if (productId === 'REGISTERED_LIFETIME') {
    updateData.accessExpiresAt = null;
  } else if (productId === 'REGISTERED_1M') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    const baseDate = (user.accessExpiresAt && new Date(user.accessExpiresAt) > now)
      ? new Date(user.accessExpiresAt) : new Date();
    baseDate.setDate(baseDate.getDate() + product.days);
    updateData.accessExpiresAt = baseDate;
  } else if (product.category === 'premium') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    const baseDate = (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now)
      ? new Date(user.premiumExpiresAt) : new Date();
    baseDate.setDate(baseDate.getDate() + product.days);
    updateData.isPremium = true;
    updateData.premiumExpiresAt = baseDate;
    botIdForCode = productId;
  } else if (product.category === 'bot') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
    if (!unlocked.includes(product.botId)) {
      unlocked.push(product.botId);
    }
    updateData.unlockedCoaches = JSON.stringify(unlocked);
    botIdForCode = product.botId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const upgradeCode = await prisma.upgradeCode.create({
    data: { code, botId: botIdForCode, isUsed: true, usedById: userId },
  });

  return { updatedUser, upgradeCode, code };
}

// =============================================
// ROUTES
// =============================================

// GET /api/purchase/config — public PayPal client ID for the JS SDK
router.get('/config', (_req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Payment system not configured.' });
  res.json({ clientId });
});

// GET /api/purchase/products — authenticated, returns available products for this user
router.get('/products', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const tier = getUserTier(user);
    const lifetime = isLifetimeRegistered(user);
    const ownedBots = getOwnedPremiumBots(user);

    const products = [];

    for (const product of Object.values(PRODUCTS)) {
      if (product.id === 'REGISTERED_LIFETIME') {
        if (lifetime) continue;
        if (tier === 'client' || tier === 'admin') continue;
      }

      if (product.id === 'REGISTERED_1M') {
        if (lifetime) continue;
        if (tier === 'client' || tier === 'admin') continue;
      }

      // Skip Premium passes if user is already active Premium or higher
      if (product.category === 'premium') {
        if (tier === 'client' || tier === 'admin') continue;
        if (tier === 'premium') continue;
      }

      // Skip bot unlocks if already owned, user has Premium+ (bots included), or access expired
      if (product.category === 'bot') {
        if (tier === 'client' || tier === 'admin') continue;
        const alreadyOwned = ownedBots.includes(product.botId);
        if (alreadyOwned) continue;
        if (tier === 'premium') continue;
        const hasActiveAccess = !user.accessExpiresAt || new Date(user.accessExpiresAt) > new Date();
        if (!hasActiveAccess) continue;
      }

      const pricing = calculatePrice(user, product.id);

      products.push({
        id: product.id,
        name: product.name,
        price: pricing.originalPrice,
        finalPrice: pricing.price,
        discountReasons: pricing.discountReasons,
        category: product.category,
        duration: product.duration || null,
        description: product.description,
      });
    }

    res.json({
      currentTier: tier,
      isLifetime: lifetime,
      isPremium: user.isPremium,
      premiumExpiresAt: user.isPremium ? user.premiumExpiresAt : null,
      ownedBots,
      products,
    });
  } catch (error) {
    console.error('❌ products error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/purchase/create-order — authenticated, creates a PayPal order for any product
router.post('/create-order', auth, purchaseLimiter, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = PRODUCTS[productId || 'REGISTERED_LIFETIME'];
    if (!product) return res.status(400).json({ error: 'Unknown product.' });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const eligibility = checkProductEligibility(user, product.id);
    if (!eligibility.eligible) {
      return res.status(409).json({ error: eligibility.reason });
    }

    const pricing = calculatePrice(user, product.id);
    if (!pricing) return res.status(400).json({ error: 'Product not available.' });

    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: pricing.price.toFixed(2) },
          custom_id: product.id,
          description: product.description,
        }],
      }),
    });
    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error('PayPal create-order failed:', err);
      return res.status(502).json({ error: 'Failed to create PayPal order.' });
    }

    const order = await orderRes.json();
    console.log(`💳 PayPal order created: ${order.id} for user ${req.userId} — ${product.id} @ €${pricing.price.toFixed(2)}`);
    res.json({ orderId: order.id, productId: product.id, price: pricing.price });
  } catch (error) {
    console.error('❌ create-order error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/purchase/capture-order — authenticated, captures payment & applies product
router.post('/capture-order', auth, purchaseLimiter, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId.' });

    const existing = await prisma.purchase.findUnique({ where: { paypalOrderId: orderId } });
    if (existing) return res.status(200).json({ error: 'Order already processed.' });

    const accessToken = await getPayPalAccessToken();

    // 1) GET order details from PayPal BEFORE capturing
    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!orderRes.ok) {
      return res.status(502).json({ error: 'Failed to retrieve PayPal order.' });
    }
    const order = await orderRes.json();

    const orderUnit = order.purchase_units?.[0];
    const orderAmount = parseFloat(orderUnit?.amount?.value || '0');
    const orderCurrency = orderUnit?.amount?.currency_code || 'EUR';
    const productId = orderUnit?.custom_id || 'REGISTERED_LIFETIME';

    if (orderCurrency !== 'EUR') {
      console.error(`❌ Currency mismatch: ${orderCurrency} (expected EUR)`);
      return res.status(400).json({ error: 'Payment currency mismatch.' });
    }

    const product = PRODUCTS[productId];
    if (!product) {
      console.error(`❌ Unknown product in order: ${productId}`);
      return res.status(400).json({ error: 'Unknown product.' });
    }

    // 2) Eligibility & price check BEFORE capturing money
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const eligibility = checkProductEligibility(user, productId);
    if (!eligibility.eligible) {
      console.warn(`⚠️ Product no longer eligible: ${productId} for user ${req.userId} — ${eligibility.reason}`);
      return res.status(409).json({ error: eligibility.reason });
    }

    const pricing = calculatePrice(user, productId);
    if (orderAmount < pricing.price - 0.01) {
      console.error(`❌ Amount mismatch: ${orderAmount} EUR (expected >=${pricing.price} EUR for ${productId})`);
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    // 3) All checks passed — now capture
    const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!captureRes.ok) {
      const err = await captureRes.text();
      console.error('PayPal capture failed:', err);
      return res.status(502).json({ error: 'Payment capture failed.' });
    }

    const capture = await captureRes.json();
    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture status not COMPLETED:', capture.status);
      return res.status(400).json({ error: `Unexpected payment status: ${capture.status}` });
    }

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(captureUnit?.amount?.value || '0');
    const currency = captureUnit?.amount?.currency_code || 'EUR';
    const payerEmail = capture.payer?.email_address || '';
    const payerName = `${capture.payer?.name?.given_name || ''} ${capture.payer?.name?.surname || ''}`.trim();

    // 4) Apply product effect & record purchase
    const { updatedUser, upgradeCode, code } = await applyProductEffect(req.userId, productId);

    await prisma.purchase.create({
      data: {
        paypalOrderId: orderId,
        customerEmail: payerEmail || updatedUser.email,
        customerName: payerName || null,
        productId,
        amount,
        currency,
        upgradeCodeId: upgradeCode.id,
        paypalPayload: capture,
      },
    });

    await sendAdminNotification(
      updatedUser.email, payerName || updatedUser.email, code, productId, amount
    );

    const { passwordHash, ...userPayload } = updatedUser;
    console.log(`✅ Direct purchase: ${orderId} → user ${req.userId} — ${productId} @ €${amount}`);
    res.json({ success: true, user: userPayload });
  } catch (error) {
    console.error('❌ capture-order error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/purchase/webhook (legacy — external PayPal buttons / Jimdo links)
router.post('/webhook', express.json(), async (req, res) => {
  try {
    if (!verifyPayPalSignature(req)) {
      console.error('Invalid PayPal webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const event = req.body;
    console.log('📥 PayPal Webhook received:', JSON.stringify(event, null, 2));
    
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      console.log(`Ignoring event type: ${event.event_type}`);
      return res.status(200).send('Event ignored');
    }

    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
    const customerEmail = event.resource?.payer?.email_address || event.resource?.payee?.email_address;
    const customerName = (event.resource?.payer?.name?.given_name || 'Customer') + ' ' + (event.resource?.payer?.name?.surname || '');
    const amount = parseFloat(event.resource?.amount?.value || '0');
    const currency = event.resource?.amount?.currency_code || 'EUR';
    const productId = event.resource?.custom_id || event.resource?.purchase_units?.[0]?.custom_id;
    
    if (!customerEmail) {
      console.error('❌ No customer email found in webhook');
      return res.status(400).send('Missing customer email');
    }
    
    if (!productId) {
      console.error('❌ No product ID (custom_id) found in webhook');
      return res.status(400).send('Missing product ID');
    }
    
    const existingPurchase = await prisma.purchase.findUnique({ where: { paypalOrderId } });
    if (existingPurchase) {
      console.log(`Purchase ${paypalOrderId} already processed`);
      return res.status(200).send('Already processed');
    }

    const botId = PRODUCT_MAPPING[productId];
    if (!botId) {
      console.error(`Unknown product ID: ${productId}`);
      return res.status(400).send('Unknown product');
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const upgradeCode = await prisma.upgradeCode.create({
      data: { code, botId }
    });

    await prisma.purchase.create({
      data: {
        paypalOrderId,
        customerEmail,
        customerName,
        productId,
        amount,
        currency,
        upgradeCodeId: upgradeCode.id,
        paypalPayload: event
      }
    });

    await sendPurchaseEmail(customerEmail, customerName, code, botId);
    await sendAdminNotification(customerEmail, customerName, code, botId, amount);

    console.log(`✅ Purchase processed: ${paypalOrderId} -> Code: ${code} -> Customer: ${customerEmail}`);
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error processing webhook.' });
  }
});

function verifyPayPalSignature(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const transmissionId = req.headers['paypal-transmission-id'];
  
  if (!webhookId) {
    console.warn('⚠️  PAYPAL_WEBHOOK_ID not configured - webhook verification impossible');
  }
  
  if (!transmissionId) {
    console.warn('⚠️  No PayPal transmission ID in headers (might be a test webhook)');
  }
  
  console.warn('⚠️  PayPal webhook accepted WITHOUT signature verification (INSECURE)');
  return true;
}

module.exports = router;