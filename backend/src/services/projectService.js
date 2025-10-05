import { Project } from '../models/project.model.js';
import { User } from '../models/user.model.js';
import { GeminiService } from './gemini.service.js';

/**
 * Service for handling project-related business logic.
 */
export const ProjectService = {
  /**
   * Creates a new project for a client, enhanced with AI-generated content.
   * @param {string} clientId - The ID of the client creating the project.
   * @param {object} projectData - The data for the new project.
   * @returns {Promise<object>} The newly created project object.
   */
  async createProject(clientId, projectData) {
    // Verify that the client exists
    const client = await User.findById(clientId);
    if (!client) {
      throw new Error('Client not found.');
    }

    // Generate AI content
    const [summary, skills] = await Promise.all([
      GeminiService.generateProjectSummary(projectData.description),
      GeminiService.suggestSkills(projectData.description),
    ]);

    // Generate a unique slug from the title
    const slug = projectData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProject = await Project.create({
      ...projectData,
      clientId,
      slug,
      ai_generated_summary: summary,
      ai_suggested_skills: skills,
    });

    return newProject;
  },

  /**
   * Retrieves a project by its ID.
   * @param {string} id - The ID of the project to retrieve.
   * @returns {Promise<object|null>} The project object or null if not found.
   */
  async getProjectById(id) {
    const project = await Project.findById(id);
    if (!project) {
      return null;
    }
    return project;
  },

  /**
   * Finds all projects based on a set of filters.
   * @param {object} filters - The filters to apply to the search.
   * @returns {Promise<Array<object>>} A list of projects matching the criteria.
   */
  async findProjects(filters) {
    return Project.findAll({ filters });
  },

  /**
   * Updates a project.
   * @param {string} projectId - The ID of the project to update.
   * @param {object} updateData - The data to update.
   * @param {string} userId - The ID of the user attempting the update (for authorization).
   * @returns {Promise<object>} The updated project object.
   */
  async updateProject(projectId, updateData, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    if (project.client_id !== userId) {
      throw new Error('You are not authorized to update this project.');
    }

    return await Project.update(projectId, updateData);
  },
};

export default ProjectService;