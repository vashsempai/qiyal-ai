import express from 'express';
import { SkillController } from '../controllers/skill.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/skills
 * @desc    Get a list of all available skills
 * @access  Public
 */
router.get('/', SkillController.getSkills);

/**
 * @route   POST /api/skills/my-skills
 * @desc    Add a skill to the current user's profile
 * @access  Private
 */
router.post('/my-skills', protect, SkillController.addUserSkill);

/**
 * @route   GET /api/skills/user/:userId
 * @desc    Get all skills for a specific user
 * @access  Public
 */
router.get('/user/:userId', SkillController.getUserSkills);

export default router;