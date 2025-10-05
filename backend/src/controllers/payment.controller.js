import { PaymentService } from '../services/payment.service.js';

export const PaymentController = {
  /**
   * Handles the request to create a new payment intent with Stripe.
   */
  async createPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const paymentData = { ...req.body, userId };

      const result = await PaymentService.createPayment(paymentData);

      res.status(201).json({
        success: true,
        message: 'Payment intent created successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles incoming webhook notifications from the Stripe gateway.
   */
  async handleStripeWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      // The raw body is attached by the express.raw middleware in payment.routes.js
      await PaymentService.handleStripeWebhook(req.body, signature);

      // Respond to Stripe to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Stripe webhook processing failed:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
};

export default PaymentController;