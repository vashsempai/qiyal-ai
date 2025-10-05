import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRequest(registerSchema), AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), AuthController.login);

export default router;