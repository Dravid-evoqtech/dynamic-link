import rateLimit from "express-rate-limit";

export const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 uploads per 10 minutes per IP
  message: "⛔ Too many uploads from this IP. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 password resets per 10 minutes per IP
  message: "⛔ Too many password resets from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const changePasswordRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 password changes per 10 minutes per IP
  message: "⛔ Too many password changes from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const googleLoginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 google logins per 10 minutes per IP
  message: "⛔ Too many google logins from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const appleLoginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 apple logins per 10 minutes per IP
  message: "⛔ Too many apple logins from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 logins per 10 minutes per IP
  message: "⛔ Too many logins from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 registrations per 10 minutes per IP
  message: "⛔ Too many registrations from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshTokenRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 refresh tokens per 10 minutes per IP
  message: "⛔ Too many requsts from you. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});