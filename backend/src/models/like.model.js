import { db } from '../utils/database.js';

export const Like = {
  /**
   * Creates a like for a post or a comment.
   * @param {string} userId - The ID of the user who is liking.
   * @param {string} postId - The ID of the post being liked (optional).
   * @param {string} commentId - The ID of the comment being liked (optional).
   * @returns {Promise<object>} The newly created like object.
   */
  async create(userId, postId = null, commentId = null) {
    if (!postId && !commentId) {
      throw new Error('A like must be associated with a post or a comment.');
    }

    const query = `
      INSERT INTO likes (user_id, post_id, comment_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const params = [userId, postId, commentId];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Removes a like from a post or comment.
   * @param {string} userId - The ID of the user.
   * @param {string} postId - The ID of the post (optional).
   * @param {string} commentId - The ID of the comment (optional).
   * @returns {Promise<object>} The deleted like object.
   */
  async remove(userId, postId = null, commentId = null) {
    let query = 'DELETE FROM likes WHERE user_id = $1';
    const params = [userId];

    if (postId) {
      params.push(postId);
      query += ` AND post_id = $${params.length}`;
    } else if (commentId) {
      params.push(commentId);
      query += ` AND comment_id = $${params.length}`;
    } else {
      throw new Error('A post ID or comment ID is required to remove a like.');
    }

    query += ' RETURNING *;';

    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Checks if a user has already liked a post or comment.
   * @param {string} userId - The ID of the user.
   * @param {string} postId - The ID of the post (optional).
   * @param {string} commentId - The ID of the comment (optional).
   * @returns {Promise<boolean>} True if the like exists, otherwise false.
   */
  async exists(userId, postId = null, commentId = null) {
    let query = 'SELECT 1 FROM likes WHERE user_id = $1';
    const params = [userId];

    if (postId) {
      params.push(postId);
      query += ` AND post_id = $${params.length}`;
    } else if (commentId) {
      params.push(commentId);
      query += ` AND comment_id = $${params.length}`;
    } else {
      return false;
    }

    const { rows } = await db.query(query, params);
    return rows.length > 0;
  },
};

export default Like;