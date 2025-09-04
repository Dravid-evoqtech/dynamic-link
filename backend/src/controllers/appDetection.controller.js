import { APIResponse } from '../utils/APIResponse.js';
import { APIError } from '../utils/APIError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// In-memory cache for app detection results (use Redis in production)
const detectionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Enhanced app detection with backend intelligence
 */
export const detectAppInstallation = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const userAgent = req.get('user-agent') || '';
  const ip = req.ip;
  
  // Extract device fingerprint
  const deviceFingerprint = generateDeviceFingerprint(userAgent, ip);
  
  // Check cache first
  const cachedResult = detectionCache.get(deviceFingerprint);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`Cache hit for device: ${deviceFingerprint}`);
    return res.json(new APIResponse(200, {
      ...cachedResult.data,
      fromCache: true
    }, 'App detection result from cache'));
  }
  
  // Detect platform and capabilities
  const platformInfo = detectPlatform(userAgent);
  const detectionStrategy = getDetectionStrategy(platformInfo);
  
  // Log detection attempt
  console.log(`App detection attempt: ${deviceFingerprint} - ${platformInfo.platform}`);
  
  const result = {
    platform: platformInfo.platform,
    isMobile: platformInfo.isMobile,
    detectionStrategy,
    deepLinkScheme: 'FutureFind://SignUp',
    token: token || null,
    timestamp: Date.now(),
    deviceFingerprint
  };
  
  // Cache the result
  detectionCache.set(deviceFingerprint, {
    data: result,
    timestamp: Date.now()
  });
  
  // Clean old cache entries (simple cleanup)
  if (detectionCache.size > 1000) {
    cleanupCache();
  }
  
  res.json(new APIResponse(200, result, 'App detection configuration'));
});

/**
 * Track app detection results for analytics
 */
export const trackDetectionResult = asyncHandler(async (req, res) => {
  const { deviceFingerprint, appDetected, detectionTime, platform } = req.body;
  
  // Log analytics data
  console.log(`App detection result: ${deviceFingerprint} - ${appDetected ? 'INSTALLED' : 'NOT_INSTALLED'} - ${detectionTime}ms - ${platform}`);
  
  // Update cache with actual result
  const cached = detectionCache.get(deviceFingerprint);
  if (cached) {
    cached.data.appDetected = appDetected;
    cached.data.detectionTime = detectionTime;
    cached.data.actualResult = true;
  }
  
  // Here you could send to analytics service (Google Analytics, Mixpanel, etc.)
  // await analyticsService.track('app_detection_result', {
  //   deviceFingerprint,
  //   appDetected,
  //   detectionTime,
  //   platform,
  //   timestamp: new Date()
  // });
  
  res.json(new APIResponse(200, { success: true }, 'Detection result tracked'));
});

/**
 * Get optimized install page configuration
 */
export const getInstallPageConfig = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const userAgent = req.get('user-agent') || '';
  
  const platformInfo = detectPlatform(userAgent);
  const config = {
    token: token || null,
    platform: platformInfo.platform,
    isMobile: platformInfo.isMobile,
    appStoreUrl: process.env.APP_STORE_URL,
    playStoreUrl: process.env.PLAY_STORE_URL,
    deepLinkScheme: 'FutureFind://SignUp',
    detectionTimeout: getOptimalTimeout(platformInfo),
    enableSmartDetection: platformInfo.isMobile,
    analytics: {
      enabled: true,
      trackingId: generateTrackingId()
    }
  };
  
  res.json(new APIResponse(200, config, 'Install page configuration'));
});

// Helper functions

function generateDeviceFingerprint(userAgent, ip) {
  // Create a simple fingerprint based on user agent and IP
  const uaHash = userAgent.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `${ip}-${Math.abs(uaHash)}`;
}

function detectPlatform(userAgent) {
  const ua = userAgent.toLowerCase();
  
  return {
    platform: ua.includes('android') ? 'android' : 
              ua.includes('iphone') || ua.includes('ipad') ? 'ios' : 'desktop',
    isMobile: /android|iphone|ipad|ipod/i.test(ua),
    isIOS: /iphone|ipad|ipod/i.test(ua),
    isAndroid: /android/i.test(ua),
    version: extractVersion(ua)
  };
}

function extractVersion(userAgent) {
  // Extract OS version for better detection
  const iosMatch = userAgent.match(/os (\d+)_(\d+)/);
  const androidMatch = userAgent.match(/android (\d+\.?\d*)/);
  
  if (iosMatch) return `iOS ${iosMatch[1]}.${iosMatch[2]}`;
  if (androidMatch) return `Android ${androidMatch[1]}`;
  return 'Unknown';
}

function getDetectionStrategy(platformInfo) {
  if (!platformInfo.isMobile) {
    return 'none'; // No detection needed for desktop
  }
  
  if (platformInfo.isIOS) {
    return 'visibility_change'; // iOS works better with visibility API
  }
  
  if (platformInfo.isAndroid) {
    return 'blur_event'; // Android works better with blur events
  }
  
  return 'hybrid'; // Fallback to both
}

function getOptimalTimeout(platformInfo) {
  // Optimize timeout based on platform
  if (platformInfo.isIOS) return 2000; // iOS is usually faster
  if (platformInfo.isAndroid) return 3000; // Android might be slower
  return 2500; // Default
}

function generateTrackingId() {
  return Math.random().toString(36).substring(2, 15);
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of detectionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      detectionCache.delete(key);
    }
  }
}
