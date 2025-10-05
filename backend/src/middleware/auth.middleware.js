import { AuthService } from '../services/auth.service.js';

/**
 * Middleware to protect routes by verifying a JWT access token.
 * If the token is valid, it attaches the decoded user payload to the request object.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
export const protect = (req, res, next) => {
  let token;

  // Check for the token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the AuthService
      const decoded = AuthService.verifyAccessToken(token);

      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
      }

      // Attach the decoded payload (e.g., { sub: userId, email }) to the request
      req.user = { id: decoded.sub, ...decoded };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  // If no token is found in the header
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

/**
 * Optional middleware to check for specific roles.
 * Must be used after the 'protect' middleware.
 * @param {...string} roles - The roles allowed to access the route.
 * @returns {function} An Express middleware function.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'User role not authorized.' });
    }
    next();
  };
};