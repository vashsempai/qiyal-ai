import { ChatService } from '../services/chat.service.js';

export const ChatController = {
  /**
   * Handles the request to get all conversations for the authenticated user.
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const conversations = await ChatService.getConversations(userId);
      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to get messages for a specific conversation.
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const options = req.query; // For pagination (limit, offset, etc.)

      const messages = await ChatService.getMessages(conversationId, userId, options);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to send a new message in a conversation.
   */
  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const senderId = req.user.id;
      const messageData = req.body;

      const message = await ChatService.sendMessage(senderId, conversationId, messageData);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  },
};

export default ChatController;