import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useThemeContext';
import { authAPI } from './services/api';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import { useRouter } from 'expo-router';
import { wp, hp } from './utils/dimensions';
import { useStandardizedAlert } from './hooks/useStandardizedAlert';

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
const CONTAINER_TOP = SCREEN_HEIGHT * (10 / 812);
const CONTAINER_LEFT = SCREEN_WIDTH * (27 / 375);
const ICON_BG_SIZE = SCREEN_WIDTH * (83.73 / 375);
const ICON_BG_RADIUS = SCREEN_WIDTH * (59.66 / 375);
const ICON_BG_TOP = SCREEN_HEIGHT * (0.05 / 812);
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

type Step = 'email' | 'otp' | 'password';

const ForgotPasswordScreen: React.FC = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('email');
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request password reset
  const handleRequestReset = async () => {
    if (!email.trim()) {
      showError('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email.trim());
      console.log('Password reset requested:', response);
      
      // Move to OTP step
      setCurrentStep('otp');
      showInfo(
        'OTP Sent', 
        'A 6-digit OTP has been sent to your email address. Please check your inbox and enter the code below.'
      );
    } catch (error: any) {
      console.error('Failed to request password reset:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error?.status === 404) {
        errorMessage = 'Email address not found. Please check your email or sign up for a new account.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showError('Error', 'Please enter the OTP sent to your email');
      return;
    }

    if (otp.trim().length !== 6) {
      showError('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.verifyOTP(otp.trim(), email.trim());
      console.log('OTP verified:', response);
      
      // Move to password step
      setCurrentStep('password');
      showSuccess(
        'OTP Verified', 
        'OTP verified successfully! Now please enter your new password.'
      );
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (error?.status === 400) {
        errorMessage = 'Invalid OTP. Please check the code and try again.';
      } else if (error?.status === 401) {
        errorMessage = 'OTP expired. Please request a new one.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showError('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.trim().length < 6) {
      showError('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting password reset API call...');
      const response = await authAPI.resetPassword(otp.trim(), email.trim(), newPassword.trim(), confirmPassword.trim());
      console.log('Password reset API call completed successfully:', response);
      
      // Log the response structure to verify it includes confirmPassword
      if (response?.data) {
        console.log('Response data:', response.data);
        console.log('OTP:', response.data.otp);
        console.log('Email:', response.data.email);
        console.log('New Password:', response.data.newPassword);
        console.log('Confirm Password:', response.data.confirmPassword);
      }
      
      showSuccess(
        'Success', 
        'Your password has been reset successfully! You can now log in with your new password.',
        () => {
          // Navigate back to login
          console.log('✅ Success Alert OK button pressed');
          console.log('🚀 Attempting to navigate to onboarding/login...');
          
          // Use setTimeout to ensure Alert is dismissed before navigation
          setTimeout(() => {
            console.log('⏰ Timeout completed, attempting navigation...');
            try {
              // Try to navigate to onboarding (which contains login)
              console.log('📍 Navigating to /onboarding...');
              router.push('/onboarding');
              console.log('✅ Successfully navigated to onboarding/login screen');
            } catch (error) {
              console.log('❌ Navigation to /onboarding failed:', error);
              // Fallback: try to go back
              try {
                console.log('🔄 Trying router.back() as fallback...');
                router.back();
                console.log('✅ Successfully went back to previous screen');
              } catch (backError) {
                console.log('❌ Back navigation also failed:', backError);
                // If all else fails, show a message to user
                showError('Navigation Error', 'Please manually navigate back to the login screen.');
              }
            }
          }, 300); // Slightly longer delay to ensure Alert is fully dismissed
        }
      );
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error?.status === 400) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error?.status === 401) {
        errorMessage = 'OTP expired or invalid. Please start over.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
      setOtp('');
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      router.back();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email':
        return 'Reset Your Password';
      case 'otp':
        return 'Enter OTP';
      case 'password':
        return 'Set New Password';
      default:
        return 'Reset Your Password';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email':
        return 'Enter your email address and we\'ll send you a 6-digit OTP to reset your password.';
      case 'otp':
        return 'Enter the 6-digit OTP sent to your email address.';
      case 'password':
        return 'Enter your new password. Make sure it\'s secure and easy to remember.';
      default:
        return 'Enter your email address and we\'ll send you instructions to reset your password.';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <InputField
              icon={<Image source={require('../assets/images/icons/email.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text: string) => setEmail(text)}
              customStyle={{ marginBottom: SCREEN_HEIGHT * (16 / 812) }}
            />
            <PrimaryButton
              title={loading ? "Sending..." : "Send OTP"}
              onPress={handleRequestReset}
              loading={loading}
              style={{ 
                borderRadius: LOGIN_BTN_RADIUS, 
                height: LOGIN_BTN_HEIGHT, 
                width: 320,
                marginBottom: SCREEN_HEIGHT * (20 / 812)
              }}
              disabled={loading || !email.trim()}
            />
          </>
        );

      case 'otp':
        return (
          <>
            <InputField
              icon={<Image source={require('../assets/images/icons/lock.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
              placeholder="Enter 6-digit OTP"
              keyboardType="numeric"
              value={otp}
              onChangeText={(text: string) => setOtp(text)}
              maxLength={6}
              customStyle={{ marginBottom: SCREEN_HEIGHT * (16 / 812) }}
            />
            <PrimaryButton
              title={loading ? "Verifying..." : "Verify OTP"}
              onPress={handleVerifyOTP}
              loading={loading}
              style={{ 
                borderRadius: LOGIN_BTN_RADIUS, 
                height: LOGIN_BTN_HEIGHT, 
                width: 320,
                marginBottom: SCREEN_HEIGHT * (20 / 812)
              }}
              disabled={loading || !otp.trim() || otp.trim().length !== 6}
            />
            <TouchableOpacity 
              onPress={handleRequestReset}
              style={{ marginBottom: SCREEN_HEIGHT * (20 / 812) }}
              disabled={loading}
            >
              <Text style={{
                color: loading ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                opacity: loading ? 0.4 : 0.7,
                fontSize: 16,
                fontFamily: 'Uber Move Text',
                fontWeight: '500',
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}>
                {loading ? 'Sending...' : 'Didn\'t receive OTP? Resend'}
              </Text>
            </TouchableOpacity>
          </>
        );

      case 'password':
        return (
          <>
            <InputField
              icon={<Image source={require('../assets/images/icons/lock.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={(text: string) => setNewPassword(text)}
              customStyle={{ marginBottom: SCREEN_HEIGHT * (16 / 812) }}
            />
            <InputField
              icon={<Image source={require('../assets/images/icons/lock.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text: string) => setConfirmPassword(text)}
              customStyle={{ marginBottom: SCREEN_HEIGHT * (16 / 812) }}
            />
            <PrimaryButton
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handleResetPassword}
              loading={loading}
              style={{ 
                borderRadius: LOGIN_BTN_RADIUS, 
                height: LOGIN_BTN_HEIGHT, 
                width: 320,
                marginBottom: SCREEN_HEIGHT * (20 / 812)
              }}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim() || newPassword !== confirmPassword}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <Background>
      <BackButton onPress={handleBack} style={{ top: ARROW_TOP, left: ARROW_LEFT, position: 'absolute', zIndex: 10 }} />
      <Text
        style={{
          position: 'absolute',
          top: LOGIN_TOP,
          left: 0,
          right: 0,
          height: LOGIN_HEIGHT,
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
        Forgot Password
      </Text>
      <View
        style={{
          flex: 1,
          width: 320,
          height: 648,
          top: CONTAINER_TOP,
          position: 'absolute',
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
          
          {/* Step Indicator */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: SCREEN_HEIGHT * (16 / 812),
            marginBottom: SCREEN_HEIGHT * (8 / 812),
          }}>
            {['email', 'otp', 'password'].map((step, index) => (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: currentStep === step ? '#2E90FA' : 'rgba(255, 255, 255, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 4,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                    fontFamily: 'Uber Move Text',
                  }}>
                    {index + 1}
                  </Text>
                </View>
                {index < 2 && (
                  <View style={{
                    width: 20,
                    height: 2,
                    backgroundColor: currentStep === 'password' ? '#2E90FA' : 'rgba(255, 255, 255, 0.3)',
                    marginHorizontal: 4,
                  }} />
                )}
              </View>
            ))}
          </View>
          
          {/* Title + Supporting text */}
          <View
            style={{
              width: TITLE_CONTAINER_WIDTH,
              height: TITLE_CONTAINER_HEIGHT,
              opacity: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: SCREEN_HEIGHT * (4 / 812),
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: '500',
                fontSize: 28,
                lineHeight: 36,
                letterSpacing: -0.56,
                textAlign: 'center',
                fontFamily: 'Uber Move Text',
                verticalAlign: 'middle',
                marginBottom: TITLE_CONTAINER_GAP,
              }}
            >
              {getStepTitle()}
            </Text>
            <Text
              style={{
                color: '#fff',
                fontWeight: '400',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.1,
                textAlign: 'center',
                fontFamily: 'Uber Move Text',
                opacity: 0.8,
              }}
            >
              {getStepDescription()}
            </Text>
          </View>
          
          {/* Form */}
          <View style={{ width: 320, marginTop: SCREEN_HEIGHT * (16 / 812) }}>
            {renderStepContent()}
            
            {/* Back to Login (only show on first step) */}
            {currentStep === 'email' && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={{
                    color: '#fff',
                    opacity: 0.7,
                    fontSize: 16,
                    fontFamily: 'Uber Move Text',
                    fontWeight: '500',
                    fontStyle: 'normal',
                    lineHeight: 24,
                    letterSpacing: -0.1,
                  }}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Background>
    <AlertComponent />
  </>
  );
};

export default ForgotPasswordScreen;
