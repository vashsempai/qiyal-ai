import { SkillService } from '../services/skillService.js';

/**
 * Controller for handling skill-related API requests.
 */
export const SkillController = {
  /**
   * Handles the request to get a list of all skills.
   */
  async getSkills(req, res, next) {
    try {
      const filters = req.query;
      const skills = await SkillService.findSkills(filters);
      res.status(200).json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to add a skill to the currently authenticated user's profile.
   */
  async addUserSkill(req, res, next) {
    try {
      const userId = req.user.id; // From auth middleware
      const { skillId, proficiencyLevel } = req.body;

      if (!skillId || !proficiencyLevel) {
        return res.status(400).json({ success: false, message: 'Skill ID and proficiency level are required.' });
      }

      const userSkill = await SkillService.addUserSkill(userId, skillId, proficiencyLevel);

      res.status(201).json({
        success: true,
        message: 'Skill added to profile successfully.',
        data: userSkill,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to get all skills for a specific user.
   */
  async getUserSkills(req, res, next) {
    try {
      const { userId } = req.params;
      const skills = await SkillService.getUserSkills(userId);
      res.status(200).json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  },
};

export default SkillController;