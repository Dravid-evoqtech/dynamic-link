import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, SafeAreaView, StyleSheet } from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectableCard from './components/SelectableCard';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import { wp, hp } from './utils/dimensions';

import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { userDataAPI } from './services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * (320 / 375);
const CARD_HEIGHT = SCREEN_HEIGHT * (56 / 812);
const CARD_RADIUS = 16;
const CARD_GAP = SCREEN_HEIGHT * (12 / 812);
const PROGRESS_WIDTH = SCREEN_WIDTH * (200 / 375);
const PROGRESS_HEIGHT = 4;
const NEXT_BTN_HEIGHT = SCREEN_HEIGHT * (54 / 812);
const NEXT_BTN_RADIUS = 16;

// Skeleton for grade selection cards
const GradeSelectionSkeleton = () => (
  <View style={{ width: 320, gap: 6 }}>
    {[1, 2, 3, 4, 5].map((item) => (
      <View key={item} style={{ width: 320, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, height: '100%' }}>
          {/* Content skeleton */}
          <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
          {/* Checkbox skeleton */}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        </View>
      </View>
    ))}
  </View>
);

export default function YourGrade() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [selected, setSelected] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Validation: Check if user has selected a grade
  const isValid = selected.trim() !== '';

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await userDataAPI.getGrades();
        const data = response.data || response;

        if (!Array.isArray(data)) {
          throw new Error("API response for grades is not an array.");
        }

        // Filter out items from the API that don't have a title, as they cannot be displayed.
        const validData = data.filter(item => {
          const hasTitle = item && typeof item.title === 'string' && item.title.trim() !== '';
          if (!hasTitle) {
            console.warn('Filtered out invalid grade object from API:', item);
          }
          return hasTitle;
        });

        const formattedOptions = validData.map((item: any) => ({
          ...item,
          key: item.key || item.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown',
          label: item.label || item.title,
        }));
        setOptions(formattedOptions);

        // Set initial selection from context
        const initialSelection = formattedOptions.find(opt => opt._id === onboardingData.grade);
        setSelected(initialSelection?.key || formattedOptions[0]?.key || '');

      } catch (err: any) {
        setError(err.message || 'Failed to load options.');
        console.error('Failed to fetch grades:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [onboardingData]);

  const handleNext = () => {
    if (!isValid) {
      alert('Please select a grade to continue.');
      return;
    }

    const selectedOption = options.find(opt => opt.key === selected);
    if (selectedOption) {
      updateData({ grade: selectedOption._id });
    }
    router.push('/YourLocation');
  };

  const PROGRESS_SEGMENTS = 8;
  const PROGRESS_CURRENT = 4;
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
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Your Grade</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>4 of 8</Text>
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
              What Grade Are You In?
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
              Pick your current grade so we can match the right opportunities.
            </Text>
            
            {/* Loading State with Glassmorphism Skeleton */}
            {loading && <GradeSelectionSkeleton />}
            
            {/* Grade Cards */}
            {!loading && !error && options.map(grade => (
              <SelectableCard
                key={grade.key}
                title={grade.label}
                selected={selected === grade.key}
                onPress={() => setSelected(grade.key)}
                variant="simple"
                backgroundColor={isDark ? '#14141C' : '#fff'}
                rightIcon={
                  selected === grade.key ? (
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#267DFF', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </View>
                  ) : (
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      borderWidth: 2, borderColor: '#E5E7EB',
                      backgroundColor: 'transparent'
                    }} />
                  )
                }
                customStyle={{
                  width: 320,
                  height: 48,
                  borderRadius: 16,
                  opacity: 1,
                  marginBottom: 6,
                  paddingTop: 12,
                  paddingRight: 14,
                  paddingBottom: 12,
                  paddingLeft: 14,
                }}
              />
            ))}
          </View>
          <Text style={{ color: '#fff', fontSize: 13, opacity: 0.6, marginTop: 8, fontFamily: 'Uber Move Text' }}>
            We'll use this to find grade-appropriate opportunities
          </Text>
        </View>
        {/* Next Button */}
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 32 }}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
            style={{ borderRadius: NEXT_BTN_RADIUS, height: NEXT_BTN_HEIGHT, width: 320 }}
            disabled={!isValid} // Disable button until valid selection
          />
        </View>
      </Background>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
