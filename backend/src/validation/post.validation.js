import Joi from 'joi';

export const postCreateSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  contentType: Joi.string().valid('text', 'image', 'video', 'project_showcase', 'poll').default('text'),
  mediaUrls: Joi.array().items(Joi.string().uri()).default([]),
  visibility: Joi.string().valid('public', 'followers', 'private').default('public')
});

export const postUpdateSchema = Joi.object({
  content: Joi.string().min(1).max(5000),
  mediaUrls: Joi.array().items(Joi.string().uri()),
  visibility: Joi.string().valid('public', 'followers', 'private')
});

export const feedQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('public', 'following').default('public')
});