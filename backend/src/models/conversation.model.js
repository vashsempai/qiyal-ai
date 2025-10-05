import { db } from '../utils/database.js';

export const Conversation = {
  /**
   * Creates a new conversation and adds initial participants.
   * @param {object} conversationData - Data for the new conversation.
   * @param {string} conversationData.createdBy - The ID of the user creating the conversation.
   * @param {Array<string>} conversationData.participants - An array of user IDs to add to the conversation.
   * @param {string} [conversationData.type='direct'] - The type of conversation.
   * @param {string} [conversationData.title] - The title of the conversation (for groups).
   * @returns {Promise<object>} The newly created conversation object.
   */
  async create({ createdBy, participants, type = 'direct', title = null }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const conversationQuery = `
        INSERT INTO conversations (created_by, type, title)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const conversationParams = [createdBy, type, title];
      const { rows: conversationRows } = await client.query(conversationQuery, conversationParams);
      const newConversation = conversationRows[0];

      // Add all participants, including the creator
      const allParticipantIds = [...new Set([createdBy, ...participants])];
      const participantPromises = allParticipantIds.map(userId => {
        const role = userId === createdBy ? 'owner' : 'member';
        return this.addParticipant(newConversation.id, userId, role, client);
      });

      await Promise.all(participantPromises);

      await client.query('COMMIT');
      return newConversation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Adds a participant to a conversation.
   * @param {string} conversationId - The ID of the conversation.
   * @param {string} userId - The ID of the user to add.
   * @param {string} [role='member'] - The role of the participant.
   * @param {object} [client=db] - Optional database client for transactions.
   * @returns {Promise<object>} The new participant entry.
   */
  async addParticipant(conversationId, userId, role = 'member', client = db) {
    const query = `
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await client.query(query, [conversationId, userId, role]);
    return rows[0];
  },

  /**
   * Finds all conversations for a given user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} An array of conversation objects.
   */
  async findByUserId(userId) {
    const query = `
      SELECT c.*, lm.content as last_message_content
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN messages lm ON c.last_message_id = lm.id
      WHERE cp.user_id = $1 AND c.is_archived = false
      ORDER BY c.last_message_at DESC NULLS LAST;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  },

  /**
   * Finds a conversation by its ID.
   * @param {string} conversationId - The ID of the conversation.
   * @returns {Promise<object|undefined>} The conversation object.
   */
  async findById(conversationId) {
    const query = 'SELECT * FROM conversations WHERE id = $1';
    const { rows } = await db.query(query, [conversationId]);
    return rows[0];
  }
};

export default Conversation;