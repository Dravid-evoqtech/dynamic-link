import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import Background from './components/Background';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import InterestChip from './components/InterestChip';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';

import { wp, hp } from './utils/dimensions';
import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { userDataAPI } from './services/api';

const CARD_WIDTH = (wp(320) - 16) / 2; // 2 per row, with gap
const CARD_GAP = hp(12);
const ICON_SIZE = 20;
const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;
const PROGRESS_SEGMENTS = 8;
const PROGRESS_CURRENT = 7;
const BAR_WIDTH = 180;
const GAP = 6;
const SEGMENT_WIDTH = (BAR_WIDTH - GAP * (PROGRESS_SEGMENTS - 1)) / PROGRESS_SEGMENTS;

const ICONS = {
  medicine: require('../assets/images/icons/Interests/Medicine.png'),
  engineering: require('../assets/images/icons/Interests/Engineering.png'),
  computerscience: require('../assets/images/icons/Interests/Computer_Science.png'),
  business: require('../assets/images/icons/Interests/Business.png'),
  arts: require('../assets/images/icons/Interests/Arts.png'),
  science: require('../assets/images/icons/Interests/Science.png'),
  psychology: require('../assets/images/icons/Interests/Psychology.png'),
  environment: require('../assets/images/icons/Interests/Environment.png'),
  lawandcivics: require('../assets/images/icons/Interests/Law_Civics.png'),
  travelandculture: require('../assets/images/icons/Interests/Travel_Culture.png'),
  hospitality: require('../assets/images/icons/Interests/Hospitality.png'),
  mediaandfilm: require('../assets/images/icons/Interests/Media_Film.png'),
  educationandteaching: require('../assets/images/icons/Interests/Education_Teaching.png'),
};

// Skeleton for interest chips
const InterestChipsSkeleton = () => (
  <View style={{ width: 320, gap: 10 }}>
    {Array.from({ length: 6 }).map((_, rowIdx) => (
      <View key={rowIdx} style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1].map(colIdx => (
          <View key={colIdx} style={{ 
            width: (320 - 8) / 2, 
            height: 48, 
            borderRadius: 24, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderWidth: 1, 
            borderColor: 'rgba(255, 255, 255, 0.2)', 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.1, 
            shadowRadius: 8, 
            elevation: 3,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            gap: 8
          }}>
            {/* Icon skeleton */}
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
            {/* Text skeleton */}
            <View style={{ flex: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

export default function Interests() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Validation: Check if user has selected at least one interest
  const isValid = selected.length > 0;

  // Helper to generate a consistent key from the title for icon lookup
  const generateKeyFromTitle = (title: string): string => {
    if (!title) return 'unknown';
    const lowerTitle = title.toLowerCase();
    // Handle multi-word keys first to ensure they are matched correctly
    if (lowerTitle.includes('computer science')) return 'computerscience';
    if (lowerTitle.includes('law')) return 'lawandcivics';
    if (lowerTitle.includes('travel')) return 'travelandculture';
    if (lowerTitle.includes('media') || lowerTitle.includes('film')) return 'mediaandfilm';
    if (lowerTitle.includes('education') || lowerTitle.includes('teaching')) return 'educationandteaching';
    
    // Fallback for single-word or other titles by sanitizing them.
    // This will correctly handle "Arts", "Business", "Science", etc.
    return lowerTitle.replace(/[^a-z0-9]/g, '');
  };

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await userDataAPI.getOpportunityDomains();
        const data = response.data || response;

        console.log('[Interests] API Response for Opportunity Domains:', response); // Log raw API response

        if (!Array.isArray(data)) {
          throw new Error("API response for interests is not an array.");
        }

        const formattedOptions = data.map((item: any, index: number) => {
          const label = (item.label && item.label.trim() !== '') ? item.label :
                        (item.title && item.title.trim() !== '') ? item.title :
                        `Unknown Interest ${index + 1}`; // Fallback label
          const key = item.key || generateKeyFromTitle(label);
          return {
            ...item, // Keep original properties from the API response
            key: key,
            label: label,
          };
        });

        const uniqueKeys = new Set();
        const uniqueOptions = formattedOptions.filter(option => {
          if (uniqueKeys.has(option.key)) {
            console.warn(`[Interests] Duplicate key "${option.key}" found. Omitting duplicate.`);
            return false;
          }
          uniqueKeys.add(option.key);
          return true;
        });
        setOptions(uniqueOptions);
        console.log('[Interests] Formatted Unique Options:', uniqueOptions); // Log unique options

        // Set initial selection from context
        if (onboardingData.interests && onboardingData.interests.length > 0) {
          const initialKeys = uniqueOptions
            .filter(opt => onboardingData.interests!.includes(opt._id))
            .map(opt => opt.key);
          setSelected(initialKeys);
          console.log('[Interests] Initial selected keys from context:', initialKeys);
        } else {
          console.log('[Interests] No initial interests found in onboarding data.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load options.');
        console.error('Failed to fetch interests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [onboardingData.interests]); // Added onboardingData.interests to dependency array

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const newSelection = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      console.log('[Interests] Toggled selection:', newSelection);
      return newSelection;
    });
  };

  const handleNext = () => {
    if (!isValid) {
      alert('Please select at least one interest to continue.');
      return;
    }

    const selectedIds = options.filter(opt => selected.includes(opt.key)).map(opt => opt._id);
    console.log('[Interests] Sending selected interest IDs to context:', selectedIds);
    updateData({ interests: selectedIds });
    router.push('/YourGoal');
  };

  return (
    <Background>
      {/* Top Bar */}
      <View style={{ marginTop: 63, alignItems: 'center', width: '100%', position: 'relative', marginBottom: 8 }}>
        <BackButton onPress={() => router.back()} style={{ left: 35, position: 'absolute', zIndex: 10 }} />
        <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Interests</Text>
        <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>7 of 8</Text>
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
        <View style={{ width: 320, alignItems: 'flex-start', marginTop: 32, gap: 8 }}>
          <Text
            style={{
              color: '#fff',
              fontFamily: 'Uber Move Text',
              fontWeight: '500',
              fontStyle: 'normal',
              fontSize: 24,
              lineHeight: 32,
              letterSpacing: -0.48,
              verticalAlign: 'middle',
            }}
          >
            What Are Your Interests?
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
            Choose as many topics as you'd like — we'll use this to personalize your experience.
          </Text>
          
          {/* Loading State with Glassmorphism Skeleton */}
          {loading && <InterestChipsSkeleton />}
          
          {/* Interest Chips Grid */}
          {!loading && !error && (
            <View style={{ width: 320, opacity: 1 }}>
              {Array.from({ length: Math.ceil(options.length / 2) }).map((_, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: rowIdx !== Math.ceil(options.length / 2) - 1 ? 10 : 0 }}>
                  {[0, 1].map(colIdx => {
                    const idx = rowIdx * 2 + colIdx;
                    if (idx >= options.length) return null;
                    const interest = options[idx];
                    const isSelected = selected.includes(interest.key);
                    // Check if the icon exists before rendering
                    const iconComponent = ICONS[interest.key as keyof typeof ICONS] ? (
                      <Image source={ICONS[interest.key as keyof typeof ICONS]} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
                    ) : (
                      // Fallback if icon is not found, e.g., a default MaterialIcons icon or null
                      <MaterialIcons name="category" size={24} color={isDark ? '#fff' : '#000'} />
                    );
                    return (
                      <View key={interest.key} style={{ marginRight: colIdx === 0 ? 8 : 0 }}>
                        <InterestChip
                          icon={iconComponent}
                          label={interest.label}
                          selected={isSelected}
                          onPress={() => toggleSelect(interest.key)}
                          borderColor={interest.border} // Assuming 'border' property comes from API or is handled by InterestChip
                        />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
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
