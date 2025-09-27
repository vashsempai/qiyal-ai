// 1. Mock external dependencies
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mock the Stripe constructor
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// 2. Mock Prisma Client
const mockPrisma = {
  subscriptionTier: {
    findUnique: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// 3. Import modules under test
import {
  createSubscriptionCheckoutSession,
  handleStripeWebhook,
} from '../services/stripeService';
import Stripe from 'stripe';

// 4. Describe test suite
describe('Stripe Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and mocks before each test
    jest.resetModules();
    jest.clearAllMocks();
    // Set fake API keys to ensure the service initializes its clients
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'fake-stripe-secret-key',
      STRIPE_WEBHOOK_SECRET: 'fake-webhook-secret',
      FRONTEND_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('createSubscriptionCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const mockSession = { id: 'sess_123', url: 'http://stripe.com/session' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const session = await createSubscriptionCheckoutSession('user_123', 'PRO');

      expect(session).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [{ price: 'price_123_pro', quantity: 1 }],
        mode: 'subscription',
        success_url: 'http://localhost:3000/dashboard?payment_success=true',
        cancel_url: 'http://localhost:3000/pricing?payment_cancelled=true',
        metadata: {
          userId: 'user_123',
          tier: 'PRO',
        },
      });
    });

    it('should throw an error for an invalid tier', async () => {
      await expect(
        createSubscriptionCheckoutSession('user_123', 'INVALID_TIER' as any)
      ).rejects.toThrow('Invalid tier provided: INVALID_TIER');
    });

    it('should throw an error if Stripe is not configured', async () => {
        // Unset the secret key for this test
        delete process.env.STRIPE_SECRET_KEY;
        // We need to re-import the service to re-evaluate the lazy initialization
        const { createSubscriptionCheckoutSession: createSession } = await import('../services/stripeService');
        await expect(createSession('user_123', 'PRO')).rejects.toThrow('Stripe has not been configured.');
    });
  });

  describe('handleStripeWebhook', () => {
    const mockSignature = 't=123,v1=abc';
    const mockBody = Buffer.from('{}');

    it('should handle checkout.session.completed event and update user', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user_123', tier: 'PRO' },
          },
        },
      };
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.subscriptionTier.findUnique.mockResolvedValue({ id: 'tier_pro_id' });

      await handleStripeWebhook(mockPrisma as any, mockSignature, mockBody);

      expect(mockPrisma.subscriptionTier.findUnique).toHaveBeenCalledWith({ where: { name: 'PRO' } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { subscriptionId: 'tier_pro_id' },
      });
    });

    it('should throw an error if signature is missing', async () => {
      await expect(handleStripeWebhook(mockPrisma as any, undefined, mockBody)).rejects.toThrow(
        'Stripe signature missing.'
      );
    });

    it('should throw an error if webhook secret is missing', async () => {
        delete process.env.STRIPE_WEBHOOK_SECRET;
        const { handleStripeWebhook: handleWebhook } = await import('../services/stripeService');
        await expect(handleWebhook(mockPrisma as any, mockSignature, mockBody)).rejects.toThrow(
            'STRIPE_WEBHOOK_SECRET is not set.'
        );
    });

    it('should throw an error if webhook construction fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      await expect(
        handleStripeWebhook(mockPrisma as any, mockSignature, mockBody)
      ).rejects.toThrow('Webhook Error: Invalid signature');
    });

    it('should throw an error if metadata is missing', async () => {
        const mockEvent = {
            type: 'checkout.session.completed',
            data: { object: { metadata: {} } }, // Missing userId and tier
        };
        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);

        await expect(
            handleStripeWebhook(mockPrisma as any, mockSignature, mockBody)
        ).rejects.toThrow('Webhook received without required metadata (userId, tier).');
    });

    it('should throw an error if subscription tier is not found in DB', async () => {
        const mockEvent = {
            type: 'checkout.session.completed',
            data: { object: { metadata: { userId: 'user_123', tier: 'PRO' } } },
        };
        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
        mockPrisma.subscriptionTier.findUnique.mockResolvedValue(null); // Tier not found

        await expect(
            handleStripeWebhook(mockPrisma as any, mockSignature, mockBody)
        ).rejects.toThrow("Subscription tier 'PRO' not found in the database.");
    });

    it('should do nothing for irrelevant webhook events', async () => {
        const mockEvent = {
          type: 'customer.subscription.deleted', // An event we don't handle
          data: { object: {} },
        };
        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);

        await handleStripeWebhook(mockPrisma as any, mockSignature, mockBody);

        // Expect that no database operations were performed
        expect(mockPrisma.subscriptionTier.findUnique).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
  });
});