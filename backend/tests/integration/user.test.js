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

const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    connect: jest.fn().mockReturnThis(),
    on: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('User API (with pg mocked)', () => {

  beforeEach(() => {
    mockQuery.mockReset();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/users/:id', () => {
    it('should return a user profile if the user exists', async () => {
      // Arrange
      const mockUser = { id: 'user-to-find', name: 'Test User' };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      // Act
      const response = await request(app).get('/api/users/user-to-find');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-to-find');
    });

    it('should return a 404 error if the user does not exist', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] }); // Simulate user not found

      // Act
      const response = await request(app).get('/api/users/non-existent-user');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found.');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should require authentication', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .send({ firstName: 'Updated' });

      // Assert
      expect(response.status).toBe(401);
    });
  });
});