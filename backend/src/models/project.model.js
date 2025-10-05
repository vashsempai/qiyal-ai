import { db } from '../utils/database.js';

/**
 * The Project model for interacting with the 'projects' table.
 */
export const Project = {
  /**
   * Creates a new project in the database.
   * @param {object} projectData - The data for the new project.
   * @returns {Promise<object>} The newly created project object.
   */
  async create(projectData) {
    const {
      clientId,
      categoryId,
      title,
      slug,
      description,
      budgetType,
      budgetMin,
      budgetMax,
      ai_generated_summary,
      ai_suggested_skills,
    } = projectData;

    const query = `
      INSERT INTO projects (
        client_id, category_id, title, slug, description, budget_type, budget_min, budget_max,
        ai_generated_summary, ai_suggested_skills
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const params = [
      clientId, categoryId, title, slug, description, budgetType, budgetMin, budgetMax,
      ai_generated_summary, ai_suggested_skills
    ];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a project by its unique ID.
   * @param {string} id - The UUID of the project to find.
   * @returns {Promise<object|undefined>} The project object if found, otherwise undefined.
   */
  async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Finds all projects, with optional filtering and pagination.
   * @param {object} [filters={}] - Optional filters (e.g., category, status).
   * @param {number} [limit=10] - The number of projects to return.
   * @param {number} [offset=0] - The number of projects to skip.
   * @returns {Promise<Array<object>>} An array of project objects.
   */
  async findAll({ filters = {}, limit = 10, offset = 0 } = {}) {
    let query = 'SELECT * FROM projects';
    const params = [];
    const whereClauses = [];

    // Example filter by status
    if (filters.status) {
      params.push(filters.status);
      whereClauses.push(`status = $${params.length}`);
    }

    // Example filter by category
    if (filters.categoryId) {
      params.push(filters.categoryId);
      whereClauses.push(`category_id = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  },

  /**
   * Updates a project's information.
   * @param {string} id - The ID of the project to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {Promise<object>} The updated project object.
   */
  async update(id, updates) {
    const allowedUpdates = ['title', 'description', 'short_description', 'status', 'budget_min', 'budget_max'];
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
      UPDATE projects
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const params = [id, ...Object.values(finalUpdates)];
    const { rows } = await db.query(query, params);
    return rows[0];
  },
};

export default Project;