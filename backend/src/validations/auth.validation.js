import { time } from 'console';
import Joi from 'joi';

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
  }),

  fullName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Full name must be at least 3 characters long',
    'string.max': 'Full name must be at most 100 characters long',
  }),

  password: Joi.string()
    .min(8)
    .max(32)
    .required()
    .custom((value, helpers) => {
      const errors = [];

      if (!/[A-Z]/.test(value)) {
        errors.push('Password must include at least one uppercase letter');
      }
      if (!/[a-z]/.test(value)) {
        errors.push('Password must include at least one lowercase letter');
      }
      if (!/[0-9]/.test(value)) {
        errors.push('Password must include at least one digit');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push('Password must include at least one special character');
      }
      if (/\s/.test(value)) {
        errors.push('Password must not contain spaces');
      }

      if (errors.length > 0) {
        return helpers.message(errors.join('. '));
      }

      return value;
    })
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be at most 32 characters long',
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required',
    }),
    
});

export const loginSchema = Joi.object({
  provider: Joi.string().valid('local', 'google', 'apple').required().messages({
    'string.empty': 'Provider is required',
    'any.only': 'Provider must be one of: email, google, apple',
  }),

  email: Joi.string().email().when('provider', {
    is: 'local',
    then: Joi.required().messages({
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email is required when provider is email',
    }),
    otherwise: Joi.forbidden(),
  }),

  password: Joi.string()
    .min(8)
    .max(32)
    .when('provider', {
      is: 'local',
      then: Joi.required().messages({
        'string.empty': 'Password is required when provider is email',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be at most 32 characters long',
      }),
      otherwise: Joi.forbidden(),
    }),

  idToken: Joi.string().when('provider', {
    is: 'google',
    then: Joi.required().messages({
      'string.empty': 'idToken is required when provider is google',
    }),
    otherwise: Joi.forbidden(),
  }),

  code: Joi.string().when('provider', {
    is: 'apple',
    then: Joi.required().messages({
      'string.empty': 'Code is required when provider is apple',
    }),
    otherwise: Joi.forbidden(),
  }),

  fullName: Joi.string()
    .min(3)
    .max(100)
    .when('provider', {
      is: 'apple',
      then: Joi.optional(), // optional for Apple
      otherwise: Joi.forbidden(),
    }).messages({
      'string.min': 'Full name must be at least 3 characters long',
      'string.max': 'Full name must be at most 100 characters long',
    }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(32)
    .required()
    .custom((value, helpers) => {
      const errors = [];

      if (!/[A-Z]/.test(value)) {
        errors.push('Password must include at least one uppercase letter');
      }
      if (!/[a-z]/.test(value)) {
        errors.push('Password must include at least one lowercase letter');
      }
      if (!/[0-9]/.test(value)) {
        errors.push('Password must include at least one digit');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push('Password must include at least one special character');
      }
      if (/\s/.test(value)) {
        errors.push('Password must not contain spaces');
      }

      if (errors.length > 0) {
        return helpers.message(errors.join('. '));
      }

      return value;
    })
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be at most 32 characters long',
    }),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Full name must be at least 3 characters long',
    'string.max': 'Full name must be at most 100 characters long',
  }),

  bio: Joi.string().optional().allow(null).messages({
    'string.base': 'Bio must be a string',
    'string.empty': 'Bio cannot be empty',
  }),

  dateOfBirth: Joi.date().less('now').optional().allow(null).messages({
    'date.less': 'Date of birth must be in the past',
  }),

  location: Joi.object({
    title: Joi.string().optional().allow(null).messages({
      'string.base': 'Location title must be a string',
    }),
    lat: Joi.string().optional().allow(null).messages({
      'string.base': 'Location latitude must be a string',
    }),
    lng: Joi.string().optional().allow(null).messages({
      'string.base': 'Location longitude must be a string',
    }),
  }).optional().allow(null).messages({
    'object.base': 'Location must be an object',
  }),

  highSchool: Joi.string().optional().allow(null).messages({
    'string.base': 'High school must be a string',
    'string.empty': 'High school cannot be empty',
  }),

  highSchoolGraduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().allow(null).messages({
    'number.base': 'High school graduation year must be a number',
    'number.integer': 'High school graduation year must be an integer',
    'number.min': 'High school graduation year must be at least 1900',
    'number.max': 'High school graduation year cannot be in the future',
  }),

  currentPassword: Joi.string().optional().allow(null).messages({
    'string.base': 'Current password must be a string',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(32)
    .optional()
    .custom((value, helpers) => {
      const errors = [];

      if (!/[A-Z]/.test(value)) {
        errors.push('Password must include at least one uppercase letter');
      }
      if (!/[a-z]/.test(value)) {
        errors.push('Password must include at least one lowercase letter');
      }
      if (!/[0-9]/.test(value)) {
        errors.push('Password must include at least one digit');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push('Password must include at least one special character');
      }
      if (/\s/.test(value)) {
        errors.push('Password must not contain spaces');
      }

      if (errors.length > 0) {
        return helpers.message(errors.join('. '));
      }

      return value;
    })
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be at most 32 characters long',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .optional()
    .allow(null)
    .messages({
      'any.only': 'New passwords do not match',
    }),
});

export const saveProfileSchema = Joi.object({
  opportunityType: Joi.string()
    .optional().messages({
      'any.only': 'Opportunity type must be one of the specified values',
    }),
  _id: Joi.string().optional().allow(null).messages({
    'string.base': '_id must be a string',
  }),
 
  bio: Joi.string().optional().allow(null).messages({
    'string.base': 'Bio must be a string',
    'string.empty': 'Bio cannot be empty',
  }),
  highSchool: Joi.string().optional().allow(null).messages({
    'string.base': 'High school must be a string',
    'string.empty': 'High school cannot be empty',
  }),
  highSchoolGraduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().allow(null).messages({
    'number.base': 'High school graduation year must be a number',
    'number.integer': 'High school graduation year must be an integer',
    'number.min': 'High school graduation year must be at least 1900',
    'number.max': `High school graduation year cannot be in the future`,

  }),
  dateOfBirth: Joi.date().less('now').optional().allow(null).messages({
    'date.less': 'Date of birth must be in the past',
  }),
  programs: Joi.array()
    .optional().messages({
      'array.base': 'Programs must be an array',
      'any.only': 'Programs must be one of the specified values',
    }),
  grade: Joi.string()
    .optional()
    .allow(null).messages({
      'any.only': 'Grade must be one of the specified values',
    }),
  location: Joi.object({
    title: Joi.string().optional().allow(null).messages({
      'string.base': 'Location title must be a string',
    }),
    lat: Joi.number().optional().allow(null),
    lng: Joi.number().optional().allow(null),
  }).optional().allow(null).messages({
    'object.base': 'Location must be an object',
  }),

  availability: Joi.array()
    .items(Joi.string()).optional().messages({
      'array.base': 'Availability must be an array',
      'any.only': 'Availability must be one of the specified values',
    }),

  interests: Joi.array()
    .items(Joi.string())
    .optional().messages({
      'array.base': 'Interests must be an array',
      'any.only': 'Interests must be one of the specified values',
    }),

  goals: Joi.array()
    .items(Joi.string())
    .optional().messages({
      'array.base': 'Goals must be an array',
      'any.only': 'Goals must be one of the specified values',
    }),

});
