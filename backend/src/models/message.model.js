import { db } from '../utils/database.js';

export const Message = {
  async create(messageData) {
    const {
      conversationId,
      senderId,
      content,
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      replyToId,
      metadata = {}
    } = messageData;

    const query = `
      INSERT INTO messages (
        conversation_id, sender_id, content, message_type,
        file_url, file_name, file_size, mime_type, reply_to_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const params = [
      conversationId, senderId, content, messageType,
      fileUrl, fileName, fileSize, mimeType, replyToId, metadata
    ];

    const { rows } = await db.query(query, params);

    // Update conversation's last message
    await this.updateConversationLastMessage(conversationId, rows[0].id);

    return rows[0];
  },

  async findByConversation(conversationId, { limit = 50, offset = 0, before } = {}) {
    let query = `
      SELECT
        m.*,
        u.username, u.first_name, u.last_name, u.avatar_url,
        rm.content as reply_content,
        ru.username as reply_username
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN messages rm ON m.reply_to_id = rm.id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
    `;

    const params = [conversationId];

    if (before) {
      params.push(before);
      query += ` AND m.created_at < $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows.reverse(); // Return in chronological order
  },

  async findById(messageId) {
    const query = `
      SELECT
        m.*,
        u.username, u.first_name, u.last_name, u.avatar_url
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1 AND m.deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [messageId]);
    return rows[0];
  },

  async update(messageId, senderId, content) {
    const query = `
      UPDATE messages
      SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [content, messageId, senderId]);
    return rows[0];
  },

  async delete(messageId, senderId) {
    const query = `
      UPDATE messages
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [messageId, senderId]);
    return rows[0];
  },

  async markAsRead(messageId, userId) {
    // Insert or update message read status
    const query = `
      INSERT INTO message_reads (message_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (message_id, user_id)
      DO UPDATE SET read_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const { rows } = await db.query(query, [messageId, userId]);
    return rows[0];
  },

  async updateConversationLastMessage(conversationId, messageId) {
    const query = `
      UPDATE conversations
      SET last_message_id = $1, last_message_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `;

    await db.query(query, [messageId, conversationId]);
  }
};

export default Message;