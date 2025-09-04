import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, SafeAreaView, StyleSheet } from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectableCard from './components/SelectableCard';
import BackButton from './components/BackButton';
import PrimaryButton from './components/PrimaryButton';
import { wp, hp } from './utils/dimensions';

import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { userDataAPI } from './services/api';

const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

const ICONS = {
  summer: {
    dark: require('../assets/images/icons/SeasonAvailability/Summer(D).png'),
    light: require('../assets/images/icons/SeasonAvailability/Summer(L).png'),
  },
  fall: {
    dark: require('../assets/images/icons/SeasonAvailability/Fall(D).png'),
    light: require('../assets/images/icons/SeasonAvailability/Fall(L).png'),
  },
  winter: {
    dark: require('../assets/images/icons/SeasonAvailability/Winter(D).png'),
    light: require('../assets/images/icons/SeasonAvailability/Winter(L).png'),
  },
  spring: {
    dark: require('../assets/images/icons/SeasonAvailability/Spring(D).png'),
    light: require('../assets/images/icons/SeasonAvailability/Spring(L).png'),
  },
};

// Skeleton for season availability cards
const SeasonAvailabilitySkeleton = () => (
  <View style={{ width: 320, gap: 16 }}>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={{ width: 320, height: 72, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, height: '100%' }}>
          {/* Icon skeleton */}
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 16 }} />
          {/* Content skeleton */}
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ width: '60%', height: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
            <View style={{ width: '80%', height: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }} />
          </View>
          {/* Checkbox skeleton */}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        </View>
      </View>
    ))}
  </View>
);

export default function SeasonAvailability() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Validation: Check if user has selected at least one season
  const isValid = selected.length > 0;

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await userDataAPI.getAvailabilitySeasons();
        const data = response.data || response;

        if (!Array.isArray(data)) {
          throw new Error("API response for seasons is not an array.");
        }

        const formattedOptions = data.map((item: any) => ({
          ...item,
          key: item.key || item.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown',
          desc: item.description || item.desc,
        }));
        setOptions(formattedOptions);

        // Set initial selection from context
        if (onboardingData.availability && onboardingData.availability.length > 0) {
          const initialKeys = formattedOptions
            .filter(opt => onboardingData.availability!.includes(opt._id))
            .map(opt => opt.key);
          setSelected(initialKeys);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load options.');
        console.error('Failed to fetch seasons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [onboardingData]);

  const toggleSelect = (key: string) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    if (!isValid) {
      alert('Please select at least one season to continue.');
      return;
    }

    const selectedIds = options.filter(opt => selected.includes(opt.key)).map(opt => opt._id);
    updateData({ availability: selectedIds });
    router.push('/Interests');
  };

  const PROGRESS_SEGMENTS = 8;
  const PROGRESS_CURRENT = 6;
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
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Season Availability</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>6 of 8</Text>
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
              When Are You Available?
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
              Select all seasons when you're available to participate in programs.
            </Text>
            
            {/* Loading State with Glassmorphism Skeleton */}
            {loading && <SeasonAvailabilitySkeleton />}
            
            {/* Option Cards */}
            {!loading && !error && options.map(opt => (
              <SelectableCard
                key={opt.key}
                icon={<Image source={ICONS[opt.key as keyof typeof ICONS]?.[isDark ? 'dark' : 'light']} style={{ width: 48, height: 48, resizeMode: 'contain' }} />}
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
