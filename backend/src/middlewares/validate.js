import { APIError } from "../utils/APIError.js";

export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });

        if (error) {
            throw new APIError(400, `Validation failed: ${error.details.map((err) => err.message).join(", ")}`);
        }

        next();
    };
};
