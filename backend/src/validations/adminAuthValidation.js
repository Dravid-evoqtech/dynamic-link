
import Joi from 'joi';

// Schema for requesting a password reset
export const forgotPasswordRequestSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.empty': 'Email cannot be empty.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.'
  }),
});

// Schema for resetting the password
export const resetPasswordSchema = Joi.object({
  // token: Joi.string().trim().required().messages({
  //   'string.empty': 'Reset token cannot be empty.',
  //   'any.required': 'Reset token is required.'
  // }),
  newPassword: Joi.string().required().min(8).messages({
    'string.empty': 'New password cannot be empty.',
    'any.required': 'New password is required.',
    'string.min': 'New password must be at least {#limit} characters long.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.empty': 'Confirm password cannot be empty.',
    'any.required': 'Confirm password is required.',
    'any.only': 'Confirm password must match new password.'
  }),
});

export const tokenSchema = Joi.object({
  token: Joi.string()
    .trim()
    .required()
    .length(64) // For crypto.randomBytes(32).toString('hex')
    .messages({
      'string.empty': 'Token cannot be empty.',
      'any.required': 'Token is required.',
      'string.length': 'Token must be exactly {#limit} characters long.'
    }),
});