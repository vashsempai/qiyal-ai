const Joi = require('joi');

// Joi schema for user registration
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('freelancer', 'client', 'both').default('freelancer'),
});

// Joi schema for user login
const loginSchema = Joi.object({
  login: Joi.string().required(), // Can be email or username
  password: Joi.string().required(),
});

/**
 * Middleware to validate request body against a Joi schema.
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @returns {function} Express middleware function.
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
};