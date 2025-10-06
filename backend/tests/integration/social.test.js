// Set JWT_SECRET before importing the server so AuthService uses the same secret
const TEST_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_SECRET;

import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import { app, server } from '../../server.js';
import jwt from 'jsonwebtoken';

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

// Mock the bcryptjs library directly. The `import` will now receive this object.
const mockBcryptCompare = jest.fn();
const mockBcryptGenSalt = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: mockBcryptCompare,
    genSalt: mockBcryptGenSalt,
    hash: mockBcryptHash,
  },
  compare: mockBcryptCompare,
  genSalt: mockBcryptGenSalt,
  hash: mockBcryptHash,
}));

// Mock Gemini service to prevent API calls
jest.mock('../../src/services/gemini.service.js', () => ({
  __esModule: true,
  default: {
    moderateContent: jest.fn().mockResolvedValue({ isAppropriate: true }),
  },
}));

// Mock Post model
const mockPostFindById = jest.fn();
const mockPostCreate = jest.fn();
const mockPostIncrementCount = jest.fn();
const mockPostDecrementCount = jest.fn();

jest.mock('../../src/models/post.model.js', () => ({
  __esModule: true,
  default: {
    findById: mockPostFindById,
    create: mockPostCreate,
    incrementCount: mockPostIncrementCount,
    decrementCount: mockPostDecrementCount,
  },
  Post: {
    findById: mockPostFindById,
    create: mockPostCreate,
    incrementCount: mockPostIncrementCount,
    decrementCount: mockPostDecrementCount,
  },
}));

// Mock Like model
const mockLikeExists = jest.fn();
const mockLikeCreate = jest.fn();
const mockLikeRemove = jest.fn();

jest.mock('../../src/models/like.model.js', () => ({
  __esModule: true,
  default: {
    exists: mockLikeExists,
    create: mockLikeCreate,
    remove: mockLikeRemove,
  },
  Like: {
    exists: mockLikeExists,
    create: mockLikeCreate,
    remove: mockLikeRemove,
  },
}));

import bcrypt from 'bcryptjs';

describe('Social API (with pg mocked)', () => {
  let authToken;
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
  };

  beforeAll(async () => {
    // Generate real JWT tokens using jwt.sign with the test secret
    const accessToken = jwt.sign(
      { sub: mockUser.id, email: mockUser.email },
      TEST_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { sub: mockUser.id, email: mockUser.email },
      TEST_SECRET,
      { expiresIn: '7d' }
    );

    // Perform login once to get a token for all tests in this suite
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockBcryptCompare.mockResolvedValue(true);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    // Force loginResponse to have the correct structure with real JWT tokens
    loginResponse.body.data = {
      tokens: {
        accessToken,
        refreshToken
      },
      user: mockUser
    };

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  beforeEach(() => {
    // Reset all mocks before each test
    mockQuery.mockReset();
    mockBcryptCompare.mockClear();
    mockPostFindById.mockClear();
    mockPostCreate.mockClear();
    mockPostIncrementCount.mockClear();
    mockPostDecrementCount.mockClear();
    mockLikeExists.mockClear();
    mockLikeCreate.mockClear();
    mockLikeRemove.mockClear();
  });

  afterAll(() => {
    // Close the server to allow Jest to exit cleanly
    server.close();
  });

  describe('POST /api/posts', () => {
    it('should create a new post for an authenticated user', async () => {
      // Arrange
      const postContent = 'This is a brand new post!';
      const mockCreatedPost = { 
        id: '22222222-2222-2222-2222-222222222222', 
        author_id: mockUser.id, 
        content: postContent,
        content_type: 'text',
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString()
      };
      
      // Mock Post.create to return the created post
      mockPostCreate.mockResolvedValue(mockCreatedPost);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: postContent });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(mockPostCreate).toHaveBeenCalledWith(expect.objectContaining({
        authorId: mockUser.id,
        content: postContent
      }));
    });
  });

  describe('POST /api/posts/:id/like', () => {
    const mockPostId = '33333333-3333-3333-3333-333333333333';
    const mockPost = {
      id: mockPostId,
      author_id: mockUser.id,
      content: 'Test post',
      likes_count: 0
    };

    it('should like a post successfully', async () => {
      // Arrange
      mockPostFindById.mockResolvedValue(mockPost);
      mockLikeExists.mockResolvedValue(false); // User hasn't liked yet
      mockLikeCreate.mockResolvedValue({ 
        id: '44444444-4444-4444-4444-444444444444',
        user_id: mockUser.id,
        post_id: mockPostId 
      });
      mockPostIncrementCount.mockResolvedValue({ likes_count: 1 });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(true);
      expect(mockPostFindById).toHaveBeenCalledWith(mockPostId);
      expect(mockLikeExists).toHaveBeenCalledWith(mockUser.id, mockPostId, null);
      expect(mockLikeCreate).toHaveBeenCalledWith(mockUser.id, mockPostId, null);
      expect(mockPostIncrementCount).toHaveBeenCalledWith(mockPostId, 'likes_count');
    });

    it('should unlike a post successfully', async () => {
      // Arrange
      mockPostFindById.mockResolvedValue(mockPost);
      mockLikeExists.mockResolvedValue(true); // User has already liked
      mockLikeRemove.mockResolvedValue({ 
        id: '44444444-4444-4444-4444-444444444444',
        user_id: mockUser.id,
        post_id: mockPostId 
      });
      mockPostDecrementCount.mockResolvedValue({ likes_count: 0 });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(false);
      expect(mockPostFindById).toHaveBeenCalledWith(mockPostId);
      expect(mockLikeExists).toHaveBeenCalledWith(mockUser.id, mockPostId, null);
      expect(mockLikeRemove).toHaveBeenCalledWith(mockUser.id, mockPostId, null);
      expect(mockPostDecrementCount).toHaveBeenCalledWith(mockPostId, 'likes_count');
    });
  });
});
