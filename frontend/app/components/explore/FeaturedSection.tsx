import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import sharedStyles from "../../styles/sharedStyles";
import { useTheme } from "../../../hooks/useThemeContext";
import { opportunitiesAPI, savedAPI, userAPI } from "../../services/api";
import { useFeaturedInfiniteQuery, useProfileQuery, useSavedOpportunitiesQuery, useSaveOpportunityMutation, useUnsaveOpportunityMutation } from "../../services/queries";
import {
  FeaturedSkeleton,
  FeaturedCardSkeleton,
  FeaturedLoadingSkeleton,
} from "../SkeletonLoader";
import { OpportunityItem } from "../../../types/opportunities";
import OpportunityDetails from "../OpportunityDetails";
import UnlockOpportunityModal from "../UnlockOpportunityModal";
import savedIcon from "../../../assets/icons/savedicon.png";
import savedFilledIcon from "../../../assets/icons/savedFilledIcon.png"; // Import the filled version
import { useStandardizedAlert } from "../../hooks/useStandardizedAlert";
// Extended interface to match API response
interface ExtendedOpportunityItem extends OpportunityItem {
  imageLink?: string; // API field for opportunity image
  organization?: string; // API field for organization name
  fields?: string[]; // API field for opportunity categories/fields
  states?: string; // API field for work type (remote, hybrid, in-person)
  types?: string; // API field for opportunity type
  opportunityStartDate?: string; // API field for start date
}

interface FeaturedSectionProps {
  filters?: {
    type: string;
    program: string;
    sortBy: string;
  };
  onViewDetails?: (opportunityId: string) => void;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  filters,
  onViewDetails,
}) => {
  const { colorScheme } = useTheme();
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();

  const isDark = colorScheme === "dark";
  const [featured, setFeatured] = useState<ExtendedOpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState(
    new Set<string>()
  );
  const [unlockedOpportunityIds, setUnlockedOpportunityIds] = useState(
    new Set<string>()
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeaturedInfiniteQuery(filters);
  const { data: profile } = useProfileQuery();
  const { data: saved } = useSavedOpportunitiesQuery();
  const saveMutation = useSaveOpportunityMutation();
  const unsaveMutation = useUnsaveOpportunityMutation();
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    string | null
  >(null);
  const [opportunityModalVisible, setOpportunityModalVisible] = useState(false);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockingOpportunityId, setUnlockingOpportunityId] = useState<
    string | null
  >(null);
  const [unlockingOpportunityTitle, setUnlockingOpportunityTitle] =
    useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (!isLoading && data) {
      const flat = data.pages.flatMap((p: any) => p.items || []);
      setFeatured(Array.isArray(flat) ? flat : []);
      setHasMore(Boolean(hasNextPage));
      setCurrentPage(data.pages.length);
      setLoading(false);
    } else {
      setLoading(isLoading);
    }
  }, [data, isLoading, hasNextPage]);

  useEffect(() => {
    if (profile) {
      const unlocked = (profile as any).unlockedOpportunities || [];
      setUnlockedOpportunityIds(new Set(unlocked));
    }
  }, [profile]);

  useEffect(() => {
    if (Array.isArray(saved)) {
      setSavedOpportunityIds(new Set((saved as any[]).map((o: any) => o._id)));
    }
  }, [saved]);

  const loadMoreFeatured = async () => {
    if (isFetchingNextPage || !hasNextPage) return;
    await fetchNextPage();
  };

  const handleToggleSave = async (opportunityId: string, isSaved: boolean) => {
    // Optimistic update - update UI immediately
    if (isSaved) {
      setSavedOpportunityIds((prev) => new Set([...prev, opportunityId]));
    } else {
      setSavedOpportunityIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
    }

    try {
      // Then make API call in background
      if (isSaved) {
        const opportunity = featured.find((o) => (o._id || "") === opportunityId);
        if (opportunity) {
          saveMutation.mutate({ opportunityId, opportunity });
        } else {
          await savedAPI.save(opportunityId);
        }
      } else {
        unsaveMutation.mutate(opportunityId);
      }
    } catch (error: any) {
      console.error("Failed to toggle save:", error);

      // Revert UI state if API call fails
      if (isSaved) {
        setSavedOpportunityIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(opportunityId);
          return newSet;
        });
      } else {
        setSavedOpportunityIds((prev) => new Set([...prev, opportunityId]));
      }

      // Handle already saved case
      if (error.message?.includes("already saved")) {
        setSavedOpportunityIds((prev) => new Set([...prev, opportunityId]));
      }
    }
  };

  const handleUnlock = (opportunityId: string) => {
    // Add the opportunity to unlocked opportunities
    setUnlockedOpportunityIds((prev) => new Set([...prev, opportunityId]));
    console.log("🔍 Featured - Opportunity unlocked:", opportunityId);
  };

  const handleUnlockPress = (
    opportunityId: string,
    opportunityTitle: string
  ) => {
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
      setUnlockedOpportunityIds(
        (prev) => new Set([...prev, unlockingOpportunityId])
      );

      // Close the modal on success
      setUnlockModalVisible(false);
      setUnlockingOpportunityId(null);
      setUnlockingOpportunityTitle("");
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
    setUnlockingOpportunityTitle("");
  };

  const handleViewDetails = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setOpportunityModalVisible(true);
  };

  const handleCloseOpportunityModal = () => {
    setOpportunityModalVisible(false);
    setSelectedOpportunityId(null);
  };

  if (loading) {
    return <FeaturedSkeleton />;
  }

  // Badge styling functions
  const getBadgeTextStyle = (workType: string) => ({
    color:
      workType?.toLowerCase() === "remote"
        ? "rgba(22, 179, 100, 1)"
        : workType?.toLowerCase() === "in-person"
        ? "rgba(46, 144, 250, 1)"
        : workType?.toLowerCase() === "hybrid"
        ? "rgba(212, 68, 241, 1)"
        : "rgba(212, 68, 241, 1)", // Default color for other states
  });

  const getBadgeBackgroundColor = (workType: string) =>
    workType?.toLowerCase() === "remote"
      ? "rgba(22, 179, 100, 0.1)"
      : workType?.toLowerCase() === "in-person"
      ? "rgba(46, 144, 250, 0.1)"
      : workType?.toLowerCase() === "hybrid"
      ? "rgba(212, 68, 241, 0.1)"
      : "rgba(212, 68, 241, 0.1)"; // Default background for other states

  const colors = {
    cardBg: isDark ? "#23272F" : "#fff",
    textPrimary: isDark ? "#fff" : "#101017",
    textSecondary: isDark ? "#B0B0B0" : "#888",
    showAllColor: isDark ? "#FFFFFF" : "#FFFFFF",
    buttonBg: isDark ? "#35383F" : "#fff",
    buttonBorder: isDark ? "#4A4E56" : "#F6F5F4",
    tagBg: isDark ? "#404040" : "#F0F0F0",
    tagBorder: isDark ? "#505050" : "#E0E0E0",
  };

  return (
    <View>
              <View style={styles.header}>
          <Text style={sharedStyles.sectionTitle}>Featured Opportunities</Text>
          <TouchableOpacity>
            <Text style={[styles.showAll, { color: colors.showAllColor }]}>
              Show all
            </Text>
          </TouchableOpacity>
        </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={featured}
        renderItem={({ item, index }) => {
          const isSaved = savedOpportunityIds.has(item._id || "");
          const isLocked = !unlockedOpportunityIds.has(item._id || "");

          return (
            <View
              key={item._id || index}
              style={[styles.card, { backgroundColor: colors.cardBg }]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={
                    item.imageLink
                      ? { uri: item.imageLink }
                      : item.image
                      ? { uri: item.image }
                      : require("../../../assets/images/image (3).png")
                  }
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => {
                    console.warn(
                      "Failed to load image for opportunity:",
                      item._id
                    );
                  }}
                />
                                 {/* Top-right icon overlay */}
                 <TouchableOpacity
                   style={styles.topRightIcon}
                   onPress={() => handleToggleSave(item._id || "", !isSaved)}
                 >
                   <MaterialIcons
                     name={isSaved ? "favorite" : "favorite-border"}
                     size={22}
                     color={isSaved ? "#2E90FA" : "#fff"}
                     style={{ backgroundColor: "transparent" }}
                   />
                 </TouchableOpacity>
                
                {/* Top-left unlock button overlay for locked opportunities */}
                {isLocked && (
                  <TouchableOpacity
                    style={styles.topLeftUnlockButton}
                    onPress={() => handleUnlockPress(item._id || "", item.title || "Opportunity")}
                  >
                    <View style={styles.unlockButtonContent}>
                      <MaterialIcons name="lock" size={18} color="#fff" />
                      <Text style={styles.unlockButtonText}>Unlock</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Title, description, and other details below the image */}
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <TouchableOpacity style={styles.organizationContainer}>
                    <Text
                      style={[
                        styles.viewDetails,
                        { maxWidth: 70, flexShrink: 1 },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.organization || item.institution || "Organization"}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[styles.metaDot, { color: colors.textSecondary }]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: colors.textSecondary,
                        maxWidth: 50,
                        flexShrink: 1,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.duration || "Duration"}
                  </Text>
                  <Text
                    style={[styles.metaDot, { color: colors.textSecondary }]}
                  >
                    •
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: getBadgeBackgroundColor(
                          item.states || item.workType
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        getBadgeTextStyle(item.states || item.workType),
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.states || item.workType || "Work Type"}
                    </Text>
                  </View>
                </View>
                {/* Small lock icon on the right - REMOVED, now using top-left unlock button */}
              </View>

              {/* Tags/Categories from API */}
              {item.fields && item.fields.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.fields.slice(0, 2).map((field, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tagItem,
                        {
                          backgroundColor: colors.tagBg,
                          borderColor: colors.tagBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {field}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.bottomRow}>
                <View style={styles.detailsButtonWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.detailsButton,
                      {
                        backgroundColor: colors.buttonBg,
                        borderColor: colors.buttonBorder,
                      },
                    ]}
                    onPress={() => {
                      if (item._id) {
                        handleViewDetails(item._id);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.detailsButtonText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Save button - always visible like in AllOpportunities.tsx */}
                <TouchableOpacity
                  style={[
                    styles.likeButtonContainer,
                    { borderColor: colors.buttonBorder },
                  ]}
                  onPress={() => handleToggleSave(item._id || "", !isSaved)}
                >
                  <MaterialIcons
                    name={isSaved ? "favorite" : "favorite-border"}
                    size={20}
                    color={isSaved ? "#2E90FA" : "#2E90FA"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item._id || String(item.id)}
        onEndReached={loadMoreFeatured}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View key="loading-skeleton" style={styles.loadingMoreContainer}>
              <FeaturedLoadingSkeleton />
            </View>
          ) : null
        }
        contentContainerStyle={styles.scrollContainer}
      />

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
          isSaved={
            selectedOpportunityId
              ? savedOpportunityIds.has(selectedOpportunityId)
              : false
          }
          onToggleSave={(isSaved) => {
            if (selectedOpportunityId) {
              handleToggleSave(selectedOpportunityId, isSaved);
            }
          }}
          isLocked={
            selectedOpportunityId
              ? !unlockedOpportunityIds.has(selectedOpportunityId)
              : false
          }
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
        onUnlockSuccess={(title, points) => {
          // Success callback - no action needed
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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18, // Match consistent margin
    marginBottom: 14,
    marginTop: 10,
    width: "100%",
    opacity: 0.9,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden", // Important to clip corners
    marginBottom: 10,
  },
  topRightIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 38,
    height: 38,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 19,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    // Remove shadow to eliminate white box appearance
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 3,
    overflow: "hidden",
  },
  topLeftUnlockButton: {
    position: "absolute",
    top: 8,
    left: 8,
    minWidth: 80,
    height: 32,
    backgroundColor: "rgba(46, 144, 250, 0.9)", // Blue background with transparency
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unlockButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "UberMoveText-Medium",
    textAlign: "center",
  },

  sectionTitle: {
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 28,
    color: "white",
    opacity: 0.9,
    marginLeft: 5,
    height: 21,
    fontFamily: "UberMoveText-Medium",
  },
  showAll: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    height: 20,
    lineHeight: 20,
    fontFamily: "UberMoveText-Regular",
  },
  scrollContainer: {
    paddingHorizontal: 18, // Match consistent margin
  },
  card: {
    backgroundColor: "#fff",
    width: 250,
    borderRadius: 20,
    padding: 12,
    marginRight: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
    height: 24,
    fontFamily: "UberMoveText-Medium",
    lineHeight: 24,
    letterSpacing: -0.1,
    verticalAlign: "middle",
  },
  description: {
    fontSize: 13,
    color: "#666",
    height: 18,
    textAlign: "left",
    fontFamily: "UberMoveText-Regular",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 6, // Reduced from 10
    alignItems: "center", // Added to align items properly
    flexWrap: "nowrap", // Prevent wrapping to keep in one line
  },
  metaLeft: {
    flexDirection: "row",
    gap: 2, // Reduced from 4
    flex: 1,
    alignItems: "center", // Added to align items properly
    flexWrap: "nowrap", // Prevent wrapping to keep in one line
  },
  metaIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    fontWeight: "500",
    fontFamily: "UberMoveText-Regular",
  },
  metaDot: {
    marginHorizontal: 4, // Reduced from 18 to fix excessive spacing
    color: "#6D6D73",
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    fontFamily: "UberMoveText-Regular",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  detailsButtonWrapper: {
    flex: 1,
    alignItems: "center",
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: "#F6F5F4",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18, // Match consistent margin
    backgroundColor: "#fff",
    width: 178,
    height: 38,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#101017",
    marginLeft: 40,
    marginTop: 3,
    fontFamily: "UberMoveText-Medium",
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
    height: 18,
    fontFamily: "UberMoveText-Regular",
  },
  likeIcon: {
    width: 18,
    height: 18,
  },
  likeButtonContainer: {
    flexDirection: "row",
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F6F5F4",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    // Remove shadow to eliminate white box appearance
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
    // Ensure no double borders or layers
    overflow: "hidden",
  },
  badge: {
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2,
    borderRadius: 6, // Reduced from 8
    flexShrink: 0, // Prevent badge from shrinking
    maxWidth: 70, // Limit badge width to fit better in one line
    overflow: "hidden", // Ensure content doesn't overflow
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
  },
  organizationContainer: {
    flexShrink: 1,
    maxWidth: 70,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 10,
  },
  tagItem: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
    width: 250, // Match the card width
  },
});

export default FeaturedSection;