import { Post } from '../models/post.model.js';
import { Like } from '../models/like.model.js';
import { Comment } from '../models/comment.model.js';

export const PostService = {
  async createPost(authorId, postData) {
    // Extract hashtags from content
    const hashtags = this.extractHashtags(postData.content);
    // Extract mentions from content
    const mentions = this.extractMentions(postData.content);

    const post = await Post.create({
      ...postData,
      authorId,
      hashtags,
      mentions
    });

    // TODO: Send notifications to mentioned users
    // TODO: AI content moderation

    return post;
  },

  async getPost(postId, userId = null) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Increment view count
    await Post.incrementCount(postId, 'views_count');

    // Check if user liked this post
    if (userId) {
      post.isLiked = await Like.exists(userId, postId);
    }

    return post;
  },

  async getFeed({ userId, limit, offset, type = 'public' }) {
    let posts;

    if (type === 'following' && userId) {
      // Get posts from followed users
      // This part requires a Follow model and logic, which is not yet implemented.
      // For now, it will fall back to the public feed.
      // posts = await this.getFollowingFeed(userId, limit, offset);
      posts = await Post.findAll({ limit, offset, visibility: 'public' });
    } else {
      // Get public posts
      posts = await Post.findAll({ limit, offset, visibility: 'public' });
    }

    // Add like status for each post if user is provided
    if (userId && posts.length > 0) {
      for (const post of posts) {
        post.isLiked = await Like.exists(userId, post.id);
      }
    }

    return posts;
  },

  async updatePost(postId, userId, updateData) {
    // Check if user owns this post
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.author_id !== userId) {
      throw new Error('You can only edit your own posts');
    }

    // Extract new hashtags and mentions
    if (updateData.content) {
      updateData.hashtags = this.extractHashtags(updateData.content);
      updateData.mentions = this.extractMentions(updateData.content);
    }

    return await Post.update(postId, updateData);
  },

  async deletePost(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.author_id !== userId) {
      throw new Error('You can only delete your own posts');
    }

    return await Post.delete(postId);
  },

  async likePost(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const existingLike = await Like.exists(userId, postId);
    if (existingLike) {
      // Unlike
      await Like.remove(userId, postId);
      await Post.decrementCount(postId, 'likes_count');
      return { liked: false };
    } else {
      // Like
      await Like.create(userId, postId);
      await Post.incrementCount(postId, 'likes_count');
      // TODO: Send notification to post author
      return { liked: true };
    }
  },

  extractHashtags(content) {
    if (!content) return [];
    const hashtagRegex = /#[\w\u0400-\u04ff]+/g;
    return content.match(hashtagRegex) || [];
  },

  extractMentions(content) {
    if (!content) return [];
    const mentionRegex = /@[\w\u0400-\u04ff]+/g;
    const mentions = content.match(mentionRegex) || [];
    // TODO: Convert @username to user IDs
    return mentions;
  }
};

export default PostService;