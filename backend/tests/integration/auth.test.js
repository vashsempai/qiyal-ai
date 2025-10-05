import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { app, server } from '../../server.js';
import { db } from '../../src/utils/database.js';
import bcrypt from 'bcryptjs';

// --- Mocking Libraries ---
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
}));

jest.mock('../../src/utils/database.js', () => ({
  db: {
    query: jest.fn(),
    close: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  __esModule: true, // Handle ES module default export
  default: {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  },
}));


describe('Auth API', () => {

  beforeEach(() => {
    db.query.mockReset();
    bcrypt.default.compare.mockReset();
    bcrypt.default.hash.mockReset();
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      db.query
        .mockResolvedValueOnce({ rows: [] }) // Check for existing email
        .mockResolvedValueOnce({ rows: [] }) // Check for existing username
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', email: 'new@example.com' }] }); // Create user
      bcrypt.default.hash.mockResolvedValue('hashed_password');

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
      db.query.mockResolvedValue({ rows: [{ id: 'existing-user' }] }); // Simulate user found

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
      db.query.mockResolvedValue({ rows: [mockUser] });
      bcrypt.default.compare.mockResolvedValue(true);

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
      db.query.mockResolvedValue({ rows: [mockUser] });
      bcrypt.default.compare.mockResolvedValue(false); // Password doesn't match

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