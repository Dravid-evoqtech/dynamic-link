// app/services/api.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from './apiEndpoints';
import { ENV } from '../config/environment';
import { tokenRefreshManager } from './TokenRefreshManager';

const BASE_URL = ENV.API.BASE_URL;

// Generic API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Validate endpoint
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint provided');
    }

    const headers: HeadersInit = {
      ...options.headers, // Merge any custom headers first
    };

    // If it's a POST/PUT/PATCH request and body is NOT FormData,
    // then set Content-Type to application/json.
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
      if (!(options.body instanceof FormData)) {
        (headers as any)['Content-Type'] = 'application/json';
      }
    }

    // --- CRITICAL: ADD/UNCOMMENT THIS FOR AUTHENTICATED ENDPOINTS ---
    const token = await AsyncStorage.getItem('userToken'); // Retrieve your stored token
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }
    // ------------------------------------------------------------------

    // Make the API call with better error handling
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: headers, // Use our dynamically built headers
        ...options,
        credentials: 'include', // Send cookies with all requests
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Network error: ${fetchError?.message || 'Failed to connect to server'}`);
    }

    // Check if response exists and has required properties
    if (!response) {
      throw new Error('Network error: No response received');
    }

    // Get the response body as text first to avoid JSON parsing errors on non-JSON responses.
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch (textError: any) {
      console.error('Response text error:', textError);
      throw new Error(`Failed to read response: ${textError?.message || 'Unknown error'}`);
    }

    if (!response.ok) {
      let errorMessage = 'Unknown error occurred';
      let errorData = null;

      // If token is expired (401), try to refresh it using the race-condition-safe manager
      if (response.status === 401 && token) {
        try {
          console.log('[API] Token expired, attempting refresh...');
          
          // Use the token refresh manager to handle race conditions
          const newToken = await tokenRefreshManager.refreshToken();
          
          if (newToken) {
            console.log('[API] Token refreshed successfully, retrying original request...');
            
            // Retry original request with new token
            const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
              headers: {
                ...headers,
                'Authorization': `Bearer ${newToken}`,
              },
              ...options,
              credentials: 'include',
            });
            
            if (retryResponse.ok) {
              const retryBody = await retryResponse.text();
              try {
                if (retryBody && retryBody.trim()) {
                  return JSON.parse(retryBody);
                } else {
                  return {};
                }
              } catch (parseError: any) {
                console.error('[API] Retry response parse error:', parseError);
                return {};
              }
            } else {
              // If retry also fails, throw the error
              throw new Error(`Retry request failed with status: ${retryResponse.status}`);
            }
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          
          // Clear invalid token
          await AsyncStorage.removeItem('userToken');
          
          // Continue with normal error handling
        }
      }

      try {
        // Try to parse the error response as JSON
        if (responseBody && responseBody.trim()) {
          errorData = JSON.parse(responseBody);
          errorMessage = errorData?.message || `API Error: ${response?.status || 'Unknown'}`;
        } else {
          errorMessage = `API Error: ${response?.status || 'Unknown'}`;
        }
      } catch (e) {
        // If it's not JSON, it might be an HTML error page or plain text.
        if (response?.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (responseBody && responseBody.trim()) {
          errorMessage = responseBody.length < 200 ? responseBody : `API Error: ${response?.status || 'Unknown'}`;
        } else {
          errorMessage = `API Error: ${response?.status || 'Unknown'}`;
        }
      }

      const error: any = new Error(errorMessage);
      error.data = errorData;
      error.status = response?.status || 'Unknown';
      error.response = response;
      throw error;
    }

    // If the response was OK, parse the body as JSON and return it.
    try {
      if (responseBody && responseBody.trim()) {
        return JSON.parse(responseBody);
      } else {
        return {};
      }
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      // If we can't parse JSON but got a successful response, return empty object
      return {};
    }
  } catch (error) {
    console.error('API call failed:', error);
    // Ensure we always throw an Error object
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`API call failed: ${String(error)}`);
    }
  }
};

// Specific API functions
export const authAPI = {
  login: (email: string, password: string, provider: string) =>
    apiCall(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password, provider }),
      credentials: 'include',
    }),

  signup: (formData: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    apiCall(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(formData),
      credentials: 'include',
    }),

  // Send FCM token to backend (after login/signup)
  sendFcmToken: (token: string, timezone?: string) =>
    apiCall(API_ENDPOINTS.FCM_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ 
        fcmToken: token,
        ...(timezone && { timezone })
      }),
      credentials: 'include',
    }),

  // Send a test/push notification to a user
  sendNotification: (payload: { userId: string; title: string; body: string; data?: string }) =>
    apiCall(API_ENDPOINTS.SEND_NOTIFICATION, {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    }),

  // Send a test notification with the exact payload structure you specified
  sendTestNotification: (userId: string, title: string = "Test Notification", body: string = "Start your day by checking new opportunities 🎯", data: string = "") =>
    apiCall(API_ENDPOINTS.SEND_NOTIFICATION, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        title,
        body,
        data
      }),
      credentials: 'include',
    }),

  googleSignup: (googleData: { idToken: string }) =>
    apiCall(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ 
        ...googleData, 
        provider: 'google' 
      }), 
      credentials: 'include',
    }),

  appleSignup: (appleData: { code: string; fullName?: string }) =>
    apiCall(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        code: appleData.code,
        fullName: appleData.fullName,
        provider: 'apple'
      }),
      credentials: 'include',
    }),
  logout: () =>
    apiCall(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
      credentials: 'include',
    }),
  deleteAccount: () =>
    apiCall(API_ENDPOINTS.DELETE_ACCOUNT, {
      method: 'DELETE',
      credentials: 'include',
    }),
  forgotPassword: (email: string) =>
    apiCall(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
      credentials: 'include',
    }),
  
  verifyOTP: (otp: string, email: string) =>
    apiCall(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ otp, email }),
      credentials: 'include',
    }),
  
  resetPassword: (otp: string, email: string, newPassword: string, confirmPassword: string) =>
    apiCall(API_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ otp, email, newPassword, confirmPassword }),
      credentials: 'include',
    }),
  checkPasswordStatus: () =>
    apiCall(API_ENDPOINTS.CHECK_PASSWORD_STATUS, {
      method: 'GET',
      credentials: 'include',
    }),
  updatePassword: (passwordData: { currentPassword: string; newPassword: string }) =>
    apiCall(API_ENDPOINTS.UPDATE_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
      credentials: 'include',
    }),
  
  changePassword: (passwordData: { oldPassword: string; newPassword: string }) =>
    apiCall(API_ENDPOINTS.UPDATE_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
      credentials: 'include',
    }),

  refreshToken: () =>
    apiCall(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      credentials: 'include',
    }),
};

import { OpportunityFilters, OpportunitySearchFilters, FeaturedOpportunityFilters, ApplicationFilters } from '../../types/opportunities';

export const opportunitiesAPI = {
  getAll: (filters: OpportunityFilters = {}) => {
    const defaultFilters = {
      limit: filters.limit || 50, // Use provided limit or default to 50
      page: filters.page || 1,
      sortBy: filters.sortBy || "Featured",
      ...filters
    };
    
    console.log('[opportunitiesAPI.getAll] Request body:', JSON.stringify(defaultFilters, null, 2));
    
    return apiCall(API_ENDPOINTS.GET_ALL_OPPORTUNITIES, {
      method: 'POST',
      body: JSON.stringify(defaultFilters),
      credentials: 'include',
    });
  },

  getCategories: () => apiCall(API_ENDPOINTS.GET_CATEGORIES, {
    method: 'POST',
    credentials: 'include',
  }),

  getById: (id: string) =>
    apiCall(API_ENDPOINTS.GET_OPPORTUNITY_BY_ID.replace(':id', id), {
      credentials: 'include',
    }),

  getFeatured: (filters: FeaturedOpportunityFilters = {}) => {
    const defaultFilters = {
      limit: 4,
      page: 1,
      ...filters
    };
    
    return apiCall(API_ENDPOINTS.GET_FEATURED_OPPORTUNITIES, {
      method: 'POST',
      body: JSON.stringify(defaultFilters),
      credentials: 'include',
    });
  },

  search: (query: string, filters: OpportunitySearchFilters = {}) =>
    apiCall(`${API_ENDPOINTS.SEARCH_OPPORTUNITIES}?q=${query}`, {
      method: 'POST',
      body: JSON.stringify(filters),
      credentials: 'include',
    }),

  unlockOpportunity: (opportunityId: string) =>
    apiCall(API_ENDPOINTS.UNLOCK_OPPORTUNITY, {
      method: 'POST',
      // Backend expects { id }, not { opportunityId }
      body: JSON.stringify({ id: opportunityId }),
      credentials: 'include',
    }),
};

export const applicationsAPI = {
  getUserApplications: (filters: ApplicationFilters = {}, limit = 50, page = 1, sortBy = "Featured") => {
    return apiCall(API_ENDPOINTS.GET_ALL_APPLICATIONS_WITH_FILTER, {
      method: 'POST',
      body: JSON.stringify({ 
        ...filters, 
        limit, 
        page, 
        sortBy 
      }),
      credentials: 'include',
    });
  },

  getApplicationById: (id: string) =>
    apiCall(API_ENDPOINTS.GET_APPLICATION_BY_ID.replace(':id', id), {
      method: 'GET',
      credentials: 'include',
    }),

  apply: (opportunityId: string, applicationData: any) =>
    apiCall(API_ENDPOINTS.APPLY_TO_OPPORTUNITY, {
      method: 'POST',
      body: JSON.stringify({ opportunityId, ...applicationData }),
      credentials: 'include',
    }),

  getStats: () =>
    apiCall(API_ENDPOINTS.GET_APPLICATION_STATS, {
      method: 'GET',
      credentials: 'include',
    }),

  saveApplication: (applicationId: string) =>
    apiCall(API_ENDPOINTS.SAVE_APPLICATION.replace(':id', applicationId), {
      method: 'PATCH',
      credentials: 'include',
    }),

  removeSavedApplication: (applicationId: string) =>
    apiCall(API_ENDPOINTS.REMOVE_SAVED_APPLICATION.replace(':id', applicationId), {
      method: 'PATCH',
      credentials: 'include',
    }),

  updateApplication: (applicationId: string, updateData: { opportunity: string; applicant: string; status: string }) =>
    apiCall(API_ENDPOINTS.UPDATE_APPLICATION.replace(':id', applicationId), {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      credentials: 'include',
    }),
};

export const savedAPI = {
  getSaved: (limit = 50, page = 1) => {
    return apiCall(`${API_ENDPOINTS.GET_SAVED_OPPORTUNITIES}?limit=${limit}&page=${page}`, { method: 'POST' });
  },

  save: (opportunityId: string) =>
    apiCall(API_ENDPOINTS.SAVE_OPPORTUNITY, {
      method: 'POST',
      body: JSON.stringify({ id: opportunityId }),
      credentials: 'include',
    }),

  remove: (opportunityId: string) =>
    apiCall(API_ENDPOINTS.REMOVE_SAVED_OPPORTUNITY, {
      method: 'POST',
      body: JSON.stringify({ id: opportunityId }),
      credentials: 'include',
    }),
};

export const userAPI = {
  getProfile: () => apiCall(API_ENDPOINTS.GET_PROFILE),
  updateProfile: (data: any) =>
    apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    }),
  updateProfilePatch: (data: any) =>
    apiCall(API_ENDPOINTS.UPDATE_PROFILE_PATCH, {
      method: 'PATCH',
      body: JSON.stringify(data),
      credentials: 'include',
    }),

  updateProfilePicture: async (imageUri: string) => {
    // Create FormData for the image file only
    const formData = new FormData();
    
    // Add the profile picture file
    formData.append('avatarFile', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    console.log('[API] Uploading profile picture to:', API_ENDPOINTS.UPDATE_PROFILE_PATCH);
    
    const uploadResponse = await apiCall(API_ENDPOINTS.UPDATE_PROFILE_PATCH, {
      method: 'PATCH',
      body: formData,
      credentials: 'include',
    });

    return uploadResponse;
  },

  updateInterests: (interests: string[]) =>
    apiCall(API_ENDPOINTS.UPDATE_INTERESTS, {
      method: 'PATCH',
      body: JSON.stringify({ interests }),
      credentials: 'include',
    }),

  updateAvailability: (availability: string[]) =>
    apiCall(API_ENDPOINTS.UPDATE_AVAILABILITY, {
      method: 'PATCH',
      body: JSON.stringify({ availability }),
      credentials: 'include',
    }),

  updatePrograms: (programs: string[]) =>
    apiCall(API_ENDPOINTS.UPDATE_PROGRAMS, {
      method: 'PATCH',
      body: JSON.stringify({ programs }),
      credentials: 'include',
    }),

  getLoginStreak: () =>
    apiCall(API_ENDPOINTS.GET_LOGIN_STREAK, {
      method: 'GET',
      credentials: 'include',
    }),

  updateLoginData: (dayPercentage: number) =>
    apiCall(API_ENDPOINTS.UPDATE_LOGIN_DATA, {
      method: 'PATCH',
      body: JSON.stringify({ 
        dayPercentageIncrement: dayPercentage.toString(),
        dayPercentage: dayPercentage.toString(),
        increment: dayPercentage.toString()
      }),
      credentials: 'include',
    }),

  updateLocation: (locationData: any) =>
    apiCall(API_ENDPOINTS.UPDATE_LOCATION, {
      method: 'PATCH',
      body: JSON.stringify(locationData),
      credentials: 'include',
    }),

  // Update FCM token using existing backend endpoint
  updateFcmToken: (fcmToken: string, timezone?: string) =>
    apiCall(API_ENDPOINTS.FCM_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ 
        fcmToken,
        ...(timezone && { timezone })
      }),
      credentials: 'include',
    }),
};

export const userDataAPI = {
  getOpportunityProgramTypes: () =>
    apiCall(API_ENDPOINTS.GET_OPPORTUNITY_PROGRAM_TYPES),
  getEnrollmentTypes: () => apiCall(API_ENDPOINTS.GET_ENROLLMENT_TYPES),
  getGrades: () => apiCall(API_ENDPOINTS.GET_GRADES),
  getAvailabilitySeasons: () => apiCall(API_ENDPOINTS.GET_AVAILABILITY_SEASONS),
  getOpportunityDomains: () => apiCall(API_ENDPOINTS.GET_OPPORTUNITY_DOMAINS),
  getGoals: () => apiCall(API_ENDPOINTS.GET_GOALS),
};

export const referralAPI = {
  createReferral: async (ownerUserId: string, maxUses: string = "1", expiresInDays: string = "1") => {
    // Use the full URL directly since this endpoint doesn't have /api/v1 prefix
    const fullUrl = 'https://futurefind-2g38.onrender.com/referral/admin/create-referral';
    
    // Get the token asynchronously
    const token = await AsyncStorage.getItem('userToken');
    
    return fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if token exists
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ownerUserId,
        maxUses,
        expiresInDays
      }),
      credentials: 'include',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  },
};

// Cache management utility
export const cacheManager = {
  // Clear all React Query cache
  clearAllCache: () => {
    // This will be called from components that need to clear cache
    // The actual implementation will be in the components using useQueryClient
  },
};

export const notificationAPI = {
  getSettings: () =>
    apiCall(API_ENDPOINTS.NOTIFICATION_SETTINGS, {
      method: 'GET',
      credentials: 'include',
    }),
  
  updateSettings: (settings: { newOpportunities: boolean; applicationUpdates: boolean; dailyStreakReminders: boolean }) =>
    apiCall(API_ENDPOINTS.NOTIFICATION_SETTINGS, {
      method: 'PATCH',
      body: JSON.stringify(settings),
      credentials: 'include',
    }),
};

// Default export for Expo Router
export default {
  authAPI,
  opportunitiesAPI,
  applicationsAPI,
  savedAPI,
  userAPI,
  userDataAPI,
  referralAPI,
  notificationAPI
};
