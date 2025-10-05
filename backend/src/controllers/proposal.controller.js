import { ProposalService } from '../services/proposalService.js';

/**
 * Controller for handling proposal-related API requests.
 */
export const ProposalController = {
  /**
   * Handles the request to create a new proposal for a project.
   */
  async createProposal(req, res, next) {
    try {
      const freelancerId = req.user.id; // From auth middleware
      const { projectId } = req.params;
      const proposalData = req.body;

      const newProposal = await ProposalService.createProposal(freelancerId, projectId, proposalData);

      res.status(201).json({
        success: true,
        message: 'Proposal submitted successfully.',
        data: newProposal,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to get all proposals for a specific project.
   */
  async getProposalsForProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id; // From auth middleware

      const proposals = await ProposalService.getProposalsForProject(projectId, userId);
      res.status(200).json({ success: true, data: proposals });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to update the status of a proposal.
   */
  async updateProposalStatus(req, res, next) {
    try {
      const { proposalId } = req.params;
      const { status } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
      }

      const updatedProposal = await ProposalService.updateProposalStatus(proposalId, status, userId);

      res.status(200).json({
        success: true,
        message: 'Proposal status updated successfully.',
        data: updatedProposal,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ProposalController;