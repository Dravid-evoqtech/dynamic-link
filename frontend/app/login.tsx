import React, { useState, useEffect, use } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import Background from './components/Background';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import SocialButton from './components/SocialButton';
import InputField from './components/InputField';
// import ForgotPasswordModal from './components/ForgotPasswordModal';
import appleLogo from '../assets/images/Applelogo.png';
import googleLogo from '../assets/images/googlelogo.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import emailIcon from '@/assets/images/icons/email.png';
import passwordIcon from '@/assets/images/icons/password.png';
import lockIcon from '@/assets/images/icons/lock.png';
import { wp, hp } from './utils/dimensions';
import { authAPI } from './services/api';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTheme } from '../hooks/useThemeContext';
import { ENV } from './config/environment';
import authService from './services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed GoogleAuth unified and FCM utils
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
// Import appleAuth directly to avoid AppleButton import issues
import AppleAuthModule from '@invertase/react-native-apple-authentication/lib/AppleAuthModule';
import { NativeModules } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

const { RNAppleAuthModule } = NativeModules;
const appleAuth = new AppleAuthModule(RNAppleAuthModule);


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARROW_SIZE = SCREEN_WIDTH * (26.6 / 375);
const ARROW_TOP = SCREEN_HEIGHT * (63 / 812);
const ARROW_LEFT = SCREEN_WIDTH * (27 / 375);
const LOGIN_TOP = SCREEN_HEIGHT * (63 / 812);
const LOGIN_LEFT = SCREEN_WIDTH * (169 / 375);
const LOGIN_WIDTH = SCREEN_WIDTH * (42 / 375);
const LOGIN_HEIGHT = SCREEN_HEIGHT * (24 / 812);
const CONTAINER_WIDTH = SCREEN_WIDTH * (320 / 375);
const CONTAINER_HEIGHT = SCREEN_HEIGHT * (648 / 812);
const CONTAINER_TOP = SCREEN_HEIGHT * (124 / 812);
const CONTAINER_LEFT = SCREEN_WIDTH * (27 / 375);
const ICON_BG_SIZE = SCREEN_WIDTH * (83.73 / 375);
const ICON_BG_RADIUS = SCREEN_WIDTH * (59.66 / 375);
const ICON_BG_TOP = SCREEN_HEIGHT * (8.16 / 812);
const LOGO_SIZE = SCREEN_WIDTH * (100 / 375);
const TITLE_CONTAINER_WIDTH = SCREEN_WIDTH * (320 / 375);
const TITLE_CONTAINER_HEIGHT = SCREEN_HEIGHT * (64 / 812);
const TITLE_CONTAINER_GAP = SCREEN_HEIGHT * (8 / 812);
const INPUT_WIDTH = SCREEN_WIDTH * (320 / 375);
const INPUT_HEIGHT = SCREEN_HEIGHT * (56 / 812);
const INPUT_RADIUS = 16;
const INPUT_ICON_SIZE = 22;
const LOGIN_BTN_HEIGHT = SCREEN_HEIGHT * (54 / 812);
const LOGIN_BTN_RADIUS = 16;
const DIVIDER_WIDTH = SCREEN_WIDTH * (120 / 375);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default function Login() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { updateData, clearData } = useOnboarding();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState('local');
  const [errors, setErrors] = useState({
    api: '',
    email: '',
    password: '',
  });
  // const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Function to clear all previous user data when starting a new login
  const clearPreviousUserData = async () => {
    try {
      console.log('[Login] Clearing previous user data...');
      
      // Clear onboarding context data
      clearData();
      
      // Clear auth service data
      await authService.logout();
      
      console.log('[Login] Previous user data cleared successfully');
    } catch (error) {
      console.warn('[Login] Failed to clear some previous user data:', error);
    }
  };

  // Removed unified Google Sign-In configuration

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', api: '' };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      setLoading(true);
      setErrors({ email: '', password: '', api: '' }); // Clear previous errors
      try {
        const responseData = await authAPI.login(email, password, provider);
        console.log('[Login] API Response:', responseData);
        console.log('[Login] Response type:', typeof responseData);
        
        // Safe way to log response keys
        if (responseData && typeof responseData === 'object') {
          console.log('[Login] Response keys:', Object.keys(responseData));
          console.log('[Login] Full response object:', JSON.stringify(responseData, null, 2));
        } else {
          console.log('[Login] Response data:', responseData);
        }

        if (responseData) {
          // Extract token from response - check multiple possible locations
          let token = null;
          if (responseData.token) {
            token = responseData.token;
          } else if (responseData.data?.token) {
            token = responseData.data.token;
          } else if (responseData.data?.user?.token) {
            token = responseData.data.user.token;
          } else if (responseData.data?.user?.accessToken) {
            token = responseData.data.user.accessToken;
          } else if (responseData.user?.token) {
            token = responseData.user.token;
          } else if (responseData.user?.accessToken) {
            token = responseData.user.accessToken;
          }
          
          if (token) {
            console.log('[Login] Token found:', token);
            console.log('[Login] Token length:', token.length);
            console.log('[Login] Token validation result:', authService.isValidToken(token));
            
            if (authService.isValidToken(token)) {
              await authService.setToken(token);
              console.log('[Login] User token stored successfully');
            } else {
              console.warn('[Login] Token found but failed validation');
              // For debugging, let's still store it temporarily
              await authService.setToken(token);
              console.log('[Login] Token stored for debugging purposes');
            }
          } else {
            console.warn('[Login] No token found in response. Available fields:', responseData ? Object.keys(responseData) : 'No response data');
            if (responseData?.data) {
              console.warn('[Login] Data fields:', Object.keys(responseData.data));
              if (responseData.data.user) {
                console.warn('[Login] User fields:', Object.keys(responseData.data.user));
                console.warn('[Login] User object:', responseData.data.user);
              }
            }
            
            // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
            const user = responseData.user || responseData.data?.user || responseData.data;
            if (user?._id) {
              console.log('[Login] Using user ID as temporary token:', user._id);
              await authService.setToken(user._id);
              console.log('[Login] User ID stored as temporary token');
              
              // Verify token was stored
              const storedToken = await authService.getToken();
              console.log('[Login] Token verification - stored token:', storedToken);
              console.log('[Login] Token verification - matches:', storedToken === user._id);
            } else {
              throw new Error('No authentication token or user ID received from server');
            }
          }

          // The user object might be at the root, in `responseData.user`, or in `responseData.data.user`.
          const user = responseData.user || responseData.data?.user || responseData.data;

          if (user?._id) {
            updateData({ _id: user._id });
            console.log(`[Login] User ID ${user._id} stored in onboarding context.`);
            
            // Store user data in auth service
            try {
              await authService.setUserData({
                _id: user._id,
                email: user.email,
                name: user.fullName
              });
              console.log('[Login] User data stored successfully');
            } catch (error) {
              console.warn('[Login] Failed to store user data:', error);
            }
          } else {
            console.warn('[Login] User ID (_id) not found in login response.');
          }

          // After successful login, request notification permission and send token (best-effort)
          try {
            const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
            const granted = await requestUserNotificationPermission();
            if (granted) {
              const token = await getFcmToken();
              if (token) {
                // Get user's timezone
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                await authAPI.sendFcmToken(token, timezone);
                console.log('[Login] FCM token sent with timezone:', timezone);
              }
            }
          } catch (e) {
            console.warn('[Login] Skipping FCM token send:', e);
          }

          console.log('User logged in successfully. Token stored.');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Login] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Login] Failed to invalidate data cache:', error);
          }
          
          router.replace('/screens/MainTabsScreen');
        } else {
          // This case handles if the API responds 200 OK but without a token.
          console.error('[Login] No response data received');
          throw new Error('Login succeeded, but no authentication token was provided. Please check your backend configuration.');
        }
      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred. Please try again.';

        // Try to assign the error to a specific field for better user feedback.
        // Note: For security, many APIs return a generic "Invalid credentials" message
        // to avoid confirming if an email is registered.
        if (/(password|credential)/i.test(errorMessage)) {
          setErrors(prev => ({ ...prev, password: errorMessage }));
        } else if (/(email|user)/i.test(errorMessage)) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else {
          // Fallback to a generic API error if it's not about email or password
          setErrors(prev => ({ ...prev, api: errorMessage }));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Removed unified Google Sign-In handler

  const onAppleButtonPress = async () => {
    if (appleLoading) return;
    
    setAppleLoading(true);
    try {
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
      console.log('[Apple Login] Complete Apple Response:', JSON.stringify(appleAuthRequestResponse, null, 2));

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
          console.log('[Apple Sign-In] Full name provided:', nameToSend);
        } else {
          console.log('[Apple Sign-In] No full name provided (subsequent login)');
          // For subsequent logins, we'll let the backend handle this
          // The backend should either use existing user data or prompt for name
        }
        
        console.log('[Apple Sign-In] Sending to API:', { 
          code: appleAuthRequestResponse.authorizationCode ? 'present' : 'missing', 
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
        
        console.log('[Apple Login] Backend Response:', JSON.stringify(responseData, null, 2));
        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Apple Sign-In] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token) {
          await AsyncStorage.setItem('userToken', token);
          console.log('[Apple Sign-In] Token stored successfully');
        } else {
          console.warn('[Apple Sign-In] No token found in response');
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Apple Sign-In] User ID stored:', user._id);
        }

        // After successful login, request notification permission and send FCM token (best-effort)
        try {
          const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
          const granted = await requestUserNotificationPermission();
          if (granted) {
            const token = await getFcmToken();
            if (token) {
              // Get user's timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await authAPI.sendFcmToken(token, timezone);
              console.log('[Apple Sign-In] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Apple Sign-In] Skipping FCM token send:', e);
        }

        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Apple Sign-In] New user - redirecting to onboarding');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Sign-In] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Apple Sign-In] Failed to invalidate data cache:', error);
          }
          
          setAppleLoading(false);
          router.replace('/OpportunityType');
        } else {
          console.log('[Apple Sign-In] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Sign-In] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Apple Sign-In] Failed to invalidate data cache:', error);
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

  const handleGoogleSignin = async () => {
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      console.log('[Google Sign-In] Starting Google authentication...');
      
      // Force Google account picker by signing out first
      try {
        await GoogleSignin.signOut();
        console.log('[Google Sign-In] Google Sign-in state cleared');
      } catch (signOutError) {
        console.warn('[Google Sign-In] Failed to clear Google Sign-in state:', signOutError);
      }
      
      await GoogleSignin.hasPlayServices();
      console.log('[Google Sign-In] Play Services check passed');
      
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'success') {
        console.log('[Google Sign-In] User signed in:', userInfo.data.user.email);
      }
      
      const tokens = await GoogleSignin.getTokens();
      console.log('[Google Sign-In] Tokens retrieved:', !!tokens);
      
      const idToken = tokens?.idToken;
      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }
      console.log('[Google Sign-In] ID token obtained, calling API...');
      
      // Use the googleSignup method from your API (it handles both signup and login)
      try {
        const responseData = await authAPI.googleSignup({ idToken });
        console.log('[Google Sign-In] API response received:', responseData);
        
        if (!responseData) {
          throw new Error('No response data received from API');
        }
        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Google Sign-In] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token && authService.isValidToken(token)) {
          await authService.setToken(token);
          console.log('[Google Sign-In] Token stored successfully');
        } else {
          console.warn('[Google Sign-In] No valid token found in response');
          
          // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
          const user = responseData?.data?.user;
          if (user?._id) {
            console.log('[Google Sign-In] Using user ID as temporary token:', user._id);
            await authService.setToken(user._id);
            console.log('[Google Sign-In] User ID stored as temporary token');
          } else {
            throw new Error('No authentication token or user ID received from server');
          }
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Google Sign-In] User ID stored:', user._id);
        }

        // After successful login, request notification permission and send FCM token (best-effort)
        try {
          const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
          const granted = await requestUserNotificationPermission();
          if (granted) {
            const token = await getFcmToken();
            if (token) {
              // Get user's timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await authAPI.sendFcmToken(token, timezone);
              console.log('[Google Sign-In] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Google Sign-In] Skipping FCM token send:', e);
        }

        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Google Sign-In] New user - redirecting to onboarding');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Google Sign-In] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Google Sign-In] Failed to invalidate data cache:', error);
          }
          
          router.replace('/OpportunityType');
        } else {
          console.log('[Google Sign-In] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Google Sign-In] Data cache invalidated successfully');
          } catch (error) {
            console.error('[Google Sign-In] Failed to invalidate data cache:', error);
          }
          
          router.replace('/screens/MainTabsScreen');
        }
      } catch (apiError: any) {
        console.error('[Google Sign-In] API call failed:', apiError);
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
  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      webClientId: ENV.GOOGLE.WEB_CLIENT_ID,
      iosClientId: ENV.GOOGLE.IOS_CLIENT_ID,
    });
  }, []);

  // Clear any previous user data when component mounts
  useEffect(() => {
    clearPreviousUserData();
  }, []);
  return (
    
      <Background>
        <BackButton onPress={() => router.back()} style={{ top: ARROW_TOP, left: ARROW_LEFT, position: 'absolute', zIndex: 10 }} />
        <Text
          style={{
            position: 'absolute',
            top: LOGIN_TOP,
            left: LOGIN_LEFT,
            width: LOGIN_WIDTH,
            height: LOGIN_HEIGHT,
            color: '#fff',
            fontWeight: '500',
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.1,
            textAlign: 'center',
            opacity: 1,
            fontFamily: 'Uber Move Text', // Use if available
          }}
        >
          Login
        </Text>
        <View
          style={{
            flex: 1,
            width: 320,
            height: 648,
            top: CONTAINER_TOP,
            position: 'absolute', // ensures top is respected
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: CONTAINER_WIDTH,
              alignItems: 'center',
            }}
          >
            {/* Logo (circular background + image) */}
            <View
              style={{
                width: ICON_BG_SIZE,
                height: ICON_BG_SIZE,
                borderRadius: ICON_BG_RADIUS,
                backgroundColor: 'rgba(255,255,255,0.10)', // placeholder, update if you have a Figma color
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
                marginTop: SCREEN_HEIGHT * (16 / 812), // Add vertical space between logo and title
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '500',
                  fontSize: 24,
                  lineHeight: 32,
                  letterSpacing: -0.48, // -2% of 24px
                  textAlign: 'center',
                  fontFamily: 'Uber Move Text', // Use if available
                  verticalAlign: 'middle',
                  marginBottom: TITLE_CONTAINER_GAP,
                }}
              >
                Log In to Your Account
              </Text>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '400',
                  fontSize: 16,
                  lineHeight: 24,
                  letterSpacing: -0.1,
                  textAlign: 'center',
                  fontFamily: 'Uber Move Text', // Use if available
                  opacity: 0.8,
                }}
              >
                Welcome back! Let’s continue your journey.
              </Text>
            </View>
            {/* Login form */}
            <View style={{ width: 320, marginTop: SCREEN_HEIGHT * (24 / 812) }}>
              {/* Email Input */}
              <InputField
                icon={<Image source={emailIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                customStyle={{ marginBottom: SCREEN_HEIGHT * (12 / 812) }}
              />
              {errors.email ? (
                <Text style={{
                  color: '#FF6B6B',
                  fontSize: 12,
                  marginTop: -8,
                  marginBottom: 8,
                  marginLeft: 4
                }}>
                  {errors.email}
                </Text>
              ) : null}

              {/* Password Input */}
              <InputField
                icon={<Image source={lockIcon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                customStyle={{ marginBottom: SCREEN_HEIGHT * (8 / 812) }}
                inputStyle={{ width: 236 }}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <Image
                      source={passwordIcon}
                      style={{
                        width: 18.03,
                        height: 15,
                        resizeMode: 'contain',
                        opacity: showPassword ? 1 : 0.6,
                      }}
                    />
                  </TouchableOpacity>
                }
              />
              {errors.password ? (
                <Text style={{
                  color: '#FF6B6B',
                  fontSize: 12,
                  marginTop: -4,
                  marginBottom: 8,
                  marginLeft: 4
                }}>
                  {errors.password}
                </Text>
              ) : null}

              {errors.api ? (
                <Text style={{
                  color: '#FF6B6B',
                  fontSize: 12,
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  {errors.api}
                </Text>
              ) : null}

              {/* Forgot Password */}
              <TouchableOpacity 
                style={{ alignSelf: 'center', marginBottom: SCREEN_HEIGHT * (16 / 812), marginTop: 14 }}
                onPress={() => router.push('/ForgotPasswordScreen')}
              >
                <Text style={{ 
                  color: isDark ? '#2E90FA' : '#FFFFFF', // Blue in dark mode, white in light mode
                  opacity: 0.6, 
                  fontSize: 15, 
                  fontFamily: 'Uber Move Text' 
                }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              {/* login Button */}
              <PrimaryButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                style={{ borderRadius: LOGIN_BTN_RADIUS, height: LOGIN_BTN_HEIGHT, width: 320 }}
              />
              {/* Divider with OR */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: hp(14)  }}>
                <View style={{ width: wp(100), height: 1, backgroundColor: '#fff', opacity: 0.8, marginRight: 12}} />
                <Text style={{ color: '#fff', opacity: 0.7, fontSize: 15, fontFamily: 'Uber Move Text' }}>OR</Text>
                <View style={{ width: wp(100), height: 1, backgroundColor: '#fff', opacity: 0.8, marginLeft: 12 }} />
              </View>
            </View>
            {/* Social login buttons */}
            <SocialButton
              icon={appleLogo}
              text="Continue with Apple"
              onPress={onAppleButtonPress}
              loading={appleLoading}
            />
            <SocialButton 
              icon={googleLogo} 
              text="Continue with Google"
              onPress={handleGoogleSignin}
              loading={googleLoading}
            />
            {/* Sign up prompt */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
              <Text style={{
                color: '#fff',
                opacity: 0.7,
                fontSize: 16,
                fontFamily: 'Uber Move Text',
                fontWeight: '500',
                fontStyle: 'normal',
                lineHeight: 24,
                letterSpacing: -0.1,
              }}>Don’t have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/SignUp')}>
                <Text style={{
                  color: isDark ? '#2E90FA' : '#fff', // Blue in dark mode, white in light mode
                  fontSize: 16,
                  fontFamily: 'Uber Move Text',
                  fontWeight: '500',
                  fontStyle: 'normal',
                  lineHeight: 24,
                  letterSpacing: -0.1,
                  marginLeft: 8
                }}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* ForgotPasswordModal removed - now using dedicated screen */}
      </Background>
   
  );
}