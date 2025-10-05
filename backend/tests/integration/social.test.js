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
  __esModule: true,
  default: {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  },
}));


describe('Social API (with pg mocked)', () => {
  let authToken;
  const mockUser = {
    id: 'mock-user-id-123',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
  };

  beforeAll(async () => {
    // Perform login once to get a token for all tests in this suite
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    bcrypt.compare.mockResolvedValue(true);
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginResponse.body.data.tokens.accessToken;
  });

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
      // Arrange
      const postContent = 'This is a brand new post!';
      const mockCreatedPost = { id: 'mock-post-id-456', author_id: mockUser.id, content: postContent };
      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedPost] });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: postContent });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('mock-post-id-456');
    });
  });

  describe('POST /api/posts/:id/like', () => {
    const mockPostId = 'post-to-be-liked';

    it('should like a post successfully', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ id: mockPostId }] }); // Post.findById
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Like.exists returns false
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // Like.create
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // Post.incrementCount

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(true);
    });

    it('should unlike a post successfully', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ id: mockPostId }] }); // Post.findById
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'like-id' }] }); // Like.exists returns true
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // Like.remove
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // Post.decrementCount

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(false);
    });
  });
});