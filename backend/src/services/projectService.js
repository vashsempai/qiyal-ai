import { Project } from '../models/project.model.js';
import { User } from '../models/user.model.js';

/**
 * Service for handling project-related business logic.
 */
export const ProjectService = {
  /**
   * Creates a new project for a client.
   * @param {string} clientId - The ID of the client creating the project.
   * @param {object} projectData - The data for the new project.
   * @returns {Promise<object>} The newly created project object.
   * @throws {Error} If the client does not exist or if data is invalid.
   */
  async createProject(clientId, projectData) {
    // Verify that the client exists
    const client = await User.findById(clientId);
    if (!client) {
      throw new Error('Client not found.');
    }

    // Add business logic here, e.g., generating a unique slug from the title
    const slug = projectData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProject = await Project.create({
      ...projectData,
      clientId,
      slug,
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
    // Potentially enrich the project object with related data, e.g., client info
    return project;
  },

  /**
   * Finds all projects based on a set of filters.
   * @param {object} filters - The filters to apply to the search.
   * @returns {Promise<Array<object>>} A list of projects matching the criteria.
   */
  async findProjects(filters) {
    // Here you could add more complex logic, like converting filter names or setting defaults
    return Project.findAll(filters);
  },

  /**
   * Updates a project.
   * @param {string} projectId - The ID of the project to update.
   * @param {object} updateData - The data to update.
   * @param {string} userId - The ID of the user attempting the update (for authorization).
   * @returns {Promise<object>} The updated project object.
   * @throws {Error} If the project is not found or the user is not authorized.
   */
  async updateProject(projectId, updateData, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    // Authorization check: only the client who created the project can update it
    if (project.client_id !== userId) {
      throw new Error('You are not authorized to update this project.');
    }

    const updatedProject = await Project.update(projectId, updateData);
    return updatedProject;
  },
};

export default ProjectService;