
import Joi from 'joi';
import {
  EMPLOYMENT_TYPE,
  OPPORTUNITY_STATUS,
} from "../constants/index.js"; 

// Assuming you have separate models for these and will be sending their ObjectIds
// You'll need to define these constants or import them from where your ObjectId enums are managed.
// For Joi validation, you'll validate them as strings that are valid ObjectIDs.
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const OPPORTUNITY_TYPES = ['Paid Internship', 'Unpaid Internship'];
const ENROLLMENT_TYPES = ['Part Time', 'Full Time'];

// Reusable schema for validating MongoDB ObjectId in params
export const idSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(objectIdPattern) // Use the defined pattern
    .messages({
      'string.empty': 'ID cannot be empty.',
      'any.required': 'ID is required.',
      'string.pattern.base': 'Invalid ID format. Must be a 24-character hexadecimal string.'
    }),
});

// export const createOpportunitySchema = Joi.object({
//   title: Joi.string().trim().required(),
//   description: Joi.string().trim().required(),
//   duration: Joi.string().trim().optional().allow(null),
//   opportunityStartDate: Joi.date().iso().optional().allow(null),
//   applicationStartDate: Joi.date().iso().optional().allow(null),
//   applicationDeadline: Joi.date().iso().optional().allow(null)
//     .when('applicationStartDate', {
//       is: Joi.exist(),
//       then: Joi.date().iso().min(Joi.ref('applicationStartDate')).messages({
//         'date.min': 'Application Deadline cannot be before Application Start Date.'
//       }),
//       otherwise: Joi.optional()
//     }),
//   organization: Joi.string().trim().required(),
//   enrollmentType: Joi.string().pattern(objectIdPattern).optional().allow(null),
//   program: Joi.array().items(Joi.string().pattern(objectIdPattern).required()).min(1).required(),
//   paid: Joi.boolean().default(false).optional(),
//   opportunityStatus: Joi.string().valid(...Object.values(OPPORTUNITY_STATUS)).default(OPPORTUNITY_STATUS.OPEN).optional(),
//   domain: Joi.array().items(Joi.string().pattern(objectIdPattern).required()).min(1).required(),
//   isFeatured: Joi.boolean().default(false).optional(),
//   isSaved: Joi.boolean().default(false).optional(),
//   employmentType: Joi.string().valid(...Object.values(EMPLOYMENT_TYPE)).optional().allow(null),
// });


export const createOpportunitySchema = Joi.object({
    title: Joi.string().trim().required().messages({
        'string.empty': 'Title cannot be empty.',
        'any.required': 'Title is a required field.'
    }),
    types: Joi.string().valid(...OPPORTUNITY_TYPES).required().messages({
        'any.only': 'Types must be one of the specified values.',
        'any.required': 'Types is a required field.'
    }),
    description: Joi.string().trim().required().messages({
        'string.empty': 'Description cannot be empty.',
        'any.required': 'Description is a required field.'
    }),
    states: Joi.string().trim().required().messages({
        'string.empty': 'States cannot be empty.',
        'any.required': 'States is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'fields'
    fields: Joi.string().trim().required().messages({
        'string.empty': 'Fields cannot be empty.',
        'any.required': 'Fields is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'grades'
    grades: Joi.string().trim().required().messages({
        'string.empty': 'Grades cannot be empty.',
        'any.required': 'Grades is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'see_website_link'
    see_website_link: Joi.string().uri().required().messages({
        'string.empty': 'Website link cannot be empty.',
        'string.uri': 'Website link must be a valid URL.',
        'any.required': 'Website link is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'opportunity_index'
    opportunity_index: Joi.number().integer().min(1).required().messages({
        'number.base': 'Opportunity Index must be a number.',
        'number.min': 'Opportunity Index must be at least 1.',
        'any.required': 'Opportunity Index is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'image_link'
    image_link: Joi.string().uri().required().messages({
        'string.empty': 'Image link cannot be empty.',
        'string.uri': 'Image link must be a valid URL.',
        'any.required': 'Image link is a required field.'
    }),
    duration: Joi.string().trim().optional().allow(null),
    // ⭐ UPDATED: Key is now 'opportunitystartdate'
    opportunitystartdate: Joi.string().trim().required().messages({
        'string.empty': 'Opportunity Start Date cannot be empty.',
        'any.required': 'Opportunity Start Date is a required field.'
    }),
    organization: Joi.string().trim().required().messages({
        'string.empty': 'Organization cannot be empty.',
        'any.required': 'Organization is a required field.'
    }),
    program: Joi.string().trim().required().messages({
        'string.empty': 'Program cannot be empty.',
        'any.required': 'Program is a required field.'
    }),
    // ⭐ UPDATED: Key is now 'isfeatured'
    isfeatured: Joi.boolean().required().messages({
        'any.required': 'isFeatured is a required field.'
    }),
    points: Joi.number().integer().min(0).when('isfeatured', {
        is: true,
        then: Joi.required().messages({
            'any.required': 'Points is required when the opportunity is featured.'
        }),
        otherwise: Joi.optional().allow(null)
    }),
    // ⭐ UPDATED: Key is now 'enrollmenttype'
    enrollmenttype: Joi.string().valid(...ENROLLMENT_TYPES).required().messages({
        'any.only': 'Enrollment Type must be one of the specified values.',
        'any.required': 'Enrollment Type is a required field.'
    }),
});


// export const updateOpportunitySchema = Joi.object({
//   title: Joi.string().trim().optional(),
//   description: Joi.string().trim().optional(),
//   duration: Joi.string().trim().optional().allow(null),
//   opportunityStartDate: Joi.date().iso().optional().allow(null),
//   applicationStartDate: Joi.date().iso().optional().allow(null),
//   applicationDeadline: Joi.date().iso().optional().allow(null)
//     .when('applicationStartDate', {
//       is: Joi.exist(),
//       then: Joi.date().iso().min(Joi.ref('applicationStartDate')).messages({
//         'date.min': 'Application Deadline cannot be before Application Start Date.'
//       }),
//       otherwise: Joi.optional()
//     }),
//   organization: Joi.string().trim().optional(),
//   enrollmentType: Joi.string().pattern(objectIdPattern).optional().allow(null),
//   program: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
//   paid: Joi.boolean().optional(),
//   opportunityStatus: Joi.string().valid(...Object.values(OPPORTUNITY_STATUS)).optional(),
//   domain: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
//   isFeatured: Joi.boolean().optional(),
//   isSaved: Joi.boolean().optional(),
//   employmentType: Joi.string().valid(...Object.values(EMPLOYMENT_TYPE)).optional().allow(null),
//   clearCoverImage: Joi.boolean().optional(),
// }).min(1);

// export const getOpportunitiesSchema = Joi.object({
//   page: Joi.number().integer().min(1).default(1),
//   limit: Joi.number().integer().min(1).max(100).default(10),
//   sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'organization', 'opportunityStartDate', 'applicationDeadline').default('createdAt'),
//   sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
//   title: Joi.string().trim().optional(),
//   description: Joi.string().trim().optional(),
//   organization: Joi.string().trim().optional(),
//   duration: Joi.string().trim().optional(),
//   paid: Joi.boolean().optional(),
//   opportunityStatus: Joi.string().valid(...Object.values(OPPORTUNITY_STATUS)).optional(),
//   isFeatured: Joi.boolean().optional(),
//   isSaved: Joi.boolean().optional(),
//   employmentType: Joi.string().valid(...Object.values(EMPLOYMENT_TYPE)).optional(),
//   enrollmentType: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
//   program: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
//   domain: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
//   opportunityStartDateFrom: Joi.date().iso().optional(),
//   opportunityStartDateTo: Joi.date().iso().min(Joi.ref('opportunityStartDateFrom')).optional(),
//   applicationStartDateFrom: Joi.date().iso().optional(),
//   applicationStartDateTo: Joi.date().iso().min(Joi.ref('applicationStartDateFrom')).optional(),
//   applicationDeadlineFrom: Joi.date().iso().optional(),
//   applicationDeadlineTo: Joi.date().iso().min(Joi.ref('applicationDeadlineFrom')).optional(),
//   search: Joi.string().trim().optional(),
// });

export const updateOpportunitySchema = Joi.object({
    title: Joi.string().trim().optional(),
    types: Joi.string().valid('Paid Internship', 'Unpaid Internship').optional(),
    description: Joi.string().trim().min(50).optional(),
    states: Joi.string().trim().optional(),
    fields: Joi.string().trim().optional(), // Now handles comma-separated strings
    grades: Joi.string().trim().optional(), // Now handles comma-separated strings
    seeWebsiteLink: Joi.string().uri().optional(),
    opportunityIndex: Joi.number().min(0).optional(),
    imageLink: Joi.string().uri().optional(),
    duration: Joi.string().trim().optional().allow(null),
    opportunityStartDate: Joi.string().isoDate().optional().allow(null),
    organization: Joi.string().trim().optional(),
    program: Joi.string().trim().optional(), // Now handles comma-separated strings
    isFeatured: Joi.boolean().optional(),
    points: Joi.number().min(0).optional().allow(null)
        .when('isFeatured', {
            is: Joi.exist().valid(true),
            then: Joi.number().required().messages({ 'any.required': 'Points are required if the opportunity is featured.' }),
            otherwise: Joi.optional().allow(null)
        }),
    enrollmentType: Joi.string().valid('Part Time', 'Full Time').optional().allow(null),
}).min(1);

export const getOpportunitiesSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    // ⭐ UPDATED: The sortBy list has been changed to match the new schema's sortable fields.
    // 'opportunityStartDate' and 'applicationDeadline' are no longer valid sort options.
    // 'opportunityIndex' and 'points' have been added.
    sortBy: Joi.string().valid(
        'createdAt',
        'updatedAt',
        'title',
        'organization',
        'opportunityIndex',
        'points'
    ).default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // ⭐ REMOVED: 'paid', 'opportunityStatus', 'isSaved', 'employmentType' fields
    // ⭐ UPDATED: 'isFeatured' is still a valid boolean filter
    isFeatured: Joi.boolean().optional(),
    
    // ⭐ ADDED: New filterable fields based on the new schema
    types: Joi.string().valid('Paid Internship', 'Unpaid Internship').optional(),
    states: Joi.string().trim().optional(),
    grades: Joi.array().items(Joi.string()).optional(),
    // `enrollmentType` is now a string enum, not an ObjectId.
    enrollmentType: Joi.string().valid('Part Time', 'Full Time').optional(),

    // ⭐ UPDATED: 'program' is still an array of ObjectIds
    program: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
    // ⭐ UPDATED: The old 'domain' field is now 'fields'
    fields: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
    
    // Standard fields that remain the same
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    organization: Joi.string().trim().optional(),
    duration: Joi.string().trim().optional(),
    
    // ⭐ REMOVED: All date range filters are removed as they are not present in the new schema.
    // This includes: `opportunityStartDateFrom/To`, `applicationStartDateFrom/To`, `applicationDeadlineFrom/To`.

    search: Joi.string().trim().optional().allow(''),
 
});

export const getOpportunityByIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/) // Regex for a valid MongoDB ObjectId
    .messages({
      'string.empty': 'Opportunity ID cannot be empty.',
      'any.required': 'Opportunity ID is required.',
      'string.pattern.base': 'Invalid Opportunity ID format. Must be a 24-character hexadecimal string.'
    }),
});


// --- OpportunityDomain Schemas ---
export const createOpportunityDomainSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Domain title cannot be empty.',
      'any.required': 'Domain title is required.',
      'string.min': 'Domain title must be at least {#limit} characters long.',
      'string.max': 'Domain title cannot exceed {#limit} characters.'
    }),
  description: Joi.string()
    .trim()
    .required()
    .min(10)
    .max(500)
    .messages({
      'string.empty': 'Domain description cannot be empty.',
      'any.required': 'Domain description is required.',
      'string.min': 'Domain description must be at least {#limit} characters long.',
      'string.max': 'Domain description cannot exceed {#limit} characters.'
    }),
});

export const updateOpportunityDomainSchema = Joi.object({
  title: Joi.string()
    .trim()
    .optional()
    .min(3)
    .max(100),
  description: Joi.string()
    .trim()
    .optional()
    .min(10)
    .max(500),
}).min(1).messages({
  'object.min': 'At least one field (title or description) is required for update.'
});

export const getOpportunityDomainsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().optional(), // For searching by title/description
});


// --- OpportunityProgramType Schemas ---
export const createOpportunityProgramTypeSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Program type title cannot be empty.',
      'any.required': 'Program type title is required.',
      'string.min': 'Program type title must be at least {#limit} characters long.',
      'string.max': 'Program type title cannot exceed {#limit} characters.'
    }),
  description: Joi.string()
    .trim()
    .required()
    .min(10)
    .max(500)
    .messages({
      'string.empty': 'Program type description cannot be empty.',
      'any.required': 'Program type description is required.',
      'string.min': 'Program type description must be at least {#limit} characters long.',
      'string.max': 'Program type description cannot exceed {#limit} characters.'
    }),
});

export const updateOpportunityProgramTypeSchema = Joi.object({
  title: Joi.string()
    .trim()
    .optional()
    .min(3)
    .max(100),
  description: Joi.string()
    .trim()
    .optional()
    .min(10)
    .max(500),
}).min(1).messages({
  'object.min': 'At least one field (title or description) is required for update.'
});

export const getOpportunityProgramTypesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().optional(), // For searching by title/description
});

// --- OpportunityEnrollmentType Schemas ---
export const createEnrollmentTypeSchema = Joi.object({
    title: Joi.string()
        .trim()
        .required()
        .min(3)
        .max(100)
        .messages({
            'string.empty': 'Enrollment type title cannot be empty.',
            'any.required': 'Enrollment type title is required.',
            'string.min': 'Enrollment type title must be at least {#limit} characters long.',
            'string.max': 'Enrollment type title cannot exceed {#limit} characters.'
        }),
    description: Joi.string()
        .trim()
        .required()
        .min(10)
        .max(500)
        .messages({
            'string.empty': 'Enrollment type description cannot be empty.',
            'any.required': 'Enrollment type description is required.',
            'string.min': 'Enrollment type description must be at least {#limit} characters long.',
            'string.max': 'Enrollment type description cannot exceed {#limit} characters.'
        }),
});

export const updateEnrollmentTypeSchema = Joi.object({
    title: Joi.string()
        .trim()
        .optional()
        .min(3)
        .max(100),
    description: Joi.string()
        .trim()
        .optional()
        .min(10)
        .max(500),
}).min(1).messages({
    'object.min': 'At least one field (title or description) is required for update.'
});

// Schema for listing all enrollment types with pagination, sorting, and search
export const getEnrollmentTypesSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().trim().optional(), // For searching by title/description
});


// ⭐ NEW SCHEMA FOR CSV BULK UPLOAD ROWS ⭐
// export const bulkUploadOpportunitySchema = Joi.object({
//   title: Joi.string().trim().required(),
//   description: Joi.string().trim().required(),
//   // coverImage is NOT expected in CSV. It will be defaulted in controller.
//   duration: Joi.string().trim().optional().allow(null, ''), // Allow empty string for optional
//  opportunityStartDate: Joi.date().iso().optional().allow(null), // Changed to Joi.date().iso(), allow(null) is enough
//   applicationStartDate: Joi.date().iso().optional().allow(null), // Changed to Joi.date().iso(), allow(null) is enough
//   applicationDeadline: Joi.date().iso().optional().allow(null)   // Changed to Joi.date().iso(), allow(null) is enough
//     .when('applicationStartDate', {
//       is: Joi.date().iso().exist().allow(null), // ⭐ Reference type also changed to Joi.date().iso() ⭐
//       then: Joi.date().iso().min(Joi.ref('applicationStartDate')).messages({
//         'date.min': 'Application Deadline cannot be before Application Start Date.'
//       }),
//       otherwise: Joi.optional()
//     }),
//   organization: Joi.string().trim().required(),
//   // For ObjectIDs, CSV will have them as strings. We'll convert in controller.
//   enrollmentType: Joi.string().pattern(objectIdPattern).optional().allow(null, ''),
//   // For arrays of ObjectIDs, CSV will have them as comma-separated strings.
//   // Validate as string here, then split and convert in controller.
//   program: Joi.string().trim().required().messages({
//     'string.empty': 'Program IDs cannot be empty.',
//     'any.required': 'Program IDs are required.'
//   }),
//   paid: Joi.boolean().default(false).optional(), // Joi can coerce "true"/"false" strings to boolean
//   opportunityStatus: Joi.string().valid(...Object.values(OPPORTUNITY_STATUS)).default(OPPORTUNITY_STATUS.OPEN).optional(),
//   domain: Joi.string().trim().required().messages({
//     'string.empty': 'Domain IDs cannot be empty.',
//     'any.required': 'Domain IDs are required.'
//   }),
//   isFeatured: Joi.boolean().default(false).optional(),
//   isSaved: Joi.boolean().default(false).optional(),
//   employmentType: Joi.string().valid(...Object.values(EMPLOYMENT_TYPE)).optional().allow(null, ''),
// }).options({ allowUnknown: false });

// export const bulkUploadOpportunitySchema = Joi.object({
//     title: Joi.string().trim().required(),
//     types: Joi.string().valid('Paid Internship', 'Unpaid Internship').required(),
//     description: Joi.string().trim().min(50).required(),
// //     states: Joi.string().trim().required(),
// //     fields: Joi.string().trim().required(), // Expects a comma-separated string of field titles
// //     grades: Joi.string().trim().required(), // Expects a comma-separated string of grades
// states: Joi.alternatives().try(
//     Joi.string(), // comma-separated (split later in code)
//     Joi.array().items(Joi.string())
//   ),
//   fields: Joi.alternatives().try(
//     Joi.string(), // comma-separated
//     Joi.array().items(Joi.string())
//   ),
//   grades: Joi.alternatives().try(
//     Joi.string(), // comma-separated
//     Joi.array().items(Joi.string())
//   ).required(),
//     seeWebsiteLink: Joi.string().uri().required(),
//     opportunityIndex: Joi.number().min(0).required(),
//     imageLink: Joi.string().uri().required(),
//     duration: Joi.string().trim().optional().allow(null),
// opportunityStartDate: Joi.alternatives().try(
//         Joi.date().iso(),
//         Joi.string().valid('Flexible')
//     ).required(),
//     //opportunityStartDate: Joi.string().isoDate().optional().allow(null),Joi.string().valid('Flexible'),
//     organization: Joi.string().trim().required(),
//     program: Joi.string().trim().required(), // Expects a comma-separated string of program titles
//     isFeatured: Joi.boolean().optional(),
//     points: Joi.number().min(0).optional().allow(null)
//         .when('isFeatured', {
//             is: Joi.exist().valid(true),
//             then: Joi.number().required().messages({ 'any.required': 'Points are required if the opportunity is featured.' }),
//             otherwise: Joi.optional().allow(null)
//         }),
//     enrollmentType: Joi.string().valid('Part Time', 'Full Time').default('Part Time'),
// }).required(); // The array of opportunities will be validated against this schema for each object


 export const bulkUploadOpportunitySchema = Joi.object({
    title: Joi.string().trim().required().messages({
        'string.empty': 'Title is required',
    }),
    types: Joi.string().trim().required().messages({
        'string.empty': 'Type is required',
    }),
    description: Joi.string().trim().min(50).required().messages({
        'string.empty': 'Description is required',
        'string.min': 'Description should be at least 50 characters long',
    }),
    states: Joi.string().trim().required().messages({
        'string.empty': 'Location (states) is required',
    }),
    fields: Joi.alternatives().try(
        Joi.string().trim(),
        Joi.array().items(Joi.string().trim()).min(1)
    ).required().messages({
        'any.required': 'At least one field is required',
        'array.min': 'Fields cannot be empty',
    }),
    grades: Joi.alternatives().try(
        Joi.string().trim(),
        Joi.array().items(Joi.string().trim()).min(1)
    ).required().messages({
        'any.required': 'At least one grade is required',
        'array.min': 'Grades cannot be empty',
    }),
    seeWebsiteLink: Joi.string().uri().trim().required().messages({
        'string.empty': 'Link is required',
        'string.uri': 'Must be a valid URL',
    }),
    opportunityIndex: Joi.number().min(0).required().messages({
        'number.base': 'Opportunity index must be a number',
        'number.min': 'Opportunity index must be at least 0',
        'any.required': 'Opportunity index is required',
    }),
    imageLink: Joi.string().uri().trim().required().messages({
        'string.empty': 'Image link is required',
        'string.uri': 'Must be a valid URL',
    }),
    duration: Joi.string().trim().allow(null, ''),
    opportunityStartDate: Joi.string().trim().allow(null, ''),
    organization: Joi.string().trim().required().messages({
        'string.empty': 'Organization is required',
    }),
    program: Joi.alternatives().try(
        Joi.string().trim(),
        Joi.array().items(Joi.string().trim()).min(1)
    ).required().messages({
        'any.required': 'At least one program is required',
        'array.min': 'Program cannot be empty',
    }),
    isFeatured: Joi.boolean().default(false),
    points: Joi.number().when('isFeatured', {
        is: true,
        then: Joi.number().required().messages({
            'any.required': 'Points are required for featured opportunities',
        }),
        otherwise: Joi.number().allow(null).default(0),
    }),
    enrollmentType: Joi.string().valid('Part Time', 'Full Time').default('Part Time'),
}).unknown(false);
