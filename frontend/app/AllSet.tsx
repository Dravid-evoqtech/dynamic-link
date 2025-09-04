import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, Alert } from 'react-native';
import Background from './components/Background';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { wp, hp } from './utils/dimensions';
import PrimaryButton from './components/PrimaryButton';
import { useQueryClient } from '@tanstack/react-query';

const CHECK_SIZE = wp(80);
const MARGIN_BOTTOM = hp(32);
const TITLE_SIZE = wp(22);
const DESCRIPTION_MAX_WIDTH = wp(300);
const BUTTON_HEIGHT = hp(54);

export default function AllSet() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const handleStartExploring = async () => {
    try {
      // Clear only data queries to ensure fresh data for the new user
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['featured'] });
      await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
      console.log('[AllSet] Data cache invalidated successfully for new user');
    } catch (error) {
      console.error('[AllSet] Failed to invalidate data cache:', error);
    }
    
    // Navigate to main app
    router.replace('/screens/MainTabsScreen');
  };
  
  return (
    
      <Background>
        <View style={styles.contentContainer}>
          {/* Checkmark */}
          <View style={styles.checkmarkContainer}>
            <MaterialIcons name="check" size={wp(48)} color="#fff" />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>
            You're All Set!
          </Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Your profile is complete. We're ready to match you with opportunities tailored to your interests and goals.
          </Text>

          {/* Bonus Points Note */}
          <Text style={styles.bonusNote}>
            You earned 30 points for completing onboarding. Use points to unlock featured opportunities.
          </Text>

          {/* Bottom Button Container */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Start Exploring Opportunities"
              onPress={handleStartExploring}
              style={styles.button}
            />
          </View>
        </View>
      </Background>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: wp(20),
  },
  checkmarkContainer: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: MARGIN_BOTTOM,
  },
  title: {
    color: '#fff',
    fontWeight: '500',
    fontSize: TITLE_SIZE,
    marginBottom: hp(16),
    fontFamily: 'Uber Move Text',
    textAlign: 'center',
  },
  description: {
    color: '#fff',
    fontSize: wp(16),
    opacity: 0.8,
    marginBottom: hp(40),
    fontFamily: 'Uber Move Text',
    textAlign: 'center',
    maxWidth: DESCRIPTION_MAX_WIDTH,
    lineHeight: hp(24),
    letterSpacing: wp(-0.1),
  },
  bonusNote: {
    color: '#fff',
    fontSize: wp(14),
    opacity: 0.9,
    marginBottom: hp(16),
    fontFamily: 'Uber Move Text',
    textAlign: 'center',
    maxWidth: DESCRIPTION_MAX_WIDTH,
    lineHeight: hp(20),
    letterSpacing: wp(-0.1),
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(32),
    position: 'absolute',
    bottom: 0,
  },
  button: {
    borderRadius: 16,
    height: BUTTON_HEIGHT,
    width: wp(320),
  },
});