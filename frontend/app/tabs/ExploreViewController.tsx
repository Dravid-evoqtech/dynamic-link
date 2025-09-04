import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  AppState,
  AppStateStatus,
  Text,
  BackHandler,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import Background from '../components/Background';
import NavigationBar from '../components/explore/NavigationBar';
import CategoriesSection from '../components/explore/CategoriesSection';
import FeaturedSection from '../components/explore/FeaturedSection';
import AllOpportunities from '../components/explore/AllOpportunities';
import FilterActionSheet from '../components/explore/FilterActionSheet';

import { useTheme } from '@/hooks/useThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { opportunitiesAPI } from '../services/api';
import { queryKeys, useCategoriesQuery } from '../services/queries';
import { useProfileQuery } from '../services/queries';
import authService from '../services/authService';
import { NavigationBarSkeleton, CategoriesSkeleton, FeaturedSkeleton, OpportunityCardSkeleton } from '../components/SkeletonLoader';

const ExploreViewController = () => {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const queryClient = useQueryClient();
  
  // Get current user data to check authentication
  const { data: userData, isLoading: userLoading } = useProfileQuery();
  
  // Mount / Unmount
  useEffect(() => {
    console.log('[ExploreViewController] mounted');
    
    // Clear only data queries when component mounts to ensure fresh data for new users
    const clearDataCache = async () => {
      try {
        // Instead of clearing all cache, only invalidate specific data queries
        await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        await queryClient.invalidateQueries({ queryKey: ['featured'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        console.log('[ExploreViewController] Data cache invalidated on mount');
      } catch (error) {
        console.error('[ExploreViewController] Failed to invalidate data cache:', error);
      }
    };
    
    clearDataCache();
    
    return () => {
      console.log('[ExploreViewController] unmounted');
    };
  }, [queryClient]);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      console.log('[ExploreViewController] focused');
      return () => {
        console.log('[ExploreViewController] unfocused');
      };
    }, [])
  );

  // AppState changes
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      console.log('[ExploreViewController] AppState:', appState.current, '->', nextState);
      appState.current = nextState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

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
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'All',
    program: 'Internship',
    sortBy: 'Featured'
  });
  
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Ref for main ScrollView to enable auto-scroll to opportunities
  const mainScrollViewRef = useRef<ScrollView>(null);
  const allOpportunitiesRef = useRef<View>(null);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  // Use regular queries for initial loading with proper caching
  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesQuery();
  // Note: FeaturedSection handles its own useFeaturedInfiniteQuery call
  // Note: AllOpportunities handles its own useOpportunitiesInfiniteQuery call
  
  const [fontsLoaded] = useFonts({
    'UberMoveText-Regular': require('../../assets/fonts/UberMoveTextRegular.otf'),
    'UberMoveText-Light': require('../../assets/fonts/UberMoveTextLight.otf'),
    'UberMoveText-Medium': require('../../assets/fonts/UberMoveTextMedium.otf'),
    'UberMoveText-Bold': require('../../assets/fonts/UberMoveTextBold.otf'),
  });

  const handleApplyFilters = (filters: { type: string; program: string; sortBy: string }) => {
    console.log('Applied filters:', filters);
    setAppliedFilters(filters);
  };

  const handleCategorySelect = (categoryName: string) => {
    console.log('Category selected:', categoryName);
    setSelectedCategory(categoryName);
    // Clear search when category is selected
    setSearchResults([]);
    setIsSearchActive(false);
    
    // Invalidate opportunities cache to force fresh API call
    queryClient.invalidateQueries({
      queryKey: ['opportunities', 'all'],
      exact: false, // This will invalidate all queries that start with ['opportunities', 'all']
    });
    // Also remove all cached data to ensure fresh start
    queryClient.removeQueries({
      queryKey: ['opportunities', 'all'],
      exact: false,
    });
    console.log('🔄 Cache invalidated and removed for opportunities queries');
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategory(null);
    
    // Invalidate opportunities cache to force fresh API call
    queryClient.invalidateQueries({
      queryKey: ['opportunities', 'all'],
      exact: false, // This will invalidate all queries that start with ['opportunities', 'all']
    });
    // Also remove all cached data to ensure fresh start
    queryClient.removeQueries({
      queryKey: ['opportunities', 'all'],
      exact: false,
    });
    console.log('🔄 Cache invalidated and removed for opportunities queries (clear filter)');
  };

  const handleSearchResults = (results: any[]) => {
    console.log('🔍 Search results received:', results);
    setSearchResults(results);
    setIsSearchActive(results.length > 0);
    // Clear category when search is active
    if (results.length > 0) {
      setSelectedCategory(null);
    }
  };

  const scrollToOpportunities = () => {
    // Use measureInWindow to get the exact position of the AllOpportunities component
    allOpportunitiesRef.current?.measureInWindow((x, y, width, height) => {
      console.log('AllOpportunities position:', { x, y, width, height });
      // Scroll to the opportunities section with some offset
      mainScrollViewRef.current?.scrollTo({ y: Math.max(0, y - 50), animated: true });
    });
  };

  useEffect(() => {
    // Mark loading complete when fonts are ready
    if (fontsLoaded) setLoading(false);
  }, []);

  // Show loading state when categories are loading (other sections handle their own loading)
  const isInitialLoading = categoriesLoading;

  if (!fontsLoaded) {
    return null;
  }

  // Show loading state for initial load
  if (isInitialLoading) {
    return (
      <Background>
        <View style={[styles.content, { backgroundColor: isDark ? 'transparent' : 'transparent' }]}>
          {/* Navigation Bar Skeleton - Fixed outside scroll view */}
          <NavigationBarSkeleton />
          
          <ScrollView>
            <View style={styles.centeredContent}>
              {/* Categories Section Skeleton */}
              <View>
                <CategoriesSkeleton />
              </View>
              
              {/* Featured Section Skeleton */}
              <FeaturedSkeleton />
              
              {/* All Opportunities Section Skeleton */}
              <View style={styles.opportunitiesSkeletonContainer}>
                <View style={styles.opportunitiesSkeletonHeader}>
                  <View style={[styles.opportunitiesSkeletonTitle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <View style={[styles.opportunitiesSkeletonButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                </View>
                <View style={styles.opportunitiesSkeletonList}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <OpportunityCardSkeleton key={index} />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={[styles.content, { backgroundColor: isDark ? 'transparent' : 'transparent' }]}>
        {/* Search Bar - Fixed outside scroll view */}
        <NavigationBar 
          onFilterPress={() => setFilterVisible(true)} 
          onSearchResults={handleSearchResults}
        />
        
        {/* Scroll View - Starts after search bar */}
        <ScrollView ref={mainScrollViewRef}>
          <View style={styles.centeredContent}>
            <CategoriesSection onCategorySelect={handleCategorySelect} />
            <FeaturedSection filters={appliedFilters} />
            <AllOpportunities 
              ref={allOpportunitiesRef}
              filters={appliedFilters} 
              searchResults={searchResults}
              isSearchActive={isSearchActive}
              selectedCategory={selectedCategory}
              onClearCategoryFilter={handleClearCategoryFilter}
              onScrollToOpportunities={scrollToOpportunities}
            />
          </View>
        </ScrollView>

        <FilterActionSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApplyFilters={handleApplyFilters}
          navigation={router}
          currentFilters={appliedFilters}
        />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    flex: 1,
    zIndex: 2,
    width: "100%",
  },
  centeredContent: {
    width: "100%", // or your desired width
    alignSelf: 'center',
  },
  opportunitiesSkeletonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  opportunitiesSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  opportunitiesSkeletonTitle: {
    width: '60%',
    height: 20,
    borderRadius: 8,
  },
  opportunitiesSkeletonButton: {
    width: 80,
    height: 25,
    borderRadius: 8,
  },
  opportunitiesSkeletonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default ExploreViewController;
