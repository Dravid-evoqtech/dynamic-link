import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenRefreshManager } from './TokenRefreshManager';
import { clearQueryCache } from './queryClient';

const TOKEN_KEY = 'userToken';
const USER_DATA_KEY = 'userData';

export interface UserData {
  _id: string;
  email?: string;
  name?: string;
  // Add other user fields as needed
}

class AuthService {
  // Store authentication token
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('[AuthService] Token stored successfully');
    } catch (error) {
      console.error('[AuthService] Error storing token:', error);
      throw error;
    }
  }

  // Get authentication token
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('[AuthService] Token retrieved:', !!token);
      return token;
    } catch (error) {
      console.error('[AuthService] Error retrieving token:', error);
      return null;
    }
  }

  // Store user data
  async setUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log('[AuthService] User data stored successfully');
    } catch (error) {
      console.error('[AuthService] Error storing user data:', error);
      throw error;
    }
  }

  // Get user data
  async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('[AuthService] User data retrieved:', !!userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error retrieving user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const isValid = Boolean(token && token.trim() !== '');
      console.log('[AuthService] Authentication check:', isValid);
      return isValid;
    } catch (error) {
      console.error('[AuthService] Error checking authentication:', error);
      return false;
    }
  }

  // Clear all authentication data (logout)
  async logout(): Promise<void> {
    try {
      // Clear any pending token refresh requests
      tokenRefreshManager.clearPendingRequests();
      // Stop auto refresh loop
      tokenRefreshManager.stopAutoRefresh();
      
      // Clear React Query cache to prevent data leakage between users
      await clearQueryCache();
      console.log('[AuthService] React Query cache cleared');
      
      // Clear stored data
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY]);
      console.log('[AuthService] Logout successful - all data cleared');
    } catch (error) {
      console.error('[AuthService] Error during logout:', error);
      throw error;
    }
  }

  // Validate token format (basic validation)
  isValidToken(token: string): boolean {
    // For debugging, let's be more lenient
    return Boolean(token && token.trim() !== '');
  }

  // Debug method to check current auth state
  async debugAuthState(): Promise<void> {
    try {
      const token = await this.getToken();
      const userData = await this.getUserData();
      const isAuth = await this.isAuthenticated();
      
      console.log('=== AUTH DEBUG ===');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('User data exists:', !!userData);
      console.log('Is authenticated:', isAuth);
      console.log('==================');
    } catch (error) {
      console.error('[AuthService] Debug error:', error);
    }
  }
}

export const authService = new AuthService();
export default authService;