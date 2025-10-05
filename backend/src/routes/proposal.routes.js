import express from 'express';
import { ProposalController } from '../controllers/proposal.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest, createProposalSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/proposals/project/:projectId
 * @desc    Submit a proposal for a specific project
 * @access  Private (only authenticated freelancers)
 */
router.post(
  '/project/:projectId',
  protect,
  validateRequest(createProposalSchema),
  ProposalController.createProposal
);

/**
 * @route   GET /api/proposals/project/:projectId
 * @desc    Get all proposals for a specific project
 * @access  Private (only the project owner)
 */
router.get(
  '/project/:projectId',
  protect,
  ProposalController.getProposalsForProject
);

/**
 * @route   PUT /api/proposals/:proposalId/status
 * @desc    Update the status of a proposal (e.g., accept, reject)
 * @access  Private (only the project owner)
 */
router.put(
  '/:proposalId/status',
  protect,
  ProposalController.updateProposalStatus
);

export default router;