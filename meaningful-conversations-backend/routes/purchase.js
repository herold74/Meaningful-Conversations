const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');
const { purchaseLimiter } = require('../middleware/rateLimiter');
const { sendPurchaseEmail, sendAdminNotification } = require('../services/mailService');

// Product ID Mapping (PayPal Button IDs zu internen botIds)
const PRODUCT_MAPPING = {
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

// GET /api/purchase/config — public PayPal client ID for the JS SDK
router.get('/config', (_req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Payment system not configured.' });
  res.json({ clientId });
});

// POST /api/purchase/create-order — authenticated, creates a PayPal order
router.post('/create-order', auth, purchaseLimiter, async (req, res) => {
  try {
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
          amount: { currency_code: 'EUR', value: '14.90' },
          custom_id: 'REGISTERED_LIFETIME',
          description: 'Meaningful Conversations — Registered Lifetime',
        }],
      }),
    });
    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error('PayPal create-order failed:', err);
      return res.status(502).json({ error: 'Failed to create PayPal order.' });
    }

    const order = await orderRes.json();
    console.log(`💳 PayPal order created: ${order.id} for user ${req.userId}`);
    res.json({ orderId: order.id });
  } catch (error) {
    console.error('❌ create-order error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/purchase/capture-order — authenticated, captures payment & activates user
router.post('/capture-order', auth, purchaseLimiter, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId.' });

    // Duplicate guard
    const existing = await prisma.purchase.findUnique({ where: { paypalOrderId: orderId } });
    if (existing) return res.status(200).json({ error: 'Order already processed.' });

    const accessToken = await getPayPalAccessToken();
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

    if (amount < 14.90 || currency !== 'EUR') {
      console.error(`❌ Amount mismatch: ${amount} ${currency} (expected >=14.90 EUR)`);
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    // Activate user: set accessExpiresAt = null (permanent Registered access)
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { accessExpiresAt: null, updatedAt: new Date() },
    });

    // Create an UpgradeCode for bookkeeping (auto-used)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const upgradeCode = await prisma.upgradeCode.create({
      data: { code, botId: 'REGISTERED_LIFETIME', isUsed: true, usedById: req.userId },
    });

    await prisma.purchase.create({
      data: {
        paypalOrderId: orderId,
        customerEmail: payerEmail || updatedUser.email,
        customerName: payerName || null,
        productId: 'REGISTERED_LIFETIME',
        amount,
        currency,
        upgradeCodeId: upgradeCode.id,
        paypalPayload: capture,
      },
    });

    await sendAdminNotification(
      updatedUser.email, payerName || updatedUser.email, code, 'REGISTERED_LIFETIME', amount
    );

    const { passwordHash, ...userPayload } = updatedUser;
    console.log(`✅ Direct purchase: ${orderId} → user ${req.userId} activated (Registered Lifetime)`);
    res.json({ success: true, user: userPayload });
  } catch (error) {
    console.error('❌ capture-order error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/purchase/webhook (legacy — external PayPal buttons / Jimdo links)
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

