import { db } from '../utils/database.js';

export const UserBalance = {
  /**
   * Finds a user's balance record by their user ID.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object|undefined>} The user balance object.
   */
  async findByUserId(userId) {
    const query = 'SELECT * FROM user_balances WHERE user_id = $1;';
    const { rows } = await db.query(query, [userId]);
    return rows[0];
  },

  /**
   * Adds a specified amount to a user's available balance.
   * Creates a balance record if one does not exist.
   * @param {string} userId - The ID of the user.
   * @param {number} amount - The amount to add.
   * @returns {Promise<object>} The updated user balance object.
   */
  async add(userId, amount) {
    const query = `
      INSERT INTO user_balances (user_id, available_balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET available_balance = user_balances.available_balance + $2
      RETURNING *;
    `;
    const { rows } = await db.query(query, [userId, amount]);
    return rows[0];
  },

  /**
   * Deducts a specified amount from a user's available balance.
   * @param {string} userId - The ID of the user.
   * @param {number} amount - The amount to deduct.
   * @returns {Promise<object>} The updated user balance object.
   * @throws {Error} If the user has insufficient funds.
   */
  async deduct(userId, amount) {
    // This operation should be done within a transaction in the service layer
    // to ensure the user has sufficient funds before deducting.
    const query = `
      UPDATE user_balances
      SET available_balance = available_balance - $1
      WHERE user_id = $2 AND available_balance >= $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [amount, userId]);
    if (rows.length === 0) {
      throw new Error('Insufficient balance or user not found.');
    }
    return rows[0];
  },
};

export default UserBalance;