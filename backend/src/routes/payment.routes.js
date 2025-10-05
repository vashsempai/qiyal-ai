import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
// import { validateRequest, createPaymentSchema } from '../validation/payment.validation.js';

const router = Router();

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
// TODO: Add validation middleware once schema is defined
router.post('/', protect, PaymentController.createPayment);

/**
 * @route   POST /api/payments/webhook/kaspi
 * @desc    Handle webhook notifications from Kaspi
 * @access  Public (secured by signature verification in service)
 */
router.post('/webhook/kaspi', PaymentController.handleKaspiWebhook);

export default router;