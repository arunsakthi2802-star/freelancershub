const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe;
if (stripeKey) {
  stripe = require('stripe')(stripeKey);
}

const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  if (!stripe) {
    console.log('⚠️ Stripe Secret Key missing. Simulating Mock Payment Intent.');
    return {
      id: 'pi_mock_' + Math.random().toString(36).substring(2, 15),
      client_secret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15),
    };
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert to cents
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
};

const confirmPaymentIntent = async (paymentIntentId) => {
  if (!stripe || paymentIntentId.startsWith('pi_mock_')) {
    return { id: paymentIntentId, status: 'succeeded' };
  }
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

const createRefund = async (paymentIntentId, amount) => {
  if (!stripe || paymentIntentId.startsWith('pi_mock_')) {
    return { id: 're_mock_' + Math.random().toString(36).substring(2, 15) };
  }
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
  });
  return refund;
};

const constructWebhookEvent = (payload, signature) => {
  if (!stripe) {
    return { type: 'payment_intent.succeeded', data: { object: { id: payload.stripePaymentIntentId } } };
  }
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

module.exports = { createPaymentIntent, confirmPaymentIntent, createRefund, constructWebhookEvent };
