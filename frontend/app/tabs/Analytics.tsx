import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, AppState, AppStateStatus, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { router } from 'expo-router';

import { Svg, Circle } from 'react-native-svg';

import { applicationsAPI, userAPI, referralAPI } from '../services/api';
import { useApplicationStatsQuery, useProfileQuery, useReferralLinkQuery } from '../services/queries';
import Background from '../components/Background';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import { Share } from 'react-native';

import { useTheme } from '@/hooks/useThemeContext';

const { width } = Dimensions.get('window');

// TypeScript interfaces
interface StatCardProps {
  iconSource: any;
  title: string;
  value: string;
  color?: string;
  iconSource2?: any;
  cardBg: string;
  textColor: string;
  subtitleColor: string;
  style?: any;  // Add optional style prop
}

interface ReferralLinkCardProps {
  referralLink: string;
  cardBg: string;
  textColor: string;
  inputBg: string;
  buttonBg: string;
  isLoading?: boolean;
  errorMessage?: string;
  onGenerateLink?: () => Promise<void>;
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

// Helper component for the summary cards (Points Summary, Application Stats)
const StatCard: React.FC<StatCardProps> = ({ iconSource, title, value, color, iconSource2, cardBg, textColor, subtitleColor }) => (
  <View style={[styles.statCard, { backgroundColor: cardBg }]}>
    <View style={[styles.statIconContainer, { backgroundColor: color }]}>
      <Image source={iconSource} style={styles.statCardIcon} />
    </View>
    <View style={styles.statCardContent}>
      <Text style={[styles.statCardTitle, { color: subtitleColor }]}>{title}</Text>
      <View style={styles.statCardValueContainer}>
        {iconSource2 && <Image source={iconSource2} style={styles.statValueIcon} />}
        <Text 
          style={[styles.statCardValue, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </View>
  </View>
 );

const StatCard2: React.FC<StatCardProps> = ({ iconSource, title, value, color, cardBg, textColor, subtitleColor, style }) => (
  <View style={[styles.statCard, { backgroundColor: cardBg }, style]}>
    <View style={[styles.statIconContainer, { backgroundColor: color }]}>
      <Image source={iconSource} style={styles.statCardIcon} />
    </View>
    <View style={styles.statCardContent}>
      <Text style={[styles.statCardTitle, { color: subtitleColor }]}>{title}</Text>
      <View style={styles.statCardValueContainer}>
        <Text style={[styles.statCardValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  </View>
);

// Modified Referral Link Card Component to match the "Invite a Friend" image
const ReferralLinkCard: React.FC<ReferralLinkCardProps> = ({ referralLink, cardBg, textColor, inputBg, buttonBg, isLoading, errorMessage, onGenerateLink }) => {
  const [shareSuccess, setShareSuccess] = useState(false);

  const shareReferralLink = async () => {
    try {
      setShareSuccess(false);
      
      // If no referral link exists, generate one first
      if (!referralLink && onGenerateLink) {
        await onGenerateLink();
        // Wait a moment for the link to be generated and state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // If still no referral link after generation attempt, show error
      if (!referralLink) {
        return;
      }
      
      // Platform-specific share message
      let shareMessage: string;
      let shareTitle: string;
      
      if (Platform.OS === 'ios') {
        shareMessage = `🚀 Join me on FutureFind! 

Discover amazing opportunities for students like you. Use my referral link to get started and unlock exclusive features!

${referralLink}

#FutureFind #StudentOpportunities #Referral`;
        shareTitle = 'FutureFind - Student Opportunities Platform';
      } else {
        // Android - shorter message for better compatibility
        shareMessage = `🚀 Join me on FutureFind! Use my referral link: ${referralLink}`;
        shareTitle = 'FutureFind Referral';
      }

      const result = await Share.share({
        message: shareMessage,
        title: shareTitle,
        url: referralLink,
      });
      
      if (result.action === Share.sharedAction) {
        setShareSuccess(true);
        // Reset success state after 3 seconds
        setTimeout(() => setShareSuccess(false), 3000);
      }
          } catch (error) {
        // Handle share error silently
      }
  };

  // Function to truncate long URLs - returns array of text elements to avoid text node errors
  const truncateUrl = (url: string, maxLength: number = 35) => {
    if (url.length <= maxLength) return [url];
    
    // Try to keep the domain and truncate the path
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;
      
      if (domain.length + 10 > maxLength) {
        // If domain is too long, truncate it
        return [domain.substring(0, maxLength - 3), '...'];
      }
      
      // Keep domain and truncate path
      const remainingLength = maxLength - domain.length - 3; // 3 for "..."
      if (path.length > remainingLength) {
        return [domain, path.substring(0, remainingLength), '...'];
      }
      
      return [url];
    } catch {
      // If URL parsing fails, just truncate the string
      return [url.substring(0, maxLength - 3), '...'];
    }
  };

  return (
    <View style={[styles.inviteFriendCardContainer, { backgroundColor: cardBg }]}>
      <Text style={[styles.inviteFriendTitle, { color: textColor }]}>Invite a Friend</Text>
      <Text style={[styles.inviteFriendDescription, { color: textColor }]}>
        <Text style={styles.inviteFriendDescriptionBlue}>Share your referral link</Text> and earn
        an <Text style={styles.inviteFriendDescriptionBlue}>unlock token</Text> when they sign
        up!
      </Text>

      <View style={[styles.referralLinkInputContainer, { backgroundColor: inputBg }]}>
        <Text style={[styles.referralLinkDisplay, { color: textColor }]}>
          {isLoading ? 'Creating referral link...' : (referralLink ? 
            truncateUrl(referralLink).map((part, index) => (
              <Text key={index} style={[styles.referralLinkDisplay, { color: textColor }]}>
                {part}
              </Text>
            ))
          : 'Click here to generate link')}
        </Text>
        <TouchableOpacity 
          style={[
            styles.copyButton, 
            { 
              backgroundColor: shareSuccess ? '#4ECDC4' : buttonBg,
              opacity: shareSuccess ? 0.8 : 1
            }
          ]} 
          onPress={referralLink ? shareReferralLink : onGenerateLink}
                  onLongPress={async () => {
          if (referralLink) {
            try {
              const Clipboard = await import('expo-clipboard');
              await Clipboard.setStringAsync(referralLink);
            } catch (error) {
              // Handle clipboard error silently
            }
          }
        }}
          disabled={isLoading}
        >
          <Text style={styles.copyButtonTextNew}>
            {isLoading ? 'Creating...' : 
             shareSuccess ? 'Shared! ✓' : 
             (referralLink ? 'Share Link' : 'Generate Link')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={[styles.referralErrorText, { color: '#FF6B6B' }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onGenerateLink}
            disabled={isLoading}
          >
            <Text style={styles.retryButtonText}>
              {isLoading ? 'Creating...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size = 40, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(74, 78, 86, 1)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#2E90FA"
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default function AnalyticsScreen({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const appState = useRef(AppState.currentState);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    acceptedApplications: 0,
    savedOpportunities: 0,
  });
  const [points, setPoints] = useState({
    applications: 0,
    dailyActivity: 0,
    profile: 0,
    usage: 0,
    total: 0,
  });
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    weekData: [
      { day: 'M', progress: 0 },
      { day: 'T', progress: 0 },
      { day: 'W', progress: 0 },
      { day: 'T', progress: 0 },
      { day: 'F', progress: 0 },
      { day: 'S', progress: 0 },
      { day: 'S', progress: 0 },
    ]
  });

  const { data: profileData, refetch: profileRefetch } = useProfileQuery();
  const derivedUserId = (profileData?._id || profileData?.id || profileData?.userId || profileData?.user_id) as string | undefined;
  
  // React Query for referral link with caching
  const { 
    data: referralLink, 
    isLoading: referralLoading, 
    error: referralError,
    refetch: refetchReferralLink
  } = useQuery({
    queryKey: ['referralLink', derivedUserId],
    queryFn: async () => {
      if (!derivedUserId) return null;
      
      const { referralAPI } = await import('../services/api');
      const response = await referralAPI.createReferral(derivedUserId);
      
      // Check different possible response formats
      if (response) {
        if (response.link) {
          return response.link;
        } else if (response.referralLink) {
          return response.link;
        } else if (response.data && response.data.link) {
          return response.data.link;
        } else if (response.data && response.data.referralLink) {
          return response.data.referralLink;
        } else if (response.url) {
          return response.url;
        }
      }
      throw new Error('Invalid response format from server');
    },
    enabled: false, // Don't run automatically, only when manually triggered
    staleTime: 24 * 60 * 60 * 1000, // Data is fresh for 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
    retry: 2, // Retry failed requests 2 times
  });

  const { data: statsData } = useApplicationStatsQuery();
  const { data: userData } = useProfileQuery();

  useEffect(() => {
    // Stats
    if (statsData) {
      setStats({
        totalApplications: statsData.totalApplicationCount || 0,
        acceptedApplications: statsData.totalAppliedApplicationCount || 0,
        savedOpportunities: statsData.totalSavedApplicationCount || 0,
      });
    }

    // User points and streak
    if (userData) {
      const loginData = userData.loginData;
      const pointsData = userData.points;
      
      // Update points state
      setPoints({
        applications: pointsData.applications || 0,
        dailyActivity: pointsData.dailyActivity || 0,
        profile: pointsData.profile || 0,
        usage: pointsData.usage || 0,
        total: pointsData.total || 0,
      });

      // Calculate week data for streak visualization
      const week = [];
      const today = new Date();
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const dayLogin = loginData.loginHistory?.find((login: any) => {
          const loginDate = new Date(login.date).toISOString().split('T')[0];
          return loginDate === dateString;
        });
        
        let progress = 0;
        if (dayLogin) {
          const dayPercentage = dayLogin.dayPercentage || 0;
          // Show 100% only if backend has 100%, otherwise show 50%
          progress = dayPercentage === 100 ? 100 : 50;
        }
        week.push({ day: dayNames[i], progress });
      }
      setStreakData({ currentStreak: loginData.currentLoginStreak || 0, weekData: week });
    }

    setLoading(false);
  }, [statsData, userData]);

  // Generate referral link on-demand when needed
  const generateReferralLink = async () => {
    if (!derivedUserId) {
      return;
    }

    if (referralLink) {
      // If we already have a referral link, just use it
      return;
    }

    // Use React Query refetch to generate the link
    try {
      await refetchReferralLink();
    } catch (error) {
      // Error handling is done by React Query
    }
  };

  // Mount / Unmount
  useEffect(() => {
    
    // Clear only data queries when component mounts to ensure fresh data for new users
    const clearDataCache = async () => {
      try {
        // Instead of clearing all cache, only invalidate specific data queries
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        await queryClient.invalidateQueries({ queryKey: ['applicationStats'] });
        await queryClient.invalidateQueries({ queryKey: ['referralLink'] });
      } catch (error) {
        console.error('[Analytics] Failed to invalidate data cache:', error);
      }
    };
    
    clearDataCache();
    
    return () => {
    };
  }, [queryClient]);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      
      // Force refresh all data when screen is focused to ensure we get the latest from backend
      const refreshData = async () => {
        try {
          // Force the profile query to refetch fresh data
          await profileRefetch();
          
        } catch (error) {
          console.error('[Analytics] Failed to refresh profile data on focus:', error);
        }
      };
      
      refreshData();
      
      return () => {
      };
    }, [profileRefetch])
  );

  // AppState changes
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      appState.current = nextState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Note: Login streak tracking has been moved to MainTabsScreen.tsx
  // so it starts when the app opens, not just when Analytics screen is opened

  // Handle hardware back button (Android) and iOS navigation
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        // Let the parent MainTabsScreen handle back navigation
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
    // iOS handles back navigation through swipe gestures and navigation bars
  }, []);

  // Define theme colors
  const colors = {
    cardBg: isDark ? '#23272F' : '#fff',
    textPrimary: isDark ? '#fff' : 'rgba(16, 16, 23, 1)',
    textSecondary: isDark ? '#B0B0B0' : 'rgba(109, 109, 115, 1)',
    divider: isDark ? '#35383F' : 'rgba(228, 228, 229, 1)',
    statCardBg: isDark ? '#2A2E36' : 'rgba(246, 245, 244, 1)',
    inputBg: isDark ? '#35383F' : 'rgba(246, 245, 244, 1)',
    copyButtonBg: isDark ? '#2E90FA' : 'rgba(16, 16, 23, 1)',
    dayCircleBorder: isDark ? '#4A4E56' : 'rgba(35, 35, 78, 1)',
  };

  // Dummy data for rendering
  const loginStreakDays = [
    { day: 'M', checked: true, icon: null },
    { day: 'T', checked: true, icon: null },
    { day: 'W', checked: true, icon: null },
    { day: 'T', checked: true, icon: null },
    { day: 'F', checked: false, icon: null },
    { day: 'S', checked: false, icon: null },
    { day: 'S', checked: false, icon: null },
  ];

  return (
    <Background>
      {/* Header - Fixed outside scroll view */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your achievements & progress</Text>
        </View>
        <TouchableOpacity style={styles.headerIconWrapper} onPress={() => router.push('/NotificationsScreen' as any)}>
          <Image
            source={
              isDark
                ? require('../../assets/icons/bell(D).png')
                : require('../../assets/icons/bell(L).png')
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Scroll View - Starts after header */}
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Points Summary Section - First Card */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBg, marginTop: 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Points Summary</Text>
            <View style={styles.pointsTotalContainer}>
              <Image
                source={require('../../assets/icons/pointsicon.png')}
                style={styles.pointsicon}
              />
              <Text style={styles.pointsTotalText}>{loading ? '...' : `${points.total} Points`}</Text>
            </View>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statCardsRow}>
              <StatCard
                iconSource={require('../../assets/icons/dailyactivityicon.png')}
                title="Daily Activity"
                value={loading ? '...' : `${points.dailyActivity} Points`}
                iconSource2={require('../../assets/icons/pointsicon(y).png')}
                cardBg={colors.statCardBg}
                textColor={colors.textPrimary}
                subtitleColor={colors.textSecondary}
              />
              <StatCard
                iconSource={require('../../assets/icons/profileicon.png')}
                title="Used points"
                value={loading ? '...' : `${points.usage} Points`}
                iconSource2={require('../../assets/icons/pointsicon(p).png')}
                cardBg={colors.statCardBg}
                textColor={colors.textPrimary}
                subtitleColor={colors.textSecondary}
              />
            </View>
        </View>

        {/* Referral Link Section */}
        <ReferralLinkCard 
          referralLink={referralLink} 
          cardBg={colors.cardBg}
          textColor={colors.textPrimary}
          inputBg={colors.inputBg}
          buttonBg={colors.copyButtonBg}
          isLoading={referralLoading}
          errorMessage={referralError instanceof Error ? referralError.message : referralError || undefined}
          onGenerateLink={generateReferralLink}
        />

        {/* Login Streak Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle2, { color: colors.textPrimary }]}>Login Streak</Text>
            <View style={styles.pointsTotalContainer}>
              <Image
                source={require('../../assets/icons/dailyactivityicon.png')}
                style={styles.pointsicon}
              />
              <Text style={styles.pointsTotalText}>{streakData.currentStreak} Days</Text>
            </View>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.loginStreakContainer}>
            <View style={styles.loginStreakRow}>
              {streakData.weekData.map((day, index) => (
                <View key={index} style={{ alignItems: 'center' }}>
                  <Text style={[styles.dayText, { color: colors.textSecondary }]}>{day.day}</Text>
                  <View style={[
                    styles.dayCircle, 
                    { 
                      borderColor: 'transparent',
                      backgroundColor: 'transparent', // Remove blue background
                      opacity: day.progress > 0 ? 1 : 0.3,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }
                  ]}>
                    <CircularProgress progress={day.progress} />
                    
                    {/* Checkmark for 100% only */}
                    {day.progress === 100 && (
                      <Text style={{
                        color: '#2E90FA', // Blue checkmark, not white
                        fontSize: 16,
                        fontWeight: 'bold',
                        zIndex: 10,
                      }}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <Text style={[styles.streakMessage, { color: colors.textSecondary }]}>
              Keep it up, you're <Text style={[styles.boldText, { color: colors.textPrimary }]}>3 days</Text> away from a{' '}
              <Text style={[styles.boldText, { color: colors.textPrimary }]}>7 day streak</Text>!
            </Text>
          </View>
        </View>

        {/* Application Stats Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle3, { color: colors.textPrimary }]}>Application Stats</Text>
            <TouchableOpacity onPress={() => onTabChange ? onTabChange('Application') : router.push('/tabs/Apllication' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.statCardsRow3}>
            <StatCard2
              iconSource={require('../../assets/icons/applicationroundedicon.png')}
              title="Total"
              value={loading ? '...' : stats.totalApplications.toString()}
              cardBg={colors.statCardBg}
              textColor={colors.textPrimary}
              subtitleColor={colors.textSecondary}
              style={styles.statCard3}  // Use the smaller card style
            />
            <StatCard2
              iconSource={require('../../assets/icons/saved.png')}
              title="Accepted"
              value={loading ? '...' : stats.acceptedApplications.toString()}
              cardBg={colors.statCardBg}
              textColor={colors.textPrimary}
              subtitleColor={colors.textSecondary}
              style={styles.statCard3}  // Use the smaller card style
            />
            <StatCard2
              iconSource={require('../../assets/icons/accepted.png')}
              title="Saved"
              value={loading ? '...' : stats.savedOpportunities.toString()}
              cardBg={colors.statCardBg}
              textColor={colors.textPrimary}
              subtitleColor={colors.textSecondary}
              style={styles.statCard3}  // Use the smaller card style
            />
          </View>
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 100,
    paddingHorizontal: 10,
    paddingTop: 0, // Remove top padding since header is fixed
  },
  headerContainer: {
    flexDirection: 'row',
    marginTop: 53,
    marginBottom: 12,
  },
  headerTextContainer: {
    width: 285,
    height: 56,
    gap: 4,
    opacity: 1,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 100,
    padding: 8,
    gap: 18,
    opacity: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'white',
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    opacity: 0.7,
  },
  icon: {
    width: 44,
    height: 44,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: 339,
    height: 172.56402587890625,
  },
  profileCardSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    height: 55,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2E90FA',
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(246, 245, 244, 1)',
    opacity: 1,
    gap: 4,
    paddingRight: 8,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 18,
    height: 18,
    borderRadius: 18,
    backgroundColor: '#F5F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(228, 228, 229, 1)',
    opacity: 0.5,
  },
  progressBarSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#2E90FA',
    borderRadius: 4,
  },
  progressLabelBadge1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(178, 221, 255, 0.32)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressLabelBadge2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 223, 137, 0.32)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressIcon: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabelText1: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: 'rgba(46, 144, 250, 1)',
    marginLeft: 2,
  },
  progressLabelText2: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: 'rgba(247, 144, 9, 1)',
    marginLeft: 2,
  },
  achievementsSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 339,
    height: 36.56402587890625,
    borderRadius: 20,
    opacity: 1,
    gap: 8,
  },
  achievementIcons: {
    flexDirection: 'row',
    position: 'relative',
    width: 48.56562423706055,
    height: 26.564027786254883,
    opacity: 1,
  },
  achievementIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 238.56562423706055,
    height: 26.564027786254883,
    opacity: 1,
    gap: 8,
  },
  achievementIconOverlap1: {
    position: 'absolute',
    zIndex: 3,
    width: 23.32,
    height: 26.15,
  },
  achievementIconOverlap2: {
    position: 'absolute',
    left: 6,
    zIndex: 2,
    width: 26.56,
    height: 26.56,
  },
  achievementIconOverlap3: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    width: 26.18,
    height: 26.18,
  },
  achievementIconOverlap4: {
    position: 'absolute',
    left: 26,
    zIndex: 0,
    width: 23.26,
    height: 26.00,
  },
  achievementsText: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(16, 16, 23, 1)',
  },
  viewAllText: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(46, 144, 250, 1)',
  },
  sectionContainer: {
    width: 339,
    height: 180,
    borderRadius: 20,
    opacity: 1,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 47,
    opacity: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    height: 20,
    opacity: 1,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(16, 16, 23, 1)',
  },
  sectionTitle2: {
    height: 20,
    opacity: 1,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(16, 16, 23, 1)',
  },
  sectionTitle3: {
    height: 20,
    opacity: 1,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(16, 16, 23, 1)',
  },
  pointsTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsicon: {
    width: 20.09,
    height: 20.09,
  },
  pointsTotalText: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(46, 144, 250, 1)',
    marginLeft: 2,
  },
  statCardsRow: {
    width: '100%',
    height: 128,
    borderRadius: 20,
    opacity: 1,
    gap: 8,  // Gap for Points Summary (2 cards)
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',  // For Points Summary (2 cards)
    flexWrap: 'nowrap',  // Prevent wrapping for Points Summary
  },
  statCardsRow3: {  // New style for Application Stats (3 cards)
    width: '100%',
    height: 128,
    borderRadius: 20,
    opacity: 1,
    gap: 8,
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'center',  // Center for 3 cards
    flexWrap: 'wrap',  // Allow wrapping for 3 cards
  },
  statCard: {
    width: 145,  // Width for Points Summary (2 cards side by side)
    height: 100,
    borderRadius: 16,
    opacity: 1,
    gap: 11,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  statCard3: {  // New style for Application Stats (3 cards)
    width: 97,  // Original width for 3 cards
    height: 100,
    borderRadius: 16,
    opacity: 1,
    gap: 11,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  statCardContent: {
    width: '100%', // Use full width instead of fixed 73px
    height: 33,
    opacity: 1,
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  statCardTitle: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: -0.1,
    // color: 'rgba(109, 109, 115, 1)', // Remove hardcoded color
    marginBottom: 4,
  },
  statCardValueContainer: {
    width: '100%', // Use full width instead of fixed 71px
    height: 18,
    borderRadius: 14,
    opacity: 1,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap', // Prevent text wrapping
  },
  statValueIcon: {
    width: 13.04,
    height: 13.04,
  },
  statCardValue: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 18,
    flex: 1, // Take remaining space
    flexShrink: 0, // Prevent shrinking
    textAlign: 'left', // Ensure left alignment
    // color: 'rgba(16, 16, 23, 1)', // Remove hardcoded color
  },
  loginStreakContainer: {
    width: '100%',
    height: 130,
    borderRadius: 20,
    opacity: 1,
    gap: 12,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  loginStreakRow: {
    flexDirection: 'row',
    width: '100%',
    height: 68,
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 1,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 8,
    borderColor: 'rgba(35, 35, 78, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 5,
    opacity: 0.2,
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
    position: 'absolute',
  },
  dayText: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6D6D73',
  },
  streakMessage: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: 'rgba(109, 109, 115, 1)',
  },
  boldText: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    color: 'rgba(16, 16, 23, 1)',
  },

  // NEW/MODIFIED STYLES FOR "INVITE A FRIEND" CARD
  inviteFriendCardContainer: {
    width: 339,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 20,
    alignSelf: 'center',
  },
  inviteFriendTitle: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    color: 'rgba(16, 16, 23, 1)',
    marginBottom: 8,
  },
  inviteFriendDescription: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(16, 16, 23, 1)',
    marginBottom: 20,
  },
  inviteFriendDescriptionBlue: {
    color: 'rgba(46, 144, 250, 1)',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
  },
  referralLinkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 245, 244, 1)',
    borderRadius: 12,
    paddingRight: 8,
  },
  referralLinkDisplay: {
    flex: 1,
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(16, 16, 23, 1)',
    paddingVertical: 12,
    paddingLeft: 16,
  },
  copyButton: {
    backgroundColor: 'rgba(16, 16, 23, 1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonTextNew: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: 'white',
  },
  progressCircle: {
    position: 'absolute',
    width: '100%',
    borderRadius: 20,
    bottom: 0,
  },
  referralErrorText: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#2E90FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
  },
});







