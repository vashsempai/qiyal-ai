import { db } from '../utils/database.js';

export const Comment = {
  /**
   * Creates a new comment on a post.
   * @param {object} commentData - The data for the new comment.
   * @returns {Promise<object>} The newly created comment object.
   */
  async create(commentData) {
    const { postId, authorId, content, parentCommentId = null } = commentData;

    const query = `
      INSERT INTO comments (post_id, author_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [postId, authorId, content, parentCommentId];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds all comments for a given post.
   * @param {string} postId - The ID of the post.
   * @returns {Promise<Array<object>>} An array of comment objects.
   */
  async findByPostId(postId) {
    const query = `
      SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC;
    `;
    const { rows } = await db.query(query, [postId]);
    return rows;
  },

  /**
   * Deletes a comment by marking it as deleted.
   * @param {string} commentId - The ID of the comment to delete.
   * @param {string} authorId - The ID of the author trying to delete the comment.
   * @returns {Promise<object>} The deleted comment object.
   */
  async delete(commentId, authorId) {
    const query = `
      UPDATE comments
      SET deleted_at = CURRENT_TIMESTAMP, content = '[deleted]'
      WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL
      RETURNING id;
    `;
    const { rows } = await db.query(query, [commentId, authorId]);
    return rows[0];
  },
};

export default Comment;