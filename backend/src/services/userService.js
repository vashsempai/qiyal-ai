import { User } from '../models/user.model.js';
import { AuthService } from './auth.service.js';

/**
 * Service for handling user-related business logic, such as registration and profile management.
 */
export const UserService = {
  /**
   * Registers a new user.
   * @param {object} userData - The user registration data.
   * @returns {Promise<object>} The newly created user object.
   * @throws {Error} If the email or username is already taken.
   */
  async register(userData) {
    const { email, username, password } = userData;

    // Check if email or username already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email is already in use.');
    }
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username is already taken.');
    }

    // Hash password before creating user
    const passwordHash = await AuthService.hashPassword(password);

    // Create the user
    const newUser = await User.create({
      ...userData,
      password: passwordHash, // The model expects 'password', but we pass the hash
    });

    // Omit password hash from the returned object
    delete newUser.password_hash;
    return newUser;
  },

  /**
   * Retrieves a user's public profile by their ID.
   * @param {string} id - The ID of the user to retrieve.
   * @returns {Promise<object|null>} The user profile object or null if not found.
   */
  async getUserProfile(id) {
    const user = await User.findById(id);
    if (!user) {
      return null;
    }
    // Ensure sensitive data is not returned
    delete user.password_hash;
    return user;
  },

  /**
   * Updates a user's profile.
   * @param {string} userId - The ID of the user to update.
   * @param {object} updateData - The data to update.
   * @returns {Promise<object>} The updated user object.
   */
  async updateUserProfile(userId, updateData) {
    // Add any business logic here, e.g., validation, sanitation
    const updatedUser = await User.update(userId, updateData);
    delete updatedUser.password_hash;
    return updatedUser;
  },
};

export default UserService;