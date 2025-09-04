import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal, Platform, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../../hooks/useThemeContext";
import { savedAPI, opportunitiesAPI, applicationsAPI, userAPI } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import SkeletonLoader, { OpportunityDetailsSkeleton } from "./SkeletonLoader";
import OpportunityContent from "./explore/OpportunityContent";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStandardizedAlert } from "../hooks/useStandardizedAlert";
import StandardizedModal from "./StandardizedModal";
import StandardizedConfirmationModal from "./StandardizedConfirmationModal";

// Conditionally import WebView only on supported platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (error) {
    console.warn('WebView not available:', error);
  }
}

const { width, height } = Dimensions.get("window");

// Custom iframe component for React Native web
const WebIframe = ({ src, style }: { src: string; style?: any }) => {
  if (Platform.OS === 'web') {
    // For web platform, use iframe
    return (
      <iframe
        src={src}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          ...style,
        }}
        title="Application Form"
        allow="camera; microphone; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    );
  }
  return null;
};

interface OpportunityDetailsProps {
  onClose?: () => void;
  opportunityId?: string;
  isSaved?: boolean;
  onToggleSave?: (isSaved: boolean) => void;
  isLocked?: boolean;
  onUnlock?: (id: string) => void;
}

interface OpportunityData {
  _id?: string;
  title?: string;
  description?: string;
  institution?: string;
  organization?: string; // API field for organization name
  duration?: string;
  workType?: string;
  startDate?: string;
  eligibility?: string;
  tags?: string[];
  fields?: string[]; // API field for opportunity categories/fields
  states?: string; // API field for work type (remote, hybrid, in-person)
  types?: string; // API field for opportunity type
  bannerImage?: string;
  imageLink?: string; // API field for opportunity image
  applicationUrl?: string;
  [key: string]: any;
}





/**
 * OpportunityDetails Component
 * 
 * This component displays detailed information about an opportunity and provides
 * functionality to save/unsave opportunities and apply to them.
 * 
 * Key Features:
 * - Dynamic data fetching from API
 * - Dark mode support
 * - Save/unsave functionality
 * - WebView/iframe application form integration
 * - Skeleton loading states
 * 
 * WebView/iframe Application Form Integration:
 * 
 * To use the WebView/iframe application form feature:
 * 
 * 1. **Option 1: Use opportunity-specific URL**
 *    - Add an `applicationUrl` field to your opportunity data
 *    - The component will automatically use this URL when available
 * 
 * 2. **Option 2: Use FutureFind business partnership form (default)**
 *    - By default, the component uses the FutureFind business partnership page
 *    - URL: https://www.future-find.org/business
 *    - This allows businesses to partner with FutureFind and connect with students
 * 
 * 3. **Option 3: Custom application form**
 *    - Modify the `getApplicationUrl()` function to use your own application form
 *    - Common options:
 *      - Google Forms: https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
 *      - Microsoft Forms: https://forms.office.com/Pages/ResponsePage.aspx?id=YOUR_FORM_ID
 *      - SurveyMonkey: https://www.surveymonkey.com/r/YOUR_FORM_ID
 *      - Custom form: https://your-website.com/application-form
 * 
 * Application Flow:
 * 1. User clicks "Apply Now" → WebView/iframe opens with application form
 * 2. User fills out form and closes WebView → Confirmation dialog appears
 * 3. User confirms they applied → Application is created via API
 * 4. User selects application status → Application is updated
 * 
 * Example usage:
 * ```typescript
 * // In your opportunity data
 * const opportunityData = {
 *   _id: "123",
 *   title: "Software Engineering Internship",
 *   applicationUrl: "https://docs.google.com/forms/d/e/YOUR_ACTUAL_FORM_ID/viewform",
 *   // ... other fields
 * };
 * ```
 */
const OpportunityDetails: React.FC<OpportunityDetailsProps> = ({ 
  onClose, 
  opportunityId, 
  isSaved: initialIsSaved = false,
  onToggleSave,
  isLocked = false,
  onUnlock,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const [isLiked, setIsLiked] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showApplicationConfirmation, setShowApplicationConfirmation] = useState(false);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [isStatusSelectionLoading, setIsStatusSelectionLoading] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  // Use React Query for caching opportunity data
  const { 
    data: opportunityData, 
    isLoading: loading, 
    error: queryError,
    refetch: fetchOpportunityData 
  } = useQuery({
    queryKey: ['opportunity', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return null;
      const response = await opportunitiesAPI.getById(opportunityId);
      return response.data || response;
    },
    enabled: !!opportunityId, // Only run query when opportunityId exists
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (newer property name)
  });

  // Update local state when isSaved prop changes
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsLiked(initialIsSaved);
    }
  }, [initialIsSaved]);

  // Check if user has already applied to this opportunity
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!opportunityId) return;
      
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // You can add an API call here to check if user already has an application
        // For example: const existingApp = await applicationsAPI.checkExisting(opportunityId);
        // setHasExistingApplication(!!existingApp);
        
        // For now, we'll set it to false and handle it in the API response
        setHasExistingApplication(false);
      } catch (error) {
        console.error('Error checking existing application:', error);
        setHasExistingApplication(false);
      }
    };

    checkExistingApplication();
  }, [opportunityId]);

  // Reset loading states when modal is closed
  const resetLoadingStates = () => {
    setLoadingStatus('loading');
    setLoadingMessage('');
    setIsStatusSelectionLoading(false);
    setFormSubmitted(false);
    setWebViewUrl('');
  };

  const handleHeartPress = async () => {
    if (!opportunityId || isSaving) return;
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setIsSaving(true);

    try {
      if (newLikedState) {
        // Save the opportunity
        await savedAPI.save(opportunityId);
        console.log('Opportunity saved successfully');
      } else {
        // Unsave the opportunity
        await savedAPI.remove(opportunityId);
        console.log('Opportunity unsaved successfully');
      }
      
      // Call the parent callback if provided
      onToggleSave?.(newLikedState);
    } catch (error) {
      console.error('Failed to toggle save:', error);
      // Revert the state if the API call fails
      setIsLiked(!newLikedState);
      
      // Handle already saved case
      if (error instanceof Error && error.message?.includes('already saved')) {
        setIsLiked(true);
      }
    } finally {
      setIsSaving(false);
    }
  };



  const handleApplicationConfirmation = async (didApply: boolean) => {
    setShowApplicationConfirmation(false);
    
    if (!didApply) {
      return; // User didn't apply, do nothing
    }

    if (!opportunityId) {
      showError('Error', 'Opportunity ID not found');
      return;
    }

    // Show loading state immediately
    setIsCreatingApplication(true);
    setIsStatusSelectionLoading(true);
    setLoadingStatus('loading');
    setLoadingMessage('Creating your application...');
    
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('User not authenticated. Please log in again.');
      }
      console.log('User token exists:', !!token);

      // Get current user profile to get the user ID
      const userResponse = await userAPI.getProfile();
      console.log('User profile response:', userResponse);
      
      const userId = userResponse.data?._id || userResponse._id;
      console.log('User ID:', userId);
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Create application with the specified request body format
      // Note: The API adds opportunityId to the data, so we don't need to include it
      const applicationData = {
        applicant: userId
      };
      
      console.log('Creating application with data:', applicationData);
      console.log('API endpoint:', 'applicationsAPI.apply');

      const response = await applicationsAPI.apply(opportunityId, applicationData);
      console.log('Application creation response:', response);
      
      // Check if the API call was successful
      if (response.success || response.statusCode === 201 || response.data?._id) {
        // Get the created application ID from the response
        const applicationId = response.data?._id;
        console.log('Application ID from response:', applicationId);
        
        if (applicationId) {
          // Store the created application details for status selection
          setCreatedApplicationId(applicationId);
          setCreatedOpportunityId(opportunityId);
          setCreatedUserId(userId);
          
          // Show success message in loading card
          setLoadingStatus('success');
          setLoadingMessage('Application created successfully! Opening status selection...');
          
          // Wait a moment to show success message, then open status selection
          setTimeout(() => {
            setShowStatusSelection(true);
            setIsStatusSelectionLoading(false);
          }, 1500);
        } else {
          // Show success message in loading card
          setLoadingStatus('success');
          setLoadingMessage('Your application has been submitted successfully!');
          
          // Wait a moment to show success message, then close
          setTimeout(() => {
            setIsStatusSelectionLoading(false);
          }, 2000);
        }
      } else {
        console.error('API response indicates failure:', response);
        throw new Error(`API response: ${JSON.stringify(response)}`);
      }
      
    } catch (error) {
      console.error('Failed to create application:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        opportunityId,
        error
      });
      
      // Handle specific error cases and show in loading card
      let errorMessage = 'Failed to submit your application';
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'You have already applied to this opportunity.';
        } else if (error.message.includes('not authenticated')) {
          errorMessage = 'Please log in again to apply.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Show error in loading card
      setLoadingStatus('error');
      setLoadingMessage(errorMessage);
      
      // Wait a moment to show error message, then close
      setTimeout(() => {
        setIsStatusSelectionLoading(false);
      }, 3000);
    } finally {
      // Always stop creating application state
      setIsCreatingApplication(false);
    }
  };

  const handleStatusSelection = async (selectedStatus: string) => {
    if (!createdApplicationId || !createdOpportunityId || !createdUserId) {
      showError('Error', 'Application details not found');
      return;
    }

    try {
      // Update the application status to the selected status
      const updateData = {
        opportunity: createdOpportunityId,
        applicant: createdUserId,
        status: selectedStatus
      };
      
      await applicationsAPI.updateApplication(createdApplicationId, updateData);
      console.log(`Application status updated to ${selectedStatus}`);
      
      // Show success message
      showSuccess(
        'Success!', 
        `Your application has been submitted and status set to ${selectedStatus}.`
      );
      
      // Reset states
      setShowStatusSelection(false);
      setCreatedApplicationId(null);
      setCreatedOpportunityId(null);
      setCreatedUserId(null);
      
    } catch (error) {
      console.error('Failed to update application status:', error);
      showError(
        'Error', 
        'Failed to update application status. Please try again.'
      );
    } finally {
      // Ensure loading state is stopped
      setIsStatusSelectionLoading(false);
    }
  };

  const handleApplyNow = async () => {
    // If locked, prompt to unlock first
    if (isLocked) {
      showInfo(
        'Unlock required',
        'This opportunity is locked. Unlock to apply (10 points will be deducted). Continue?'
      );
      // For now, just call onUnlock directly. In a full implementation, you'd create a custom confirmation modal
      if (onUnlock) {
        onUnlock(opportunityId || '');
      }
      return;
    }

    // Check if user has already applied to this opportunity
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showError('Error', 'Please log in to apply for opportunities.');
        return;
      }

      // You can add a check here to see if user already has an application
      // This would require an API endpoint to check existing applications
      // For now, we'll proceed with the application form
      
      // Reset form submission state for new application
      setFormSubmitted(false);
      setWebViewUrl('');
      
      // Open web form for application
      setWebViewVisible(true);
    } catch (error) {
      console.error('Error checking application status:', error);
      showError('Error', 'Unable to check application status. Please try again.');
    }
  };

  const handleWebViewClose = () => {
    setWebViewVisible(false);
    // Show confirmation dialog after WebView is closed
    setShowApplicationConfirmation(true);
  };

  // Detect form submissions by monitoring URL changes
  const handleWebViewNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url;
    setWebViewUrl(currentUrl);
    
    // Check for common form submission indicators
    const isFormSubmitted = 
      currentUrl.includes('success') ||
      currentUrl.includes('thank') ||
      currentUrl.includes('submitted') ||
      currentUrl.includes('confirmation') ||
      currentUrl.includes('complete') ||
      currentUrl.includes('done') ||
      currentUrl.includes('form') && currentUrl.includes('response');
    
    if (isFormSubmitted) {
      setFormSubmitted(true);
      console.log('Form submission detected from URL:', currentUrl);
    }
  };

  // Enhanced close handler that considers form submission detection
  const handleWebViewCloseEnhanced = () => {
    setWebViewVisible(false);
    
    if (formSubmitted) {
      // If we detected a form submission, show success confirmation
      setLoadingStatus('success');
      setLoadingMessage('Form submission detected! Creating your application...');
      setIsStatusSelectionLoading(true);
      
      // Automatically create the application since form was submitted
      setTimeout(() => {
        handleApplicationConfirmation(true);
      }, 1000);
    } else {
      // Show the "Did you apply?" confirmation popup
      setShowApplicationConfirmation(true);
    }
  };

  const handleWebViewCloseWithoutApply = () => {
    setWebViewVisible(false);
    // Reset any loading states if user closes without applying
    resetLoadingStates();
  };

  const handleDirectApplication = async () => {
    if (!opportunityId) {
      showError('Error', 'Opportunity ID not found');
      return;
    }

    // Show loading state immediately
    setIsCreatingApplication(true);
    setIsStatusSelectionLoading(true);
    setLoadingStatus('loading');
    setLoadingMessage('Creating your application...');
    
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('User not authenticated. Please log in again.');
      }
      console.log('User token exists:', !!token);

      // Get current user profile to get the user ID
      const userResponse = await userAPI.getProfile();
      console.log('User profile response:', userResponse);
      
      const userId = userResponse.data?._id || userResponse._id;
      console.log('User ID:', userId);
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Create application with the specified request body format
      const applicationData = {
        applicant: userId
      };
      
      console.log('Creating application with data:', applicationData);
      console.log('API endpoint:', 'applicationsAPI.apply');

      const response = await applicationsAPI.apply(opportunityId, applicationData);
      console.log('Application creation response:', response);
      
      // Check if the API call was successful
      if (response.success || response.statusCode === 201 || response.data?._id) {
        // Get the created application ID from the response
        const applicationId = response.data?._id;
        console.log('Application ID from response:', applicationId);
        
        if (applicationId) {
          // Store the created application details for status selection
          setCreatedApplicationId(applicationId);
          setCreatedOpportunityId(opportunityId);
          setCreatedUserId(userId);
          
          // Show success message in loading card
          setLoadingStatus('success');
          setLoadingMessage('Application created successfully! Opening status selection...');
          
          // Wait a moment to show success message, then open status selection
          setTimeout(() => {
            setShowStatusSelection(true);
            setIsStatusSelectionLoading(false);
          }, 1500);
        } else {
          // Show success message in loading card
          setLoadingStatus('success');
          setLoadingMessage('Your application has been submitted successfully!');
          
          // Wait a moment to show success message, then close
          setTimeout(() => {
            setIsStatusSelectionLoading(false);
          }, 2000);
        }
      } else {
        console.error('API response indicates failure:', response);
        throw new Error(`API response: ${JSON.stringify(response)}`);
      }
      
    } catch (error) {
      console.error('Failed to create application:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        opportunityId,
        error
      });
      
      // Handle specific error cases and show in loading card
      let errorMessage = 'Failed to submit your application';
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'You have already applied to this opportunity.';
        } else if (error.message.includes('not authenticated')) {
          errorMessage = 'Please log in again to apply.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Show error in loading card
      setLoadingStatus('error');
      setLoadingMessage(errorMessage);
      
      // Wait a moment to show error message, then close
      setTimeout(() => {
        setIsStatusSelectionLoading(false);
      }, 3000);
    } finally {
      // Always stop creating application state
      setIsCreatingApplication(false);
    }
  };



  const getApplicationUrl = () => {
    // Return the application URL from opportunity data or a default one
    // You can customize this URL based on your needs
    const baseUrl = opportunityData?.applicationUrl;
    
    if (baseUrl) {
      return baseUrl;
    }
    
    // Use the FutureFind business partnership form URL
    // This is the official FutureFind business partnership page
    const futureFindBusinessUrl = 'https://www.future-find.org/business';
    
    return futureFindBusinessUrl;
  };

  const colors = {
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
    sheetBg: isDark ? '#23272F' : '#FFFFFF',
    title: isDark ? '#FFFFFF' : '#FFFFFF',
    subtitle: isDark ? '#FFFFFF' : '#FFFFFF',
    tagBorder: isDark ? '#FFFFFF' : '#FFFFFF',
    tagText: isDark ? '#FFFFFF' : '#FFFFFF',
    sectionTitle: isDark ? '#FFFFFF' : '#FFFFFF',
    sectionTitle2: isDark ? '#FFFFFF' : '#000000',
    infoCardBg: isDark ? '#2A2F3A' : '#F5F9FF',
    infoLabel: isDark ? '#B0B0B0' : '#6D6D73',
    infoValue: isDark ? '#FFFFFF' : '#000000',
    descriptionContainer: isDark ? '#2A2F3A' : '#FFFFFF',
    descriptionText: isDark ? '#E0E0E0' : '#101017',
    iconButtonBorder: isDark ? '#404040' : '#F6F5F4',
    applyButton: isDark ? '#2E90FA' : '#0676EF',
    heartColor: isLiked ? "rgba(46, 144, 250, 1)" : "#2E90FA",
    // Modal colors for proper dark/light mode support
    modalBg: isDark ? '#23272F' : '#FFFFFF',
    modalText: isDark ? '#FFFFFF' : '#000000',
    modalSubtext: isDark ? '#B0B0B0' : '#6D6D73',
    modalBorder: isDark ? '#404040' : '#E0E0E0',
    noButtonBg: isDark ? '#404040' : '#E0E0E0',
    noButtonText: isDark ? '#FFFFFF' : '#000000',
    statusButtonBg: isDark ? '#2A2F3A' : '#F5F9FF',
  };

  if (loading) {
    return <OpportunityDetailsSkeleton />;
  }

  if (queryError || !opportunityData) {
    return (
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.sheetBg }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.title }]}>
              {queryError instanceof Error ? queryError.message : 'Failed to load opportunity details'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchOpportunityData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.overlay, { backgroundColor: colors.overlay }]} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={[styles.sheet, { backgroundColor: colors.sheetBg }]} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
        <LinearGradient
            colors={isDark ? ["#1a1f2e", "#2a2f3a"] : ["#0F80FA", "#A5CFFD"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheet}
        >
          {/* ========== SECTION 1: TOP IMAGE WITH BOTTOM FADE ========== */}
          <View style={styles.imageContainer}>
            <Image
              source={
                !imageError && opportunityData.imageLink 
                  ? { uri: opportunityData.imageLink }
                  : !imageError && opportunityData.bannerImage 
                    ? { uri: opportunityData.bannerImage }
                    : require("../../assets/images/summerinternship.png")
              }
              style={styles.bannerImage}
              resizeMode={imageError ? "stretch" : "center"}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                console.warn('Failed to load banner image for opportunity:', opportunityData._id);
                setImageError(true);
                setImageLoading(false);
              }}
            />
            
            {/* Loading indicator */}
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <SkeletonLoader width={200} height={200} />
              </View>
            )}
            
            {/* Combined blur and gradient effect */}
            <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.imageBottomBlur}>
              <LinearGradient
                colors={isDark ? ["rgba(0,0,0,0)", "rgba(42,47,58,0.3)"] : ["rgba(255,255,255,0)", "#73B5FC03"]}
                style={StyleSheet.absoluteFill}
              />
            </BlurView>
              
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
          </View>

          {/* ========== SECTION 2: CONTENT SCROLL (TITLE → DESCRIPTION) ========== */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Text */}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.title }]}>
                  {opportunityData.title || 'Opportunity Title'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtitle }]}>
                  {opportunityData.organization || opportunityData.institution || 'Institution Name'}
                </Text>
              
              {/* Tags */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}
                bounces={false}
                alwaysBounceHorizontal={false}
                scrollEventThrottle={16}
                nestedScrollEnabled={true}
                style={styles.tagsScrollView}
                contentInsetAdjustmentBehavior="never"
              >
                {[
                  ...(opportunityData.fields || []),
                  opportunityData.states,
                  opportunityData.types,
                  ...(opportunityData.tags || [])
                ].filter(Boolean).map((tag, index) => (
                  <View key={index} style={styles.tagContainer}>
                    <Text style={[styles.tag, { color: colors.tagText, borderColor: colors.tagBorder }]}>{tag}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* About */}
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>About</Text>
            <View style={styles.opportunityContentContainer}>
              <OpportunityContent 
                startDate={opportunityData.opportunityStartDate || opportunityData.startDate || 'TBD'}
                duration={opportunityData.duration || 'TBD'}
                eligibility={opportunityData.eligibility || 'TBD'}
              />
            </View>

            {/* Description */}
              <View style={[styles.descriptionContainer, { backgroundColor: colors.descriptionContainer }]}>
                <Text style={[styles.sectionTitle2, { color: colors.sectionTitle2 }]}>Description</Text>
                <TouchableOpacity 
                  onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[styles.descriptionText, { color: colors.descriptionText }]}
                    numberOfLines={isDescriptionExpanded ? undefined : 3}
                  >
                    {opportunityData.description || 'No description available for this opportunity.'}
                  </Text>
                  {!isDescriptionExpanded && (
                    <Text style={[styles.expandText, { color: colors.applyButton }]}>
                      ... Read more
                    </Text>
                  )}
                  {isDescriptionExpanded && (
                    <Text style={[styles.expandText, { color: colors.applyButton }]}>
                      Show less
                    </Text>
                  )}
                </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ========== SECTION 3: BOTTOM ACTIONS ========== */}
          <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  { 
                    borderColor: isLiked ? 'rgba(199, 214, 230, 1)' : colors.iconButtonBorder,
                    opacity: isSaving ? 1 : 1
                  }
                ]}
                onPress={handleHeartPress}
                disabled={isSaving}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={colors.heartColor} 
              />
            </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.applyButton, 
                  { 
                    backgroundColor: hasExistingApplication ? '#6B7280' : colors.applyButton,
                    opacity: hasExistingApplication ? 0.7 : 1
                  }
                ]} 
                onPress={handleApplyNow}
                disabled={hasExistingApplication}
              >
                <Text style={styles.applyText}>
                  {hasExistingApplication ? 'Already Applied' : 'Apply Now'}
                </Text>
              </TouchableOpacity>
          </View>
        </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* WebView/iframe Modal for Application Form */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWebViewCloseEnhanced}
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleWebViewCloseEnhanced}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.webViewHeader, { backgroundColor: isDark ? '#23272F' : '#FFFFFF' }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleWebViewCloseEnhanced}
              >
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
              <Text style={[styles.webViewTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Application Form
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* WebView for mobile platforms, iframe for web platform */}
            {Platform.OS === 'web' ? (
              // Web platform: Use custom WebIframe component
              <View style={styles.webView}>
                <WebIframe src={getApplicationUrl()} />
              </View>
            ) : WebView ? (
              // Mobile platforms: Use WebView
              <WebView
                source={{ uri: getApplicationUrl() }}
                style={styles.webView}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                onError={(syntheticEvent: any) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                  setWebViewLoading(false);
                }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoadingContainer}>
                    <SkeletonLoader width="100%" height={200} />
                    <SkeletonLoader width="80%" height={20} style={{ marginTop: 20 }} />
                    <SkeletonLoader width="60%" height={16} style={{ marginTop: 10 }} />
                  </View>
                )}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                scalesPageToFit={true}
                bounces={false}
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              // Fallback for platforms where WebView is not available
              <View style={styles.webViewLoadingContainer}>
                <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 16, textAlign: "center", marginBottom: 20 }}>
                  WebView is not available on this platform. Please open the application form in a browser.
                </Text>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.applyButton }]}
                  onPress={() => Linking.openURL(getApplicationUrl())}
                >
                  <Text style={styles.applyText}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Application Confirmation Modal */}
      <StandardizedConfirmationModal
        visible={showApplicationConfirmation}
        onClose={() => setShowApplicationConfirmation(false)}
        title="Did you apply?"
        message="Please confirm if you completed the application for this opportunity."
        confirmText={isCreatingApplication ? "Creating..." : "Yes, I applied"}
        cancelText="No, I didn't"
        onConfirm={() => handleApplicationConfirmation(true)}
        onCancel={() => handleApplicationConfirmation(false)}
        loading={isCreatingApplication}
        type="info"
      />

      {/* Enhanced Loading Modal for Status Selection */}
      <StandardizedModal
        visible={isStatusSelectionLoading}
        onClose={loadingStatus === 'error' || loadingStatus === 'success' ? resetLoadingStates : () => {}}
        type="confirmation"
        animationType="fade"
        showCloseButton={loadingStatus === 'error' || loadingStatus === 'success'}
      >
        <View style={styles.loadingContent}>
          {/* Show different content based on status */}
          {loadingStatus === 'loading' && (
            <>
              <View style={[styles.loadingSpinnerContainer, { backgroundColor: colors.applyButton + '15' }]}>
                <ActivityIndicator size="large" color={colors.applyButton} />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.modalText }]}>
                Creating Application...
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.modalSubtext }]}>
                Please wait while we set up your application
              </Text>
              <View style={styles.loadingProgressBar}>
                <View style={[styles.loadingProgressFill, { backgroundColor: colors.applyButton }]} />
              </View>
            </>
          )}
          
          {loadingStatus === 'success' && (
            <>
              <View style={[styles.statusIconContainer, { backgroundColor: colors.applyButton + '20' }]}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={70} 
                  color={colors.applyButton} 
                />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.modalText }]}>
                Application Created!
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.modalSubtext }]}>
                {loadingMessage}
              </Text>
              <View style={styles.successAnimationContainer}>
                <Ionicons name="sparkles" size={24} color={colors.applyButton} />
              </View>
            </>
          )}
          
          {loadingStatus === 'error' && (
            <>
              <View style={[styles.statusIconContainer, { backgroundColor: '#EF4444' + '20' }]}>
                <Ionicons 
                  name="close-circle" 
                  size={70} 
                  color="#EF4444" 
                />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.modalText }]}>
                Something Went Wrong
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.modalSubtext }]}>
                {loadingMessage}
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.applyButton }]}
                onPress={() => {
                  setLoadingStatus('loading');
                  setLoadingMessage('Creating your application...');
                  // Retry the application creation
                  setTimeout(() => handleApplicationConfirmation(true), 1000);
                }}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </StandardizedModal>

      {/* Enhanced Status Selection Modal */}
      <StandardizedModal
        visible={showStatusSelection}
        onClose={() => setShowStatusSelection(false)}
        type="confirmation"
        animationType="fade"
        showCloseButton={true}
      >
        <View style={styles.statusSelectionContent}>
          {/* Header with icon and title */}
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: colors.applyButton + '20' }]}>
              <Ionicons 
                name="checkmark-circle" 
                size={50} 
                color={colors.applyButton} 
              />
            </View>
            <Text style={[styles.statusSelectionTitle, { color: colors.modalText }]}>
              Set Application Status
            </Text>
            <Text style={[styles.statusSelectionSubtitle, { color: colors.modalSubtext }]}>
              Choose the current status for your application
            </Text>
          </View>
          
          {/* Status buttons with better layout */}
          <View style={styles.statusButtonsContainer}>
            {/* First row - 3 buttons */}
            <View style={styles.statusButtonRow}>
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.statusButtonBg }]}
                onPress={() => handleStatusSelection('Submitted')}
              >
                <View style={styles.statusButtonIconContainer}>
                  <Ionicons name="document-text" size={24} color={colors.modalText} />
                </View>
                <Text style={[styles.statusButtonText, { color: colors.modalText }]}>Submitted</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.statusButtonBg }]}
                onPress={() => handleStatusSelection('Applied')}
              >
                <View style={styles.statusButtonIconContainer}>
                  <Ionicons name="send" size={24} color={colors.modalText} />
                </View>
                <Text style={[styles.statusButtonText, { color: colors.modalText }]}>Applied</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.statusButtonBg }]}
                onPress={() => handleStatusSelection('Accepted')}
              >
                <View style={styles.statusButtonIconContainer}>
                  <Ionicons name="checkmark" size={24} color={colors.modalText} />
                </View>
                <Text style={[styles.statusButtonText, { color: colors.modalText }]}>Accepted</Text>
              </TouchableOpacity>
            </View>
            
            {/* Second row - 2 buttons */}
            <View style={styles.statusButtonRow}>
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.statusButtonBg }]}
                onPress={() => handleStatusSelection('In Review')}
              >
                <View style={styles.statusButtonIconContainer}>
                  <Ionicons name="eye" size={24} color={colors.modalText} />
                </View>
                <Text style={[styles.statusButtonText, { color: colors.modalText }]}>In Review</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: colors.statusButtonBg }]}
                onPress={() => handleStatusSelection('Withdraw')}
              >
                <View style={styles.statusButtonIconContainer}>
                  <Ionicons name="close-circle" size={24} color={colors.modalText} />
                </View>
                <Text style={[styles.statusButtonText, { color: colors.modalText }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Cancel button */}
          <TouchableOpacity 
            style={[styles.statusCancelButton, { borderColor: colors.modalBorder }]}
            onPress={() => setShowStatusSelection(false)}
          >
            <Text style={[styles.statusCancelButtonText, { color: colors.modalSubtext }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </StandardizedModal>
    <AlertComponent />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.90,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
    backgroundColor: '#f5f5f5', // Light background for transparent images
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5', // Light background for transparent images
  },
  imageBottomBlur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: "hidden",
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 6,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  iconImage: {
    width: 20,
    height: 18.5,
  },
  textContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "UberMoveText-Medium",
    marginBottom: 2,
    width: "100%",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Regular",
  },
  tagsScrollView: {
    height: 40,
    marginBottom: 20,
  },
  tagRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingHorizontal: 0,
    minWidth: '100%',
  },
  tagContainer: {
    borderRadius: 24,
    paddingVertical: 6,
  },
  tag: {
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 15,
    marginHorizontal: 20,
    fontWeight: "500",
    fontFamily: "UberMoveText-Regular",
    marginBottom: 6,
  },
  sectionTitle2: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    marginBottom: 8,
  },
  infoCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 6,
  },
  infoCard: {
    width: 105,
    borderRadius: 17,
    height: 89,
    padding: 12,
    elevation: 2,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "400",
    marginBottom: 3,
    fontFamily: "UberMoveText-Regular",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  descriptionContainer: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    elevation: 2,
    marginBottom: 20, // Added margin bottom
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 24,
    opacity: 0.8,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  bottomActions: {
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
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  applyButton: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "UberMoveText-Regular",
  },
  retryButton: {
    backgroundColor: "#2E90FA",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "UberMoveText-Medium",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "UberMoveText-Medium",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 44,
  },
  webView: {
    flex: 1,
  },
  webViewLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)', // Semi-transparent white overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  opportunityContentContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 18,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
    textDecorationLine: 'underline',
    fontFamily: 'UberMoveText-Medium',
  },

  statusButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  statusButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    width: '100%',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'UberMoveText-Regular',
    opacity: 0.8,
    marginBottom: 24,
    lineHeight: 22,
  },
  statusSelectionModal: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSelectionContent: {
    alignItems: 'center',
    width: '100%',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusSelectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
  statusSelectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'UberMoveText-Regular',
    opacity: 0.8,
  },
  statusCancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
  },
  loadingCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingSpinnerContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    width: '60%',
    borderRadius: 2,
  },

  successAnimationContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 144, 250, 0.15)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
  },



  statusButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },


});

export default OpportunityDetails;