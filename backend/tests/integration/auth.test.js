// Set JWT secrets for testing
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_REFRESH_SECRET = 'test-secret-key-for-jwt-tokens';

import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { app, server } from '../../server.js';

// --- Mocking Libraries ---
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
}));

// Create mock functions for database
const mockDbQuery = jest.fn();
const mockDbClose = jest.fn();

jest.mock('../../src/utils/database.js', () => ({
  db: {
    query: mockDbQuery,
    close: mockDbClose,
  },
}));

// Create mock functions for bcrypt
const mockBcryptCompare = jest.fn();
const mockBcryptGenSalt = jest.fn();
const mockBcryptHash = jest.fn();

jest.mock('bcryptjs', () => ({
  __esModule: true, // Handle ES module default export
  default: {
    compare: mockBcryptCompare,
    genSalt: mockBcryptGenSalt,
    hash: mockBcryptHash,
  },
}));

import { db } from '../../src/utils/database.js';
import bcrypt from 'bcryptjs';

describe('Auth API', () => {
  beforeEach(() => {
    mockDbQuery.mockReset();
    mockBcryptCompare.mockReset();
    mockBcryptHash.mockReset();
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // Check for existing email
        .mockResolvedValueOnce({ rows: [] }) // Check for existing username
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', email: 'new@example.com' }] }); // Create user
      mockBcryptHash.mockResolvedValue('hashed_password');

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          username: 'newuser',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('new@example.com');
      expect(response.body.data).toHaveProperty('tokens');
    });

    it('should fail if email is already in use', async () => {
      // Arrange
      mockDbQuery.mockResolvedValue({ rows: [{ id: 'existing-user' }] }); // Simulate user found

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123' });

      // Assert
      expect(response.status).toBe(500); // The service throws a generic error
      expect(response.body.error.message).toBe('User already exists with this email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user with correct credentials', async () => {
      // Arrange
      const mockUser = { id: 'user-1', email: 'test@example.com', password_hash: 'hashed' };
      mockDbQuery.mockResolvedValue({ rows: [mockUser] });
      mockBcryptCompare.mockResolvedValue(true);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
    });

    it('should fail with incorrect credentials', async () => {
      // Arrange
      const mockUser = { id: 'user-1', email: 'test@example.com', password_hash: 'hashed' };
      mockDbQuery.mockResolvedValue({ rows: [mockUser] });
      mockBcryptCompare.mockResolvedValue(false); // Password doesn't match

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
