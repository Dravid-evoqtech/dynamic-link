import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, SafeAreaView, Modal, AppState, AppStateStatus, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Background from '../components/Background';
import OpportunityCard from '../components/explore/OpportunityCard';

import OpportunityDetails from '../components/OpportunityDetails';
import { useTheme } from '../../hooks/useThemeContext';
import { savedAPI, userAPI } from '../services/api';
import { useSavedOpportunitiesQuery, useProfileQuery, useUnsaveOpportunityMutation } from '../services/queries';
import { OpportunityCardSkeleton } from '../components/SkeletonLoader';
import { useRouter } from 'expo-router';
import { OpportunityItem } from '../../types/opportunities';
import { useStandardizedAlert } from '../hooks/useStandardizedAlert';

interface SavedOpportunitiesProps {
  onRegisterModal?: (modalRef: { visible: boolean; onClose: () => void }) => void;
  onTabChange?: (tab: string) => void;
}

const { width } = Dimensions.get('window');

const filters = ['All', 'Remote', 'In-Person', 'Hybrid'];

export default function SavedOpportunities({ onRegisterModal, onTabChange }: SavedOpportunitiesProps) {
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [savedOpportunities, setSavedOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedOpportunityIds, setUnlockedOpportunityIds] = useState(new Set<string>());
  const [opportunityModalVisible, setOpportunityModalVisible] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const { data: savedData, isLoading } = useSavedOpportunitiesQuery();
  const { data: userData } = useProfileQuery();
  const unsaveMutation = useUnsaveOpportunityMutation();

  // Register modal with parent component for back button handling
  useEffect(() => {
    if (onRegisterModal) {
      console.log('[SavedOpportunities] Registering modal with parent, visible:', opportunityModalVisible);
      onRegisterModal({
        visible: opportunityModalVisible,
        onClose: () => setOpportunityModalVisible(false)
      });
    }
  }, [opportunityModalVisible, onRegisterModal]);

  useEffect(() => {
    setLoading(isLoading);
    if (Array.isArray(savedData)) {
      console.log('🔍 Saved Opportunities Data:', savedData);
      setSavedOpportunities(savedData as any);
    }
  }, [savedData, isLoading]);

  // Mount / Unmount
  useEffect(() => {
    console.log('[SavedOpportunities] mounted');
    return () => {
      console.log('[SavedOpportunities] unmounted');
    };
  }, []);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      console.log('[SavedOpportunities] focused');
      return () => {
        console.log('[SavedOpportunities] unfocused');
      };
    }, [])
  );

  // AppState changes
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      console.log('[SavedOpportunities] AppState:', appState.current, '->', nextState);
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

  useEffect(() => {
    if (userData) {
      const unlockedOpportunities = (userData as any).unlockedOpportunities || [];
      setUnlockedOpportunityIds(new Set(unlockedOpportunities));
    }
  }, [userData]);

  const filteredOpportunities =
    selectedFilter === 'All'
      ? savedOpportunities
      : savedOpportunities.filter((item) => {
          // Check multiple possible field names for work type
          const workType = item.states || item.workType || item.type || item.work_type;
          console.log(`🔍 Filtering: ${item.title} - workType: "${workType}", filter: "${selectedFilter}"`);
          console.log(`🔍 Item data:`, JSON.stringify(item, null, 2));
          
          if (!workType) {
            console.log(`🔍 No workType found for ${item.title}`);
            return false;
          }
          
          // Map filter values to actual data values
          const filterMap: { [key: string]: string[] } = {
            'Remote': ['Remote', 'remote', 'REMOTE'],
            'In-Person': ['In Person', 'In-Person', 'in-person', 'In Person', 'IN-PERSON'],
            'Hybrid': ['Hybrid', 'hybrid', 'HYBRID']
          };
          
          const allowedValues = filterMap[selectedFilter] || [];
          const isMatch = allowedValues.includes(workType);
          console.log(`🔍 Match result: ${isMatch} for "${workType}" in ${JSON.stringify(allowedValues)}`);
          return isMatch;
        });

  const handleUnsave = async (opportunityId: string) => {
    try {
      unsaveMutation.mutate(opportunityId);
      // Remove from local state
      setSavedOpportunities(prev => prev.filter(opp => opp._id !== opportunityId));
    } catch (error) {
      console.error('Failed to unsave opportunity:', error);
    }
  };

  const handleUnlock = async (opportunityId: string) => {
    // Optimistic update
    setUnlockedOpportunityIds(prev => new Set([...prev, opportunityId]));
    console.log('🔍 Saved - Attempting unlock:', opportunityId);
    try {
      const { opportunitiesAPI } = await import('../services/api');
      await opportunitiesAPI.unlockOpportunity(opportunityId);
      console.log('🔍 Saved - Unlock persisted');
    } catch (error) {
      setUnlockedOpportunityIds(prev => {
        const next = new Set(prev);
        next.delete(opportunityId);
        return next;
      });
      console.error('❌ Failed to unlock opportunity:', error);
      
      // Show user-friendly error message based on the error
      let errorMessage = "Failed to unlock opportunity. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Not enough points")) {
          errorMessage = "Insufficient points! You need more points to unlock this opportunity.";
        } else if (error.message.includes("400")) {
          errorMessage = "Bad request. Please check your account and try again.";
        } else if (error.message.includes("401")) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes("403")) {
          errorMessage = "Access denied. You don't have permission to unlock this opportunity.";
        } else if (error.message.includes("404")) {
          errorMessage = "Opportunity not found. It may have been removed.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        }
      }
      
      // Error handling - unlock failed
    }
  };

  const handleOpportunityPress = (item: OpportunityItem) => {
    if (item._id) {
      setSelectedOpportunityId(item._id);
      setOpportunityModalVisible(true);
    }
  };

  const handleCloseOpportunityModal = () => {
    setOpportunityModalVisible(false);
    setSelectedOpportunityId(null);
  };

  const handleToggleSave = async (opportunityId: string, isSaved: boolean) => {
    if (!isSaved) {
      // If unsaving, remove from local state
      setSavedOpportunities(prev => prev.filter(opp => opp._id !== opportunityId));
    }
  };

  return (
    <>
      <Background>
        <View style={styles.headerContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Saved Opportunities</Text>
            <Text style={styles.headerSubtitle}>{savedOpportunities.length} Opportunities</Text>
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

        {/* Updated Filter Bar */}
        <View style={styles.filterContainer}>
          {filters.map((filter, index) => (
            <React.Fragment key={filter}>
              <TouchableOpacity
                onPress={() => setSelectedFilter(filter)}
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

        {/* Opportunities List */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <OpportunityCardSkeleton key={index} />
            ))
          ) : filteredOpportunities.length > 0 ? (
            // Show opportunities when they exist
            filteredOpportunities.map((item, index) => (
              <OpportunityCard
                key={item._id || index}
                item={item}
                isSaved={true}
                onToggleSave={(isSaved) => handleUnsave(item._id || '')}
                onPress={handleOpportunityPress}
              />
            ))
          ) : (
            // Show empty state when no opportunities found
            <View style={styles.emptyStateContainer}>
              <Image
                source={require('../../assets/icons/heart-3-line.png')}
                style={styles.emptyStateIcon}
              />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {selectedFilter === 'All' ? 'No Saved Opportunities Yet' : `No ${selectedFilter} Opportunities`}
              </Text>
              <Text style={[styles.emptyStateMessage, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                {selectedFilter === 'All' 
                  ? "You haven't saved any opportunities yet. Start exploring and save opportunities that interest you!"
                  : `You don't have any ${selectedFilter.toLowerCase()} opportunities saved at the moment. Keep exploring!`
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

      </Background>

      {/* OpportunityDetails Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={opportunityModalVisible}
        onRequestClose={handleCloseOpportunityModal}
      >
        <OpportunityDetails 
          onClose={handleCloseOpportunityModal}
          opportunityId={selectedOpportunityId || undefined}
          isSaved={true}
          onToggleSave={(isSaved) => selectedOpportunityId ? handleToggleSave(selectedOpportunityId, isSaved) : undefined}
          isLocked={selectedOpportunityId ? !unlockedOpportunityIds.has(selectedOpportunityId) : false}
          onUnlock={(id) => handleUnlock(id)}
        />
      </Modal>
    <AlertComponent />
    </>
  );
}

// Update the styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:"100%",
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
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.02 * 24, // -2% of 24px
    verticalAlign: 'middle',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    opacity: 0.7,
  },
  headerIcon: {
    width: 28,
    height: 28,
    tintColor: 'white',
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
    marginTop: 12,
    marginBottom: 18,
    alignSelf: 'center',
    padding: 3,
  },
  filterItem: {
    width: 81.25,
    height: 34,
    borderRadius: 7,
    opacity: 1,
    paddingRight: 10,
    paddingLeft: 10,
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
    letterSpacing: -0.08,
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
    paddingBottom: 110,
    alignSelf: 'center',
    gap: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
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
    letterSpacing: -0.02 * 20, // -2% of 20px
    marginBottom: 10,
  },
  emptyStateMessage: {
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    width: 280,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.02 * 16, // -2% of 16px
  },
});
