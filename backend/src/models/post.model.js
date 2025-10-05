import { db } from '../utils/database.js';

export const Post = {
  async create(postData) {
    const {
      authorId,
      content,
      contentType = 'text',
      mediaUrls = [],
      hashtags = [],
      mentions = [],
      visibility = 'public'
    } = postData;

    const query = `
      INSERT INTO posts (author_id, content, content_type, media_urls, hashtags, mentions, visibility)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const params = [authorId, content, contentType, mediaUrls, hashtags, mentions, visibility];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  async findById(postId) {
    const query = `
      SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1 AND p.deleted_at IS NULL;
    `;
    const { rows } = await db.query(query, [postId]);
    return rows[0];
  },

  async findAll({ limit = 20, offset = 0, authorId, visibility = 'public' } = {}) {
    let query = `
      SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.deleted_at IS NULL
    `;
    const params = [];
    const whereClauses = [];

    if (authorId) {
      params.push(authorId);
      whereClauses.push(`p.author_id = $${params.length}`);
    }

    if (visibility) {
      params.push(visibility);
      whereClauses.push(`p.visibility = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` AND ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  },

  async update(postId, updates) {
    const allowedFields = ['content', 'media_urls', 'hashtags', 'visibility'];
    const setClause = [];
    const params = [postId];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        params.push(updates[key]);
        setClause.push(`${key} = $${params.length}`);
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE posts
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, params);
    return rows[0];
  },

  async delete(postId) {
    const query = `
      UPDATE posts
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id;
    `;
    const { rows } = await db.query(query, [postId]);
    return rows[0];
  },

  async incrementCount(postId, field) {
    const validFields = ['likes_count', 'comments_count', 'shares_count', 'views_count'];
    if (!validFields.includes(field)) {
      throw new Error('Invalid field for increment');
    }

    const query = `
      UPDATE posts
      SET ${field} = ${field} + 1
      WHERE id = $1
      RETURNING ${field};
    `;
    const { rows } = await db.query(query, [postId]);
    return rows[0];
  },

  async decrementCount(postId, field) {
    const validFields = ['likes_count', 'comments_count'];
    if (!validFields.includes(field)) {
      throw new Error('Invalid field for decrement');
    }

    const query = `
      UPDATE posts
      SET ${field} = GREATEST(${field} - 1, 0)
      WHERE id = $1
      RETURNING ${field};
    `;
    const { rows } = await db.query(query, [postId]);
    return rows[0];
  }
};

export default Post;