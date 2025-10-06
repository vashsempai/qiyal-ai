// Import jest/globals at the very top
import { jest, describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';

// Create mock functions BEFORE any mocks
const mockCreatePost = jest.fn();
const mockFindById = jest.fn();
const mockLikePost = jest.fn();
const mockModerateContent = jest.fn();

// Mock auth middleware - protect always inserts req.user
jest.mock('../../src/middleware/auth.middleware.js', () => ({
  __esModule: true,
  protect: (req, res, next) => {
    req.user = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      username: 'testuser',
    };
    next();
  },
}));

// Mock GeminiService
jest.mock('../../src/services/gemini.service.js', () => ({
  __esModule: true,
  GeminiService: {
    moderateContent: mockModerateContent,
  },
}));

// Mock PostService
jest.mock('../../src/services/post.service.js', () => ({
  __esModule: true,
  PostService: {
    createPost: mockCreatePost,
    findById: mockFindById,
    likePost: mockLikePost,
  },
}));

// Dynamic import after mocks
let app, server;

describe('Social API Integration Tests', () => {
  let authToken;
  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    // Dynamic import after all mocks are set up
    const m = await import('../../server.js');
    app = m.app;
    server = m.server;

    // For these tests, we assume a valid auth token is provided
    authToken = 'mock-valid-token-for-testing';
  });

  beforeEach(() => {
    // Reset all mocks before each test
    mockCreatePost.mockReset();
    mockLikePost.mockReset();
    mockFindById.mockReset();
    mockModerateContent.mockReset();
  });

  afterAll(() => {
    // Close the server to allow Jest to exit cleanly
    if (server && server.close) {
      server.close();
    }
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      // Arrange: Return a STRICTLY VALID object structure matching real PostService response
      const mockCreatedPost = {
        id: '22222222-2222-2222-2222-222222222222',
        author_id: mockUserId,
        author: {
          id: mockUserId,
          email: 'test@example.com',
          username: 'testuser',
          avatar_url: null,
        },
        content: 'This is a test post',
        content_type: 'text',
        media_url: null,
        visibility: 'public',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockModerateContent.mockResolvedValue({ approved: true });
      mockCreatePost.mockResolvedValue(mockCreatedPost);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'This is a test post' });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        id: mockCreatedPost.id,
        content: mockCreatedPost.content,
      });
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    const mockPostId = '33333333-3333-3333-3333-333333333333';

    it('should like a post successfully', async () => {
      // Arrange: Return a STRICTLY VALID object structure
      mockLikePost.mockResolvedValue({ liked: true });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(true);
      expect(mockLikePost).toHaveBeenCalledWith(mockPostId, expect.any(String));
    });

    it('should unlike a post successfully', async () => {
      // Arrange: Return a STRICTLY VALID object structure
      mockLikePost.mockResolvedValue({ liked: false });

      // Act
      const response = await request(app)
        .post(`/api/posts/${mockPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.liked).toBe(false);
      expect(mockLikePost).toHaveBeenCalledWith(mockPostId, expect.any(String));
    });
  });
});
