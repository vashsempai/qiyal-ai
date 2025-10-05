import express from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest, createProjectSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (only authenticated users, e.g., clients)
 */
router.post(
  '/',
  protect,
  validateRequest(createProjectSchema),
  ProjectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get a list of all projects (with filters)
 * @access  Public
 */
router.get('/', ProjectController.getProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by its ID
 * @access  Public
 */
router.get('/:id', ProjectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private (only the project owner)
 */
router.put('/:id', protect, ProjectController.updateProject);

export default router;