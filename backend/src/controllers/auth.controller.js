import { UserService } from '../services/userService.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Controller for handling authentication-related requests like registration and login.
 */
export const AuthController = {
  /**
   * Handles user registration requests.
   */
  async register(req, res, next) {
    try {
      const { user, tokens } = await UserService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: { user, tokens },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles user login requests.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: { user, tokens },
      });
    } catch (error) {
      // For login, send a generic error to avoid user enumeration
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
  },
};

export default AuthController;