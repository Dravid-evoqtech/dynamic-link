import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SelectableCard from './components/SelectableCard';
import PrimaryButton from './components/PrimaryButton';
import BackButton from './components/BackButton';
import { wp, hp } from './utils/dimensions';
import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { userDataAPI } from './services/api';

const ICON_SIZE = 28;
const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

const ICONS: { [key: string]: React.ReactElement } = {
  volunteer: <MaterialCommunityIcons name="account-heart-outline" size={ICON_SIZE} color="#267DFF" />,
  skills: <MaterialCommunityIcons name="star-circle" size={ICON_SIZE} color="#D96AFF" />,
  research: <MaterialIcons name="menu-book" size={ICON_SIZE} color="#FF7A50" />,
  internship: <MaterialCommunityIcons name="briefcase-check-outline" size={ICON_SIZE} color="#1AC28D" />,
  careers: <MaterialIcons name="explore" size={ICON_SIZE} color="#267DFF" />,
  leadership: <MaterialCommunityIcons name="medal-outline" size={ICON_SIZE} color="#FFA726" />,
  impact: <MaterialCommunityIcons name="heart" size={ICON_SIZE} color="#FF4D4F" />,
  certificates: <MaterialCommunityIcons name="certificate" size={ICON_SIZE} color="#1AC28D" />,
  college: <MaterialCommunityIcons name="school-outline" size={ICON_SIZE} color="#267DFF" />,
  network: <MaterialCommunityIcons name="account-group-outline" size={ICON_SIZE} color="#D96AFF" />,
  default: <MaterialIcons name="star" size={ICON_SIZE} color="#888" />, // Fallback icon
};

const ICON_COLORS: { [key: string]: string } = {
  volunteer: '#EAF3FF',
  skills: '#F7E8FF',
  research: '#FFF2EC',
  internship: '#E6FAF3',
  careers: '#EAF3FF',
  leadership: '#FFF4E3',
  impact: '#FFEAEA',
  certificates: '#E6FAF3',
  college: '#EAF3FF',
  network: '#F7E8FF',
  default: '#F0F0F0',
};

// Helper to generate a consistent key from the title for icon lookup, similar to Interests.tsx
const generateKeyFromTitle = (title: string): string => {
  if (!title) return 'default';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('volunteer')) return 'volunteer';
  if (lowerTitle.includes('new skills')) return 'skills';
  if (lowerTitle.includes('research')) return 'research';
  if (lowerTitle.includes('internship')) return 'internship';
  if (lowerTitle.includes('explore careers')) return 'careers';
  if (lowerTitle.includes('leadership')) return 'leadership';
  if (lowerTitle.includes('impact')) return 'impact';
  if (lowerTitle.includes('certificates')) return 'certificates';
  if (lowerTitle.includes('prepare for college')) return 'college';
  if (lowerTitle.includes('build my network')) return 'network';
  // Fallback for any goals not explicitly handled
  return 'default';
};

// Skeleton for goal selection cards
const GoalSelectionSkeleton = () => (
  <View style={{ width: 320, gap: 16 }}>
    {[1, 2, 3, 4, 5].map((item) => (
      <View key={item} style={{ width: 320, height: 72, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, height: '100%' }}>
          {/* Icon skeleton */}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 16 }} />
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

export default function YourGoal() {
  const { data: onboardingData, updateData, submitOnboarding } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Validation: Check if user has selected at least one goal
  const isValid = selected.length > 0;

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await userDataAPI.getGoals();
        const data = response.data || response;
        console.log('[YourGoal] Raw API Response for Goals:',data);
        
        console.log('[YourGoal] API Response for Goals:', response);

        if (!Array.isArray(data)) {
          throw new Error("API response for goals is not an array.");
        }

        const formattedOptions = data.map((item: any, index: number) => {
          const title = (item.title && item.title.trim() !== '') ? item.title : `Unknown Goal ${index + 1}`;
          const key = item.key || generateKeyFromTitle(title);
          return {
            ...item,
            key: key,
            title: title,
            desc: item.description || item.desc,
          };
        });

        const uniqueKeys = new Set();
        const uniqueOptions = formattedOptions.filter(option => {
          if (uniqueKeys.has(option.key)) {
            console.warn(`[YourGoal] Duplicate key "${option.key}" found. Omitting duplicate.`);
            return false;
          }
          uniqueKeys.add(option.key);
          return true;
        });
        setOptions(uniqueOptions);
        console.log('[YourGoal] Formatted Unique Options:', uniqueOptions);

        // Set initial selection from context
        if (onboardingData.goals && onboardingData.goals.length > 0) {
          const initialKeys = uniqueOptions
            .filter(opt => onboardingData.goals!.includes(opt._id))
            .map(opt => opt.key);
          setSelected(initialKeys);
          console.log('[YourGoal] Initial selected keys from context:', initialKeys);
        } else {
          console.log('[YourGoal] No initial goals found in onboarding data.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load goals.');
        console.error('Failed to fetch goals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [onboardingData.goals]); // Dependency on onboardingData.goals

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const newSelection = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      console.log('[YourGoal] Toggled selection:', newSelection);
      return newSelection;
    });
  };

  const handleNext = async () => {
    if (!isValid) {
      alert('Please select at least one goal to continue.');
      return;
    }

    const selectedIds = options.filter(opt => selected.includes(opt.key)).map(opt => opt._id);
    console.log('[YourGoal] Finalizing with selected goal IDs:', selectedIds);

    setSubmitting(true);
    setError(null); // Clear previous fetch errors

    try {
      // Pass the final piece of data to submitOnboarding.
      // It will merge this with existing context data before sending to the API.
      await submitOnboarding({ goals: selectedIds });
      router.push('/AllSet');
    } catch (err: any) {
      setError(err.message || 'Failed to save your preferences. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const PROGRESS_SEGMENTS = 8;
  const PROGRESS_CURRENT = 8;
  const BAR_WIDTH = 180;
  const GAP = 4;
  const SEGMENT_WIDTH = (BAR_WIDTH - GAP * (PROGRESS_SEGMENTS - 1)) / PROGRESS_SEGMENTS;

  return (
   
      <Background>

        {/* Top Bar */}
        <View style={{ marginTop: 63, alignItems: 'center', width: '100%', position: 'relative', marginBottom: 8 }}>
          <BackButton onPress={() => router.back()} style={{ left: 35, position: 'absolute', zIndex: 10 }} />
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Your Goal</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>8 of 8</Text>
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
        {/* Main Content - Fixed Header */}
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
              What Are Your Goals?
            </Text>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 20,
                opacity: 0.8,
              }}
            >
              Select the goals that matter most to you. This helps us match you with opportunities.
            </Text>
          </View>
          
          {/* Scrollable Goal Cards Only */}
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: NEXT_BTN_HEIGHT + 48 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: 320, alignItems: 'flex-start' }}>
              {loading && <GoalSelectionSkeleton />}
              
              {/* Goal Cards */}
              {!loading && !error && options.map(goal => {
                const isSelected = selected.includes(goal.key);
                const icon = ICONS[goal.key] || ICONS.default;
                const iconBgColor = ICON_COLORS[goal.key] || ICON_COLORS.default;
                return (
                  <SelectableCard
                    key={goal.key}
                    icon={icon}
                    title={goal.title}
                    description={goal.desc}
                    selected={isSelected}
                    onPress={() => toggleSelect(goal.key)}
                    iconBgColor={iconBgColor}
                    backgroundColor={isDark ? '#14141C' : '#fff'}
                    rightIcon={
                      isSelected ? (
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
                );
              })}
            </View>
          </ScrollView>
        </View>
        {/* White gradient overlay above Next Button - Light Mode Only */}
        {!isDark && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: 60,
              bottom: NEXT_BTN_HEIGHT + 32,
              opacity: 1,
              zIndex: 15,
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        )}
        {/* Solid white background below gradient - Light Mode Only */}
        {!isDark && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: NEXT_BTN_HEIGHT + 32,
              bottom: 0,
              backgroundColor: '#fff',
              zIndex: 14,
            }}
          />
        )}
        {/* Gradient background for Next Button */}
        <LinearGradient
          // Adapt gradient to theme for a seamless fade effect
          colors={
            isDark
              ? ['rgba(13, 17, 23, 0)', '#0d1117'] // Dark theme fade to background
              : ['rgba(165, 207, 253, 0)', '#A5CFFD'] // Light theme fade to background
          }
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            height: 137,
            bottom: 0,
            opacity: 1,
            zIndex: 10,
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.8 }} // Smoother fade
        />
        {/* Fixed Next Button */}
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 32,
          alignItems: 'center',
          zIndex: 20,
        }}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
            loading={submitting}
            style={{ borderRadius: NEXT_BTN_RADIUS, height: NEXT_BTN_HEIGHT, width: 320 }}
            disabled={!isValid || submitting} // Disable button until valid selection or while submitting
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
