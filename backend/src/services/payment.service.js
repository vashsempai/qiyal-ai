import { Payment } from '../models/payment.model.js';
import { Transaction } from '../models/transaction.model.js';
import { UserBalance } from '../models/user-balance.model.js';
import { KaspiService } from './kaspi.service.js';

export const PaymentService = {
  async createPayment({
    userId,
    amount,
    currency = 'KZT',
    paymentMethod,
    description,
    contractId,
    metadata = {}
  }) {
    // Calculate fees
    const platformFee = this.calculatePlatformFee(amount, paymentMethod);
    const gatewayFee = this.calculateGatewayFee(amount, paymentMethod);
    const netAmount = amount - platformFee - gatewayFee;

    // Create payment record
    const payment = await Payment.create({
      userId,
      contractId,
      amount,
      currency,
      paymentMethod,
      platformFee,
      gatewayFee,
      netAmount,
      description,
      metadata,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Create gateway transaction
    let gatewayResponse;
    switch (paymentMethod) {
      case 'kaspi':
        gatewayResponse = await KaspiService.createPayment({
          amount,
          currency,
          orderId: payment.id,
          description,
          callbackUrl: `${process.env.API_URL}/api/payments/webhook/kaspi`,
          returnUrl: `${process.env.FRONTEND_URL}/payments/success`
        });
        break;

      case 'balance':
        // Process balance payment immediately
        return await this.processBalancePayment(payment);

      default:
        throw new Error(`Payment method ${paymentMethod} not supported`);
    }

    // Update payment with gateway response
    if (gatewayResponse) {
      await Payment.update(payment.id, {
        gatewayTransactionId: gatewayResponse.transactionId,
        gatewayResponse,
        status: 'processing'
      });
    }

    return { ...payment, gatewayResponse };
  },

  async processBalancePayment(payment) {
    const userBalance = await UserBalance.findByUserId(payment.user_id);

    if (!userBalance || userBalance.available_balance < payment.amount) {
      await Payment.update(payment.id, { status: 'failed' });
      throw new Error('Insufficient balance');
    }

    // Deduct from balance
    await UserBalance.deduct(payment.user_id, payment.amount);

    // Create transaction
    await Transaction.create({
      userId: payment.user_id,
      paymentId: payment.id,
      type: 'payment',
      amount: -payment.amount,
      description: payment.description
    });

    // Mark payment as completed
    await Payment.update(payment.id, {
      status: 'completed',
      processedAt: new Date()
    });

    return payment;
  },

  async handleKaspiWebhook(webhookData) {
    const { orderId, status, transactionId, amount } = webhookData;

    const payment = await Payment.findById(orderId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status based on webhook
    let paymentStatus;
    switch (status) {
      case 'SUCCESS':
        paymentStatus = 'completed';
        // Add to user balance
        await UserBalance.add(payment.user_id, payment.net_amount);
        // Create transaction record
        await Transaction.create({
          userId: payment.user_id,
          paymentId: payment.id,
          type: 'deposit',
          amount: payment.net_amount,
          description: payment.description
        });
        break;

      case 'FAILED':
        paymentStatus = 'failed';
        break;

      default:
        paymentStatus = 'processing';
    }

    await Payment.update(payment.id, {
      status: paymentStatus,
      gatewayCallbackData: webhookData,
      processedAt: paymentStatus === 'completed' ? new Date() : null
    });

    // TODO: Send notification to user
    // TODO: Update contract status if needed

    return payment;
  },

  calculatePlatformFee(amount, paymentMethod) {
    const feeRate = parseFloat(process.env.PLATFORM_FEE_RATE) || 0.05; // 5%
    return Math.round(amount * feeRate * 100) / 100;
  },

  calculateGatewayFee(amount, paymentMethod) {
    const fees = {
      kaspi: 0.025, // 2.5%
      card: 0.03,   // 3%
      bank_transfer: 0.01, // 1%
      balance: 0    // No fee
    };

    const feeRate = fees[paymentMethod] || 0;
    return Math.round(amount * feeRate * 100) / 100;
  }
};

export default PaymentService;