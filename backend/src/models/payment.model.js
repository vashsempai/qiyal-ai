import { db } from '../utils/database.js';

export const Payment = {
  /**
   * Creates a new payment record in the database.
   * @param {object} paymentData - Data for the new payment.
   * @returns {Promise<object>} The newly created payment object.
   */
  async create(paymentData) {
    const {
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
      expiresAt,
    } = paymentData;

    const query = `
      INSERT INTO payments (
        user_id, contract_id, amount, currency, payment_method,
        platform_fee, gateway_fee, net_amount, description, metadata, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const params = [
      userId, contractId, amount, currency, paymentMethod,
      platformFee, gatewayFee, netAmount, description, metadata, expiresAt,
    ];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a payment by its ID.
   * @param {string} id - The ID of the payment.
   * @returns {Promise<object|undefined>} The payment object.
   */
  async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Finds a payment by its gateway transaction ID.
   * @param {string} transactionId - The ID from the payment gateway.
   * @returns {Promise<object|undefined>} The payment object.
   */
  async findByGatewayTransactionId(transactionId) {
    const query = 'SELECT * FROM payments WHERE gateway_transaction_id = $1;';
    const { rows } = await db.query(query, [transactionId]);
    return rows[0];
  },

  /**
   * Updates a payment record.
   * @param {string} id - The ID of the payment to update.
   * @param {object} updates - The fields to update.
   * @returns {Promise<object>} The updated payment object.
   */
  async update(id, updates) {
    const allowedUpdates = [
      'status', 'gateway_transaction_id', 'gateway_response',
      'gateway_callback_data', 'processed_at', 'receipt_url'
    ];

    const setClauses = [];
    const params = [id];

    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        params.push(updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update.');
    }

    const query = `
      UPDATE payments
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await db.query(query, params);
    return rows[0];
  },
};

export default Payment;