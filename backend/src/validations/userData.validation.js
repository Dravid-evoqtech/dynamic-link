import Joi from "joi";

export const userDataValidationSchema = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
        "string.base": "Title must be a string",
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title must not exceed 100 characters",
    }),
    description: Joi.string().max(500).required().messages({
        "string.base": "Description must be a string",

        "string.max": "Description must not exceed 500 characters",
    }),
});
export const userDataParamsValidationSchema = Joi.object({
    id: Joi.string().required().messages({
        "string.base": "ID must be a valid ObjectId",
        "string.empty": "ID is required",
        "any.required": "ID is required",
    }),
});

export const programValidationSchema = Joi.object({
    programs: Joi.array().items(Joi.string()).required().messages({
        'array.base': 'Programs must be an array',
        'any.only': 'Programs must be one of the specified values',
    }),
});

export const availabilityValidationSchema = Joi.object({
    availability: Joi.array().items(Joi.string()).required().messages({
        'array.base': 'Availability must be an array',
        'any.only': 'Availability must be one of the specified values',
    }),
});

export const locationValidationSchema = Joi.object({
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
})

export const interestsValidationSchema = Joi.object({
    interests: Joi.array().items(Joi.string()).required().messages({
        'array.base': 'Interests must be an array',
        'any.only': 'Interests must be one of the specified values',
    }),
});

