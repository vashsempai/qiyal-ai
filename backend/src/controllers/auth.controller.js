import { UserService } from '../services/userService.js';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/user.model.js';

/**
 * Controller for handling authentication-related requests like registration and login.
 */
export const AuthController = {
  /**
   * Handles user registration requests.
   * It validates input, calls the user service to create the user,
   * and sends a success response.
   */
  async register(req, res, next) {
    try {
      const newUser = await UserService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: newUser,
      });
    } catch (error) {
      // Pass errors to the error handling middleware
      next(error);
    }
  },

  /**
   * Handles user login requests.
   * It validates credentials, generates JWTs upon success,
   * and returns the user data along with the tokens.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      // Compare passwords
      const isMatch = await AuthService.comparePasswords(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Prepare user data for the response (omitting sensitive info)
      const userResponse = { ...user };
      delete userResponse.password_hash;

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: userResponse,
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;