import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { API_ENDPOINTS } from './apiEndpoints';
import { ENV } from '../config/environment';

const BASE_URL = ENV.API.BASE_URL;

interface PendingRequest {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

class TokenRefreshManager {
  private refreshPromise: Promise<string> | null = null;
  private pendingRequests: PendingRequest[] = [];
  private isRefreshing = false;
  private autoRefreshIntervalId: any = null;
  private appStateSubscription: { remove: () => void } | null = null;

  /**
   * Refresh the access token, handling race conditions
   * If multiple requests fail simultaneously, only one refresh will be performed
   */
  async refreshToken(): Promise<string> {
    // If refresh is already in progress, queue this request
    if (this.isRefreshing && this.refreshPromise) {
      return new Promise<string>((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject });
      });
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      
      // Resolve all pending requests with the new token
      this.pendingRequests.forEach(({ resolve }) => resolve(newToken));
      this.pendingRequests = [];
      
      return newToken;
    } catch (error) {
      // Reject all pending requests with the error
      this.pendingRequests.forEach(({ reject }) => reject(error as Error));
      this.pendingRequests = [];
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<string> {
    try {
      console.log('[TokenRefreshManager] Starting token refresh...');
      
      const refreshResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshResponse.ok) {
        throw new Error(`Token refresh failed with status: ${refreshResponse.status}`);
      }

      const refreshData = await refreshResponse.json();
      const newToken = refreshData.data?.accessToken || refreshData.accessToken;
      
      if (!newToken) {
        throw new Error('No access token received from refresh response');
      }

      // Store the new token
      await AsyncStorage.setItem('userToken', newToken);
      console.log('[TokenRefreshManager] Token refreshed and stored successfully');
      
      return newToken;
    } catch (error) {
      console.error('[TokenRefreshManager] Token refresh failed:', error);
      
      // Clear invalid token on refresh failure
      await AsyncStorage.removeItem('userToken');
      
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start automatic token refresh.
   * Defaults to every 9 minutes so a 15-minute access token never fully expires while the app is active.
   */
  startAutoRefresh(refreshIntervalMs: number = 9 * 60 * 1000): void {
    try {
      // Clear existing timers/listeners if any
      this.stopAutoRefresh();

      // Kick off an immediate, silent refresh to extend session on app start
      this.refreshToken().catch((e) => {
        console.warn('[TokenRefreshManager] Initial auto refresh failed (will keep trying):', e?.message || e);
      });

      // Schedule periodic refreshes
      this.autoRefreshIntervalId = setInterval(() => {
        this.refreshToken().catch((e) => {
          console.warn('[TokenRefreshManager] Scheduled refresh failed:', e?.message || e);
        });
      }, refreshIntervalMs);

      // Refresh whenever app returns to foreground
      const handleAppStateChange = (state: string) => {
        if (state === 'active') {
          this.refreshToken().catch((e) => {
            console.warn('[TokenRefreshManager] Foreground refresh failed:', e?.message || e);
          });
        }
      };
      this.appStateSubscription = AppState.addEventListener('change', handleAppStateChange) as any;

      console.log('[TokenRefreshManager] Auto refresh started');
    } catch (error) {
      console.error('[TokenRefreshManager] Failed to start auto refresh:', error);
    }
  }

  /**
   * Stop automatic token refresh and remove listeners.
   */
  stopAutoRefresh(): void {
    try {
      if (this.autoRefreshIntervalId) {
        clearInterval(this.autoRefreshIntervalId);
        this.autoRefreshIntervalId = null;
      }
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      console.log('[TokenRefreshManager] Auto refresh stopped');
    } catch (error) {
      console.error('[TokenRefreshManager] Failed to stop auto refresh:', error);
    }
  }

  /**
   * Check if a refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Get the number of pending requests waiting for token refresh
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.length;
  }

  /**
   * Clear all pending requests (useful for logout)
   */
  clearPendingRequests(): void {
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Token refresh cancelled'));
    });
    this.pendingRequests = [];
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();
export default TokenRefreshManager;