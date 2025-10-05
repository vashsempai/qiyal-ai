import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';

/**
 * Service for handling skill-related business logic.
 */
export const SkillService = {
  /**
   * Creates a new skill in the system.
   * @param {object} skillData - The data for the new skill.
   * @returns {Promise<object>} The newly created skill object.
   */
  async createSkill(skillData) {
    // Add any validation or slug generation logic here
    const slug = skillData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSkill = await Skill.create({ ...skillData, slug });
    return newSkill;
  },

  /**
   * Adds a skill to a user's profile.
   * @param {string} userId - The ID of the user.
   * @param {string} skillId - The ID of the skill to add.
   * @param {string} proficiencyLevel - The user's proficiency with the skill.
   * @returns {Promise<object>} The user-skill association.
   * @throws {Error} If the user or skill is not found.
   */
  async addUserSkill(userId, skillId, proficiencyLevel) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      throw new Error('Skill not found.');
    }

    return Skill.addUserSkill({ userId, skillId, proficiencyLevel });
  },

  /**
   * Retrieves all skills for a given user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<object>>} A list of the user's skills.
   */
  async getUserSkills(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return Skill.findByUserId(userId);
  },

  /**
   * Finds all skills, optionally filtering by category.
   * @param {object} filters - The filters to apply.
   * @returns {Promise<Array<object>>} A list of skills.
   */
  async findSkills(filters) {
    return Skill.findAll({ filters });
  },
};

export default SkillService;