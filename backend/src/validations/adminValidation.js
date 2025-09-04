// In your validations/adminValidation.js (or similar file)
import Joi from 'joi';


export const idSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'ID cannot be empty.',
      'any.required': 'ID is required.',
      'string.pattern.base': 'Invalid ID format. Must be a 24-character hexadecimal string.'
    }),
});

export const adminCreateUserSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(3).max(100).required(),
  // Password is required for admin creation, but no confirmPassword needed
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
    .required(),
});

export const adminUpdateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  fullName: Joi.string().min(3).max(100).optional(),
  // Password should NOT be updated via this generic endpoint.
  // Use a separate 'changePassword' endpoint for security reasons.
  password: Joi.forbidden().messages({ 'any.forbidden': 'Password cannot be updated via this endpoint.' }),
  confirmPassword: Joi.forbidden().messages({ 'any.forbidden': 'Confirm password cannot be updated via this endpoint.' }),

  // Admin can update status
  status: Joi.string().valid("active", "inactive", "suspended").optional(), // Added 'suspended' as example

  points: Joi.number().optional(),


}).min(1).messages({'object.min': 'At least one field must be provided for update.'}); // Ensure at least one field is being updated

export const addAdminSchema = Joi.object({
  fullName: Joi.string().trim().required().min(3).max(100).messages({
    'string.empty': 'Full name cannot be empty.',
    'any.required': 'Full name is required.',
    'string.min': 'Full name must be at least {#limit} characters long.',
    'string.max': 'Full name cannot exceed {#limit} characters.'
  }),
  email: Joi.string().email().trim().required().messages({
    'string.empty': 'Email cannot be empty.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().required().min(8).messages({ // Strong password requirements
    'string.empty': 'Password cannot be empty.',
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least {#limit} characters long.'
  }),
  // You might want to include a 'role' field, but it's safer to hardcode 'admin' in the controller
  // to prevent accidental role assignment.
  // role: Joi.string().valid('admin').default('admin').optional(), // If you want to allow explicit admin role
  // isActive: Joi.boolean().default(true).optional(), // Admin can set initial active status
});