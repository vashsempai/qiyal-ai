import { Router, raw } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/payments
 * @desc    Create a new payment intent
 * @access  Private
 */
// TODO: Add Joi validation for the request body
router.post('/', protect, PaymentController.createPayment);

/**
 * @route   POST /api/payments/webhook/stripe
 * @desc    Handle webhook notifications from Stripe
 * @access  Public (secured by Stripe's signature verification in service)
 */
router.post(
  '/webhook/stripe',
  // Stripe requires the raw request body to verify the signature
  raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

export default router;