import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, SafeAreaView, StyleSheet } from 'react-native';
import Background from './components/Background';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectableCard from './components/SelectableCard';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import { wp, hp } from './utils/dimensions';
import { useQueryClient } from '@tanstack/react-query';

import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { userDataAPI } from './services/api';

const CARD_WIDTH = wp(320);
const CARD_HEIGHT = hp(72);
const CARD_RADIUS = 16;
const CARD_GAP = hp(16);
const ICON_SIZE = 32;
const PROGRESS_WIDTH = wp(200);
const PROGRESS_HEIGHT = 4;
const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

const ICONS = {
  internship: {
    dark: require('../assets/images/icons/ChooseProgram/Internship(D).png'),
    light: require('../assets/images/icons/ChooseProgram/Internship(L).png'),
  },
  volunteering: {
    dark: require('../assets/images/icons/ChooseProgram/Volunteering(D).png'),
    light: require('../assets/images/icons/ChooseProgram/Volunteering(L).png'),
  },
  research: {
    dark: require('../assets/images/icons/ChooseProgram/Research(D).png'),
    light: require('../assets/images/icons/ChooseProgram/Research(L).png'),
  },
  scholarships: {
    dark: require('../assets/images/icons/ChooseProgram/Scholarships(D).png'),
    light: require('../assets/images/icons/ChooseProgram/Scholarships(L).png'),
  },
  default: { // Add a fallback
    dark: require('../assets/images/icons/ChooseProgram/Internship(D).png'),
    light: require('../assets/images/icons/ChooseProgram/Internship(L).png'),
  }
};

const generateKeyFromTitle = (title: string): string => {
  if (!title) return 'default';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('internship')) return 'internship';
  if (lowerTitle.includes('volunteer')) return 'volunteering';
  if (lowerTitle.includes('research')) return 'research';
  if (lowerTitle.includes('scholarship')) return 'scholarships';
  return 'default';
};

// Skeleton for program selection cards
const ProgramSelectionSkeleton = () => (
  <View style={{ width: 320, gap: 16 }}>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={{ width: 320, height: 72, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, height: '100%' }}>
          {/* Icon skeleton */}
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 16 }} />
          {/* Content skeleton */}
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ width: '70%', height: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
            <View style={{ width: '90%', height: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }} />
          </View>
          {/* Checkbox skeleton */}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        </View>
      </View>
    ))}
  </View>
);

export default function ChooseProgram() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  // Validation: Check if user has selected at least one program
  const isValid = selected.length > 0;

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await userDataAPI.getOpportunityProgramTypes();
        const data = response.data || response;

        if (!Array.isArray(data)) {
          throw new Error("API response for program types is not an array.");
        }

        const formattedOptions = data.map((item: any) => ({
          ...item,
          key: generateKeyFromTitle(item.title),
          desc: item.description || 'No description available.',
        }));
        setOptions(formattedOptions);

        // Set initial selection from context
        if (onboardingData.programs && onboardingData.programs.length > 0) {
          const initialKeys = formattedOptions
            .filter(opt => onboardingData.programs!.includes(opt._id))
            .map(opt => opt.key);
          setSelected(initialKeys);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load program types.');
        console.error('Failed to fetch program types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [onboardingData.programs]);

  const toggleSelect = (key: string) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleNext = async () => {
    if (!isValid) {
      alert('Please select at least one program type to continue.');
      return;
    }

    const selectedIds = options.filter(opt => selected.includes(opt.key)).map(opt => opt._id);
    updateData({ programs: selectedIds });
    
    // Clear only data queries before navigating to ensure fresh data
    try {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['featured'] });
      await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
      console.log('[ChooseProgram] Data cache invalidated successfully');
    } catch (error) {
      console.error('[ChooseProgram] Failed to invalidate data cache:', error);
    }
    
    router.push('/YourGrade');
  };

  const getIcon = (key: string) => {
    const iconKey = key as keyof typeof ICONS;
    const theme = isDark ? 'dark' : 'light';
    return ICONS[iconKey]?.[theme] || ICONS.default[theme];
  };

  const PROGRESS_SEGMENTS = 9;
  const PROGRESS_CURRENT = 3;
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
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Choose Program</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>3 of 8</Text>
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
              What Programs Interest You?
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
                marginBottom: 24,
                opacity: 0.8,
              }}
            >
              Select the types of programs you're most interested in.
            </Text>
            
            {/* Loading State with Glassmorphism Skeleton */}
            {loading && <ProgramSelectionSkeleton />}
            
            {/* Option Cards */}
            {!loading && !error && options.map(opt => (
              <SelectableCard
                key={opt.key}
                icon={<Image source={getIcon(opt.key)} style={{ width: 48, height: 48, resizeMode: 'contain' }} />}
                title={opt.title}
                description={opt.desc}
                selected={selected.includes(opt.key)}
                onPress={() => toggleSelect(opt.key)}
                backgroundColor={isDark ? '#14141C' : '#fff'}
                rightIcon={
                  selected.includes(opt.key) ? (
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
              />
            ))}
          </View>
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
