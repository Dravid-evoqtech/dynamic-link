import React from 'react';
import { View, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height, borderRadius = 8, style = {} }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Check if glassmorphismSkeleton style is being used
  const isGlassmorphism = style && (
    style.backgroundColor === 'transparent' || 
    (Array.isArray(style) && style.some(s => s && s.backgroundColor === 'transparent'))
  );

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          // Only apply background color if not using glassmorphism style
          backgroundColor: isGlassmorphism ? 'transparent' : (isDark ? '#2A2A3A' : '#E5E5E5'),
          opacity,
        },
        style,
      ]}
    />
  );
};

export const OpportunityCardSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <SkeletonLoader width="80%" height={20} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
        <SkeletonLoader width="100%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
        <View style={styles.tagsRow}>
          <SkeletonLoader width={60} height={24} borderRadius={12} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={80} height={24} borderRadius={12} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
        </View>
      </View>
      <SkeletonLoader width={44} height={44} borderRadius={22} style={styles.glassmorphismSkeleton} />
    </View>
  );
};

export const ApplicationCardSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <SkeletonLoader width="70%" height={20} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
        <SkeletonLoader width="50%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
        <SkeletonLoader width="40%" height={14} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
        <View style={styles.tagsRow}>
          <SkeletonLoader width={50} height={20} borderRadius={10} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={60} height={20} borderRadius={10} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
        </View>
      </View>
      <SkeletonLoader width={80} height={32} borderRadius={16} style={styles.glassmorphismSkeleton} />
    </View>
  );
};

export const NavigationBarSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.navContainer}>
      {/* Top Row: Title + Bell */}
      <View style={styles.navTopRow}>
        <SkeletonLoader width={100} height={32} borderRadius={8} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={44} height={44} borderRadius={22} style={styles.glassmorphismSkeleton} />
      </View>

      {/* Middle Row: Location + Edit */}
      <View style={styles.navLocationRow}>
        <SkeletonLoader width={16} height={16} borderRadius={8} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={120} height={20} borderRadius={6} style={[styles.glassmorphismSkeleton, { marginLeft: 6 }]} />
        <SkeletonLoader width={16} height={16} borderRadius={8} style={[styles.glassmorphismSkeleton, { marginLeft: 6 }]} />
      </View>

      {/* Bottom Row: Search + Filter */}
      <View style={styles.navSearchRow}>
        <SkeletonLoader width="85%" height={40} borderRadius={20} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={44} height={44} borderRadius={22} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
      </View>
    </View>
  );
};

export const TabBarSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.tabContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonLoader key={index} width={60} height={60} borderRadius={30} style={styles.glassmorphismSkeleton} />
      ))}
    </View>
  );
};

export const FilterSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.filterContainer}>
      <SkeletonLoader width="30%" height={20} style={[styles.glassmorphismSkeleton, { marginBottom: 16 }]} />
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonLoader key={index} width="100%" height={48} borderRadius={8} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
      ))}
    </View>
  );
};

export const OpportunityDetailsSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" }]}>
      <View style={[styles.sheet, { backgroundColor: isDark ? '#23272F' : '#FFFFFF' }]}>
        <LinearGradient
          colors={isDark ? ["#1a1f2e", "#2a2f3a"] : ["#0F80FA", "#A5CFFD"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheet}
        >
          {/* Banner Image Skeleton */}
          <View style={styles.skeletonImageContainer}>
            <SkeletonLoader width="100%" height={200} borderRadius={24} style={styles.glassmorphismSkeleton} />
          </View>

          {/* Content Skeleton */}
          <ScrollView contentContainerStyle={styles.skeletonScrollContent}>
            {/* Header Text Skeleton */}
            <View style={styles.skeletonTextContainer}>
              <SkeletonLoader width="80%" height={24} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
              <SkeletonLoader width="60%" height={18} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
              
              {/* Tags Skeleton */}
              <View style={styles.skeletonTagRow}>
                <SkeletonLoader width={80} height={32} borderRadius={16} style={styles.glassmorphismSkeleton} />
                <SkeletonLoader width={100} height={32} borderRadius={16} style={styles.glassmorphismSkeleton} />
                <SkeletonLoader width={90} height={32} borderRadius={16} style={styles.glassmorphismSkeleton} />
              </View>
            </View>

            {/* About Section Skeleton */}
            <SkeletonLoader width={60} height={20} style={[styles.glassmorphismSkeleton, { marginHorizontal: 20, marginBottom: 12 }]} />
            <View style={styles.skeletonInfoCardRow}>
              <View style={styles.skeletonInfoCard}>
                <SkeletonLoader width={26} height={26} style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} />
                <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 3 }]} />
                <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
              </View>
              <View style={styles.skeletonInfoCard}>
                <SkeletonLoader width={26} height={26} style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} />
                <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 3 }]} />
                <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
              </View>
              <View style={styles.skeletonInfoCard}>
                <SkeletonLoader width={26} height={26} style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} />
                <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 3 }]} />
                <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
              </View>
            </View>

            {/* Description Section Skeleton */}
            <View style={styles.skeletonDescriptionCard}>
              <SkeletonLoader width={100} height={20} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
              <SkeletonLoader width="100%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
              <SkeletonLoader width="95%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
              <SkeletonLoader width="90%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
              <SkeletonLoader width="85%" height={16} style={styles.glassmorphismSkeleton} />
            </View>
          </ScrollView>

          {/* Bottom Actions Skeleton */}
          <View style={styles.skeletonBottomActions}>
            <SkeletonLoader width={54} height={54} borderRadius={20} style={styles.glassmorphismSkeleton} />
            <SkeletonLoader width="80%" height={54} borderRadius={20} style={styles.glassmorphismSkeleton} />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export const CategoriesSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.sectionContainer}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={120} height={24} borderRadius={6} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={80} height={20} borderRadius={6} style={styles.glassmorphismSkeleton} />
      </View>

      {/* Category Cards */}
      <View style={styles.categoriesRow}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.categoryCard}>
            <SkeletonLoader 
              width={30} 
              height={30} 
              borderRadius={20} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12, alignSelf: 'flex-start' }]} 
            />
            <SkeletonLoader 
              width="80%" 
              height={18} 
              borderRadius={4} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 6, alignSelf: 'flex-start' }]} 
            />
            <SkeletonLoader 
              width="60%" 
              height={14} 
              borderRadius={4} 
              style={[styles.glassmorphismSkeleton, { alignSelf: 'flex-start' }]} 
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export const FeaturedSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.sectionContainer}>
      {/* Header Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={200} height={24} borderRadius={6} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={80} height={20} borderRadius={6} style={styles.glassmorphismSkeleton} />
      </View>

      {/* Featured Cards Row Skeleton */}
      <View style={styles.featuredCardsRowSkeleton}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.featuredSkeletonCard}>
            {/* Image Banner Skeleton */}
            <SkeletonLoader 
              width="100%" 
              height={80} 
              borderRadius={12} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            
            {/* Title Skeleton */}
            <SkeletonLoader 
              width="90%" 
              height={18} 
              borderRadius={4} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} 
            />
            
            {/* Description Skeleton */}
            <SkeletonLoader 
              width="100%" 
              height={14} 
              borderRadius={4} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 4 }]} 
            />
            
            {/* Meta Row Skeleton */}
            <View style={styles.featuredMetaRowSkeleton}>
              <SkeletonLoader width={40} height={14} borderRadius={4} style={styles.glassmorphismSkeleton} />
              <SkeletonLoader width={6} height={14} borderRadius={4} style={styles.glassmorphismSkeleton} />
              <SkeletonLoader width={35} height={14} borderRadius={4} style={styles.glassmorphismSkeleton} />
              <SkeletonLoader width={6} height={14} borderRadius={4} style={styles.glassmorphismSkeleton} />
              <SkeletonLoader width={50} height={14} borderRadius={6} style={styles.glassmorphismSkeleton} />
            </View>
            
            {/* Tags Container Skeleton */}
            <View style={styles.featuredTagsSkeleton}>
              <SkeletonLoader width={50} height={20} borderRadius={12} style={[styles.glassmorphismSkeleton, { marginRight: 6 }]} />
              <SkeletonLoader width={60} height={20} borderRadius={12} style={styles.glassmorphismSkeleton} />
            </View>
            
            {/* Bottom Row Skeleton */}
            <View style={styles.featuredBottomRowSkeleton}>
              <SkeletonLoader width={150} height={32} borderRadius={8} style={styles.glassmorphismSkeleton} />
              <SkeletonLoader width={32} height={32} borderRadius={14} style={styles.glassmorphismSkeleton} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const FeaturedCardSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.featuredSkeletonCard, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
      {/* Image Banner Skeleton */}
      <SkeletonLoader 
        width="100%" 
        height={120} 
        borderRadius={12} 
        style={[styles.glassmorphismSkeleton, { marginBottom: 10 }]} 
      />
      
      {/* Title Skeleton */}
      <SkeletonLoader 
        width="90%" 
        height={24} 
        borderRadius={4} 
        style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
      />
      
      {/* Description Skeleton */}
      <SkeletonLoader 
        width="100%" 
        height={18} 
        borderRadius={4} 
        style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} 
      />
      
      {/* Meta Row Skeleton */}
      <View style={styles.featuredMetaRowSkeleton}>
        <SkeletonLoader width={50} height={18} borderRadius={4} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={8} height={18} borderRadius={4} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={40} height={18} borderRadius={4} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={8} height={18} borderRadius={4} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={60} height={18} borderRadius={6} style={styles.glassmorphismSkeleton} />
      </View>
      
      {/* Tags Container Skeleton */}
      <View style={styles.featuredTagsSkeleton}>
        <SkeletonLoader width={50} height={20} borderRadius={12} style={[styles.glassmorphismSkeleton, { marginRight: 6 }]} />
        <SkeletonLoader width={60} height={20} borderRadius={12} style={styles.glassmorphismSkeleton} />
      </View>
      
      {/* Bottom Row Skeleton */}
      <View style={styles.featuredBottomRowSkeleton}>
        <SkeletonLoader width={178} height={38} borderRadius={8} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={38} height={38} borderRadius={14} style={styles.glassmorphismSkeleton} />
      </View>
    </View>
  );
};

export const SelectionListSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.selectionListSkeleton}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.selectionItemSkeleton}>
          <SkeletonLoader width={20} height={20} borderRadius={4} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width="70%" height={16} borderRadius={4} style={[styles.glassmorphismSkeleton, { marginLeft: 12 }]} />
        </View>
      ))}
    </View>
  );
};

export const OpportunityPreferencesSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.sectionContainer}>
      {/* Header skeleton */}
      <SkeletonLoader width="60%" height={24} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
      <SkeletonLoader width="80%" height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 24 }]} />
      
      {/* Looking For Section */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={100} height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
      </View>
      <SkeletonLoader width="100%" height={38} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
      <SkeletonLoader width="100%" height={38} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginBottom: 20 }]} />
      
      {/* Availability Section */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={80} height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
      </View>
      <SkeletonLoader width="100%" height={38} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginBottom: 20 }]} />
      
      {/* Location Section */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={120} height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
      </View>
      <SkeletonLoader width="100%" height={50} borderRadius={20} style={[styles.glassmorphismSkeleton, { marginBottom: 20 }]} />
      
      {/* Interests Section */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={70} height={16} style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} />
      </View>
      <View style={styles.tagsRow}>
        <SkeletonLoader width={80} height={32} borderRadius={16} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={100} height={32} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
        <SkeletonLoader width={90} height={32} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
      </View>
    </View>
  );
};

export const CardItemSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.cardItemSkeleton}>
      <SkeletonLoader width={20} height={20} borderRadius={4} style={styles.glassmorphismSkeleton} />
      <SkeletonLoader width={60} height={16} borderRadius={4} style={[styles.glassmorphismSkeleton, { marginLeft: 8 }]} />
    </View>
  );
};

export const ApplicationDetailsSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.skeletonContainer}>
      {/* Modal Title Skeleton */}
      <SkeletonLoader width={150} height={28} style={[styles.glassmorphismSkeleton, { marginBottom: 28, marginTop: 18 }]} />
      
      {/* Application Card Skeleton */}
      <SkeletonLoader width="100%" height={120} borderRadius={16} style={[styles.glassmorphismSkeleton, { marginBottom: 16 }]} />
      
      {/* Overview Section Skeleton */}
      <SkeletonLoader width={60} height={22} style={[styles.glassmorphismSkeleton, { marginTop: 12, marginBottom: 4 }]} />
      <View style={styles.skeletonOverviewRow}>
        <View style={styles.skeletonOverviewBox}>
          <SkeletonLoader width={24} height={24} style={[styles.glassmorphismSkeleton, { marginBottom: 4 }]} />
          <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 2 }]} />
          <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
        </View>
        <View style={styles.skeletonOverviewBox}>
          <SkeletonLoader width={24} height={24} style={[styles.glassmorphismSkeleton, { marginBottom: 4 }]} />
          <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 2 }]} />
          <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
        </View>
        <View style={styles.skeletonOverviewBox}>
          <SkeletonLoader width={24} height={24} style={[styles.glassmorphismSkeleton, { marginBottom: 4 }]} />
          <SkeletonLoader width="60%" height={12} style={[styles.glassmorphismSkeleton, { marginBottom: 2 }]} />
          <SkeletonLoader width="80%" height={14} style={styles.glassmorphismSkeleton} />
        </View>
      </View>

      {/* Application Status Section Skeleton */}
      <ApplicationStatusSkeleton />

      {/* Need Help Section Skeleton */}
      <SkeletonLoader width={100} height={22} style={[styles.glassmorphismSkeleton, { marginTop: 12, marginBottom: 4 }]} />
      <View style={styles.skeletonHelpBox}>
        <SkeletonLoader width={38} height={38} style={styles.glassmorphismSkeleton} />
        <View style={styles.skeletonHelpTextContainer}>
          <SkeletonLoader width="80%" height={11} style={[styles.glassmorphismSkeleton, { marginBottom: 4 }]} />
          <SkeletonLoader width="60%" height={18} style={styles.glassmorphismSkeleton} />
        </View>
      </View>
      
      {/* Bottom Buttons Skeleton */}
      <View style={styles.skeletonBottomButtons}>
        <SkeletonLoader width={54} height={54} borderRadius={16} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={275} height={54} borderRadius={20} style={styles.glassmorphismSkeleton} />
      </View>
    </View>
  );
};

export const ApplicationStatusSkeleton = () => {
  return (
    <>
      {/* Status Section Title */}
      <SkeletonLoader width={120} height={22} style={[styles.glassmorphismSkeleton, { marginTop: 8, marginBottom: 2 }]} />
      
      {/* Status Container */}
      <View style={styles.skeletonStatusContainer}>
        {/* Current Status Row */}
        <View style={styles.skeletonStatusRow}>
          <SkeletonLoader width={100} height={16} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={80} height={28} borderRadius={14} style={styles.glassmorphismSkeleton} />
        </View>
        
        {/* Status Description */}
        <SkeletonLoader width="100%" height={14} style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} />
        <SkeletonLoader width="85%" height={14} style={[styles.glassmorphismSkeleton, { marginBottom: 16 }]} />
        
        {/* Status Buttons - Smaller Horizontal Layout */}
        <View style={styles.skeletonStatusButtonsHorizontal}>
          <SkeletonLoader width={65} height={28} borderRadius={14} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={65} height={28} borderRadius={14} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={65} height={28} borderRadius={14} style={styles.glassmorphismSkeleton} />
          <SkeletonLoader width={65} height={28} borderRadius={14} style={styles.glassmorphismSkeleton} />
        </View>
      </View>
    </>
  );
};

export const FeaturedLoadingSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.featuredLoadingSkeleton}>
      {/* Simple loading indicator - minimal height */}
      <View style={styles.loadingIndicator}>
        <SkeletonLoader width={6} height={6} borderRadius={3} style={styles.glassmorphismSkeleton} />
        <SkeletonLoader width={6} height={6} borderRadius={3} style={[styles.glassmorphismSkeleton, { marginLeft: 6 }]} />
        <SkeletonLoader width={6} height={6} borderRadius={3} style={[styles.glassmorphismSkeleton, { marginLeft: 6 }]} />
      </View>
      <SkeletonLoader 
        width={80} 
        height={14} 
        borderRadius={7} 
        style={[styles.glassmorphismSkeleton, { marginTop: 8 }]} 
      />
    </View>
  );
};


export const ExploreSkeleton = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.exploreContainer}>
      {/* Top Section - Header/Search Area */}
      <View style={styles.exploreTopSection}>
        {/* Main Search Bar */}
        <SkeletonLoader 
          width="100%" 
          height={48} 
          borderRadius={24} 
          style={[styles.glassmorphismSkeleton, { marginBottom: 16 }]} 
        />
        
        {/* Title and Avatar Row */}
        <View style={styles.titleAvatarRow}>
          <View style={styles.titleStack}>
            <SkeletonLoader 
              width={120} 
              height={24} 
              borderRadius={12} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width={80} 
              height={18} 
              borderRadius={9} 
              style={styles.glassmorphismSkeleton} 
            />
          </View>
          <SkeletonLoader 
            width={40} 
            height={40} 
            borderRadius={20} 
            style={styles.glassmorphismSkeleton} 
          />
        </View>

        {/* Secondary Search/Filter Row */}
        <View style={styles.secondaryRow}>
          <SkeletonLoader 
            width="70%" 
            height={32} 
            borderRadius={16} 
            style={styles.glassmorphismSkeleton} 
          />
          <SkeletonLoader 
            width={32} 
            height={32} 
            borderRadius={16} 
            style={styles.glassmorphismSkeleton} 
          />
        </View>

        {/* Long Horizontal Bar */}
        <SkeletonLoader 
          width="100%" 
          height={20} 
          borderRadius={10} 
          style={[styles.glassmorphismSkeleton, { marginTop: 16 }]} 
        />
      </View>

      {/* Middle Section - Content Cards */}
      <View style={styles.exploreContentSection}>
        {/* Three Small Cards Row */}
        <View style={styles.smallCardsRow}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.smallCard}>
              <SkeletonLoader 
                width={32} 
                height={32} 
                borderRadius={16} 
                style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
              />
              <SkeletonLoader 
                width="80%" 
                height={16} 
                borderRadius={8} 
                style={[styles.glassmorphismSkeleton, { marginBottom: 6 }]} 
              />
              <SkeletonLoader 
                width="60%" 
                height={14} 
                borderRadius={7} 
                style={styles.glassmorphismSkeleton} 
              />
            </View>
          ))}
        </View>

        {/* Section Title */}
        <SkeletonLoader 
          width="60%" 
          height={20} 
          borderRadius={10} 
          style={[styles.glassmorphismSkeleton, { marginVertical: 20 }]} 
        />

        {/* Two Large Cards Row */}
        <View style={styles.largeCardsRow}>
          <View style={styles.largeCard}>
            <SkeletonLoader 
              width="100%" 
              height={120} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width="80%" 
              height={18} 
              borderRadius={9} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="100%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="70%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width={32} 
              height={32} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { alignSelf: 'flex-end' }]} 
            />
          </View>
          
          <View style={styles.largeCard}>
            <SkeletonLoader 
              width="100%" 
              height={100} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width="90%" 
              height={18} 
              borderRadius={9} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="100%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="80%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width={32} 
              height={32} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { alignSelf: 'flex-end' }]} 
            />
          </View>
        </View>

        {/* Another Section Title */}
        <SkeletonLoader 
          width="50%" 
          height={20} 
          borderRadius={10} 
          style={[styles.glassmorphismSkeleton, { marginVertical: 20 }]} 
        />

        {/* Another Two Large Cards Row */}
        <View style={styles.largeCardsRow}>
          <View style={styles.largeCard}>
            <SkeletonLoader 
              width="100%" 
              height={120} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width="85%" 
              height={18} 
              borderRadius={9} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="100%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="75%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width={32} 
              height={32} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { alignSelf: 'flex-end' }]} 
            />
          </View>
          
          <View style={styles.largeCard}>
            <SkeletonLoader 
              width="100%" 
              height={100} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width="80%" 
              height={18} 
              borderRadius={9} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="100%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 8 }]} 
            />
            <SkeletonLoader 
              width="70%" 
              height={16} 
              borderRadius={8} 
              style={[styles.glassmorphismSkeleton, { marginBottom: 12 }]} 
            />
            <SkeletonLoader 
              width={32} 
              height={32} 
              borderRadius={16} 
              style={[styles.glassmorphismSkeleton, { alignSelf: 'flex-end' }]} 
            />
          </View>
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNavBar, { 
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }]}>
        <View style={styles.navIconContainer}>
          <View style={styles.dashboardIcon}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dashboardDot, 
                  { backgroundColor: '#2E90FA' }
                ]} 
              />
            ))}
          </View>
        </View>
        
        <SkeletonLoader 
          width={24} 
          height={24} 
          borderRadius={12} 
          style={[styles.navIcon, { backgroundColor: isDark ? '#666' : '#999' }]} 
        />
        
        <SkeletonLoader 
          width={24} 
          height={24} 
          borderRadius={12} 
          style={[styles.navIcon, { backgroundColor: isDark ? '#666' : '#999' }]} 
        />
        
        <SkeletonLoader 
          width={24} 
          height={24} 
          borderRadius={12} 
          style={[styles.navIcon, { backgroundColor: isDark ? '#666' : '#999' }]} 
        />
        
        <SkeletonLoader 
          width={24} 
          height={24} 
          borderRadius={12} 
          style={[styles.navIcon, { backgroundColor: isDark ? '#666' : '#999' }]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    width: '100%', // Use 100% width instead of hardcoded 339
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navContainer: {
    padding: 16,
    marginTop: 30,
  },
  navTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  navSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
  },
  filterContainer: {
    padding: 16,
    borderRadius: 12,
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featuredRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featuredTag: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  featuredActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionListSkeleton: {
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    maxHeight: 150,
  },
  selectionItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },

  glassmorphismSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  exploreContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  exploreTopSection: {
    marginBottom: 24,
  },
  titleAvatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleStack: {
    flex: 1,
    marginRight: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exploreContentSection: {
    flex: 1,
    marginBottom: 24,
  },
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  smallCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  largeCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  largeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  navIconContainer: {
    width: 24,
    height: 24,
  },
  dashboardIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    height: 24,
  },
  dashboardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  // ApplicationDetailsSkeleton styles
  skeletonContainer: {
    width: 339,
    height: 541,
    opacity: 1,
    position: 'absolute',
    top: 0,
    alignItems: 'stretch',
  },
  skeletonCardWrapper: {
    marginBottom: 16,
  },
  skeletonTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonOverviewBox: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: 100,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  skeletonHelpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  skeletonHelpContent: {
    flex: 1,
  },
  skeletonBottomButtons: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 29,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // OpportunityDetailsSkeleton styles
  skeletonInfoCard: {
    width: 105,
    borderRadius: 17,
    height: 89,
    padding: 12,
    elevation: 1,
    alignItems: 'flex-start',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  skeletonDescriptionCard: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Dimensions.get('window').height * 0.85,
    overflow: "hidden",
  },
  skeletonImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  skeletonScrollContent: {
    paddingBottom: 100,
  },
  skeletonTextContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  skeletonTagRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  skeletonInfoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 6,
  },
  skeletonBottomActions: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  // ApplicationStatusSkeleton styles
  skeletonStatusContainer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  skeletonStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonStatusButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  skeletonStatusButtonsHorizontal: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 16,
  },
  skeletonHelpTextContainer: {
    flex: 1,
  },
  featuredSkeletonCard: {
    width: 250,
    borderRadius: 20,
    padding: 12,
    marginRight: 6,
    marginLeft: 0, // Remove left margin to match FeaturedSection changes
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featuredMetaRowSkeleton: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 2,
  },
  featuredTagsSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 10,
  },
  featuredBottomRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  featuredCardsRowSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 18, // Match FeaturedSection paddingHorizontal: 18
    gap: 12,
  },
  featuredLoadingSkeleton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: 250,
    minHeight: 80,
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

});

export default SkeletonLoader;