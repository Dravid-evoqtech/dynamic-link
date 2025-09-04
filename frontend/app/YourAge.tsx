import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, SafeAreaView, Modal, Platform } from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import { wp, hp } from './utils/dimensions';

import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const INPUT_WIDTH = wp(320);
const INPUT_HEIGHT = hp(56);
const INPUT_RADIUS = 16;
const INPUT_ICON_SIZE = 22;
const PROGRESS_WIDTH = wp(200);
const PROGRESS_HEIGHT = 4;
const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

// Skeleton for age input
const AgeInputSkeleton = () => (
  <View style={{ width: 320, height: 56, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
    {/* Icon skeleton */}
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 10 }} />
    {/* Input skeleton */}
    <View style={{ flex: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, marginRight: 10 }} />
    {/* Calendar icon skeleton */}
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
  </View>
);

export default function YourAge() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [date, setDate] = useState<Date>(new Date(1994, 10, 17)); // Months are 0-indexed
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate age from date
  function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Debug logging
    console.log('[YourAge] Birth date:', birthDate);
    console.log('[YourAge] Today:', today);
    console.log('[YourAge] Month difference:', m);
    console.log('[YourAge] Calculated age:', age);
    
    return age;
  }

  // Validation: Check if date is valid and user is old enough (e.g., 13+ years)
  const calculatedAge = calculateAge(date);
  const isValid = date && !isNaN(date.getTime()) && calculatedAge >= 13;
  
  // Additional validation to ensure the date makes sense
  const isDateReasonable = date && date <= new Date() && date > new Date(1900, 0, 1);
  const finalIsValid = isValid && isDateReasonable;
  
  // Debug logging
  useEffect(() => {
    console.log('[YourAge] Current date:', date);
    console.log('[YourAge] Calculated age:', calculatedAge);
    console.log('[YourAge] Is valid:', isValid);
    console.log('[YourAge] Is date reasonable:', isDateReasonable);
    console.log('[YourAge] Final validation:', finalIsValid);
  }, [date, calculatedAge, isValid, isDateReasonable, finalIsValid]);

  useEffect(() => {
    console.log('[YourAge] Onboarding data from context:', onboardingData);
    // Set initial date from context if available
    if (onboardingData.dateOfBirth) {
      const contextDate = new Date(onboardingData.dateOfBirth);
      // Check if it's a valid date before setting
      if (!isNaN(contextDate.getTime())) {
        console.log('[YourAge] Setting initial date from context:', contextDate);
        setDate(contextDate);
      }
    }
  }, [onboardingData]);

  // Format date as MM/DD/YYYY
  const formatDate = (dateObj: Date) => {
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleNext = () => {
    const currentAge = calculateAge(date);
    console.log('[YourAge] Attempting to proceed with age:', currentAge);
    
    if (!finalIsValid) {
      alert(`Please select a valid date of birth. You must be at least 13 years old. Current calculated age: ${currentAge}`);
      return;
    }

    // Update the OnboardingContext with the selected date
    updateData({ dateOfBirth: date });
    console.log('[YourAge] Saved date to context:', date);

    // Navigate to the next screen
    router.push('/ChooseProgram');
  };

  const PROGRESS_SEGMENTS = 8;
  const PROGRESS_CURRENT = 2;
  const BAR_WIDTH = 180;
  const GAP = 4;
  const SEGMENT_WIDTH = (BAR_WIDTH - GAP * (PROGRESS_SEGMENTS - 1)) / PROGRESS_SEGMENTS;

  return (
 
      <Background>

        {/* Top Bar */}
        <View style={{
          marginTop: 63,
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          marginBottom: 8
        }}>
          <BackButton onPress={() => router.back()} style={{ left: 35, position: 'absolute', zIndex: 10 }} />
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Your Age</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>2 of 8</Text>
        </View>
          {/* Progress Bar */}
        <View
          style={{
            position: 'absolute',
            top: 106,
            left: 97,
            width: BAR_WIDTH,
            height: 4,
            flexDirection: 'row',
            opacity: 1,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: SEGMENT_WIDTH,
                height: 4,
                backgroundColor: i < PROGRESS_CURRENT 
                  ? (isDark ? 'rgba(46, 144, 250, 1)' : '#fff') 
                  : 'rgba(255,255,255,0.4)',
                borderRadius: 2,
                marginRight: i !== PROGRESS_SEGMENTS - 1 ? GAP : 0,
              }}
            />
          ))}
        </View>
        {/* Main Content */}
        <View style={{ flex: 1, alignItems: 'center', width: '100%', marginTop: 24 }}>
          <View style={{ width: 320, alignItems: 'flex-start', marginTop: 32 }}>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'Uber Move Text',
                fontWeight: '500',
                fontStyle: 'normal',
                fontSize: 24,
                lineHeight: 32,
                letterSpacing: -0.48,
                marginBottom: 8,
              }}
            >
              How Old Are You?
            </Text>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.1,
                marginBottom: 20,
                opacity: 0.8,
              }}
            >
            Pick your age so we can show you the right opportunities.
          </Text>
          {/* Loading State with Glassmorphism Skeleton */}
          {loading ? (
            <AgeInputSkeleton />
          ) : (
            <InputField
              icon={<Image source={require('../assets/images/icons/YourAgeIcon/cakeicon.png')} style={{ width: 22, height: 22, marginRight: 10, resizeMode: 'contain', tintColor: isDark ? '#fff' : '#222' }} />}
              placeholder="MM/DD/YYYY"
              value={formatDate(date)}
              onChangeText={str => { /* Optionally, parse and setDate if you want manual input */ }}
              editable={false}
              customStyle={{ width: 320, marginBottom: 24, backgroundColor: isDark ? '#14141C' : '#fff' }}
              inputStyle={{
                width: 236,
                height: 42,
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: 15,
                lineHeight: 22,
                letterSpacing: -0.1,
                verticalAlign: 'middle',
                opacity: 1,
                color: isDark ? '#fff' : '#222',
              }}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPicker(true)}>
                  <Image source={require('../assets/images/icons/YourAgeIcon/calandericon.png')} style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: isDark ? '#222' : '#222' }} />
                </TouchableOpacity>
              }
              onPress={() => setShowPicker(true)} // Add this to open picker when input field is pressed
            />
          )}
        </View>
          {/* Show calculated age */}
          <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontSize: 20,
                textAlign: 'center',
                marginBottom: 20,
              }}
          >
              {calculateAge(date)} years old
            </Text>
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 32 }}>
              <PrimaryButton
                title="Next"
                onPress={handleNext}
                style={{ borderRadius: NEXT_BTN_RADIUS, height: NEXT_BTN_HEIGHT, width: 320 }}
                disabled={!finalIsValid} // Disable button until valid date is selected
              />
            </View>
          </View>
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowPicker(false)}
          >
            <TouchableOpacity 
              style={[styles.datePickerContainer, { backgroundColor: isDark ? '#23272F' : '#FFFFFF' }]} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Select Your Date of Birth
                </Text>
                <Text style={[styles.datePickerSubtitle, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                  You must be at least 13 years old
                </Text>
              </View>
              
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDate(selectedDate);
                    // For iOS, don't auto-close since it's a spinner
                    // For Android, close immediately
                    if (Platform.OS === 'android') {
                      setShowPicker(false);
                    }
                  }
                }}
                maximumDate={new Date()} // Can't select future dates
                minimumDate={new Date(1900, 0, 1)} // Reasonable minimum date
                style={styles.datePicker}
                textColor={isDark ? '#FFFFFF' : '#000000'}
              />
              
              <View style={styles.datePickerButtons}>
                <TouchableOpacity 
                  style={[styles.datePickerButton, styles.cancelButton]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={[styles.datePickerButtonText, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.datePickerButton, styles.doneButton, { backgroundColor: isDark ? '#2E90FA' : '#0676EF' }]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.doneButtonText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </Background>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
  datePickerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'UberMoveText-Regular',
    opacity: 0.8,
  },
  datePicker: {
    width: Platform.OS === 'ios' ? 300 : 320,
    height: Platform.OS === 'ios' ? 200 : 50,
    marginBottom: 20,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  doneButton: {
    backgroundColor: '#2E90FA',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
  },
});
