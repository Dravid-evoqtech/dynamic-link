// Environment Configuration for FutureFind App
// This file centralizes all environment variables and configuration

// Environment detection
type Environment = 'production' | 'development';

const getEnvironment = (): Environment => {
  // You can set this manually or use a build-time variable
  // For now, defaulting to production
  return (process.env.NODE_ENV as Environment) || 'production';
};

const isProduction = getEnvironment() === 'production';
const isDevelopment = getEnvironment() === 'development';

// Base configuration
const baseConfig = {
  // Google Sign-In Configuration
  GOOGLE: {
    WEB_CLIENT_ID: '950666227466-smoakr16tall0tef1nepv72vj941l45u.apps.googleusercontent.com',
    IOS_CLIENT_ID: '950666227466-p4p0u9f4446csmrqns89vi5p0j7d209c.apps.googleusercontent.com',
  },
  
  // App Configuration
  APP: {
    NAME: 'FutureFind',
    ENV: getEnvironment(),
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_APPLE_SIGNIN: true,
    ENABLE_GOOGLE_SIGNIN: true,
  },
};

// Environment-specific configurations
const environmentConfigs = {
  production: {
    API: {
      BASE_URL: 'https://futurefind-2g38.onrender.com/api/v1',
    },
    FEATURES: {
      ...baseConfig.FEATURES,
      ENABLE_ANALYTICS: true,
      ENABLE_NOTIFICATIONS: true,
    },
  },
  
  development: {
    API: {
      BASE_URL: 'https://futurefind-2g38.onrender.com/api/v1', // Use staging API for development
    },
    FEATURES: {
      ...baseConfig.FEATURES,
      ENABLE_ANALYTICS: false,
      ENABLE_NOTIFICATIONS: false,
    },
  },
  

};

// Merge base config with environment-specific config
export const ENV = {
  ...baseConfig,
  ...environmentConfigs[getEnvironment() as keyof typeof environmentConfigs],
};

// Helper functions for environment checks
export const isProd = () => isProduction;
export const isDev = () => isDevelopment;

export default ENV;
