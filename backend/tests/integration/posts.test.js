import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import { app, server } from '../../server.js';
import bcrypt from 'bcryptjs';

// --- Mocking Libraries ---
// Mock the 'pg' library to control database interactions
const mockQuery = jest.fn();
jest.mock('pg', () => {
  const mockPool = {
    query: mockQuery,
    connect: jest.fn().mockReturnThis(),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock the 'bcryptjs' library to control password comparison
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));


describe('Posts API (with pg mocked)', () => {

  beforeEach(() => {
    // Reset mocks before each test
    mockQuery.mockReset();
    bcrypt.compare.mockClear();
  });

  afterAll(() => {
    // Close the server to allow Jest to exit cleanly
    server.close();
  });

  describe('POST /api/posts', () => {
    it('should create a new post for an authenticated user', async () => {
      // --- Arrange ---
      // 1. Mock the database response for the user login
      const mockUser = {
        id: 'mock-user-id-123',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(true); // Ensure password check passes

      // 2. Perform login to get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      const authToken = loginResponse.body.data.tokens.accessToken;

      // 3. Mock the database response for creating the post
      const postContent = 'This is a brand new post!';
      const mockCreatedPost = {
        id: 'mock-post-id-456',
        author_id: mockUser.id,
        content: postContent,
        hashtags: [],
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedPost] });

      // --- Act ---
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: postContent });

      // --- Assert ---
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('mock-post-id-456');

      // Verify the INSERT query for the post was called
      const insertQueryCall = mockQuery.mock.calls.find(call => call[0].includes('INSERT INTO posts'));
      expect(insertQueryCall).toBeDefined();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ content: 'This should fail.' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('no token provided');
    });
  });
});