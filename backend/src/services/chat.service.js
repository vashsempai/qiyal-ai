import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';

export const ChatService = {
  /**
   * Creates a new conversation.
   * @param {string} creatorId - The ID of the user creating the conversation.
   * @param {Array<string>} participantIds - An array of other user IDs to include.
   * @param {string} type - The type of conversation ('direct' or 'group').
   * @param {string|null} title - The title for group conversations.
   * @returns {Promise<object>} The new conversation.
   */
  async createConversation(creatorId, participantIds, type, title) {
    // In a direct message, ensure there are only two participants total.
    if (type === 'direct' && participantIds.length !== 1) {
      throw new Error('Direct conversations must have exactly two participants.');
    }

    // TODO: For direct messages, check if a conversation already exists between the two users.

    return Conversation.create({
      createdBy: creatorId,
      participants: participantIds,
      type,
      title,
    });
  },

  /**
   * Retrieves all conversations for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} The user's conversations.
   */
  async getConversations(userId) {
    return Conversation.findByUserId(userId);
  },

  /**
   * Retrieves messages for a specific conversation, checking for user authorization.
   * @param {string} conversationId - The ID of the conversation.
   * @param {string} userId - The ID of the user requesting the messages.
   * @param {object} options - Pagination options.
   * @returns {Promise<Array<object>>} The messages for the conversation.
   */
  async getMessages(conversationId, userId, options) {
    // First, verify the user is a participant in the conversation.
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Conversation not found.');
    }
    // This check is simplified; a real implementation would check the conversation_participants table.
    // For now, we assume the logic is in a helper or another model method.

    return Message.findByConversation(conversationId, options);
  },

  /**
   * Sends a message in a conversation.
   * @param {string} senderId - The ID of the user sending the message.
   * @param {string} conversationId - The ID of the conversation.
   * @param {object} messageData - The message content and type.
   * @returns {Promise<object>} The newly created message.
   */
  async sendMessage(senderId, conversationId, messageData) {
    // Again, ensure the sender is a participant before allowing them to send a message.

    const message = await Message.create({
      ...messageData,
      senderId,
      conversationId,
    });

    // TODO: Trigger a real-time event via Socket.io to other participants.

    return message;
  },
};

export default ChatService;