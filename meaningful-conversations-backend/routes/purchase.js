const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prismaClient');
const { sendPurchaseEmail, sendAdminNotification } = require('../services/mailService');

// Product ID Mapping (PayPal Button IDs zu internen botIds)
// Full-price products
const PRODUCT_MAPPING = {
  // Registered tier
  'REGISTERED_LIFETIME':  'REGISTERED_LIFETIME',
  // Premium passes (full price)
  'ACCESS_PASS_1M':       'ACCESS_PASS_1M',
  'ACCESS_PASS_3M':       'ACCESS_PASS_3M',
  'ACCESS_PASS_1Y':       'ACCESS_PASS_1Y',
  // Premium passes — Upgrade from Registered Lifetime (loyalty discount)
  'UPGRADE_LT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_LT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_LT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  // Premium passes — Upgrade with Bot-Unlock credit
  'UPGRADE_BOT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_BOT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_BOT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  // Premium passes — Upgrade Lifetime + Bot combined
  'UPGRADE_LT_BOT_PREMIUM_1M': 'ACCESS_PASS_1M',
  'UPGRADE_LT_BOT_PREMIUM_3M': 'ACCESS_PASS_3M',
  'UPGRADE_LT_BOT_PREMIUM_1Y': 'ACCESS_PASS_1Y',
  // Individual bot unlocks
  'KENJI_UNLOCK':         'kenji-stoic',
  'CHLOE_UNLOCK':         'chloe-cbt'
};

// POST /api/purchase/webhook
router.post('/webhook', express.json(), async (req, res) => {
  try {
    // 1. Verify PayPal Webhook Signature
    if (!verifyPayPalSignature(req)) {
      console.error('Invalid PayPal webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const event = req.body;
    
    // Log the full webhook for debugging
    console.log('📥 PayPal Webhook received:', JSON.stringify(event, null, 2));
    
    // 2. Handle only PAYMENT.CAPTURE.COMPLETED events
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      console.log(`Ignoring event type: ${event.event_type}`);
      return res.status(200).send('Event ignored');
    }

    // Extract data with safe navigation
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
    const customerEmail = event.resource?.payer?.email_address || event.resource?.payee?.email_address;
    const customerName = (event.resource?.payer?.name?.given_name || 'Customer') + ' ' + (event.resource?.payer?.name?.surname || '');
    const amount = parseFloat(event.resource?.amount?.value || '0');
    const currency = event.resource?.amount?.currency_code || 'EUR';
    const productId = event.resource?.custom_id || event.resource?.purchase_units?.[0]?.custom_id;
    
    // Validation
    if (!customerEmail) {
      console.error('❌ No customer email found in webhook');
      return res.status(400).send('Missing customer email');
    }
    
    if (!productId) {
      console.error('❌ No product ID (custom_id) found in webhook');
      return res.status(400).send('Missing product ID');
    }
    
    // 3. Check for duplicate processing
    const existingPurchase = await prisma.purchase.findUnique({
      where: { paypalOrderId }
    });
    
    if (existingPurchase) {
      console.log(`Purchase ${paypalOrderId} already processed`);
      return res.status(200).send('Already processed');
    }

    // 4. Map product ID and generate code
    const botId = PRODUCT_MAPPING[productId];
    if (!botId) {
      console.error(`Unknown product ID: ${productId}`);
      return res.status(400).send('Unknown product');
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const upgradeCode = await prisma.upgradeCode.create({
      data: { code, botId }
    });

    // 5. Create purchase record
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

    // 6. Send emails
    await sendPurchaseEmail(customerEmail, customerName, code, botId);
    await sendAdminNotification(customerEmail, customerName, code, botId, amount);

    console.log(`✅ Purchase processed: ${paypalOrderId} -> Code: ${code} -> Customer: ${customerEmail}`);
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error processing webhook.' });
  }
});

// Verify PayPal webhook signature
// ⚠️  SECURITY WARNING: Signature verification is currently DISABLED!
// This function accepts ALL webhooks without cryptographic verification.
// Before going live with payments, implement proper verification using:
// https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
function verifyPayPalSignature(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  
  // ⚠️  CRITICAL SECURITY TODO: Implement proper signature verification!
  // Without this, attackers can send fake webhooks to grant premium access.
  // Implementation required before accepting real payments.
  
  if (!webhookId) {
    console.warn('⚠️  PAYPAL_WEBHOOK_ID not configured - webhook verification impossible');
  }
  
  if (!transmissionId) {
    console.warn('⚠️  No PayPal transmission ID in headers (might be a test webhook)');
  }
  
  console.warn('⚠️  PayPal webhook accepted WITHOUT signature verification (INSECURE)');
  return true; // TEMPORARILY accept all webhooks - MUST BE FIXED BEFORE PRODUCTION
}

module.exports = router;

