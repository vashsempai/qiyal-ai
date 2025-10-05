const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRequest(registerSchema), AuthController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', validateRequest(loginSchema), AuthController.login);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, AuthController.getProfile);

module.exports = router;