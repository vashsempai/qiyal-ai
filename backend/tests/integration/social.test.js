// CRITICAL: jest.mock must be STRICTLY BEFORE importing app/server.js for ESM to work
// This ensures mocks are hoisted and applied before any module initialization

// Mock GeminiService - ONLY what's needed for social post endpoints
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

// Mock PostService - ONLY what's needed for social post endpoints
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

// STRICTLY AFTER ALL MOCKS: now import app/server
import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import { app, server } from '../../server.js';

describe('Social API Integration Tests', () => {
  let authToken;
  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    // For these tests, we assume a valid auth token is provided
    // In a real scenario, you'd log in first or use a test token
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
