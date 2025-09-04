import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, Platform } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Background from "./components/Background";
import SocialButton from "./components/SocialButton";
import InputField from "./components/InputField";
import PrimaryButton from "./components/PrimaryButton";
import BackButton from "./components/BackButton";
import { router } from "expo-router";
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useThemeContext';
import { authAPI } from './services/api';
import { useOnboarding } from "../contexts/OnboardingContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from "./config/environment";
// Removed GoogleAuth unified usage
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
// Import appleAuth directly to avoid AppleButton import issues
import AppleAuthModule from '@invertase/react-native-apple-authentication/lib/AppleAuthModule';
import { NativeModules } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

const { RNAppleAuthModule } = NativeModules;
const appleAuth = new AppleAuthModule(RNAppleAuthModule);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTAINER_TOP = SCREEN_HEIGHT * (121 / 812);
const ICON_BG_SIZE = SCREEN_WIDTH * (83.73 / 375);
const ICON_BG_RADIUS = SCREEN_WIDTH * (59.66 / 375);
const LOGO_SIZE = SCREEN_WIDTH * (100 / 375);
const TITLE_CONTAINER_WIDTH = SCREEN_WIDTH * (320 / 375);
const TITLE_CONTAINER_HEIGHT = SCREEN_HEIGHT * (63 / 812);
const TITLE_CONTAINER_GAP = SCREEN_HEIGHT * (8 / 812);

// Import PNG icons
import appleIcon from "../assets/images/Applelogo.png";
import googleIcon from "../assets/images/googlelogo.png";
import personIcon from "../assets/images/icons/personIcon.png";
import emailIcon from "../assets/images/icons/email.png";
import lockIcon from "../assets/images/icons/lock.png";
import eyeIcon from "../assets/images/icons/password.png";
import startIcon from "../assets/images/icons/StartIcon.png";

export default function SignUp() {
  const { colorScheme } = useTheme();
  const { updateData, clearData } = useOnboarding();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    api: '',
  });

  // Function to clear all previous user data when starting a new signup
  const clearPreviousUserData = async () => {
    try {
      console.log('[SignUp] Clearing previous user data...');
      
      // Clear onboarding context data
      clearData();
      
      // Clear auth service data
      const authService = await import('./services/authService');
      await authService.default.logout();
      
      // Clear AsyncStorage manually as well to be thorough
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      console.log('[SignUp] Previous user data cleared successfully');
    } catch (error) {
      console.warn('[SignUp] Failed to clear some previous user data:', error);
    }
  };

  const handleGoogleSignUp = async () => {
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      
      // Clear any previous user data before starting new signup
      await clearPreviousUserData();
      
      console.log('[Google Sign-Up] Starting Google authentication...');
      
      // Force Google account picker by signing out first
      try {
        await GoogleSignin.signOut();
        console.log('[Google Sign-Up] Google Sign-in state cleared');
      } catch (signOutError) {
        console.warn('[Google Sign-Up] Failed to clear Google Sign-in state:', signOutError);
      }
      
      await GoogleSignin.hasPlayServices();
      console.log('[Google Sign-Up] Play Services check passed');
      
      const userInfo = await GoogleSignin.signIn();
      console.log('[Google Sign-Up] User signed in successfully');
      
      const tokens = await GoogleSignin.getTokens();
      console.log('[Google Sign-Up] Tokens retrieved:', !!tokens);
      
      const idToken = tokens?.idToken;
      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }
      console.log('[Google Sign-Up] ID token obtained, calling API...');
      try {
        const responseData = await authAPI.googleSignup({ idToken });
        console.log('[Google Sign-Up] API response received:', responseData);
        
        if (!responseData) {
          throw new Error('No response data received from API');
        }
        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Google Sign-Up] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token) {
          // Import authService to handle token storage properly
          const authService = await import('./services/authService');
          if (authService.default.isValidToken(token)) {
            await authService.default.setToken(token);
            console.log('[Google Sign-Up] Token stored successfully');
          } else {
            console.warn('[Google Sign-Up] Token found but failed validation');
            // For debugging, let's still store it temporarily
            await authService.default.setToken(token);
            console.log('[Google Sign-Up] Token stored for debugging purposes');
          }
        } else {
          console.warn('[Google Sign-Up] No token found in response');
          
          // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
          if (user?._id) {
            console.log('[Google Sign-Up] Using user ID as temporary token:', user._id);
            const authService = await import('./services/authService');
            await authService.default.setToken(user._id);
            console.log('[Google Sign-Up] User ID stored as temporary token');
          } else {
            throw new Error('No authentication token or user ID received from server');
          }
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Google Sign-Up] User ID stored:', user._id);
          
          // Store user data in auth service
          try {
            const authService = await import('./services/authService');
            await authService.default.setUserData({
              _id: user._id,
              email: user.email,
              name: user.fullName
            });
            console.log('[Google Sign-Up] User data stored successfully');
          } catch (error) {
            console.warn('[Google Sign-Up] Failed to store user data:', error);
          }
        }
        
        // After successful signup, request notification permission and send FCM token (best-effort)
        try {
          const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
          const granted = await requestUserNotificationPermission();
          if (granted) {
            const token = await getFcmToken();
            if (token) {
              // Get user's timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await authAPI.sendFcmToken(token, timezone);
              console.log('[Google Sign-Up] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Google Sign-Up] Skipping FCM token send:', e);
        }

        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Google Sign-Up] New user - showing onboarding popup');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Google Sign-Up] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Google Sign-Up] Failed to invalidate data cache:', error);
          }
          
          setShowPopup(true);
        } else {
          console.log('[Google Sign-Up] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Google Sign-Up] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Google Sign-Up] Failed to invalidate data cache:', error);
          }
          
          setGoogleLoading(false);
          router.replace('/screens/MainTabsScreen');
        }
      } catch (apiError: any) {
        console.error('[Google Sign-Up] API call failed:', apiError);
        throw new Error(`API Error: ${apiError?.message || 'Failed to authenticate with server'}`);
      }
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error('Google Sign-In Error:', error);
      alert(error?.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };
  
  // Configure Google Sign-In (direct SDK)
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: ENV.GOOGLE.WEB_CLIENT_ID,
    iosClientId: ENV.GOOGLE.IOS_CLIENT_ID,
  });

  // Clear any previous user data when component mounts
  useEffect(() => {
    clearPreviousUserData();
  }, []);



  const onAppleButtonPress = async () => {
    if (appleLoading) return;
    
    setAppleLoading(true);
    try {
      // Clear any previous user data before starting new signup
      await clearPreviousUserData();
      
      // Check if Apple authentication is supported on this device
      if (!appleAuth.isSupported) {
        alert('Apple Sign-In is not supported on this device');
        setAppleLoading(false);
        return;
      }

      // Performs login request
      // Note: it appears putting FULL_NAME first is important, see issue #293
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Log Apple response data for debugging
      console.log('[Apple Sign-Up] Complete Apple Response:', JSON.stringify(appleAuthRequestResponse, null, 2));

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // get current authentication state for user
      // ! This method must be tested on a real device. On the iOS simulator it always throws an error.
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

      // use credentialState response to ensure the user is authenticated
      if (credentialState === appleAuth.State.AUTHORIZED) {
        // user is authenticated
        const { identityToken, nonce } = appleAuthRequestResponse;

        // Use the appleSignup method from your API (it handles both signup and login)
        // Send identityToken as 'code' and fullName to match backend expectations
        const fullName = appleAuthRequestResponse.fullName;
        
        // Apple only provides fullName on first authentication, not on subsequent logins
        // We need to handle this gracefully
        let nameToSend = undefined;
        if (fullName?.givenName && fullName?.familyName) {
          nameToSend = `${fullName.givenName} ${fullName.familyName}`.trim();
          console.log('[Apple Sign-Up] Full name provided:', nameToSend);
        } else {
          console.log('[Apple Sign-Up] No full name provided (subsequent login)');
          // For subsequent logins, we'll let the backend handle this
          // The backend should either use existing user data or prompt for name
        }
        
        console.log('[Apple Sign-Up] Sending to API:', { 
          code: identityToken ? 'present' : 'missing', 
          fullName: nameToSend || 'undefined',
          provider: 'apple'
        });
        
        const apiPayload = { 
          code: appleAuthRequestResponse.authorizationCode, // Send authorizationCode as 'code' to match backend API
          fullName: nameToSend
        };
        
        const responseData = await authAPI.appleSignup(apiPayload);
        
        if (!responseData) {
          throw new Error('No response data received from API');
        }
        
        console.log('[Apple Sign-Up] Backend Response:', JSON.stringify(responseData, null, 2));
        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Apple Sign-Up] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token) {
          // Import authService to handle token storage properly
          const authService = await import('./services/authService');
          if (authService.default.isValidToken(token)) {
            await authService.default.setToken(token);
            console.log('[Apple Sign-Up] Token stored successfully');
          } else {
            console.warn('[Apple Sign-Up] Token found but failed validation');
            // For debugging, let's still store it temporarily
            await authService.default.setToken(token);
            console.log('[Apple Sign-Up] Token stored for debugging purposes');
          }
        } else {
          console.warn('[Apple Sign-Up] No token found in response');
          
          // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
          if (user?._id) {
            console.log('[Apple Sign-Up] Using user ID as temporary token:', user._id);
            const authService = await import('./services/authService');
            await authService.default.setToken(user._id);
            console.log('[Apple Sign-Up] User ID stored as temporary token');
          } else {
            throw new Error('No authentication token or user ID received from server');
          }
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Apple Sign-Up] User ID stored:', user._id);
          
          // Store user data in auth service
          try {
            const authService = await import('./services/authService');
            await authService.default.setUserData({
              _id: user._id,
              email: user.email,
              name: user.fullName
            });
            console.log('[Apple Sign-Up] User data stored successfully');
          } catch (error) {
            console.warn('[Apple Sign-Up] Failed to store user data:', error);
          }
        }

        // After successful signup, request notification permission and send FCM token (best-effort)
        try {
          const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
          const granted = await requestUserNotificationPermission();
          if (granted) {
            const token = await getFcmToken();
            if (token) {
              // Get user's timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await authAPI.sendFcmToken(token, timezone);
              console.log('[Apple Sign-Up] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Apple Sign-Up] Skipping FCM token send:', e);
        }

        // Log final result for debugging
        console.log('[Apple Sign-Up] Final result:', { isNewUser, userId: user?._id, userEmail: user?.email, userName: user?.fullName, hasToken: !!token });
        
        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Apple Sign-Up] New user - showing onboarding popup');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Sign-Up] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Apple Sign-Up] Failed to invalidate data cache:', error);
          }
          
          setShowPopup(true);
        } else {
          console.log('[Apple Sign-Up] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Sign-Up] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Apple Sign-Up] Failed to invalidate data cache:', error);
          }
          
          setAppleLoading(false);
          router.replace('/screens/MainTabsScreen');
        }
      } else {
        throw new Error('Apple Sign-In failed - user not authorized');
      }
    } catch (error: any) {
      // Handle Apple authentication specific errors
      if (error.code === appleAuth.Error.CANCELED) {
        // user cancelled the login flow
        setAppleLoading(false);
        return;
      }
      console.error('Apple Sign-In Error:', error);
      alert(error?.message || 'Apple Sign-In failed');
    } finally {
      setAppleLoading(false);
    }
    
    
    

  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      api: '',
    };

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    //  else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
    //   newErrors.password = 'Password must contain at least one uppercase letter and one number';
    //   isValid = false;
    // }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        // Clear any previous user data before starting new signup
        await clearPreviousUserData();
        
        const { fullName, email, password, confirmPassword } = formData;
        // The backend creates the user, which generates the _id, and returns a token.
        const responseData = await authAPI.signup({ fullName, email, password, confirmPassword });

        console.log('[SignUp] API Response:', responseData);

        // Store token if available and validate it
        const token = responseData?.token || responseData?.data?.token;
        if (token) {
          // Import authService to handle token storage properly
          const authService = await import('./services/authService');
          if (authService.default.isValidToken(token)) {
            await authService.default.setToken(token);
            console.log('[SignUp] Token stored successfully');
          } else {
            console.warn('[SignUp] Token found but failed validation');
            // For debugging, let's still store it temporarily
            await authService.default.setToken(token);
            console.log('[SignUp] Token stored for debugging purposes');
          }
        } else {
          console.warn('[SignUp] No token found in response');
        }

        // The user object might be at the root, in `responseData.user`, or in `responseData.data.user`.
        const user = responseData.user || responseData.data?.user || responseData.data;

        if (user?._id) {
          updateData({ _id: user._id });
          console.log(`[SignUp] User ID ${user._id} stored in onboarding context.`);
          
          // Store user data in auth service
          try {
            const authService = await import('./services/authService');
            await authService.default.setUserData({
              _id: user._id,
              email: user.email,
              name: user.fullName
            });
            console.log('[SignUp] User data stored successfully');
          } catch (error) {
            console.warn('[SignUp] Failed to store user data:', error);
          }
          
          // If no token was provided, use user ID as temporary token
          if (!token) {
            try {
              const authService = await import('./services/authService');
              await authService.default.setToken(user._id);
              console.log('[SignUp] User ID stored as temporary token');
            } catch (error) {
              console.warn('[SignUp] Failed to store user ID as token:', error);
            }
          }
        } else {
          console.warn('[SignUp] User ID (_id) not found in signup response.');
        }
        
        // On success, show the popup to continue onboarding
        
        // Clear only data queries to ensure fresh data for the new user
        try {
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          await queryClient.invalidateQueries({ queryKey: ['categories'] });
          await queryClient.invalidateQueries({ queryKey: ['featured'] });
          await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
          console.log('[SignUp] Data cache invalidated successfully');
        } catch (error) {
          console.error('[SignUp] Failed to invalidate data cache:', error);
        }
        
        setShowPopup(true);

      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred. Please try again.';

        // Check for specific error messages to display them under the right field
        if (/(email|user with that email already exists)/i.test(errorMessage)) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else {
          // Fallback for other errors
          setErrors(prev => ({ ...prev, api: errorMessage }));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Background>
              <View style={{ flex: 1 }}>
        {/* Back Button */}
        <BackButton onPress={() => router.back()} style={{ top: SCREEN_HEIGHT * (63 / 812),  position: 'absolute', zIndex: 10 }} />
        {/* Page Title (absolute, like login) */}
        <Text
          style={{
            position: 'absolute',
            top: SCREEN_HEIGHT * (63 / 812),
            left: SCREEN_WIDTH * (110 / 375),
            width: SCREEN_WIDTH * (62 / 375),
            height: SCREEN_HEIGHT * (24 / 812),
            color: '#fff',
            fontWeight: '500',
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.1,
            textAlign: 'center',
            opacity: 1,
            fontFamily: 'Uber Move Text',
          }}
        >
            Sign Up
          </Text>
          <View
            style={{
              flex: 1,
              width: 320,
              marginTop: CONTAINER_TOP,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <KeyboardAwareScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ 
                alignItems: 'center', 
                paddingBottom: Platform.OS === 'ios' ? 100 : 120,
                paddingTop: 20,
                minHeight: '100%'
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraHeight={20}
              extraScrollHeight={20}
            >
              {/* Logo (circular background + image) */}
                        <View
                style={{
                  width: ICON_BG_SIZE,
                  height: ICON_BG_SIZE,
                  borderRadius: ICON_BG_RADIUS,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  opacity: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={require('../assets/images/logo.png')}
                  style={{ width: LOGO_SIZE, height: LOGO_SIZE, opacity: 1 }}
                  resizeMode="contain"
                />
                </View>
              {/* Title + Supporting text */}
              <View
                style={{
                  width: TITLE_CONTAINER_WIDTH,
                  height: TITLE_CONTAINER_HEIGHT,
                  opacity: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 24,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '500',
                    fontSize: 24,
                    lineHeight: 32,
                    letterSpacing: -0.48,
                    textAlign: 'center',
                    fontFamily: 'Uber Move Text',
                    verticalAlign: 'middle',
                    marginBottom: TITLE_CONTAINER_GAP,
                  }}
                >
                  Create Your Account
                </Text>
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    fontSize: 16,
                    lineHeight: 24,
                    textAlign: 'center',
                    fontFamily: 'Uber Move Text',
                    opacity: 0.8,
                  }}
                >
                  It only takes a minute to get started.
                </Text>
          </View>
              {/* Sign Up form and buttons go here */}
              <View style={{ 
                width: 320, 
                marginTop: SCREEN_HEIGHT * (20 / 812),
                paddingBottom: 20
              }}>
                <SocialButton icon={appleIcon} text="Continue with Apple" onPress={onAppleButtonPress} loading={appleLoading} />
                <SocialButton
                  icon={googleIcon}
                  text="Continue with Google"
                  onPress={handleGoogleSignUp}
                  loading={googleLoading}
                />
        {/* OR Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>
                <InputField
                  icon={<Image source={personIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, fullName: text }));
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  customStyle={{ marginBottom: errors.fullName ? 4 : 14 }}
                />
                {errors.fullName ? (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                ) : null}

                <InputField
                  icon={<Image source={emailIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  customStyle={{ marginBottom: errors.email ? 4 : 14 }}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}

                <InputField
                  icon={<Image source={lockIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                  placeholder="Enter Password"
                  value={formData.password}
                  secureTextEntry={!showPassword}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, password: text }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  customStyle={{ marginBottom: errors.password ? 4 : 14 }}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                      <Image
                        source={eyeIcon}
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          opacity: showPassword ? 1 : 0.6,
                        }}
                      />
                    </TouchableOpacity>
                  }
                />
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}

                <InputField
                  icon={<Image source={lockIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, confirmPassword: text }));
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  customStyle={{ marginBottom: errors.confirmPassword ? 4 : 20 }}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                      <Image
                        source={eyeIcon}
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          opacity: showConfirmPassword ? 1 : 0.6,
                        }}
                      />
                    </TouchableOpacity>
                  }
                />
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}

                {errors.api ? (
                  <Text style={styles.apiErrorText}>
                    {errors.api}
                  </Text>
                ) : null}

                <PrimaryButton
                  title="Create Account"
                  onPress={handleSignUp}
                  loading={loading}
                  style={{ marginTop: 0, marginBottom: 0 }}
                />
                {/* Login Link */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text style={{ 
                      color: isDark ? '#2E90FA' : '#fff', // Blue in dark mode, white in light mode
                      fontSize: 14, 
                      fontWeight: 'bold', 
                      marginLeft: 6 
                    }}>Login</Text>
                  </TouchableOpacity>
        </View>
        </View>
              </KeyboardAwareScrollView>
            </View>
            {/* Popup Modal for onboarding */}
            <Modal
              visible={showPopup}
              animationType="slide"
              transparent
              onRequestClose={() => setShowPopup(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                {/* Blur background */}
                <BlurView
                  intensity={Platform.OS === 'ios' ? 60 : 100}
                  tint={Platform.OS === 'ios' ? 'dark' : 'dark'}
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    zIndex: 0,
                  }}
                />
                {/* Optional: semi-transparent overlay for extra dim */}
                <View style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  zIndex: 1,
                }} />
                {/* Modal Card */}
                <View
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT * 0.55,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    overflow: 'hidden',
                    zIndex: 2,
                  }}
                >
                  <Background>
                    <View style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      shadowColor: '#000',
                      shadowOpacity: 0.12,
                      shadowRadius: 24,
                      elevation: 8,
                    }}>
                  {/* User Icon */}
                  <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 56 }}>
                    <Image source={startIcon} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
                  </View>
                  {/* Title */}
                  <View style={{ width: 320, height: 32, opacity: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Uber Move Text',
                        fontWeight: '500',
                        fontStyle: 'normal',
                        fontSize: 24,
                        lineHeight: 32,
                        letterSpacing: -0.48,
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        width: 320,
                        height: 32,
                        opacity: 1,
                      }}
                    >
                      Tell Us About You
                    </Text>
            </View>
                  {/* Description */}
                  <View style={{ width: 320, height: 72, opacity: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Uber Move Text',
                        fontWeight: '400',
                        fontStyle: 'normal',
                        fontSize: 16,
                        lineHeight: 24,
                        letterSpacing: -0.1,
                        textAlign: 'center',
                        width: 320,
                        height: 72,
                        opacity: 1,
                      }}
                    >
                      Answer a few quick questions to help us personalize your experience and match you with the best opportunities.
            </Text>
                  </View>
                  {/* Button */}
                  <PrimaryButton
                    title="Let's Start"
                    onPress={() => {
                      setShowPopup(false);
                      router.replace('/OpportunityType');
                    }}
                    style={{
                      borderRadius: 16,
                      height: SCREEN_HEIGHT * (54 / 812),
                      width: 320,
                      alignSelf: 'center',
                      marginBottom: 32
                    }}
                  />
                    </View>
                  </Background>
                </View>
              </View>
            </Modal>
        </View>
      </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161622',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Uber Move Text',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Uber Move Text',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'center',
  },
  line: {
    height: 1,
    width: 100,
    borderRadius: 1,
    backgroundColor: '#E4E4E5',
  },
  orText: {
    marginHorizontal: 12,
    color: '#FFFFFF',
    fontFamily: 'Uber Move Text',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -2,
    marginBottom: 10,
    marginLeft: 4,
  },
  apiErrorText: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
});