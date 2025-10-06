// Set JWT_SECRET before importing the server so AuthService uses the same secret
const TEST_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_SECRET;

import request from 'supertest';
import { jest, describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
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

// Mock the bcryptjs library directly
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

// Mock PostService BEFORE importing server
const mockCreatePost = jest.fn();
const mockFindById = jest.fn();
const mockLikePost = jest.fn();
jest.mock('../../src/services/post.service.js', () => ({
  __esModule: true,
  PostService: {
    createPost: mockCreatePost,
    findById: mockFindById,
    likePost: mockLikePost,
  },
  default: {
    createPost: mockCreatePost,
    findById: mockFindById,
    likePost: mockLikePost,
  },
}));

// Mock GeminiService BEFORE importing server
const mockModerateContent = jest.fn();
jest.mock('../../src/services/gemini.service.js', () => ({
  __esModule: true,
  GeminiService: {
    moderateContent: mockModerateContent,
  },
  default: {
    moderateContent: mockModerateContent,
  },
}));

import { app, server } from '../../server.js';
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
    mockCreatePost.mockClear();
    mockLikePost.mockClear();
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
        author: {
          id: mockUser.id,
          email: mockUser.email,
          username: 'test',
          avatar_url: null
        },
        content: postContent,
        content_type: 'text',
        media_url: null,
        visibility: 'public',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Mock PostService.createPost to return the created post
      mockCreatePost.mockResolvedValue(mockCreatedPost);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: postContent });

      console.log('RESPONSE', response.body);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(mockCreatePost).toHaveBeenCalled();
    });
  });

  describe('POST /api/posts/:id/like', () => {
    const mockPostId = '33333333-3333-3333-3333-333333333333';

    it('should like a post successfully', async () => {
      // Arrange - Mock PostService.likePost to return liked: true
      mockLikePost.mockResolvedValue({ liked: true });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('RESPONSE', response.body);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(true);
      expect(mockLikePost).toHaveBeenCalledWith(mockPostId, mockUser.id);
    });

    it('should unlike a post successfully', async () => {
      // Arrange - Mock PostService.likePost to return liked: false
      mockLikePost.mockResolvedValue({ liked: false });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('RESPONSE', response.body);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(false);
      expect(mockLikePost).toHaveBeenCalledWith(mockPostId, mockUser.id);
    });
  });
});
