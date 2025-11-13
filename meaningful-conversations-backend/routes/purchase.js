const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prismaClient');
const { sendPurchaseEmail, sendAdminNotification } = require('../services/mailService');

// Product ID Mapping (PayPal Button IDs zu internen botIds)
const PRODUCT_MAPPING = {
  'ACCESS_PASS_1M': 'ACCESS_PASS_1M',
  'ACCESS_PASS_3M': 'ACCESS_PASS_3M',
  'ACCESS_PASS_1Y': 'ACCESS_PASS_1Y',
  'KENJI_UNLOCK': 'kenji-adhd',
  'CHLOE_UNLOCK': 'chloe-cbt'
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
    
    // 2. Handle only PAYMENT.CAPTURE.COMPLETED events
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      console.log(`Ignoring event type: ${event.event_type}`);
      return res.status(200).send('Event ignored');
    }

    const paypalOrderId = event.resource.supplementary_data?.related_ids?.order_id;
    const customerEmail = event.resource.payer.email_address;
    const customerName = event.resource.payer.name?.given_name + ' ' + event.resource.payer.name?.surname;
    const amount = parseFloat(event.resource.amount.value);
    const currency = event.resource.amount.currency_code;
    const productId = event.resource.custom_id; // Set in PayPal Button
    
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
    res.status(500).send('Internal error');
  }
});

// Verify PayPal webhook signature
function verifyPayPalSignature(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  
  // TODO: Implement proper signature verification using PayPal SDK
  // For now, accept all webhooks for testing purposes
  // This is a simplified version - in production, implement full signature verification
  // See: https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
  
  if (!webhookId) {
    console.warn('⚠️  PAYPAL_WEBHOOK_ID not configured in environment');
  }
  
  if (!transmissionId) {
    console.warn('⚠️  No PayPal transmission ID in headers (might be a test webhook)');
  }
  
  console.log('✅ PayPal webhook accepted (validation bypassed for testing)');
  return true; // TEMPORARILY accept all webhooks for testing
}

module.exports = router;

