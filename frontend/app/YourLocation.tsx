import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import Background from './components/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { wp, hp } from './utils/dimensions';
import BackButton from './components/BackButton';

import { useTheme } from '../hooks/useThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';

const INPUT_WIDTH = wp(320);
const INPUT_HEIGHT = hp(56);
const INPUT_RADIUS = 16;
const INPUT_ICON_SIZE = 22;
const PROGRESS_WIDTH = wp(200);
const PROGRESS_HEIGHT = 4;
const NEXT_BTN_HEIGHT = hp(54);
const NEXT_BTN_RADIUS = 16;

// Skeleton for location input
const LocationInputSkeleton = () => (
  <View style={{ width: 320, gap: 16 }}>
    {/* Input field skeleton */}
    <View style={{ width: 320, height: 56, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
      {/* Icon skeleton */}
      <View style={{ width: 15, height: 18, borderRadius: 9, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 10 }} />
      {/* Input skeleton */}
      <View style={{ flex: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }} />
    </View>
    {/* Current location button skeleton */}
    <View style={{ width: 320, height: 56, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginRight: 8 }} />
      <View style={{ width: 120, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }} />
    </View>
  </View>
);

export default function YourLocation() {
  const { data: onboardingData, updateData } = useOnboarding();
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Location suggestions state with debouncing
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [debouncedAddress, setDebouncedAddress] = useState('');
  
  // Performance optimizations
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCache = useRef<Map<string, any[]>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation: Check if user has entered a location
  const isValid = address.trim() !== '';

  useEffect(() => {
    console.log('[YourLocation] Onboarding data from context:', onboardingData);
    if (onboardingData.location) {
      console.log('[YourLocation] Setting initial location from context:', onboardingData.location);
      setAddress(onboardingData.location.title || '');
      if (onboardingData.location.lat && onboardingData.location.lng) {
        setCoords({
          lat: onboardingData.location.lat,
          lng: onboardingData.location.lng,
        });
        setLocationDetected(true);
      }
    }
  }, [onboardingData]);

  // Debounced search - only search after user stops typing for 300ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedAddress(address);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [address]);

  // Fetch suggestions only after debounced address changes
  useEffect(() => {
    if (debouncedAddress.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    fetchSuggestions(debouncedAddress);
  }, [debouncedAddress]);

  // Optimized suggestions fetching with caching and request cancellation
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    const trimmedTerm = searchTerm.trim().toLowerCase();
    
    // Check cache first
    if (searchCache.current.has(trimmedTerm)) {
      setSuggestions(searchCache.current.get(trimmedTerm) || []);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setSuggestionsLoading(true);
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmedTerm
      )}&addressdetails=1&limit=5`;
      
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'FutureFindApp/1.0' },
        signal: abortControllerRef.current.signal
      });
      
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      
      // Cache the results
      searchCache.current.set(trimmedTerm, data);
      
      // Only update if this is still the current search
      if (trimmedTerm === debouncedAddress.trim().toLowerCase()) {
        setSuggestions(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      if (trimmedTerm === debouncedAddress.trim().toLowerCase()) {
        setSuggestionsLoading(false);
      }
    }
  }, [debouncedAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // When user selects a suggestion
  const handleSuggestionSelect = (item: any) => {
    setAddress(item.display_name);
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setLocationDetected(true);
    setSuggestions([]);
  };

  const handleNext = () => {
    if (!isValid) {
      alert('Please enter your location to continue.');
      return;
    }

    // Update the OnboardingContext with the location object
    const locationData = {
      title: address,
      ...(coords && { lat: coords.lat, lng: coords.lng }),
    };
    updateData({ location: locationData });
    console.log('[YourLocation] Saved location to context:', locationData);
    // Navigate to the next screen
    router.push('/SeasonAvailability');
  };

  const PROGRESS_SEGMENTS = 8;
  const PROGRESS_CURRENT = 5;
  const BAR_WIDTH = 180;
  const GAP = 4;
  const SEGMENT_WIDTH = (BAR_WIDTH - GAP * (PROGRESS_SEGMENTS - 1)) / PROGRESS_SEGMENTS;

  return (
   
      <Background>

        {/* Top Bar */}
        <View style={{
          marginTop: 63,
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          marginBottom: 8
        }}>
          <BackButton onPress={() => router.back()} style={{ left: 35, position: 'absolute', zIndex: 10 }} />
          <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16, fontFamily: 'Uber Move Text' }}>Your Location</Text>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7, position: 'absolute', right: 32, top: 0, fontFamily: 'Uber Move Text' }}>5 of 8</Text>
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
        {/* Main Content */}
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
              Where Are You Located?
            </Text>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: -0.1,
                marginBottom: 20,
                opacity: 0.8,
              }}
            >
              This helps us find nearby in-person opportunities.
            </Text>
            {/* Location Input */}
            {loading ? (
              <LocationInputSkeleton />
            ) : (
              <>
                <InputField
                  icon={<Image source={require('../assets/images/icons/LocationIcon.png')} style={{ width: 15, height: 18.11, marginRight: 10, resizeMode: 'contain', tintColor: isDark ? '#fff' : '#222' }} />}
                  placeholder="Enter your city, state, or ZIP code"
                  value={address}
                  onChangeText={(text: string) => {
                    setAddress(text);
                    setLocationDetected(false);
                    setCoords(null); // Clear coords when user types manually
                  }}
                  customStyle={{ width: 320, marginBottom: 16, backgroundColor: isDark ? '#14141C' : '#fff' }}
                  inputStyle={{ color: isDark ? '#fff' : '#222' }}
                />

                {/* Enhanced Suggestions with Better Loading States */}
                {suggestionsLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#16B364" />
                    <Text style={styles.loadingText}>Searching locations...</Text>
                  </View>
                )}
                
                {suggestions.length > 0 && (
                  <View style={[styles.suggestionsContainer, { backgroundColor: isDark ? '#23232A' : '#f5f5f5' }]}>
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => item.place_id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.suggestionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' }]}
                          onPress={() => handleSuggestionSelect(item)}
                        >
                          <Text style={[styles.suggestionText, { color: isDark ? '#fff' : '#222' }]}>{item.display_name}</Text>
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                )}

                {/* Current Location Detected Button */}
                {!locationDetected ? (
                  <TouchableOpacity
                    style={{
                      width: 320,
                      height: 56,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: '#fff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      backgroundColor: 'transparent',
                    }}
                    onPress={async () => {
                      try {
                        // iOS requires more specific permission types
                        let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
                        
                        // For iOS, also request background permissions if needed
                        if (foregroundStatus !== 'granted') {
                          alert('Permission to access location was denied. Please enable location permissions in Settings.');
                          return;
                        }
                        
                        // On iOS, we need to check if location services are enabled
                        let locationEnabled = await Location.hasServicesEnabledAsync();
                        if (!locationEnabled) {
                          alert('Location services are disabled. Please enable location services in Settings.');
                          return;
                        }
                        
                        setLoading(true);
                        let loc = await Location.getCurrentPositionAsync({
                          accuracy: Accuracy.Balanced,
                          timeInterval: 10000,
                          distanceInterval: 10,
                        });
                        
                        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                        
                        // Use reverse geocoding to get address
                        let geocode = await Location.reverseGeocodeAsync({
                          latitude: loc.coords.latitude,
                          longitude: loc.coords.longitude
                        });
                        
                        if (geocode.length > 0) {
                          const { street, city, region, country, postalCode } = geocode[0];
                          const locationParts = [city, region, country].filter(Boolean);
                          const locationString = locationParts.join(', ');
                          setAddress(locationString || 'Current Location');
                          setLocationDetected(true);
                        } else {
                          // Fallback to coordinates if geocoding fails
                          setAddress(`Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`);
                          setLocationDetected(true);
                        }
                      } catch (error: any) {
                        console.error('Location error:', error);
                        if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
                          alert('Location services are disabled. Please enable location services in Settings.');
                        } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
                          alert('Location is currently unavailable. Please try again.');
                        } else {
                          alert('Could not determine your location. Please try again or enter manually.');
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Image source={require('../assets/images/icons/CurrentLocation.png')} style={{ width: 18.33, height: 18.33, marginRight: 8, resizeMode: 'contain', tintColor: '#fff' }} />
                    <Text style={{
                      color: '#FFFFFF',
                      fontFamily: 'Uber Move Text',
                      fontWeight: '500',
                      fontStyle: 'normal',
                      fontSize: 16,
                      lineHeight: 24,
                      letterSpacing: -0.1,
                      textAlign: 'center',
                      height: 24,
                      opacity: 1,
                    }}>Use My Current Location</Text>
                  </TouchableOpacity>
                ) : (
                <View
                  style={{
                    width: 320,
                    height: 50,
                    borderRadius: 16,
                    overflow: 'hidden',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    backgroundColor: isDark ? '#143C2B' : '#D2F4E3',
                  }}
                >
                  <Image
                    source={require('../assets/images/icons/CurrentLocation.png')}
                    style={{
                      width: 18.33,
                      height: 18.33,
                      marginRight: 8,
                      resizeMode: 'contain',
                      tintColor: isDark ? '#16B364' : '#16B364',
                      zIndex: 1,
                    }}
                  />
                  <Text
                    style={{
                      color: '#16B364',
                      fontFamily: 'Uber Move Text',
                      fontWeight: '500',
                      fontSize: 16,
                      lineHeight: 24,
                      letterSpacing: -0.1,
                      textAlign: 'center',
                      width: 198,
                      height: 24,
                    }}
                  >
                    Current Location Detected
                  </Text>
                </View>
                )}
              </>
            )}
            {/* Helper Text */}
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{
                color: '#FFFFFF',
                fontFamily: 'Uber Move Text',
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: 13,
                lineHeight: 18,
                letterSpacing: -0.1,
                textAlign: 'center',
                opacity: 0.6,
                marginTop: 4,
                width: '100%',
              }}>
                Your location helps us find nearby opportunities
              </Text>
            </View>
          </View>
        </View>
        {/* Next Button */}
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 32 }}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
            style={{ borderRadius: NEXT_BTN_RADIUS, height: NEXT_BTN_HEIGHT, width: 320 }}
            disabled={!isValid} // Disable button until valid location is entered
          />
        </View>
      </Background>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  loadingText: {
    color: '#16B364',
    fontSize: 14,
    fontFamily: 'UberMoveText-Regular',
    marginLeft: 8,
  },
  suggestionsContainer: {
    width: 320,
    backgroundColor: '#23232A',
    borderRadius: 8,
    maxHeight: 180,
    marginBottom: 8,
    alignSelf: 'center',
    zIndex: 10,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'UberMoveText-Regular',
  },
});
