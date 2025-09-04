import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import appleLogo from "../assets/images/Applelogo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import googleLogo from "../assets/images/googlelogo.png";
import Background from "./components/Background";
import WidgetCard from "./components/Cards/WidgetCard";
import NotificationCard from "./components/Cards/NotificationCard";
import StreakCard from "./components/Cards/StreakCard";
import PrimaryButton from "./components/PrimaryButton";
import SocialButton from "./components/SocialButton";
import { hp, wp } from "./utils/dimensions";
// Removed GoogleAuth unified usage
import { useOnboarding } from "../contexts/OnboardingContext";
import { authAPI } from "./services/api";
import { ENV } from "./config/environment";
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useQueryClient } from '@tanstack/react-query';

// Import appleAuth directly to avoid AppleButton import issues
import AppleAuthModule from '@invertase/react-native-apple-authentication/lib/AppleAuthModule';
import { NativeModules } from 'react-native';

const { RNAppleAuthModule } = NativeModules;
const appleAuth = new AppleAuthModule(RNAppleAuthModule);


const PROGRESS_BAR_WIDTH = wp(320);
const BAR_WIDTH = wp(72);
const GAP = wp(8);

const ProgressBar = () => (
  <View style={styles.progressBarRow}>
    <View style={[styles.progressBarLine, { opacity: 1, marginRight: GAP }]} />
    <View
      style={[styles.progressBarLine, { opacity: 0.4, marginRight: GAP }]}
    />
    <View
      style={[styles.progressBarLine, { opacity: 0.4, marginRight: GAP }]}
    />
    <View style={[styles.progressBarLine, { opacity: 0.4 }]} />
  </View>
);

export default function Onboarding() {
  const router = useRouter();
  const { updateData, clearData } = useOnboarding();
  const queryClient = useQueryClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Function to clear all previous user data when starting a new signup
  const clearPreviousUserData = async () => {
    try {
      console.log('[Onboarding] Clearing previous user data...');
      
      // Clear onboarding context data
      clearData();
      
      // Clear auth service data
      const authService = await import('./services/authService');
      await authService.default.logout();
      
      console.log('[Onboarding] Previous user data cleared successfully');
    } catch (error) {
      console.warn('[Onboarding] Failed to clear some previous user data:', error);
    }
  };

  const onGoogleSignPress = async () => {
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      
      // Clear any previous user data before starting new signup
      await clearPreviousUserData();
      
      console.log('[Onboarding] Starting Google authentication...');
      
      // Force Google account picker by signing out first
      try {
        await GoogleSignin.signOut();
        console.log('[Onboarding] Google Sign-in state cleared');
      } catch (signOutError) {
        console.warn('[Onboarding] Failed to clear Google Sign-in state:', signOutError);
      }
      
      await GoogleSignin.hasPlayServices();
      console.log('[Onboarding] Play Services check passed');
      
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'success') {
        console.log('[Onboarding] User signed in:', userInfo.data.user.email);
      }
      
      const tokens = await GoogleSignin.getTokens();
      console.log('[Onboarding] Tokens retrieved:', !!tokens);
      
      const idToken = tokens?.idToken;
      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }
      console.log('[Onboarding] ID token obtained, calling API...');
      
      // Use the googleSignup method from your API (it handles both signup and login)
      try {
        const responseData = await authAPI.googleSignup({ idToken });
        console.log('[Onboarding] API response received:', responseData);
        
        if (!responseData) {
          throw new Error('No response data received from API');
        }
        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Onboarding] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token) {
          // Import authService to handle token storage properly
          const authService = await import('./services/authService');
          if (authService.default.isValidToken(token)) {
            await authService.default.setToken(token);
            console.log('[Onboarding] Token stored successfully');
          } else {
            console.warn('[Onboarding] No valid token found in response');
            
            // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
            if (user?._id) {
              console.log('[Onboarding] Using user ID as temporary token:', user._id);
              await authService.default.setToken(user._id);
              console.log('[Onboarding] User ID stored as temporary token');
            } else {
              throw new Error('No authentication token or user ID received from server');
            }
          }
        } else {
          console.warn('[Onboarding] No token found in response');
          
          // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
          if (user?._id) {
            console.log('[Onboarding] Using user ID as temporary token:', user._id);
            const authService = await import('./services/authService');
            await authService.default.setToken(user._id);
            console.log('[Onboarding] User ID stored as temporary token');
          } else {
            throw new Error('No authentication token or user ID received from server');
          }
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Onboarding] User ID stored:', user._id);
          
          // Store user data in auth service
          try {
            const authService = await import('./services/authService');
            await authService.default.setUserData({
              _id: user._id,
              email: user.email,
              name: user.fullName
            });
            console.log('[Onboarding] User data stored successfully');
          } catch (error) {
            console.warn('[Onboarding] Failed to store user data:', error);
          }
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
              console.log('[Onboarding] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Onboarding] Skipping FCM token send:', e);
        }

        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Onboarding] New user - continuing with onboarding');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Onboarding] Data cache invalidated successfully for new user');
          } catch (error) {
            console.error('[Onboarding] Failed to invalidate data cache:', error);
          }
          
          router.push('/OpportunityType');
        } else {
          console.log('[Onboarding] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Onboarding] Data cache invalidated successfully for existing user');
          } catch (error) {
            console.error('[Onboarding] Failed to invalidate data cache:', error);
          }
          
          router.replace('/screens/MainTabsScreen');
        }
      } catch (apiError: any) {
        console.error('[Onboarding] API call failed:', apiError);
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
    // Configure Google Sign-In
    useEffect(() => {
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE.WEB_CLIENT_ID,
        iosClientId: ENV.GOOGLE.IOS_CLIENT_ID,
      });
    }, []);

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
        } else {
          // For subsequent logins, we'll let the backend handle this
          // The backend should either use existing user data or prompt for name
        }
        
        const apiPayload = { 
          code: appleAuthRequestResponse.authorizationCode, // Send authorizationCode as 'code' to match backend API
          fullName: nameToSend
        };
        
        const responseData = await authAPI.appleSignup(apiPayload);
        
        if (!responseData) {
          throw new Error('No response data received from API');
        }
        

        
        // Check if user is new or existing
        const isNewUser = responseData?.data?.isNewUser;
        const user = responseData?.data?.user;
        
        console.log('[Apple Onboarding] User status:', { isNewUser, user });
        
        const token = responseData?.data?.token;
        if (token) {
          // Import authService to handle token storage properly
          const authService = await import('./services/authService');
          if (authService.default.isValidToken(token)) {
            await authService.default.setToken(token);
            console.log('[Apple Onboarding] Token stored successfully');
          } else {
            console.warn('[Apple Onboarding] Token found but failed validation');
            // For debugging, let's still store it temporarily
            await authService.default.setToken(token);
            console.log('[Apple Onboarding] Token stored for debugging purposes');
          }
        } else {
          console.warn('[Apple Onboarding] No token found in response');
          
          // TEMPORARY FIX: Use user ID as token since backend doesn't provide token
          if (user?._id) {
            console.log('[Apple Onboarding] Using user ID as temporary token:', user._id);
            const authService = await import('./services/authService');
            await authService.default.setToken(user._id);
            console.log('[Apple Onboarding] User ID stored as temporary token');
          } else {
            throw new Error('No authentication token or user ID received from server');
          }
        }
        
        if (user?._id) {
          updateData({ _id: user._id });
          console.log('[Apple Onboarding] User ID stored:', user._id);
          
          // Store user data in auth service
          try {
            const authService = await import('./services/authService');
            await authService.default.setUserData({
              _id: user._id,
              email: user.email,
              name: user.fullName
            });
            console.log('[Apple Onboarding] User data stored successfully');
          } catch (error) {
            console.warn('[Apple Onboarding] Failed to store user data:', error);
          }
        }

        // After successful Apple sign-in during onboarding, request permission and send FCM token (best-effort)
        try {
          const { requestUserNotificationPermission, getFcmToken } = await import('./services/notifications');
          const granted = await requestUserNotificationPermission();
          if (granted) {
            const token = await getFcmToken();
            if (token) {
              // Get user's timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await authAPI.sendFcmToken(token, timezone);
              console.log('[Apple Onboarding] FCM token sent with timezone:', timezone);
            }
          }
        } catch (e) {
          console.warn('[Apple Onboarding] Skipping FCM token send:', e);
        }


        
        // Route based on whether user is new or existing
        if (isNewUser) {
          console.log('[Apple Onboarding] New user - continuing with onboarding');
          
          // Clear only data queries to ensure fresh data for the new user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Onboarding] Data cache invalidated successfully for new user');
          } catch (error) {
            console.error('[Apple Onboarding] Failed to invalidate data cache:', error);
          }
          
          setAppleLoading(false);
          router.push('/OpportunityType');
        } else {
          console.log('[Apple Onboarding] Existing user - redirecting to main app');
          
          // Clear only data queries to ensure fresh data for the existing user
          try {
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({ queryKey: ['featured'] });
            await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
            console.log('[Apple Onboarding] Data cache invalidated successfully for existing user');
          } catch (error) {
            console.error('[Apple Onboarding] Failed to invalidate data cache:', error);
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

  return (
    
    <Background>
      

        {/* Progress Bar */}
        <View
          style={{
            width: wp(320),
            height: "auto",
            opacity: 1,
            position: "absolute",
            top: hp(70),
            gap: 8,
          }}
        >
          <ProgressBar />
        </View>
        {/* Top Section: cards, avatars, notification */}
        <View
          style={{
            width: wp(337.54),
            height: hp(220.14),
            opacity: 1,
            position: "absolute",
            top: hp(145),
          }}
        >
          {/* Cards Row */}
          <View style={{ flexDirection: "row" }}>
            <WidgetCard />
            <StreakCard />
          </View>
          {/* Avatars Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              zIndex: 2,
              left: wp(123.4),
              top: -hp(20),
            }}
          >
            <Image
              source={require("../assets/images/avatars4.png")}
              style={{ width: wp(32), height: hp(32), borderRadius: wp(16), marginLeft: 0 }}
            />
            <Image
              source={require("../assets/images/avatars3.png")}
              style={{
                width: wp(32),
                height: hp(32),
                borderRadius: wp(16),
                marginLeft: -wp(16),
              }}
            />
            <Image
              source={require("../assets/images/avatars1.png")}
              style={{
                width: wp(32),
                height: hp(32),
                borderRadius: wp(16),
                marginLeft: -wp(16),
              }}
            />
            <Image
              source={require("../assets/images/avatars2.png")}
              style={{
                width: wp(32),
                height: hp(32),
                borderRadius: wp(16),
                marginLeft: -wp(16),
              }}
            />
          </View>
          {/* Notification */}
          <NotificationCard
            style={{
              width: wp(258),
              height: hp(58.18),
              borderRadius: wp(14),
              zIndex: 3,
            }}
          />
        </View>

        {/* Main Content */}
        <View
          style={{
            width: wp(320),
            height: hp(404),
            opacity: 1,
            marginTop: hp(400), // Use marginTop instead of absolute top
            position: "relative",
          }}
        >
          {/* Welcome content */}
          <View
            style={{ width: wp(320), height: hp(100), opacity: 1, marginBottom: 4 }}
          >
            <Text
              style={{
                fontFamily: "Inter-Medium",
                fontWeight: "500",
                fontSize: 22,
                color: "#fff",
                letterSpacing: 0,
              }}
            >
              Welcome to FutureFind.
            </Text>
            <Text
              style={{
                fontFamily: "Inter-Medium",
                fontWeight: "500",
                fontSize: 22,
                color: "#fff",
                letterSpacing: 0,
              }}
            >
              Elevate your productivity
            </Text>
            <Text
              style={{
                fontFamily: "Inter-Medium",
                fontWeight: "500",
                fontSize: 22,
                color: "#fff",
                letterSpacing: 0,
              }}
            >
              and concentration.
            </Text>
          </View>
          {/* Buttons */}
          <View
            style={{
              width: wp(320),
              height: hp(186),
              opacity: 1,
              justifyContent: "center",
              top: hp(24),
            }}
          >
            <PrimaryButton
              title="Continue with Email"
              onPress={() => router.push("/login")}
              style={{ width: 320 }}
            />
            <SocialButton icon={appleLogo} text="Continue with Apple" onPress={onAppleButtonPress} loading={appleLoading} />
            <SocialButton
              icon={googleLogo}
              text="Continue with Google"
              onPress={onGoogleSignPress}
              loading={googleLoading}
            />
          </View>
          {/* Terms and Privacy - Bottom */}
          <View
            style={{
              width: wp(320),
              height: hp(186),
              opacity: 1,
              justifyContent: "center",
              top: hp(24),
            }}
          >
          <Text style={styles.termsText}>
            By Continuing you acknowledge that you have read and understood, and
            agree to FutureFind's <Text style={styles.link}>Terms & </Text>
            <Text style={styles.link}>Conditions</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
        </View>
      
    </Background>
   
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: "flex-start",
    width: "100%",
    paddingTop: 330,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
    marginTop: 0,
  },
  welcomeSubtitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
    marginTop: 0,
  },
  termsText: {
    width: wp(320),
    height: hp(54),
    color: "#F4F4F4",
    fontFamily: "Uber Move Text",
    fontWeight: "400",
    fontStyle: "normal",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    textAlign: "center",
    alignSelf: "center",
    position: "absolute",
    top: hp(8),
    left: 0,
    opacity: 1,
  },
  link: {
    color: "#fff",
    opacity: 1,
  },
  rowContainer: {
    position: "absolute",
    width: wp(320),
    height: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  progressBarRow: {
    position: "absolute",
    width: PROGRESS_BAR_WIDTH,
    height: "auto",
    top: hp(0),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    opacity: 1,
  },
  progressBarLine: {
    width: BAR_WIDTH,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: "#fff",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  // Keep firstLeftCard only if used elsewhere
});