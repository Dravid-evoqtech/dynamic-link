import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    const isProd = process.env.NODE_ENV === "production";
    const statusCode = err.statusCode || 500;

    // Log error using Winston
    logger.error({
        method: req.method,
        url: req.originalUrl,
        statusCode,
        message: err.message,
        stack: err.stack,
    });


    // Send structured response
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        data: null,
        ...(isProd ? {} : { stack: err.stack }),
    });
};

export { errorHandler };
