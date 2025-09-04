import sharedStyles from "../../styles/sharedStyles";
import React, { useState, useEffect, useMemo, useRef, forwardRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import OpportunityCard from './OpportunityCard';
import OpportunityDetails from '../OpportunityDetails';
import UnlockOpportunityModal from '../UnlockOpportunityModal';
import { useTheme } from '../../../hooks/useThemeContext';
import { opportunitiesAPI, savedAPI, userAPI } from '../../services/api';
import { useOpportunitiesInfiniteQuery, useSaveOpportunityMutation, useUnsaveOpportunityMutation, useSavedOpportunitiesQuery, useProfileQuery } from '../../services/queries';
import { OpportunityCardSkeleton } from '../SkeletonLoader';
import { useStandardizedAlert } from '../../hooks/useStandardizedAlert';
import { OpportunityItem, OpportunityFilters } from '../../../types/opportunities';

interface AllOpportunitiesProps {
  opportunities?: OpportunityItem[];
  filters?: {
    type: string;
    program: string;
    sortBy: string;
  };
  searchResults?: any[];
  isSearchActive?: boolean;
  onClearSearch?: () => void;
  selectedCategory?: string | null;
  onClearCategoryFilter?: () => void;
  onScrollToOpportunities?: () => void;
}

const AllOpportunities = forwardRef<View, AllOpportunitiesProps>(({ 
  filters, 
  searchResults, 
  isSearchActive, 
  onClearSearch,
  selectedCategory,
  onClearCategoryFilter,
  onScrollToOpportunities
}, ref) => {
  const { colorScheme } = useTheme();
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const isDark = colorScheme === 'dark';
  
  // Ref for FlatList to enable auto-scroll
  const flatListRef = useRef<FlatList>(null);
  
  // Get API data first
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useOpportunitiesInfiniteQuery(filters, !isSearchActive, selectedCategory);
  
  // Get opportunities directly from API query - no local state
  const allOpportunities = useMemo(() => {
    if (!data) return [];
    const opportunities = data.pages.flatMap((page: any) => page.items || []);
    console.log(`[AllOpportunities] Total opportunities accumulated: ${opportunities.length}`);
    console.log(`[AllOpportunities] Pages loaded: ${data.pages.length}`);
    data.pages.forEach((page: any, index: number) => {
      console.log(`[AllOpportunities] Page ${index + 1}: ${page.items?.length || 0} items`);
    });
    return opportunities;
  }, [data]);
  
  // Handle search results - use search results when active, otherwise use API data
  const displayOpportunities = useMemo(() => {
    if (isSearchActive && searchResults && searchResults.length > 0) {
      // Check if it's a search query object
      const firstResult = searchResults[0] as any;
      if (firstResult && firstResult.query) {
        // For now, filter locally based on search query
        const query = firstResult.query.toLowerCase().trim();
        return allOpportunities.filter(opportunity => {
          const title = (opportunity.title || '').toLowerCase();
          const description = (opportunity.description || '').toLowerCase();
          const organization = (opportunity.organization || opportunity.institution || '').toLowerCase();
          const fields = Array.isArray(opportunity.fields) ? opportunity.fields.join(' ').toLowerCase() : '';
          
          return title.includes(query) || 
                 description.includes(query) || 
                 organization.includes(query) || 
                 fields.includes(query);
        });
      }
    }
    return allOpportunities;
  }, [allOpportunities, searchResults, isSearchActive]);
  const displayLoading = isLoading;
  const displayHasMore = hasNextPage;

  // Search is now handled by the API through the query
  // No local search state needed
  const [savedOpportunityIds, setSavedOpportunityIds] = useState(new Set<string>());
  const [unlockedOpportunityIds, setUnlockedOpportunityIds] = useState(new Set<string>());
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [opportunityModalVisible, setOpportunityModalVisible] = useState(false);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockingOpportunityId, setUnlockingOpportunityId] = useState<string | null>(null);
  const [unlockingOpportunityTitle, setUnlockingOpportunityTitle] = useState<string>('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const { data: savedData } = useSavedOpportunitiesQuery();
  const { data: userData } = useProfileQuery();

  // Log API data for debugging
  useEffect(() => {
    if (!isLoading && data) {
      const flat = data.pages.flatMap((p: any) => p.items || []);
      console.log(`[AllOpportunities] Loaded ${flat.length} opportunities from API${selectedCategory ? ` for category: ${selectedCategory}` : ''}`, {
        totalPages: data.pages.length,
        hasNextPage,
        isFetchingNextPage,
        selectedCategory,
        isSearchActive
      });
    }
  }, [data, isLoading, selectedCategory, hasNextPage, isFetchingNextPage, isSearchActive]);

  // Auto-scroll to opportunities when category is selected
  useEffect(() => {
    if (selectedCategory && !isLoading && displayOpportunities.length > 0 && onScrollToOpportunities) {
      // Delay to ensure the component is fully rendered and data is loaded
      setTimeout(() => {
        onScrollToOpportunities();
      }, 500);
    }
  }, [selectedCategory, isLoading, displayOpportunities.length, onScrollToOpportunities]);

  // Sync saved opportunities with the cache
  useEffect(() => {
    if (Array.isArray(savedData)) {
      const savedIds = new Set((savedData as any[]).map((o: any) => o._id));
      setSavedOpportunityIds(savedIds);
    }
  }, [savedData]);

  const saveMutation = useSaveOpportunityMutation();
  const unsaveMutation = useUnsaveOpportunityMutation();

  const handleToggleSave = async (opportunityId: string, isSaved: boolean, opportunity?: OpportunityItem) => {
    try {
      if (isSaved) {
        // Save the opportunity
        // Optimistically update local heart state
        setSavedOpportunityIds(prev => new Set([...prev, opportunityId]));
        // Update Saved tab cache instantly
        if (opportunity) {
          saveMutation.mutate({ opportunityId, opportunity });
        } else {
          // Fallback to API if no object provided
          await savedAPI.save(opportunityId);
        }
      } else {
        // Unsave the opportunity
        unsaveMutation.mutate(opportunityId);
        setSavedOpportunityIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(opportunityId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      // If it's already saved, just update the UI state
      if (error instanceof Error && error.message?.includes('already saved')) {
        setSavedOpportunityIds(prev => new Set([...prev, opportunityId]));
      }
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

  const handleUnlock = async (opportunityId: string) => {
    // Find the opportunity to get its title
    const opportunity = displayOpportunities.find(opp => opp._id === opportunityId);
    if (opportunity) {
      setUnlockingOpportunityId(opportunityId);
      setUnlockingOpportunityTitle(opportunity.title || 'this opportunity');
      setUnlockModalVisible(true);
    }
  };

  const handleUnlockPress = (opportunityId: string, opportunityTitle: string) => {
    setUnlockingOpportunityId(opportunityId);
    setUnlockingOpportunityTitle(opportunityTitle);
    setUnlockModalVisible(true);
  };

  const handleUnlockConfirm = async () => {
    if (!unlockingOpportunityId) return;
    
    setIsUnlocking(true);
    try {
      // Call the API to unlock the opportunity
      await opportunitiesAPI.unlockOpportunity(unlockingOpportunityId);
      
      // Update local state
      setUnlockedOpportunityIds(prev => new Set([...prev, unlockingOpportunityId]));
      
      // Close both modals
      setUnlockModalVisible(false);
      setOpportunityModalVisible(false);
      setSelectedOpportunityId(null);
      setUnlockingOpportunityId(null);
      setUnlockingOpportunityTitle('');
    } catch (error) {
      // Let the modal handle the error display
      throw error;
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlockCancel = () => {
    setUnlockModalVisible(false);
    setUnlockingOpportunityId(null);
    setUnlockingOpportunityTitle('');
  };

  const loadMoreOpportunities = async () => {
    console.log('[AllOpportunities] loadMoreOpportunities called:', { 
      isFetchingNextPage, 
      hasNextPage, 
      selectedCategory, 
      isSearchActive,
      currentPageCount: data?.pages?.length || 0,
      totalOpportunities: allOpportunities.length
    });
    if (isFetchingNextPage || !hasNextPage) {
      console.log('[AllOpportunities] Skipping load more - isFetchingNextPage:', isFetchingNextPage, 'hasNextPage:', hasNextPage);
      return;
    }
    console.log('[AllOpportunities] Fetching next page...');
    await fetchNextPage();
  };

  if (displayLoading) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={sharedStyles.sectionTitle}>
            {isSearchActive ? 'Search Results' : 'All Opportunities'}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.showAll, { color: isDark ? '#FFFFFF' : '#FFFFFF' }]}>Show all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={Array.from({ length: 6 })}
          renderItem={() => <OpportunityCardSkeleton />}
          keyExtractor={(_, index) => String(index)}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <>

      <View ref={ref} style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={sharedStyles.sectionTitle}>
            {isSearchActive && searchResults && searchResults.length > 0 ? 
             `Search Results (${displayOpportunities.length})` :
             selectedCategory ? `${selectedCategory} Opportunities (${displayOpportunities.length})` : 'All Opportunities'}
          </Text>
          {(selectedCategory || (isSearchActive && searchResults && searchResults.length > 0)) ? (
            <TouchableOpacity onPress={selectedCategory ? onClearCategoryFilter : onClearSearch}>
              <Text style={[styles.showAll, { color: isDark ? '#FFFFFF' : '#FFFFFF' }]}>Clear Filter</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Text style={[styles.showAll, { color: isDark ? '#FFFFFF' : '#FFFFFF' }]}>Show all</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList 
          ref={flatListRef}
          data={displayOpportunities}
          renderItem={({ item, index }) => {
            const isLocked = !(
              userData?.unlockedOpportunities?.includes(item._id || '') || 
              unlockedOpportunityIds.has(item._id || '')
            );
            return (
              <OpportunityCard 
                key={item._id || index} 
                item={item}
                isSaved={item._id ? savedOpportunityIds.has(item._id) : false}
                isLocked={isLocked}
                onToggleSave={(isSaved) => item._id ? handleToggleSave(item._id, isSaved, item) : undefined}
                onPress={handleOpportunityPress}
                onUnlock={handleUnlock}
              />
            );
          }}
          keyExtractor={(item) => item._id || String(item.id)}
          onEndReached={isSearchActive ? undefined : loadMoreOpportunities}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isFetchingNextPage && !isSearchActive ? (
            <View style={styles.loadingMoreContainer}>
              <OpportunityCardSkeleton />
            </View>
          ) : null}
          ListEmptyComponent={
            displayOpportunities.length === 0 && !displayLoading ? (
              <View style={styles.endOfListContainer}>
                <Text style={[styles.endOfListText, { color: isDark ? '#B0B0B0' : '#888' }]}>
                  {isSearchActive && searchResults && searchResults.length > 0 ? 'No search results found' :
                   selectedCategory ? `No opportunities found for ${selectedCategory}` : 
                   "You've reached the end of opportunities"}
                </Text>
              </View>
            ) : null
          }
        />
      </View>

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
          isSaved={selectedOpportunityId ? savedOpportunityIds.has(selectedOpportunityId) : false}
          onToggleSave={(isSaved) => {
            if (selectedOpportunityId) {
              const opp = displayOpportunities.find((o) => (o._id || String(o.id)) === selectedOpportunityId) as OpportunityItem | undefined;
              handleToggleSave(selectedOpportunityId, isSaved, opp);
            }
          }}
          isLocked={selectedOpportunityId ? !(
            userData?.unlockedOpportunities?.includes(selectedOpportunityId) || 
            unlockedOpportunityIds.has(selectedOpportunityId)
          ) : false}
          onUnlock={(id) => handleUnlock(id)}
        />
      </Modal>

      {/* UnlockOpportunityModal */}
      <UnlockOpportunityModal
        visible={unlockModalVisible}
        onCancel={handleUnlockCancel}
        onUnlock={handleUnlockConfirm}
        isUnlocking={isUnlocking}
        opportunityTitle={unlockingOpportunityTitle}
        pointsRequired={10}
        onUnlockSuccess={(opportunityTitle, pointsRequired) => {
          setUnlockModalVisible(false);
          setUnlockingOpportunityId(null);
          setUnlockingOpportunityTitle('');
        }}
        onUnlockError={(errorMessage, points) => {
          // Show toast notification when modal closes with error
          if (errorMessage.includes("Not enough points")) {
            showError("Points Deducted", `${points} points cut - insufficient points`);
          } else {
            // Error handling - unlock failed
          }
        }}
      />
    <AlertComponent />
    </>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
    opacity: 0.9,
  },
  showAll: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    height: 20,
    right: 5,
    fontFamily: "UberMoveText-Regular",
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    width: '100%',
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Regular',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '600',
  },
  clearSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: 'UberMoveText-Regular',
  },
});

export default AllOpportunities;
