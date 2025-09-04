import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from './api';

// Minimal, safe wrapper to request notification permission on iOS/Android13+
// Uses @react-native-firebase/messaging when available on iOS. On Android 13+
// uses the platform POST_NOTIFICATIONS runtime permission.

export async function requestUserNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const sdk = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
      if (sdk >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      // < 33: notifications are enabled by default
      return true;
    }

    if (Platform.OS === 'ios') {
      // Dynamically import to avoid hard crash if the module isn't installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const messaging = require('@react-native-firebase/messaging').default;
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return !!enabled;
      } catch (err) {
        console.warn('[Notifications] RNFirebase messaging not available; skipping iOS permission', err);
        return false;
      }
    }

    // Web or other platforms: do nothing
    return false;
  } catch (error) {
    console.error('[Notifications] Failed to request permission', error);
    return false;
  }
}

// Get FCM token (requires @react-native-firebase/messaging)
export async function getFcmToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const messaging = require('@react-native-firebase/messaging').default;
        const token = await messaging().getToken();
        return token || null;
      } catch (err) {
        console.warn('[Notifications] messaging not available; cannot get FCM token', err);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token', error);
    return null;
  }
}

// Store FCM token locally
export async function storeFcmTokenLocally(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('fcmToken', token);
    await AsyncStorage.setItem('fcmTokenTimestamp', Date.now().toString());
  } catch (error) {
    console.error('[Notifications] Failed to store FCM token locally', error);
  }
}

// Get stored FCM token locally
export async function getStoredFcmToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('fcmToken');
  } catch (error) {
    console.error('[Notifications] Failed to get stored FCM token', error);
    return null;
  }
}

// Check if FCM token needs refresh (older than 7 days)
export async function shouldRefreshFcmToken(): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem('fcmTokenTimestamp');
    if (!timestamp) return true;
    
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    return tokenAge > sevenDaysInMs;
  } catch (error) {
    console.error('[Notifications] Failed to check FCM token age', error);
    return true;
  }
}

// Refresh FCM token and update backend
export async function refreshAndUpdateFcmToken(): Promise<string | null> {
  try {
    // Get new token from Firebase
    const newToken = await getFcmToken();
    if (!newToken) {
      console.warn('[Notifications] Failed to get new FCM token');
      return null;
    }

    // Store locally
    await storeFcmTokenLocally(newToken);

    // Update backend using existing endpoint
    try {
      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await userAPI.updateFcmToken(newToken, timezone);
      console.log('[Notifications] FCM token updated successfully via /notify/save-token with timezone:', timezone);
    } catch (error) {
      console.error('[Notifications] Failed to update FCM token on backend', error);
      // Don't fail the function if backend update fails
    }

    return newToken;
  } catch (error) {
    console.error('[Notifications] Failed to refresh FCM token', error);
    return null;
  }
}

// Initialize FCM token management
export async function initializeFcmToken(): Promise<string | null> {
  try {
    // Check if we have a stored token
    let token = await getStoredFcmToken();
    
    // If no stored token or token needs refresh, get a new one
    if (!token || await shouldRefreshFcmToken()) {
      token = await refreshAndUpdateFcmToken();
    }
    
    return token;
  } catch (error) {
    console.error('[Notifications] Failed to initialize FCM token', error);
    return null;
  }
}

// Clean up FCM token (useful for logout)
export async function clearFcmToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('fcmToken');
    await AsyncStorage.removeItem('fcmTokenTimestamp');
  } catch (error) {
    console.error('[Notifications] Failed to clear FCM token', error);
  }
}

// Test function to verify complete notification flow
export async function testNotificationFlow(): Promise<{
  permissionGranted: boolean;
  fcmToken: string | null;
  localStorage: boolean;
  backendUpdate: boolean;
}> {
  try {
    console.log('🧪 Testing Complete Notification Flow...');
    
    // 1. Request permission
    console.log('📱 Requesting notification permission...');
    const permissionGranted = await requestUserNotificationPermission();
    console.log('✅ Permission result:', permissionGranted);
    
    // 2. Get FCM token
    console.log('🔑 Getting FCM token...');
    const fcmToken = await getFcmToken();
    console.log('✅ FCM token:', fcmToken ? 'Generated' : 'Failed');
    
    // 3. Store locally
    let localStorage = false;
    if (fcmToken) {
      console.log('💾 Storing token locally...');
      await storeFcmTokenLocally(fcmToken);
      localStorage = true;
      console.log('✅ Token stored locally');
    }
    
    // 4. Update backend
    let backendUpdate = false;
    if (fcmToken) {
      try {
        console.log('🌐 Updating backend...');
        await userAPI.updateFcmToken(fcmToken);
        backendUpdate = true;
        console.log('✅ Backend updated successfully');
      } catch (error) {
        console.log('⚠️ Backend update failed:', error instanceof Error ? error.message : 'Unknown error');
        backendUpdate = false;
      }
    }
    
    const result = {
      permissionGranted,
      fcmToken,
      localStorage,
      backendUpdate
    };
    
    console.log('🎉 Notification Flow Test Complete!', result);
    return result;
    
  } catch (error) {
    console.error('❌ Notification Flow Test Failed:', error);
    return {
      permissionGranted: false,
      fcmToken: null,
      localStorage: false,
      backendUpdate: false
    };
  }
}


