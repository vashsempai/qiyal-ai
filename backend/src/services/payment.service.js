import { Payment } from '../models/payment.model.js';
import { Transaction } from '../models/transaction.model.js';
import { UserBalance } from '../models/user-balance.model.js';
import { User } from '../models/user.model.js';
import { StripeService } from './stripe.service.js';

export const PaymentService = {
  /**
   * Creates a payment intent with Stripe for a user.
   * If the user is not yet a Stripe customer, one is created first.
   */
  async createPayment({ userId, amount, currency = 'usd', description, metadata = {} }) {
    let user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Create a Stripe customer if one doesn't exist
    if (!user.stripe_customer_id) {
      const customer = await StripeService.createCustomer({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: { userId },
      });
      user = await User.update(userId, { stripe_customer_id: customer.id });
    }

    // Create a payment record in our database
    const payment = await Payment.create({
      userId,
      amount,
      currency,
      paymentMethod: 'stripe',
      status: 'pending',
      description,
      metadata,
    });

    // Create a Payment Intent with Stripe
    const paymentIntent = await StripeService.createPaymentIntent({
      amount,
      currency,
      customerId: user.stripe_customer_id,
      description,
      metadata: { ...metadata, paymentId: payment.id },
    });

    // Update our payment record with the Stripe transaction ID
    await Payment.update(payment.id, {
      gateway_transaction_id: paymentIntent.id,
      status: 'processing',
    });

    return {
      clientSecret: paymentIntent.clientSecret,
      paymentId: payment.id,
    };
  },

  /**
   * Handles webhook events from Stripe.
   */
  async handleStripeWebhook(payload, signature) {
    const event = await StripeService.handleWebhook(payload, signature);
    const paymentIntent = event.data;

    const payment = await Payment.findByGatewayTransactionId(paymentIntent.id);
    if (!payment) {
      throw new Error(`Payment with Stripe ID ${paymentIntent.id} not found.`);
    }

    if (event.type === 'payment_completed') {
      await this.processSuccessfulPayment(payment, paymentIntent);
    } else if (event.type === 'payment_failed') {
      await Payment.update(payment.id, {
        status: 'failed',
        gateway_callback_data: paymentIntent,
      });
    }

    return { status: 'success' };
  },

  /**
   * Processes a successful payment by updating balances and creating transactions.
   */
  async processSuccessfulPayment(payment, paymentIntent) {
    if (payment.status === 'completed') {
      console.warn(`Payment ${payment.id} has already been processed.`);
      return;
    }

    const platformFee = this.calculateStripeFee(paymentIntent.amount);
    const netAmount = (paymentIntent.amount / 100) - platformFee;

    await Payment.update(payment.id, {
      status: 'completed',
      processed_at: new Date(),
      platform_fee: platformFee,
      net_amount: netAmount,
      gateway_callback_data: paymentIntent,
    });

    // For now, we assume the payment is a deposit to the user's balance
    await UserBalance.add(payment.user_id, netAmount);

    await Transaction.create({
      userId: payment.user_id,
      paymentId: payment.id,
      type: 'deposit',
      amount: netAmount,
      currency: payment.currency,
      description: `Deposit from Stripe payment: ${paymentIntent.id}`,
    });
  },

  /**
   * Calculates the Stripe fee (approximated as 2.9% + $0.30).
   */
  calculateStripeFee(amountInCents) {
    const fee = (amountInCents * 0.029) + 30;
    return Math.round(fee) / 100;
  },
};

export default PaymentService;