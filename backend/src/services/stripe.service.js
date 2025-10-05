import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const StripeService = {
  async createPaymentIntent({ amount, currency = 'usd', customerId, description, metadata = {} }) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      customer: customerId,
      description,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
  },

  async createCustomer({ email, name, metadata = {} }) {
    return await stripe.customers.create({ email, name, metadata });
  },

  async confirmPayment(paymentIntentId) {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  },

  async refundPayment(paymentIntentId, amount) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
  },

  async handleWebhook(body, signature) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return { type: 'payment_completed', data: event.data.object };
        case 'payment_intent.payment_failed':
          return { type: 'payment_failed', data: event.data.object };
        default:
          return { type: 'unhandled', data: event.data.object };
      }
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
};

export default StripeService;