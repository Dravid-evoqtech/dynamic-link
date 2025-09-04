import Joi from 'joi';

export const registerUserSchema = Joi.object({

  email: Joi.string().email().required(),

  fullName: Joi.string().min(3).max(100).required(),

  password: Joi.string().min(6).required(),

  // Optional nested avatar input (optional for registration)
  avatar: Joi.object({
    avatarUrl: Joi.string().uri().optional(),
    avatarPublicId: Joi.string().optional().allow(null),
  }).optional(),

  referralCode: Joi.string().optional().alphanum(),

  referredBy: Joi.string().optional().allow(null),

  dateOfBirth: Joi.date().less('now').optional().allow(null),

  location: Joi.string().optional().allow(null),

  grade: Joi.string()
    .valid("Grade 9", "Grade 10", "Grade 11", "Grade 12", "Undergraduate", "Graduate")
    .optional()
    .allow(null),

  opportunityType: Joi.array()
    .items(Joi.string().valid("Remote", "In Person", "Hybrid"))
    .optional(),

  programs: Joi.array()
    .items(Joi.string().valid("Internship", "Volunteer", "Scholarship", "Research"))
    .optional(),

  availability: Joi.array()
    .items(Joi.string().valid("Spring", "Summer", "Fall", "Winter"))
    .optional(),

  interests: Joi.array()
    .items(Joi.string().valid(
      "Art", "Medicine", "Engineering", "Computer Science", "Business", "Science",
      "Psychology", "Education and Training", "Environment", "Law and Civics",
      "Travel and Culture", "Hospitality", "Media and Fun"
    ))
    .optional(),

  // These fields are typically set server-side (so omit in public API)
  points: Joi.number().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  refreshToken: Joi.string().optional()
});
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});
export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).optional(),

  avatar: Joi.object({
    avatarUrl: Joi.string().uri().optional(),
    avatarPublicId: Joi.string().optional().allow(null),
  }).optional(),

  dateOfBirth: Joi.date().less('now').optional().allow(null),

  location: Joi.string().optional().allow(null),

  grade: Joi.string()
    .valid("Grade 9", "Grade 10", "Grade 11", "Grade 12", "Undergraduate", "Graduate")
    .optional()
    .allow(null),

  opportunityType: Joi.array()
    .items(Joi.string().valid("Remote", "In Person", "Hybrid"))
    .optional(),

  programs: Joi.array()
    .items(Joi.string().valid("Internship", "Volunteer", "Scholarship", "Research"))
    .optional(),

  availability: Joi.array()
    .items(Joi.string().valid("Spring", "Summer", "Fall", "Winter"))
    .optional(),

  interests: Joi.array()
    .items(Joi.string().valid(
      "Art", "Medicine", "Engineering", "Computer Science", "Business", "Science",
      "Psychology", "Education and Training", "Environment", "Law and Civics",
      "Travel and Culture", "Hospitality", "Media and Fun"
    ))
    .optional(),

  status: Joi.string().valid("active", "inactive").optional(),
});
export const updateAvatarSchema = Joi.object({
  avatar: Joi.object().required()
});