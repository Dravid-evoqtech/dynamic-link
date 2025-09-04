// app/constants/apiEndpoints.tsx

/**
 * All API endpoints used in the application.
 * This centralizes endpoint management for better organization and maintainability.
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/users/login',
  SIGNUP: '/users/register',
  GOOGLE_SIGNUP: '/users/google',
  LOGOUT: '/users/logout',
  DELETE_ACCOUNT: '/users/delete-user',
  FORGOT_PASSWORD: '/users/request-password-reset',
  VERIFY_OTP: '/users/verify-otp',
  RESET_PASSWORD: '/users/reset-password',
  CHECK_PASSWORD_STATUS: '/users/check-password-status',
  UPDATE_PASSWORD: '/users/change-password',
  REFRESH_TOKEN: '/users/refresh-token',

  // User endpoints
  GET_PROFILE: '/users/get-current-user',
  UPDATE_PROFILE: '/users/save-profile-data',
  UPDATE_PROFILE_PATCH: '/users/update-profile',
  UPDATE_PROFILE_PICTURE: '/users/profile-picture',
  UPDATE_INTERESTS: '/users/update-interests',
  UPDATE_AVAILABILITY: '/users/update-availability',
  UPDATE_PROGRAMS: '/users/update-programs',
  GET_LOGIN_STREAK: '/user/login-streak',
  UPDATE_LOGIN_DATA: '/logindata',
  UPDATE_LOCATION: '/users/update-location',
  // UPDATE_FCM_TOKEN: '/users/update-fcm-token', // Not implemented in backend yet

  // User Onboarding Data
  GET_OPPORTUNITY_PROGRAM_TYPES: '/user-data/opportunity-program-types',
  GET_ENROLLMENT_TYPES: '/user-data/states',
  GET_GRADES: '/user-data/grades',
  GET_AVAILABILITY_SEASONS: '/user-data/availability-seasons',
  GET_OPPORTUNITY_DOMAINS: '/user-data/fields',
  GET_GOALS: '/user-data/user-goals',

  // Opportunities endpoints
  GET_ALL_OPPORTUNITIES: '/opportunity/get-all-opportunities',
  GET_CATEGORIES: '/opportunity/get-categories',
  GET_OPPORTUNITY_BY_ID: '/opportunity/get-opportunity/:id',
  GET_FEATURED_OPPORTUNITIES: '/opportunity/get-featured-opportunities',
  SEARCH_OPPORTUNITIES: '/opportunity/search',
  UNLOCK_OPPORTUNITY: '/opportunity/unlock-opportunity',


  // Applications endpoints
  GET_ALL_APPLICATIONS: '/application/get-all-applications',
  GET_ALL_APPLICATIONS_WITH_FILTER: '/application/get-all-applications-with-filter',
  APPLY_TO_OPPORTUNITY: '/application',
  GET_APPLICATION_BY_ID: '/application/:id',
  GET_APPLICATION_STATS: '/application/get-stats',
  UPDATE_APPLICATION: '/application/update/:id',
  SAVE_APPLICATION: '/application/:id/save',
  REMOVE_SAVED_APPLICATION: '/application/:id/remove-from-saved',

  
  // Saved opportunities
  GET_SAVED_OPPORTUNITIES: '/opportunity/get-saved-opportunities',
  SAVE_OPPORTUNITY: '/opportunity/save-opportunity',
  REMOVE_SAVED_OPPORTUNITY: '/opportunity/unsave-opportunity',

  // Notifications endpoints
  NOTIFICATION_SETTINGS: '/notify/settings',
  FCM_TOKEN: '/notify/save-token',
  SEND_NOTIFICATION: '/notify/send',
};

// Default export for Expo Router
export default API_ENDPOINTS;