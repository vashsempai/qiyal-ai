import { Router } from 'express';
import { PostController } from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { postCreateSchema, postUpdateSchema, feedQuerySchema } from '../validation/post.validation.js';

const router = Router();

// A middleware to adapt validateRequest for query parameters
const validateQuery = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// Public routes
router.get('/feed', validateQuery(feedQuerySchema), PostController.getFeed);
router.get('/:id', PostController.getPost);

// Protected routes, all routes below will require authentication
router.use(protect);

router.post('/', validateRequest(postCreateSchema), PostController.createPost);
router.put('/:id', validateRequest(postUpdateSchema), PostController.updatePost);
router.delete('/:id', PostController.deletePost);
router.post('/:id/like', PostController.likePost);

export default router;