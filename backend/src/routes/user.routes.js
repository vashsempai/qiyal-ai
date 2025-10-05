import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest, updateUserProfileSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/:id
 * @desc    Get a user's public profile by ID
 * @access  Public
 */
router.get('/:id', UserController.getUserById);

/**
 * @route   PUT /api/users/profile
 * @desc    Update the current user's profile
 * @access  Private
 */
router.put(
  '/profile',
  protect,
  validateRequest(updateUserProfileSchema),
  UserController.updateCurrentUserProfile
);

export default router;