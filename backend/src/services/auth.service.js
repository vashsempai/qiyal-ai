const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthService = {
  /**
   * Hashes a plain text password.
   * @param {string} password - The plain text password.
   * @returns {Promise<string>} The hashed password.
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  /**
   * Compares a plain text password with a hash.
   * @param {string} password - The plain text password.
   * @param {string} hashedPassword - The hashed password.
   * @returns {Promise<boolean>} True if the passwords match.
   */
  async comparePasswords(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * Generates JWT access and refresh tokens.
   * @param {object} user - The user object to encode in the token.
   * @returns {{accessToken: string, refreshToken: string}} The generated tokens.
   */
  generateTokens(user) {
    const payload = {
      id: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d', // 7-day access token
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // 30-day refresh token
    });

    return { accessToken, refreshToken };
  },

  /**
   * Verifies a JWT token.
   * @param {string} token - The JWT token to verify.
   * @returns {object|null} The decoded payload or null if invalid.
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  },
};

module.exports = AuthService;