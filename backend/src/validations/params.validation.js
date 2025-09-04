import Joi from "joi";

export const idSchema = Joi.object({
    id: Joi.string().required().messages({
        "string.base": "ID must be a valid ObjectId",
        "string.empty": "ID is required",
        "any.required": "ID is required",
    }),
});