import { db } from '../utils/database.js';

/**
 * The Skill model for interacting with the 'skills' and related tables.
 */
export const Skill = {
  /**
   * Creates a new skill in the database.
   * @param {object} skillData - The data for the new skill.
   * @returns {Promise<object>} The newly created skill object.
   */
  async create(skillData) {
    const { categoryId, name, slug, description } = skillData;
    const query = `
      INSERT INTO skills (category_id, name, slug, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [categoryId, name, slug, description];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a skill by its unique ID.
   * @param {string} id - The UUID of the skill to find.
   * @returns {Promise<object|undefined>} The skill object if found, otherwise undefined.
   */
  async findById(id) {
    const query = 'SELECT * FROM skills WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Finds all skills, with optional filtering.
   * @param {object} [filters={}] - Optional filters (e.g., categoryId).
   * @returns {Promise<Array<object>>} An array of skill objects.
   */
  async findAll({ filters = {} } = {}) {
    let query = 'SELECT * FROM skills';
    const params = [];
    const whereClauses = [];

    if (filters.categoryId) {
      params.push(filters.categoryId);
      whereClauses.push(`category_id = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY name ASC';
    const { rows } = await db.query(query, params);
    return rows;
  },

  /**
   * Adds a skill to a user's profile.
   * @param {string} userId - The ID of the user.
   * @param {string} skillId - The ID of the skill.
   * @param {string} proficiencyLevel - The user's proficiency level.
   * @returns {Promise<object>} The user_skill association object.
   */
  async addUserSkill({ userId, skillId, proficiencyLevel }) {
    const query = `
      INSERT INTO user_skills (user_id, skill_id, proficiency_level)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const params = [userId, skillId, proficiencyLevel];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds all skills associated with a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} An array of skill objects for the user.
   */
  async findByUserId(userId) {
    const query = `
      SELECT s.*, us.proficiency_level
      FROM skills s
      JOIN user_skills us ON s.id = us.skill_id
      WHERE us.user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  },
};

export default Skill;