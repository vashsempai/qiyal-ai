import { UserService } from '../services/userService.js';

/**
 * Controller for handling user profile-related requests.
 */
export const UserController = {
  /**
   * Handles the request to get a user's profile by their ID.
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserProfile(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to update the currently authenticated user's profile.
   */
  async updateCurrentUserProfile(req, res, next) {
    try {
      // The user's ID should be attached to the request by an auth middleware
      const userId = req.user.id;
      const updateData = req.body;

      const updatedUser = await UserService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default UserController;