import express from 'express';
import {
  detectAppInstallation,
  trackDetectionResult,
  getInstallPageConfig
} from '../controllers/appDetection.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for app detection endpoints
const detectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many app detection requests, please try again later.'
});

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 tracking requests per minute per IP
  message: 'Too many tracking requests, please try again later.'
});

// App detection endpoints
router.get('/detect', detectionLimiter, detectAppInstallation);
router.post('/track', trackingLimiter, trackDetectionResult);
router.get('/config', getInstallPageConfig);

export default router;
