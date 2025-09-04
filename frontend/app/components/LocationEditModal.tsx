import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../hooks/useThemeContext';
import { userAPI } from '../services/api';
import InputField from './InputField';
import PrimaryButton from './PrimaryButton';
import Background from './Background';
import { useStandardizedAlert } from '../hooks/useStandardizedAlert';

interface LocationEditModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationUpdated?: (location: { title: string; lat?: number; lng?: number }) => void;
}

const LocationEditModal: React.FC<LocationEditModalProps> = ({
  visible,
  onClose,
  onLocationUpdated,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { showError, showSuccess, AlertComponent } = useStandardizedAlert();
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Suggestions state with debouncing
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [debouncedAddress, setDebouncedAddress] = useState('');
  
  // Performance optimizations
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCache = useRef<Map<string, any[]>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch current location when modal opens
  useEffect(() => {
    if (visible) {
      fetchCurrentLocation();
    }
  }, [visible]);

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

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      const locationData = response.data?.location;
      if (locationData && typeof locationData === 'object') {
        setAddress(locationData.title || '');
        if (locationData.lat && locationData.lng) {
          setCoords({
            lat: locationData.lat,
            lng: locationData.lng,
          });
          setLocationDetected(true);
        }
      } else if (locationData) {
        setAddress(locationData || '');
      }
    } catch (error) {
      console.error('Failed to fetch current location:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUseCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Denied', 'Permission to access location was denied');
        return;
      }

      setLoading(true);
      let loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geocode.length > 0) {
          const { city, region, country } = geocode[0];
          const locationString = [city, region, country].filter(Boolean).join(', ');
          setAddress(locationString || 'Current Location');
        } else {
          setAddress('Current Location');
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, using generic location name:', geocodeError);
        setAddress('Current Location');
      }

      setLocationDetected(true);
      setSuggestions([]);
    } catch (error) {
      console.error('Error getting current location:', error);
      showError('Error', 'Failed to get current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!address.trim()) {
      showError('Error', 'Please enter a location');
      return;
    }

    try {
      setSaving(true);

      // Prepare the location data for the callback
      const locationData = {
        title: address.trim(),
        ...(coords && { lat: coords.lat, lng: coords.lng }),
      };

      // Use the dedicated updateLocation endpoint with the correct structure
      const requestBody = {
        location: {
          title: address.trim(),
          ...(coords && { lat: coords.lat.toString(), lng: coords.lng.toString() }),
        },
      };

      const response = await userAPI.updateLocation(requestBody);

      // Call the callback to update the parent component
      if (onLocationUpdated) {
        onLocationUpdated(locationData);
      }

      // Close modal and show success message
      onClose();
      showSuccess('Success', 'Location updated successfully!');
    } catch (error) {
      console.error('Failed to update location:', error);

      let errorMessage = 'Failed to update location. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || errorMessage;
      }

      showError('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Background>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Image
                  source={
                    isDark
                      ? require('../../assets/icons/editprofile/leftarrow(D).png')
                      : require('../../assets/icons/editprofile/leftarrow.png')
                  }
                  style={styles.backIcon}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Location</Text>
              <View style={{ width: 30 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>Where Are You Located?</Text>
              <Text style={styles.subtitle}>
                This helps us find nearby in-person opportunities.
              </Text>

              {/* Location Input */}
              <InputField
                icon={
                  <Image
                    source={require('../../assets/images/icons/LocationIcon.png')}
                    style={{
                      width: 15,
                      height: 18.11,
                      marginRight: 10,
                      resizeMode: 'contain',
                      tintColor: isDark ? '#fff' : '#222',
                    }}
                  />
                }
                placeholder="Enter your city, state, or ZIP code"
                value={address}
                onChangeText={(text: string) => {
                  setAddress(text);
                  setLocationDetected(false);
                  setCoords(null);
                }}
                customStyle={{
                  width: 320,
                  marginBottom: 8,
                  backgroundColor: isDark ? '#14141C' : '#fff',
                }}
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

              {/* Current Location Button */}
              {!locationDetected ? (
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={loading}
                >
                  <Image
                    source={require('../../assets/images/icons/CurrentLocation.png')}
                    style={styles.currentLocationIcon}
                  />
                  <Text style={styles.currentLocationText}>
                    {loading ? 'Detecting...' : 'Use My Current Location'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.locationDetectedContainer}>
                  <Image
                    source={require('../../assets/images/icons/CurrentLocation.png')}
                    style={styles.locationDetectedIcon}
                  />
                  <Text style={styles.locationDetectedText}>Current Location Detected</Text>
                </View>
              )}

              {/* Helper Text */}
              <Text style={styles.helperText}>
                Your location helps us find nearby opportunities
              </Text>
            </View>

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={saving ? 'Saving...' : 'Save Location'}
                onPress={handleSaveLocation}
                style={styles.saveButton}
                disabled={saving || !address.trim()}
              />
            </View>
          </Background>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    <AlertComponent />
  </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  backIcon: {
    width: 38,
    height: 38,
    right: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'UberMoveText-Medium',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: '#fff',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    marginBottom: 32,
    opacity: 0.8,
    textAlign: 'center',
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
  currentLocationButton: {
    width: 320,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  currentLocationIcon: {
    width: 18.33,
    height: 18.33,
    marginRight: 8,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  currentLocationText: {
    color: '#FFFFFF',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  locationDetectedContainer: {
    width: 320,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(170, 240, 196, 0.9)',
  },
  locationDetectedIcon: {
    width: 18.33,
    height: 18.33,
    marginRight: 8,
    resizeMode: 'contain',
    tintColor: '#16B364',
  },
  locationDetectedText: {
    color: '#16B364',
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  helperText: {
    color: '#FFFFFF',
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  saveButton: {
    borderRadius: 16,
    height: 54,
    width: 320,
  },
});

export default LocationEditModal;