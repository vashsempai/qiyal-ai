import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { app, server } from '../../server.js';
import Stripe from 'stripe';

// --- Mocking Libraries ---
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
}));

const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    connect: jest.fn().mockReturnThis(),
    on: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock the Stripe constructor and its instance methods
const mockStripeInstance = {
  paymentIntents: { create: jest.fn() },
  customers: { create: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
};
jest.mock('stripe', () => jest.fn(() => mockStripeInstance));


describe('Payments API (with mocks)', () => {
  const mockUserId = 'user-for-payment-test';

  beforeEach(() => {
    mockQuery.mockReset();
    // Reset all methods on the mock instance
    Object.values(mockStripeInstance).forEach(service => {
      Object.values(service).forEach(method => method.mockClear());
    });
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/payments', () => {
    it('should create a Stripe payment intent and return a client secret', async () => {
      // --- Arrange ---
      const mockUser = { id: mockUserId, email: 'payment@example.com', stripe_customer_id: 'cus_123' };
      mockQuery.mockResolvedValue({ rows: [mockUser] }); // For User.findById
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] }); // For Payment.create

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_456',
      };
      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // --- Act ---
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer mock-token`) // Assuming a valid token after auth middleware
        .send({ amount: 100, currency: 'usd', description: 'Test payment' });

      // --- Assert ---
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBe(mockPaymentIntent.client_secret);
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalled();
    });
  });
});