/**
 * Global test setup file
 * This file is loaded BEFORE any test files, ensuring mocks are in place
 * before server imports occur.
 */
import { jest } from '@jest/globals';

// Mock PostService BEFORE any imports
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

// Mock GeminiService BEFORE any imports
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

// Export mocks so tests can configure them
export {
  mockCreatePost,
  mockFindById,
  mockLikePost,
  mockModerateContent,
};
