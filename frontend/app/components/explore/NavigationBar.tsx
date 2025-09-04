import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useTheme } from '../../../hooks/useThemeContext';
import { userAPI, opportunitiesAPI } from '../../services/api';
import { useProfileQuery, useSearchOpportunitiesQuery } from '../../services/queries';
import { useRouter } from 'expo-router';
import { NavigationBarSkeleton } from '../SkeletonLoader';
import LocationEditModal from '../LocationEditModal';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queries';

interface Props {
  onFilterPress: () => void;
  onSearchResults?: (results: any[]) => void;
}

const NavigationBar: React.FC<Props> = ({ onFilterPress, onSearchResults }) => {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  const [userLocation, setUserLocation] = useState("Loading location...");
  const [loading, setLoading] = useState(true);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeout = useRef<number | null>(null);
  const [userKey, setUserKey] = useState(0); // Key to force re-mounting when user changes
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfileQuery();

  useEffect(() => {
    if (profile) {
      const locationData: any = (profile as any).location;
      if (locationData && typeof locationData === 'object') {
        setUserLocation(locationData.title || 'Location not set');
      } else {
        setUserLocation(locationData || 'Location not set');
      }
    } else {
      // Reset location when profile is null/undefined (user logged out)
      setUserLocation('Location not set');
    }
    setLoading(profileLoading);
  }, [profile, profileLoading]);

  // Clear location when component unmounts or user changes
  useEffect(() => {
    return () => {
      setUserLocation('Location not set');
    };
  }, []);

  // Listen for app state changes to detect user switches
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, might be a new user login
        // Force refresh profile data
        refetchProfile();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refetchProfile]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  if (loading) {
    return <NavigationBarSkeleton />;
  }

  const handleEditLocation = () => {
    setIsLocationModalVisible(true);
  };

  const handleLocationUpdated = async (locationData: { title: string; lat?: number; lng?: number }) => {
    // Update local state immediately for better UX
    setUserLocation(locationData.title);
    
    // Update the profile cache directly with new location data
    queryClient.setQueryData(queryKeys.profile, (oldData: any) => {
      if (oldData) {
        return {
          ...oldData,
          location: {
            title: locationData.title,
            ...(locationData.lat && { lat: locationData.lat.toString() }),
            ...(locationData.lng && { lng: locationData.lng.toString() }),
          }
        };
      }
      return oldData;
    });
    
    // Also invalidate the cache to ensure fresh data is fetched on next mount
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
  };

  const closeLocationModal = () => {
    setIsLocationModalVisible(false);
  };

  // Function to force refresh profile data (call this when user logs in/out)
  const forceProfileRefresh = () => {
    setUserKey(prev => prev + 1);
    setUserLocation('Location not set');
    refetchProfile();
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      if (onSearchResults) {
        onSearchResults([]);
      }
      return;
    }
    
    // For now, we'll pass the search query to the parent component
    // which will handle the local filtering
    if (onSearchResults) {
      onSearchResults([{ query }]); // Pass query as a special object
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // Debounced search - search after user stops typing for 500ms
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (onSearchResults) {
      onSearchResults([]);
    }
    // Clear any pending search timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  const colors = {
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
    searchBg: isDark ? "rgba(10, 14, 26, 0.8)" : "rgba(15, 128, 250, 0.8)", // Using Background.tsx colors
    placeholder: isDark
      ? "rgba(255, 255, 255, 0.6)"
      : "rgba(255, 255, 255, 0.8)",
    iconBlue: "#FFFFFF", // For filled pin icon
  };

  return (
    <View style={styles.container}>
      {/* Top Row: Title + Bell */}
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Explore
        </Text>
        <TouchableOpacity onPress={() => router.push('/NotificationsScreen')}>
          <Image
            source={
              isDark
                ? require("../../../assets/icons/bell(D).png")
                : require("../../../assets/icons/bell(L).png")
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Middle Row: Location + Pencil */}
      <View style={styles.locationRow}>
        <Image
          source={require("../../../assets/icons/map-pin-fill (1).png")}
          style={[styles.smallIcon, { tintColor: colors.iconBlue }]}
        />
        <Text 
          style={[styles.location, { color: colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {userLocation}
        </Text>
        <TouchableOpacity onPress={handleEditLocation}>
          <Image
            source={require("../../../assets/icons/edit-2-line (2).png")}
            style={styles.smallIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Row: Search + Filter */}
      <View style={styles.searchRow}>
        <View
          style={[styles.searchContainer, { backgroundColor: colors.searchBg }]}
        >
          <Image
            source={require("../../../assets/icons/searchbar.png")}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchBar, { color: colors.textPrimary }]}
            placeholder="Search keyword, skills, or organization"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          {searching && searchQuery.length === 0 && (
            <View style={styles.searchLoading}>
              <Text style={styles.searchLoadingText}>🔍</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={onFilterPress}>
          <Image
            source={
              isDark
                ? require("../../../assets/icons/filter(D).png")
                : require("../../../assets/icons/filter(L).png")
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* LocationEditModal */}
      <LocationEditModal
        visible={isLocationModalVisible}
        onClose={closeLocationModal}
        onLocationUpdated={handleLocationUpdated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    width: 285,
    fontFamily: "UberMoveText-Medium",
    fontWeight: "500",
    lineHeight: 32,
    letterSpacing: -0.48,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    width: 285,
    height: 20,
    gap: 4,
    opacity: 1,
  },
  location: {
    fontSize: 14,
    marginRight: 6,
    fontFamily: "UberMoveText-Regular",
  },
  searchRow: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginRight: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    shadowColor: "#666666",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 8,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: "#fff",
  },
  searchBar: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    fontFamily: "UberMoveText-Regular",
    color: "#FFFFFF",
  },
  icon: {
    width: 44,
    height: 44,
  },
  smallIcon: {
    width: 16,
    height: 16,
  },
  searchLoading: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchLoadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NavigationBar;