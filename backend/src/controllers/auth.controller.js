const User = require('../models/user.model');
const AuthService = require('../services/auth.service');

const AuthController = {
  /**
   * Handles user registration.
   */
  async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already in use' });
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const newUser = await User.create({
        email,
        username,
        passwordHash,
        firstName,
        lastName,
        role,
      });

      // Generate tokens
      const tokens = AuthService.generateTokens(newUser);

      // Sanitize user object before sending
      const userResponse = { ...newUser };
      delete userResponse.password_hash;

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        tokens,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles user login.
   */
  async login(req, res, next) {
    try {
      const { login, password } = req.body;

      // Find user by email or username
      const user = await User.findByEmail(login) || await User.findByUsername(login);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare passwords
      const isMatch = await AuthService.comparePasswords(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Sanitize user object
      const userResponse = { ...user };
      delete userResponse.password_hash;

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        tokens,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetches the profile of the currently authenticated user.
   */
  async getProfile(req, res, next) {
    try {
      // The user ID is attached to the request by the auth middleware
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AuthController;