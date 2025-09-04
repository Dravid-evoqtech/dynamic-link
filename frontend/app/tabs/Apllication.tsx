import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, AppState, AppStateStatus, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Background from '../components/Background';
import ApplicationCard from '../components/explore/ApplicationCard';
import ApplicationDetailsModal from '../components/explore/ApplicationDetailsModal';
import { useTheme } from '../../hooks/useThemeContext';
import { applicationsAPI } from '../services/api';
import { useApplicationsQuery } from '../services/queries';
import { ApplicationCardSkeleton } from '../components/SkeletonLoader';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

interface Application {
  _id?: string;
  status: string;
  opportunity: {
    title: string;
    organization: string;
    paid?: boolean;
    employmentType?: string | null;
  };
  appliedOn: string;
  [key: string]: any;
}

interface ApllicationProps {
  onRegisterModal?: (modalRef: { visible: boolean; onClose: () => void }) => void;
  onTabChange?: (tab: string) => void;
}

const filters = ['All', 'Applied', 'Submitted', 'Accepted'];

export default function Apllication({ onRegisterModal, onTabChange }: ApllicationProps) {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const queryClient = useQueryClient();

  const { data: appsData, isLoading, error: queryError } = useApplicationsQuery('All'); // Always fetch all applications



  // Register modal with parent component for back button handling
  useEffect(() => {
    if (onRegisterModal) {
      console.log('[Apllication] Registering modal with parent, visible:', modalVisible);
      onRegisterModal({
        visible: modalVisible,
        onClose: () => setModalVisible(false)
      });
    }
  }, [modalVisible, onRegisterModal]);

  useEffect(() => {
    setLoading(isLoading);
    
    if (!appsData || !Array.isArray(appsData)) {
      setAllApplications([]);
      setFilteredApplications([]);
      return;
    }
    
    const apps = appsData;
    
    // Always update with fresh data from API
    setAllApplications(apps);
    
    // Apply current filter
    if (selectedFilter === 'All') {
      setFilteredApplications(apps);
    } else {
      const filtered = apps.filter(app => app.status === selectedFilter);
      setFilteredApplications(filtered);
    }
    
  }, [appsData, isLoading, selectedFilter]);

  // Auto-update filtered applications when allApplications change
  useEffect(() => {
    if (selectedFilter === 'All') {
      setFilteredApplications(allApplications);
    } else {
      const filtered = allApplications.filter(app => app.status === selectedFilter);
      setFilteredApplications(filtered);
    }
  }, [allApplications, selectedFilter]);

  // Handle filter changes
  const handleFilterChange = (newFilter: string) => {
    setSelectedFilter(newFilter);
    
    if (newFilter === 'All') {
      setFilteredApplications(allApplications);
    } else {
      const filtered = allApplications.filter(app => app.status === newFilter);
      setFilteredApplications(filtered);
    }
  };

  const fetchApplications = async (_statusFilter?: string) => {
    /* Data is handled via TanStack Query */
  };

  // Mount / Unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup on unfocus
      };
    }, [])
  );

  // AppState changes
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
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

  // Refresh applications when modal closes
  const handleModalClose = async () => {
    setModalVisible(false);
    setRefreshing(true);
    
    // Quick refresh of applications
    try {
      await fetchApplications(selectedFilter);
    } catch (error) {
      console.error('Failed to refresh applications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle status updates from ApplicationCard components
  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    // Update all applications immediately
    setAllApplications(prev => 
      prev.map(app => 
        app._id === applicationId 
          ? { ...app, status: newStatus }
          : app
      )
    );
    
    // IMPORTANT: Get the updated all applications and re-apply the current filter
    const updatedAllApps = allApplications.map(app => 
      app._id === applicationId 
        ? { ...app, status: newStatus }
        : app
    );
    
    // Update filtered applications based on current filter
    if (selectedFilter === 'All') {
      setFilteredApplications(updatedAllApps);
    } else {
      const filtered = updatedAllApps.filter(app => app.status === selectedFilter);
      setFilteredApplications(filtered);
    }
    
    // Update React Query cache
    try {
      queryClient.setQueryData(['applications', { filter: 'All' }], (oldData: any) => {
        if (Array.isArray(oldData)) {
          return oldData.map(app => 
            app._id === applicationId 
              ? { ...app, status: newStatus }
              : app
          );
        }
        return oldData;
      });
    } catch (error) {
      console.error('[Apllication] Failed to update cache:', error);
    }
  };

  // Get the correct count for display based on current filter
  const getDisplayCount = () => {
    const count = selectedFilter === 'All' ? allApplications.length : filteredApplications.length;
    return count;
  };

  return (
    <Background>
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>
            {refreshing ? 'Refreshing...' : `${getDisplayCount()} Applications`}
          </Text>
        </View>
        <View style={styles.headerIconWrapper}>
          <TouchableOpacity onPress={() => router.push('/NotificationsScreen' as any)}>
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
        </View>

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        {filters.map((filter, index) => (
          <React.Fragment key={filter}>
            <TouchableOpacity
              onPress={() => handleFilterChange(filter)}
              style={[
                styles.filterItem,
                selectedFilter === filter && styles.filterItemSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextSelected,
                ]}
              >
                {filter}
          </Text>
              </TouchableOpacity>
              {index < filters.length - 1 && (
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>



        {/* Application Cards List */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            // Show 5 skeleton cards while loading
            Array.from({ length: 5 }).map((_, index) => (
              <ApplicationCardSkeleton key={index} />
            ))
          ) : filteredApplications.length > 0 ? (
            // Show applications when they exist
            filteredApplications.map((item, i) => (
              <TouchableOpacity
                key={`${item._id || i}-${item.status}`}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedApplication(item);
                  setModalVisible(true);
                }}
              >
                <ApplicationCard {...item} onStatusUpdate={handleStatusUpdate} />
              </TouchableOpacity>
            ))
          ) : (
            // Show empty state when no applications found
            <View style={styles.emptyStateContainer}>
              <Image
                source={require('../../assets/icons/applicationicon.png')}
                style={styles.emptyStateIcon}
              />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {selectedFilter === 'All' ? 'No Applications Yet' : `No ${selectedFilter} Applications`}
              </Text>
              <Text style={[styles.emptyStateMessage, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                {selectedFilter === 'All' 
                  ? "You haven't applied to any opportunities yet. Start exploring and applying to opportunities that interest you!"
                  : `You don't have any ${selectedFilter.toLowerCase()} applications at the moment. Keep applying to opportunities!`
                }
              </Text>
              <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: isDark ? '#2E90FA' : '#007AFF' }]}
                onPress={() => onTabChange ? onTabChange('Explore') : router.push('/tabs/ExploreViewController' as any)}
              >
                <Text style={styles.exploreButtonText}>Explore Opportunities</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <ApplicationDetailsModal
          visible={modalVisible}
          onClose={handleModalClose}
          onRefresh={() => {}}
          application={selectedApplication}
        />
      </Background>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    flexDirection: 'row',
    marginTop: 53,
    marginBottom: 24,
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
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.02 * 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  icon: {
    width: 44,
    height: 44,
  },
  filterContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 336,
    marginBottom: 8,
    alignSelf: 'center',
    padding: 3,
  },
  filterItem: {
    width: 81.25,
    height: 34,
    borderRadius: 7,
    opacity: 1,
    paddingRight: 7,
    paddingLeft: 7,
    alignItems: 'center',
    justifyContent: 'center',
    // If you want to be explicit about no rotation:
    transform: [{ rotate: '0deg' }],
  },
  filterItemSelected: {
    backgroundColor: 'white',
    borderRadius: 10,
    flex: 1,
  },
  dividerContainer: {
    width: 1,
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 12,
    borderRadius: 100,
    opacity: 1,
    backgroundColor: 'rgba(219, 219, 221, 1)',
    // Optional: explicit no rotation
    transform: [{ rotate: '0deg' }],
  },
  filterText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Medium',
    lineHeight: 16,
  },
  filterTextSelected: {
    color: '#101017',
    fontWeight: '500',
    fontSize: 13,
    fontFamily: 'UberMoveText-Medium',
    lineHeight: 16,
  },
  list: {
    width: 339,
    opacity: 1,
    gap: 1, // This works in React Native for flex layouts (newer versions)
    alignSelf: 'center', // To center the list horizontally
    // Optional: explicit no rotation
    transform: [{ rotate: '0deg' }],
    paddingBottom: 110,
},
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 10,
  },
  emptyStateMessage: {
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    width: 280,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 20,
  },

});




