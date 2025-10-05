import { PostService } from '../services/post.service.js';

export const PostController = {
  async createPost(req, res, next) {
    try {
      const post = await PostService.createPost(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      next(error);
    }
  },

  async getPost(req, res, next) {
    try {
      const post = await PostService.getPost(req.params.id, req.user?.id);
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeed(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'public'
      } = req.query;

      const offset = (page - 1) * limit;

      const posts = await PostService.getFeed({
        userId: req.user?.id,
        limit: parseInt(limit),
        offset,
        type
      });

      res.json({
        success: true,
        data: posts,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePost(req, res, next) {
    try {
      const post = await PostService.updatePost(
        req.params.id,
        req.user.id,
        req.body
      );
      res.json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      next(error);
    }
  },

  async deletePost(req, res, next) {
    try {
      await PostService.deletePost(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async likePost(req, res, next) {
    try {
      const result = await PostService.likePost(req.params.id, req.user.id);
      res.json({
        success: true,
        message: result.liked ? 'Post liked' : 'Post unliked',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

export default PostController;