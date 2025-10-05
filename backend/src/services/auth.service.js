import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

/**
 * Service for handling authentication-related logic like password hashing and JWT management.
 */
export const AuthService = {
  /**
   * Authenticates a user and returns their data along with JWTs.
   * @param {string} email - The user's email.
   * @param {string} password - The user's plain text password.
   * @returns {Promise<{user: object, tokens: object}>}
   * @throws {Error} If credentials are invalid.
   */
  async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isMatch = await this.comparePasswords(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    const tokens = this.generateTokens(user);

    const userResponse = { ...user };
    delete userResponse.password_hash;

    return { user: userResponse, tokens };
  },

  /**
   * Hashes a plain text password.
   * @param {string} password - The plain text password to hash.
   * @returns {Promise<string>} The resulting hashed password.
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  /**
   * Compares a plain text password with a hashed password.
   * @param {string} password - The plain text password.
   * @param {string} hashedPassword - The hash to compare against.
   * @returns {Promise<boolean>} True if the password matches the hash, otherwise false.
   */
  async comparePasswords(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * Generates JWT access and refresh tokens for a user.
   * @param {object} user - The user object to encode in the tokens.
   * @returns {{accessToken: string, refreshToken: string}} An object containing the new tokens.
   */
  generateTokens(user) {
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      // Add any other roles or permissions from your user object
    };

    const refreshTokenPayload = {
      sub: user.id,
    };

    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m', // Shorter lifespan for access tokens
    });

    const refreshToken = jwt.sign(refreshTokenPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Longer lifespan for refresh tokens
    });

    return { accessToken, refreshToken };
  },

  /**
   * Verifies a JWT access token.
   * @param {string} token - The JWT to verify.
   * @returns {object|null} The decoded token payload if valid, otherwise null.
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Handles expired tokens, invalid signatures, etc.
      return null;
    }
  },

  /**
   * Verifies a JWT refresh token.
   * @param {string} token - The JWT to verify.
   * @returns {object|null} The decoded token payload if valid, otherwise null.
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  },
};

export default AuthService;