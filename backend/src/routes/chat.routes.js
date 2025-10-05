import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All chat routes are protected
router.use(protect);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
router.get('/conversations', ChatController.getConversations);

/**
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @desc    Get messages for a specific conversation
 * @access  Private
 */
router.get('/conversations/:conversationId/messages', ChatController.getMessages);

/**
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @desc    Send a new message in a conversation
 * @access  Private
 */
router.post('/conversations/:conversationId/messages', ChatController.sendMessage);

export default router;