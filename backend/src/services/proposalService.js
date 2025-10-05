import { Proposal } from '../models/proposal.model.js';
import { Project } from '../models/project.model.js';
import { User } from '../models/user.model.js';

/**
 * Service for handling proposal-related business logic.
 */
export const ProposalService = {
  /**
   * Creates a new proposal for a project.
   * @param {string} freelancerId - The ID of the freelancer submitting the proposal.
   * @param {string} projectId - The ID of the project being applied to.
   * @param {object} proposalData - The data for the proposal.
   * @returns {Promise<object>} The newly created proposal object.
   * @throws {Error} If the project or freelancer is not found, or if the project is not open for proposals.
   */
  async createProposal(freelancerId, projectId, proposalData) {
    const freelancer = await User.findById(freelancerId);
    if (!freelancer) {
      throw new Error('Freelancer not found.');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    // Business rule: Ensure project is open for proposals
    if (project.status !== 'published') {
      throw new Error('This project is not currently accepting proposals.');
    }

    // Business rule: Prevent duplicate proposals
    const existingProposal = await Proposal.findOne({ where: { freelancer_id: freelancerId, project_id: projectId } });
    if (existingProposal) {
        throw new Error('You have already submitted a proposal for this project.');
    }

    const newProposal = await Proposal.create({
      ...proposalData,
      freelancerId,
      projectId,
    });

    return newProposal;
  },

  /**
   * Retrieves all proposals for a specific project.
   * @param {string} projectId - The ID of the project.
   * @param {string} userId - The ID of the user requesting the proposals (for authorization).
   * @returns {Promise<Array<object>>} A list of proposals for the project.
   * @throws {Error} If the user is not the project owner.
   */
  async getProposalsForProject(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    // Authorization check: Only the project client can view proposals
    if (project.client_id !== userId) {
      throw new Error('You are not authorized to view proposals for this project.');
    }

    return Proposal.findByProjectId(projectId);
  },

  /**
   * Updates the status of a proposal (e.g., accept, reject).
   * @param {string} proposalId - The ID of the proposal to update.
   * @param {string} status - The new status for the proposal.
   * @param {string} userId - The ID of the user performing the update (for authorization).
   * @returns {Promise<object>} The updated proposal object.
   * @throws {Error} If the user is not authorized to update the proposal.
   */
  async updateProposalStatus(proposalId, status, userId) {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found.');
    }

    const project = await Project.findById(proposal.project_id);
    // Authorization: Only the project client can change the proposal status
    if (project.client_id !== userId) {
      throw new Error('You are not authorized to update this proposal.');
    }

    // Add logic here to handle side-effects of status change
    // For example, if a proposal is accepted, other proposals might be automatically rejected.

    return Proposal.update(proposalId, { status });
  },
};

export default ProposalService;