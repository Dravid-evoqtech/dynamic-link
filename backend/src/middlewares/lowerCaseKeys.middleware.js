/**
 * Utility function to recursively convert all keys in an object to lowercase.
 * This is useful for handling inconsistent casing from frontend requests.
 * @param {object} obj The object to convert.
 * @returns {object} A new object with all keys in lowercase.
 */
const lowerCaseKeys = (obj) => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = key.toLowerCase();
        acc[newKey] = lowerCaseKeys(obj[key]);
        return acc;
    }, {});
};

/**
 * Express middleware to convert all keys in the request body to lowercase.
 * @param {express.Request} req The Express request object.
 * @param {express.Response} res The Express response object.
 * @param {express.NextFunction} next The next middleware function.
 */
const lowerCaseBodyKeys = (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        req.body = lowerCaseKeys(req.body);
    }
    next();
};

export { lowerCaseBodyKeys };
