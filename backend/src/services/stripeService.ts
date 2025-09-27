import Stripe from 'stripe';


let stripe: Stripe | null = null;

const getStripeClient = (): Stripe | null => {
    if (stripe) {
        return stripe;
    }

    if (process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-08-27.basil',
            typescript: true,
        });
        return stripe;
    }

    console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
    return null;
};


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});


// In a real application, these prices would be managed in your Stripe dashboard
// and fetched via the API, not hardcoded.
const priceIds: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_123_pro',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_123_enterprise',
};

/**
 * Creates a Stripe Checkout Session for a user to purchase a subscription.
 * @param userId The ID of the user purchasing the subscription.
 * @param tier The name of the subscription tier ('PRO' or 'ENTERPRISE').
 * @returns A Stripe Checkout Session object.
 */
export const createSubscriptionCheckoutSession = async (
  userId: string,
  tier: 'PRO' | 'ENTERPRISE'
): Promise<Stripe.Checkout.Session> => {

  const stripeClient = getStripeClient();
  if (!stripeClient) {
    throw new Error('Stripe has not been configured.');
  }


  const priceId = priceIds[tier];
  if (!priceId) {
    throw new Error(`Invalid tier provided: ${tier}`);
  }


  const session = await stripeClient.checkout.sessions.create({

  const session = await stripe.checkout.sessions.create({

    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/dashboard?payment_success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?payment_cancelled=true`,
    // Pass the user ID and the selected tier to the webhook via metadata
    metadata: {
      userId,
      tier,
    },
  });

  return session;
};

/**
 * Handles incoming webhooks from Stripe.
 * Specifically listens for 'checkout.session.completed' to update user subscriptions.
 * @param prisma A Prisma client instance.
 * @param signature The `Stripe-Signature` header from the request.
 * @param body The raw request body.
 */
export const handleStripeWebhook = async (
    prisma: any, // Using any to avoid circular dependency issues with PrismaClient type
    signature: string | string[] | undefined,
    body: Buffer
  ): Promise<void> => {

    const stripeClient = getStripeClient();
    if (!stripeClient) {
      throw new Error('Stripe has not been configured.');
    }


    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
    }
    if (!signature) {
      throw new Error('Stripe signature missing.');
    }

    let event: Stripe.Event;

    try {

      event = stripeClient.webhooks.constructEvent(

      event = stripe.webhooks.constructEvent(

        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tier } = session.metadata || {};

      if (!userId || !tier) {
        throw new Error('Webhook received without required metadata (userId, tier).');
      }

      // Find the subscription tier in our database
      const subscriptionTier = await prisma.subscriptionTier.findUnique({
        where: { name: tier },
      });

      if (!subscriptionTier) {
        throw new Error(`Subscription tier '${tier}' not found in the database.`);
      }

      // Update the user's subscription in our database
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: subscriptionTier.id },
      });

      console.log(`Successfully updated user ${userId} to ${tier} subscription.`);
    }
  };