import { PaymentService } from '../services/payment.service.js';

export const PaymentController = {
  /**
   * Handles the request to create a new payment.
   */
  async createPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const paymentData = { ...req.body, userId };

      const result = await PaymentService.createPayment(paymentData);

      res.status(201).json({
        success: true,
        message: 'Payment initiated successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles incoming webhook notifications from the Kaspi gateway.
   */
  async handleKaspiWebhook(req, res, next) {
    try {
      const webhookData = req.body;
      // TODO: Add webhook signature verification for security

      await PaymentService.handleKaspiWebhook(webhookData);

      // Respond to Kaspi to acknowledge receipt
      res.status(200).json({ success: true, message: 'Webhook received.' });
    } catch (error) {
      // Log the error but send a generic success response to the gateway
      // to prevent retries for non-recoverable errors.
      console.error('Kaspi webhook processing failed:', error);
      res.status(200).json({ success: true, message: 'Webhook acknowledged.' });
    }
  },
};

export default PaymentController;