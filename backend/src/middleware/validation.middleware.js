import Joi from 'joi';

/**
 * A middleware factory that creates a validation middleware for a given Joi schema.
 *
 * @param {Joi.Schema} schema - The Joi schema to validate the request against.
 * @returns {function} An Express middleware function.
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    // Validate the request body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Report all errors, not just the first one
      stripUnknown: true, // Remove fields that are not in the schema
    });

    if (error) {
      // Map Joi's error details to a more user-friendly format
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''), // Clean up message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // Attach the validated and sanitized value to the request object
    req.body = value;
    next();
  };
};

// --- Authentication Schemas ---
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// --- User Schemas ---
export const updateUserProfileSchema = Joi.object({
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  bio: Joi.string().max(2000).allow('', null),
  title: Joi.string().max(200).allow('', null),
  hourlyRate: Joi.number().min(1).max(10000),
});

// --- Project Schemas ---
export const createProjectSchema = Joi.object({
  categoryId: Joi.string().uuid().required(),
  title: Joi.string().min(10).max(300).required(),
  description: Joi.string().min(50).required(),
  budgetType: Joi.string().valid('fixed', 'hourly', 'milestone').required(),
  budgetMin: Joi.number().min(1).required(),
  budgetMax: Joi.number().min(Joi.ref('budgetMin')).required(),
});

// --- Proposal Schemas ---
export const createProposalSchema = Joi.object({
  coverLetter: Joi.string().min(20).required(),
  proposedAmount: Joi.number().min(1).required(),
  proposedTimeline: Joi.number().integer().min(1).required(),
});