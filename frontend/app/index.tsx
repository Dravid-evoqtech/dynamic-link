import React, { useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Image, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from './components/Background';
import logo from '../assets/images/applogo.png';
import { wp, hp } from './utils/dimensions';
import { useFonts } from 'expo-font';
import authService from './services/authService';
import { tokenRefreshManager } from './services/TokenRefreshManager';

export default function SplashScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  // Mount / Unmount
  useEffect(() => {
    console.log('[SplashScreen] mounted');
    return () => {
      console.log('[SplashScreen] unmounted');
    };
  }, []);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      console.log('[SplashScreen] focused');
      return () => {
        console.log('[SplashScreen] unfocused');
      };
    }, [])
  );

  // AppState changes (active, background, inactive)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      console.log('[SplashScreen] AppState:', appState.current, '->', nextState);
      appState.current = nextState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const [fontsLoaded] = useFonts({
    'UberMoveText-Regular': require('../assets/fonts/UberMoveTextRegular.otf'),
    'UberMoveText-Medium': require('../assets/fonts/UberMoveTextMedium.otf'),
    'UberMoveText-Bold': require('../assets/fonts/UberMoveTextBold.otf'),
    'UberMoveText-Light': require('../assets/fonts/UberMoveTextLight.otf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const checkLoginStatus = async () => {
      try {
        console.log('[SplashScreen] ===== AUTHENTICATION CHECK START =====');
        console.log('[SplashScreen] Checking authentication status...');
        
        // Debug: Check what's actually stored
        await authService.debugAuthState();
        
        // Add a small delay to ensure AsyncStorage is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isAuthenticated = await authService.isAuthenticated();
        console.log('[SplashScreen] Authentication result:', isAuthenticated);
        
        if (isAuthenticated) {
          // User is already logged in → go to main app
          console.log('[SplashScreen] ✅ User is authenticated, redirecting to main app');
          try {
            // Start background token refresh loop
            tokenRefreshManager.startAutoRefresh();
            console.log('[SplashScreen] Attempting to navigate to /screens/MainTabsScreen');
            await router.replace('/screens/MainTabsScreen');
            console.log('[SplashScreen] ✅ Navigation to main app successful');
          } catch (navError) {
            console.error('[SplashScreen] ❌ Navigation error:', navError);
            console.error('[SplashScreen] Navigation error details:', JSON.stringify(navError));
            console.log('[SplashScreen] Navigation failed, going to onboarding as fallback');
            router.replace('/onboarding');
          }
        } else {
          // No token → go to onboarding/login
          console.log('[SplashScreen] ❌ User not authenticated, redirecting to onboarding');
          router.replace('/onboarding');
        }
        console.log('[SplashScreen] ===== AUTHENTICATION CHECK END =====');
      } catch (error) {
        console.error('[SplashScreen] ❌ Error checking login status:', error);
        console.error('[SplashScreen] Error details:', JSON.stringify(error));
        router.replace('/onboarding');
      }
    };

    const timer = setTimeout(checkLoginStatus, 1500); // splash delay
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;



  return (
    <Background>
      <Image
        source={logo}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>FutureFind</Text>
      

    </Background>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: wp(120),
    height: hp(120),
    marginBottom: hp(24),
  },
  title: {
    position: 'absolute',
    bottom: hp(48),
    alignSelf: 'center',
    fontSize: wp(24),
    color: '#fff',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    lineHeight: hp(32),
    letterSpacing: wp(-0.48),
  },

});