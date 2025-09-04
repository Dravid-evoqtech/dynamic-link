import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  AppState,
  AppStateStatus,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabBar from "../components/TabBar";
import Background from "../components/Background";
import SettingsSection from "../components/SettingsSection";
import EditProfileActionSheet from "../components/EditProfileActionSheet";
import LocationEditModal from "../components/LocationEditModal";
import { useTheme } from "../../hooks/useThemeContext";
import { authAPI, userAPI } from "../services/api";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import authService from "../services/authService";
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from "../services/queries";

interface ProfileScreenProps {
  onRegisterModal?: (modalRef: { visible: boolean; onClose: () => void }) => void;
}

const settingIcon = require("../../assets/icons/myprofile/settingprofile.png");
const avatarIcon = require("../../assets/icons/myprofile/profileavtar.icon.png");
const editIcon = require("../../assets/icons/myprofile/editprofile.png");
const locationIcon = require("../../assets/icons/myprofile/mapprofile.png");
const notificationIcons = [
  require("../../assets/icons/myprofile/notification1.png"),
  require("../../assets/icons/myprofile/notification2.png"),
  require("../../assets/icons/myprofile/notification3.png"),
  require("../../assets/icons/myprofile/notification4.png"),
];
const likeIcon = require("../../assets/icons/myprofile/heartlike.png");
const totalpointIcon = require("../../assets/icons/myprofile/Icon (1).png");
const applicationIcon = require("../../assets/icons/myprofile/Icon (2).png");
const levelIcon = require("../../assets/icons/myprofile/Icon (3).png");
const savedIcon = require("../../assets/icons/myprofile/Icon (4).png");
const appliedIcon = require("../../assets/icons/myprofile/Icon (5).png");
const streakIcon = require("../../assets/icons/myprofile/Icon (6).png");

const ProfileScreen = ({ onRegisterModal }: ProfileScreenProps) => {
  const appState = useRef(AppState.currentState);
  const [activeTab, setActiveTab] = React.useState("Saved");
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("San Francisco, CA");
  const [userData, setUserData] = useState<any>(null);
  const { colorScheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const colors = {
    cardBg: isDark ? '#23272F' : '#fff',
    textPrimary: isDark ? '#fff' : '#222',
    textSecondary: isDark ? '#B0B0B0' : '#888',
    dividerColor: isDark ? '#35383F' : '#F3F4F6',
  };

  const router = useRouter();

  // Register modals with parent component for back button handling
  useEffect(() => {
    if (onRegisterModal) {
      // Register the most recently opened modal
      if (editProfileVisible) {
        console.log('[Profile] Registering editProfile modal with parent, visible:', editProfileVisible);
        onRegisterModal({
          visible: editProfileVisible,
          onClose: () => setEditProfileVisible(false)
        });
      } else if (locationModalVisible) {
        console.log('[Profile] Registering location modal with parent, visible:', locationModalVisible);
        onRegisterModal({
          visible: locationModalVisible,
          onClose: () => setLocationModalVisible(false)
        });
      }
    }
  }, [editProfileVisible, locationModalVisible, onRegisterModal]);

  // Function to register SettingsSection modals
  const handleSettingsModalRegister = useCallback((modalRef: { visible: boolean; onClose: () => void }) => {
    if (onRegisterModal) {
      console.log('[Profile] Registering settings modal:', modalRef);
      onRegisterModal(modalRef);
    }
  }, [onRegisterModal]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // Inform the backend about the logout.
      await authAPI.logout();
      console.log('Successfully logged out from backend.');
    } catch (error) {
      console.error('Failed to logout from backend, proceeding with client-side logout:', error);
      // We still log out on the client even if the API call fails (e.g., no internet).
    } finally {
      try {
        // Clear Google Sign-in state to force account picker on next sign-in
        await GoogleSignin.signOut();
        console.log('Google Sign-in state cleared successfully');
      } catch (googleError) {
        console.warn('Failed to clear Google Sign-in state:', googleError);
      }
      
      // Clear the user's session from the device.
      await authService.logout();
      
      // Navigate to the initial screen and clear the navigation stack.
      router.replace('/onboarding');
    }
  };

  // Function to clear all React Query cache when user logs out
  const clearUserCache = () => {
    try {
      console.log('[Profile] Clearing user cache on logout...');
      
      // Clear all user-related queries
      queryClient.removeQueries({ queryKey: queryKeys.profile });
      queryClient.removeQueries({ queryKey: queryKeys.saved });
      queryClient.removeQueries({ queryKey: queryKeys.categories });
      queryClient.removeQueries({ queryKey: queryKeys.stats });
      
      // Clear featured and opportunities queries (these are functions, so we need to clear by pattern)
      queryClient.removeQueries({ queryKey: ['opportunities', 'featured'] });
      queryClient.removeQueries({ queryKey: ['opportunities', 'all'] });
      queryClient.removeQueries({ queryKey: ['opportunities', 'search'] });
      
      // Also clear any other user-specific data
      queryClient.clear();
      
      console.log('[Profile] User cache cleared successfully');
    } catch (error) {
      console.error('[Profile] Failed to clear user cache:', error);
    }
  };

  const handleOpenLocationModal = () => {
    setLocationModalVisible(true);
  };

  const handleLocationUpdated = (locationData: { title: string; lat?: number; lng?: number }) => {
    setCurrentLocation(locationData.title);
    setLocationModalVisible(false);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const data = response.data?.data || response.data || response;
      
      // Update user data with proper avatar URL
      const updatedUserData = {
        ...data,
        profilePicture: data.avatar?.avatarUrl || data.profilePicture
      };
      
      setUserData(updatedUserData);
      
      // Set location
      const locationData = data.location;
      if (locationData && typeof locationData === 'object') {
        setCurrentLocation(locationData.title || 'San Francisco, CA');
      } else if (locationData) {
        setCurrentLocation(locationData || 'San Francisco, CA');
      }
      
      console.log('Profile data updated:', updatedUserData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Keep default location if fetch fails
    }
  };

  // Fetch user profile data when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Mount / Unmount
  useEffect(() => {
    console.log('[Profile] mounted');
    return () => {
      console.log('[Profile] unmounted');
    };
  }, []);

  // Focus / Unfocus
  useFocusEffect(
    useCallback(() => {
      console.log('[Profile] focused');
      return () => {
        console.log('[Profile] unfocused');
      };
    }, [])
  );

  // AppState changes
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      console.log('[Profile] AppState:', appState.current, '->', nextState);
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

  return (
    <Background>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>
          Manage Profile, Statistics & Activities
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            /* TODO: This button should probably open one of the settings modals. */
          }}
        >
          {/* <Image
            source={isDark ? require('../../assets/icons/myprofile/settings(D).png') : settingIcon}
            style={styles.settingsIcon}
          /> */}
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.cardBg }]}>
          <View style={styles.profilePicRow}>
            <Image 
              source={userData?.profilePicture 
                ? { uri: userData.profilePicture } 
                : avatarIcon} 
              style={styles.profileImage} 
            />
            <TouchableOpacity
              style={[
                styles.editButton,
                {
                  backgroundColor: isDark ? '#23272F' : '#fff',
                  borderColor: isDark ? '#35383F' : '#F3F4F6',
                }
              ]}
              onPress={() => {
                setEditProfileVisible(true);
              }}
            >
              <Image 
                source={editIcon} 
                style={[
                  styles.editIcon,
                  { tintColor: isDark ? '#2E90FA' : '#60A5FA' }
                ]} 
              />
            </TouchableOpacity>
          </View>
          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />
          {/* Location Row */}
          <View style={styles.locationRow}>
            <View style={styles.locationLeftGroup}>
              <Image 
                source={locationIcon} 
                style={[
                  styles.locationIcon, 
                  { tintColor: isDark ? '#0F80FA' : '#0F80FA' }
                ]} 
              />
              <Text 
                style={[styles.locationText, { color: colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentLocation}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenLocationModal}
              style={styles.updateLocationContainer}
            >
              <Text style={styles.updateLocation}>Update Location</Text>
            </TouchableOpacity>
          </View>
          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />
          {/* Notifications Row */}
          <View style={styles.notificationRow}>
            <View style={styles.notificationLeftGroup}>
              <View style={styles.notificationIconsRow}>
                {notificationIcons.map((icon, idx) => (
                  <Image
                    key={idx}
                    source={icon}
                    style={[
                      styles.notificationIcon,
                      {
                        marginLeft: idx === 0 ? 0 : -10,
                        zIndex: notificationIcons.length - idx,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.notificationText, { color: colors.textPrimary }]}>20 New Notifications</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                /* TODO: handle view all notifications */
              }}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        {/* <View style={[styles.aboutCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Passionate STEM student with strong interest in AI and research.
            Seeking hands-on learning opportunities.
          </Text>
        </View> */}

        {/* Statistics */}
        {/* <Text style={styles.activitiesHeader}>Statistics</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={totalpointIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Points</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>0 Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={applicationIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Applications</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>12</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={levelIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>10</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={savedIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saved</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>14</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={appliedIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Applied</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>10</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
            <Image source={streakIcon} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>4 Days</Text>
          </View>
        </View> */}

        {/* <Text style={styles.activitiesHeader}>Activities</Text>
        <View style={styles.activitiesTabs}>
          {["Saved", "Applied", "Recent"].map((tab, idx) => (
            <React.Fragment key={tab}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                  // Add margin for spacing except after the last tab
                  idx < 2 && { marginRight: 8 },
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    activeTab === tab ? styles.tabTextActive : styles.tabText
                  }
                >
                  {tab}
                </Text>
              </TouchableOpacity>
              {idx === 1 && <View style={styles.tabDivider} />}
            </React.Fragment>
          ))}
        </View> */}

        {/* Activities List */}
        {/* <View style={[styles.activityCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.activityCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
                Summer Biology Internship
              </Text>
              <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>
                Work with real scientists on envsdfghjksdfghj
              </Text>
              <View style={styles.activityOrgRow}>
                <Text
                  style={[styles.orgAcademy, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  CodeSpark Academy
                </Text>
                <Text style={[styles.orgDot, { color: colors.textSecondary }]}> • </Text>
                <Text style={[styles.orgDuration, { color: colors.textSecondary }]}>6 weeks</Text>
                <Text style={[styles.orgDot, { color: colors.textSecondary }]}> • </Text>
                <Text style={styles.orgTypeRemote}>Remote</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton}>
              <Image source={likeIcon} style={styles.likeIcon} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.activityCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Remote Coding Bootcamp</Text>
              <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>
                Learn to code and build proghhhjjjjjdfghjsdfghjertyu
              </Text>
              <View style={styles.activityOrgRow}>
                <Text
                  style={[styles.orgAcademy, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Bright Future Academy
                </Text>
                <Text style={[styles.orgDot, { color: colors.textSecondary }]}> • </Text>
                <Text style={[styles.orgDuration, { color: colors.textSecondary }]}>6 weeks</Text>
                <Text style={[styles.orgDot, { color: colors.textSecondary }]}> • </Text>
                <Text style={styles.orgTypeInPerson}>In-Person</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton}>
              <Image source={likeIcon} style={styles.likeIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.viewAllSavedBtn}>
          <Text style={styles.viewAllSavedText}>View All Saved</Text>
        </TouchableOpacity> */}
        

        
        <SettingsSection 
          onLogout={handleLogout} 
          isLoggingOut={isLoggingOut} 
          onRegisterModal={handleSettingsModalRegister}
          onClearCache={clearUserCache}
        />

      </ScrollView>
              <TabBar 
          activeTab="Profile"
          onTabPress={(tab) => {
            // Handle tab navigation if needed
            console.log('Tab pressed:', tab);
          }}
        />
      </View>
      
      {/* Edit Profile Modal */}
      <EditProfileActionSheet
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        onProfileUpdated={fetchUserProfile}
      />
      {/* Location Edit Modal */}
      <LocationEditModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onLocationUpdated={handleLocationUpdated}
      />
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    paddingTop: 30,
    paddingLeft: 18, // Match the consistent left margin
    width: "100%",
    marginTop: 20,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "UberMoveText-Medium",
    fontWeight: 500,
    marginBottom: 2,
    height: 32,
  },
  headerSubtitle: {
    color: "#e0e7ff",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 400,
    height: 20,
    fontFamily: "UberMoveText-Regular",
  },
  settingsButton: {
    position: "absolute",
    top: 24,
    right: 18, // Keep right margin consistent
    padding: 6,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0, // Remove horizontal padding like working pages
    paddingBottom: 110,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    width: 339, // Match your desired width
    alignSelf: "center",
    gap: 4,
    marginHorizontal: 18, // Add left and right margin to match title positioning
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  profilePicRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#60A5FA",
    backgroundColor: "#fff",
  },
  editButton: {
    marginLeft: 18, // space between avatar and edit button
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  editIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  profileCard: {
    backgroundColor: "#fff",
    margin: 18,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    height: 168,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  locationLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.5,
  },
  locationIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    tintColor: "#0F80FA",
  },
  locationText: {
    color: "#222",
    fontSize: 12,
    fontFamily: "UberMoveText-Medium",
    marginLeft: 4,
    flex: 1,
  },
  updateLocation: {
    color: "#0F80FA",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    textAlign: "center",
  },
  updateLocationContainer: {
    flex: 0.5,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  notificationLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  notificationIcon: {
    width: 32,
    height: 32,
  },
  notificationText: {
    color: "#222",
    fontSize: 12,
    fontFamily: "UberMoveText-Medium",
  },
  viewAll: {
    color: "#0F80FA",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  aboutCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    width: 339, // Match your desired width
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    marginHorizontal: 18, // Add left and right margin to match title positioning
    gap: 3,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#101017",
    fontFamily: "UberMoveText-Medium",
  },
  aboutText: {
    color: "#6D6D73", // gray-500
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 4,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    flex: 1,
    padding: 12,
    marginHorizontal: 18, // Match the card positioning margin
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    width: 107,
    gap: 4,
    alignItems: "flex-start",
  },
  statIcon: {
    width: 32,
    height: 32,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    color: "#101017",
  },
  statLabel: {
    fontSize: 11,
    color: "#6D6D73",
    opacity: 0.7,
    fontWeight: 400,
    marginBottom: 2,
    height: 13,
    fontFamily: "UberMoveText-Regular",
  },
  activitiesHeader: {
    fontSize: 15,
    fontWeight: 500,
    color: "#FFFFFF",
    marginHorizontal: 18, // Add left and right margin to match card positioning
    fontFamily: "UberMoveText-Medium",
    marginTop: 10,
    marginBottom: 8,
  },
  activitiesTabs: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 18, // Match the card positioning margin
    padding: 4,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "UberMoveText-Medium",
  },
  tabTextActive: {
    color: "#222",
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
  },
  tabDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 18, // Match the card positioning margin
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 18, // Match the card positioning margin
    marginBottom: 8,
    flexDirection: "column",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    height: 100,
    gap: 10,
    width: "100%",
    alignSelf: "center",
  },
  activityCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: "#101017",
    marginBottom: 2,
    fontFamily: "UberMoveText-Medium",
  },
  activityDesc: {
    fontSize: 13,
    color: "#444",
    height: 18,
    fontWeight: 400,
    fontFamily: "UberMoveText-Regular",
    overflow: "hidden",
  },

  likeButton: {
    marginLeft: 12,
    width: 38,
    height: 38,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#F6F5F4",
  },
  likeIcon: {
    width: 38,
    height: 38,
    marginBottom: 25,
  },
  activityOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    width: "100%",
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  orgAcademy: {
    color: "#267DFF",
    fontWeight: 500,
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
    flexShrink: 1,
    maxWidth: "100%", // Ensures it doesn't take too much space
  },
  orgDot: {
    color: "#6D6D73",
    fontSize: 13,
    marginHorizontal: 2,
  },
  orgDuration: {
    color: "#6D6D73",
    fontSize: 13,
    fontFamily: "UberMoveText-Regular",
    flexShrink: 0,
    fontWeight: "400",
    height: 18,
  },
  orgTypeInPerson: {
    color: "#267DFF",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    flexShrink: 0,
  },
  orgTypeRemote: {
    color: "#16B364",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    flexShrink: 0,
  },
  viewAllSavedBtn: {
    borderWidth: 1,
    borderColor: "#B6D2F7",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginHorizontal: 18, // Add left and right margin to match title positioning
    marginTop: 4,
    backgroundColor: "transparent",
    width: 339, // Match your desired width
    shadowColor: "#000",
    alignSelf: "center",
  },
  viewAllSavedText: {
    color: "#FAFAFC",
    fontWeight: "400",
    fontSize: 13,
    fontFamily: "UberMoveText-Regular",
  },
  activeIcon: {
    tintColor: "#0F80FA", // blue
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
    width: "100%",
  },
  

});

export default ProfileScreen;