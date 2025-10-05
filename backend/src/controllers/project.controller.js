import { ProjectService } from '../services/projectService.js';

/**
 * Controller for handling project-related API requests.
 */
export const ProjectController = {
  /**
   * Handles the request to create a new project.
   */
  async createProject(req, res, next) {
    try {
      // Assuming user's ID is attached from auth middleware
      const clientId = req.user.id;
      const projectData = req.body;

      const newProject = await ProjectService.createProject(clientId, projectData);

      res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        data: newProject,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to get a project by its ID.
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to get a list of all projects, with optional filters.
   */
  async getProjects(req, res, next) {
    try {
      // Filters can be passed via query parameters
      const filters = req.query;
      const projects = await ProjectService.findProjects(filters);
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handles the request to update a project.
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id; // From auth middleware

      const updatedProject = await ProjectService.updateProject(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully.',
        data: updatedProject,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ProjectController;