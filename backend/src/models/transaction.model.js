import { db } from '../utils/database.js';

export const Transaction = {
  /**
   * Creates a new financial transaction record.
   * @param {object} transactionData - Data for the new transaction.
   * @returns {Promise<object>} The newly created transaction object.
   */
  async create(transactionData) {
    const {
      userId,
      paymentId,
      type,
      amount,
      currency,
      description,
      referenceId,
      metadata
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        user_id, payment_id, type, amount, currency, description, reference_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      userId, paymentId, type, amount, currency, description, referenceId, metadata
    ];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds all transactions for a given user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} An array of transaction objects.
   */
  async findByUserId(userId) {
    const query = 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC;';
    const { rows } = await db.query(query, [userId]);
    return rows;
  },
};

export default Transaction;