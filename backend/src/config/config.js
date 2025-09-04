import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables for dynamic links
const requiredEnvVars = [
  'JWT_SECRET',
  'ANDROID_PACKAGE',
  'ANDROID_SHA256',
  'IOS_APP_ID',
  'PLAY_STORE_URL',
  'APP_STORE_URL',
  'DOMAIN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables for dynamic links:', missingVars);
  process.exit(1);
}

export default {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  tempTTL: Number(process.env.TEMP_TTL_SECONDS || 86400),
  tokenTTL: Number(process.env.TEMP_TOKEN_TTL_SECONDS || 172800),
  appHost: process.env.APP_HOST,
  androidPackage: process.env.ANDROID_PACKAGE,
  androidSha256: process.env.ANDROID_SHA256,
  iosAppId: process.env.IOS_APP_ID,
  playStoreUrl: process.env.PLAY_STORE_URL,
  appStoreUrl: process.env.APP_STORE_URL,
  domain: process.env.DOMAIN,
};
