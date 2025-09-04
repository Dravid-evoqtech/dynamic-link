// app/OpportunityType.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, SafeAreaView } from 'react-native';
import { useTheme } from '../hooks/useThemeContext';
import Background from './components/Background';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectableCard from './components/SelectableCard';
import BackButton from './components/BackButton';
import PrimaryButton from './components/PrimaryButton';
import { wp, hp } from './utils/dimensions';
import { userDataAPI } from './services/api'; 
import { useOnboarding } from '../contexts/OnboardingContext'; 
import SkeletonLoader from './components/SkeletonLoader';

const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

// Define icons separately for cleaner code
const ICONS = {
  remote: {
    light: require('../assets/images/icons/OpportunityTypeIcons/remote(L).png'),
    dark: require('../assets/images/icons/OpportunityTypeIcons/remote(D).png'),
  },
  inperson: {
    light: require('../assets/images/icons/OpportunityTypeIcons/inperson(L).png'),
    dark: require('../assets/images/icons/OpportunityTypeIcons/inperson(D).png'),
  },
  hybrid: {
    light: require('../assets/images/icons/OpportunityTypeIcons/hybrid(L).png'),
    dark: require('../assets/images/icons/OpportunityTypeIcons/hybrid(D).png'),
  },
};

// Skeleton for opportunity type cards
const OpportunityTypeSkeleton = () => (
  <View style={{ width: 320, gap: 16 }}>
    {[1, 2, 3].map((item) => (
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

export default function OpportunityType() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [selected, setSelected] = useState(''); // The 'key' of the selected option
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Validation: Check if user has selected an option
  const isValid = selected.trim() !== '';

  useEffect(() => {
    const fetchEnrollmentTypes = async () => {
      try {
        console.log('[OpportunityType] Onboarding data from context:', onboardingData);

        const response = await userDataAPI.getEnrollmentTypes();
        console.log('API Response for Enrollment Types:', response); 

        let data = response;
        if (response && response.data) {
          data = response.data;
        }

        if (!Array.isArray(data)) {
          console.warn('API response is not an array:', data);
          data = [];
        }

        const formattedOptions = data.map((item: any) => {
          const key = item.key || item.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown';
          return {
            ...item,
            desc: item.description || item.desc,
            key: key,
            icon: ICONS[key as keyof typeof ICONS] || ICONS.hybrid,
          };
        });

        const uniqueKeys = new Set();
        const uniqueOptions = formattedOptions.filter((option: any) => {
          if (uniqueKeys.has(option.key)) {
            console.warn(`Duplicate key "${option.key}" found in enrollment types. Omitting duplicate.`);
            return false;
          }
          uniqueKeys.add(option.key);
          return true;
        });

        setOptions(uniqueOptions);
        console.log('[OpportunityType] Available unique options:', uniqueOptions);

        // Set initial selection from context if available, otherwise default to first option
        const matchingOption = uniqueOptions.find((opt: any) => opt._id === onboardingData.opportunityType);
        console.log('[OpportunityType] Found matching option from context:', matchingOption);

        const initialKey = matchingOption?.key || uniqueOptions[0]?.key || '';
        console.log('[OpportunityType] Setting initial selected key to:', initialKey);
        setSelected(initialKey);

      } catch (err: any) {
        console.error('Failed to fetch enrollment types:', err);
        setError(err.message || 'Failed to load options.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentTypes();
  }, [onboardingData]);

  const handleNext = () => {
    if (!isValid) {
      alert('Please select an opportunity type to continue.');
      return;
    }

    const selectedOptionObject = options.find(opt => opt.key === selected);

    if (!selectedOptionObject || !selectedOptionObject._id) {
      alert('Selected option data is invalid. Please try again.'); // Added for better UX
      return;
    }

    const opportunityTypeId = selectedOptionObject._id;

    // Update the OnboardingContext with the selected ID (as an array)
    updateData({ opportunityType: opportunityTypeId }); 

    // Navigate to the next screen
    router.push('/YourAge');
  };

  const SEGMENTS = 8;
  const BAR_WIDTH = 180;
  const GAP = 4;
  const SEGMENT_WIDTH = (BAR_WIDTH - GAP * (SEGMENTS - 1)) / SEGMENTS;

  return (
    <Background>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} style={{ left: 35, position: 'absolute', zIndex: 10 }} />
        <Text style={styles.headerText}>Opportunity Type</Text>
        <Text style={styles.stepText}>1 of 8</Text>
      </View>
      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { width: BAR_WIDTH }]}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View
            key={i}
            style={{
              width: SEGMENT_WIDTH,
              height: 4,
              backgroundColor: i === 0
                ? (isDark ? 'rgba(46, 144, 250, 1)' : '#fff')
                : 'rgba(255,255,255,0.4)',
              borderRadius: 2,
              marginRight: i !== SEGMENTS - 1 ? GAP : 0,
            }}
          />
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            Choose Opportunity Type
          </Text>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>
            What type of opportunity are you looking for?
          </Text>
        </View>
        
        {/* Loading State with Glassmorphism Skeleton */}
        {loading && <OpportunityTypeSkeleton />}
        
        {/* Error State */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {/* Option Cards */}
        {!loading && !error && options.map(opt => (
          <SelectableCard
            key={opt.key}
            icon={<Image source={opt.icon[isDark ? 'dark' : 'light']} style={{ width: 48, height: 48, resizeMode: 'contain' }} />}
            title={opt.title}
            description={opt.desc}
            selected={selected === opt.key}
            onPress={() => setSelected(opt.key)}
            backgroundColor={isDark ? "#14141C" : "#fff"}
            rightIcon={
              selected === opt.key ? (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#267DFF', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="check" size={18} color="#fff" />
                </View>
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: 'transparent' }} />
              )
            }
          />
        ))}
      </View>
      
      {/* Next Button */}
      <View style={styles.nextButtonContainer}>
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
  topBar: {
    marginTop: 63,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  headerText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    fontFamily: 'Uber Move Text',
  },
  stepText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    position: 'absolute',
    right: 32,
    top: 0,
    fontFamily: 'Uber Move Text',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 106,
    left: 97,
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: wp(27.5),
  },
  titleContainer: {
    width: 320,
    alignItems: 'flex-start',
    marginTop: 32,
  },
  titleText: {
    color: '#fff',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
  },
  subtitleContainer: {
    width: 320,
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 24,
  },
  subtitleText: {
    color: '#fff',
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    opacity: 0.8,
  },
  nextButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  container: {
    flex: 1,
  },
});