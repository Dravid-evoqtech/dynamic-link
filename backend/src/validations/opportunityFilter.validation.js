import Joi from "joi";

export const opportunityFilterSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(4),
    page: Joi.number().integer().min(1).default(1),

    // Sorting
    sortBy: Joi.string().valid("Featured", "Newest", "Ending Soon").default("Newest"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),

    // Search and filters
    search: Joi.string().allow("", null).optional(),


    program: Joi.alternatives().try(
        Joi.string(), // single ObjectId
        Joi.array().items(Joi.string()) // array of ObjectIds
    ).optional(),

    fields: Joi.alternatives().try( 
        Joi.string(),
        Joi.array().items(Joi.string())
    ).optional(),
    states: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).optional(),

    type: Joi.alternatives().try(
        Joi.string().valid("Paid Internship", "Unpaid Internship"),
        Joi.array().items(Joi.string().valid("Paid Internship", "Unpaid Internship"))
    ).optional(),

    deadlineBefore: Joi.date().iso().optional(),
    deadlineAfter: Joi.date().iso().optional(),
});
