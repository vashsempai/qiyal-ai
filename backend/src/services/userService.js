import { User } from '../models/user.model.js';
import { AuthService } from './auth.service.js';

export const UserService = {
  async register(userData) {
    const { username, email, password, firstName, lastName } = userData;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    // Generate tokens for immediate login
    const tokens = AuthService.generateTokens(newUser);

    // Prepare user object for response
    const userResponse = { ...newUser };
    delete userResponse.password_hash;

    return { user: userResponse, tokens };
  },

  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // Remove sensitive data
    delete user.password_hash;
    return user;
  },

  async updateUserProfile(userId, updateData) {
    const updatedUser = await User.update(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found or update failed');
    }
    delete updatedUser.password_hash;
    return updatedUser;
  }
};

export default UserService;