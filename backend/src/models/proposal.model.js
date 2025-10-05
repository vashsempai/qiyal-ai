import { db } from '../utils/database.js';

/**
 * The Proposal model for interacting with the 'proposals' table.
 */
export const Proposal = {
  /**
   * Creates a new proposal for a project.
   * @param {object} proposalData - The data for the new proposal.
   * @returns {Promise<object>} The newly created proposal object.
   */
  async create(proposalData) {
    const {
      projectId,
      freelancerId,
      coverLetter,
      proposedAmount,
      proposedTimeline,
    } = proposalData;

    const query = `
      INSERT INTO proposals (
        project_id, freelancer_id, cover_letter, proposed_amount, proposed_timeline
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const params = [projectId, freelancerId, coverLetter, proposedAmount, proposedTimeline];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a proposal by its unique ID.
   * @param {string} id - The UUID of the proposal to find.
   * @returns {Promise<object|undefined>} The proposal object if found, otherwise undefined.
   */
  async findById(id) {
    const query = 'SELECT * FROM proposals WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Finds all proposals for a given project.
   * @param {string} projectId - The ID of the project.
   * @returns {Promise<Array<object>>} An array of proposal objects.
   */
  async findByProjectId(projectId) {
    const query = 'SELECT * FROM proposals WHERE project_id = $1 ORDER BY created_at DESC;';
    const { rows } = await db.query(query, [projectId]);
    return rows;
  },

  /**
   * Finds all proposals submitted by a given freelancer.
   * @param {string} freelancerId - The ID of the freelancer.
   * @returns {Promise<Array<object>>} An array of proposal objects.
   */
  async findByFreelancerId(freelancerId) {
    const query = 'SELECT * FROM proposals WHERE freelancer_id = $1 ORDER BY created_at DESC;';
    const { rows } = await db.query(query, [freelancerId]);
    return rows;
  },

  /**
   * Updates a proposal's information.
   * @param {string} id - The ID of the proposal to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {Promise<object>} The updated proposal object.
   */
  async update(id, updates) {
    const allowedUpdates = ['cover_letter', 'proposed_amount', 'proposed_timeline', 'status'];
    const finalUpdates = {};
    for (const key in updates) {
        if (allowedUpdates.includes(key)) {
            finalUpdates[key] = updates[key]
        }
    }
    const setClause = Object.keys(finalUpdates)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update.');
    }

    const query = `
      UPDATE proposals
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const params = [id, ...Object.values(finalUpdates)];
    const { rows } = await db.query(query, params);
    return rows[0];
  },
};

export default Proposal;