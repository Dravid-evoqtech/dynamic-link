import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import TabBar from '../components/TabBar';
import ExploreViewController from '../tabs/ExploreViewController';
import SavedOpportunities from '../tabs/SavedOpportunities';
import AnalyticsScreen from '../tabs/Analytics';
import ProfileScreen from '../tabs/Profile';
import Apllication from '../tabs/Apllication';
import authService from '../services/authService';
import { userAPI } from '../services/api';
import { useProfileQuery } from '../services/queries';
import { useStandardizedAlert } from '../hooks/useStandardizedAlert';

export default function MainTabsScreen() {
  const { showError, showSuccess, showInfo, showConfirmation, AlertComponent } = useStandardizedAlert();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Explore');
  const [tabHistory, setTabHistory] = useState<string[]>(['Explore']);
  const [isExiting, setIsExiting] = useState(false);
  
  // Refs to track modal states from child components
  const modalRefs = useRef<{
    applicationModal?: { visible: boolean; onClose: () => void };
    opportunityModal?: { visible: boolean; onClose: () => void };
    profileModal?: { visible: boolean; onClose: () => void };
    locationModal?: { visible: boolean; onClose: () => void };
    appearanceModal?: { visible: boolean; onClose: () => void };
    notificationModal?: { visible: boolean; onClose: () => void };
  }>({});

  // Get user data for login streak tracking
  const { data: userData, refetch: profileRefetch } = useProfileQuery();

  // Check authentication only once on component mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('[MainTabsScreen] Checking authentication...');
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isMounted) return;
        
        if (!isAuthenticated) {
          console.log('[MainTabsScreen] User not authenticated, redirecting to login');
          router.replace('/login');
          return;
        }
        
        console.log('[MainTabsScreen] User authenticated, staying on main screen');
      } catch (error) {
        if (!isMounted) return;
        console.error('[MainTabsScreen] Error checking authentication:', error);
        router.replace('/login');
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // App Usage Tracking for Login Streak - starts when app opens
  useEffect(() => {
    let usageTimer: ReturnType<typeof setTimeout>;
    let isTracking = false;

    const startUsageTracking = () => {
      if (isTracking) return;
      
      // Wait for userData to be loaded before checking progress
      if (!userData || !userData.loginData) {
        return;
      }
      
      // Check if user has already completed 100% for today
      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0];
      const backendTodayData = userData.loginData.loginHistory?.find((login: any) => {
        const loginDate = new Date(login.date).toISOString().split('T')[0];
        return loginDate === todayDateString;
      });
      
      const backendTodayPercentage = backendTodayData?.dayPercentage || 0;
      
      // If already 100% or very close to 100%, don't start tracking
      if (backendTodayPercentage >= 95) {
        return;
      }
      
      // Force a fresh data fetch before starting tracking to ensure we have the latest
      profileRefetch().then(() => {
      });
      
      isTracking = true;
      
      // Start 30-second timer
      usageTimer = setTimeout(async () => {
        try {
          console.log('[MainTabsScreen] Login streak tracking: 30 seconds completed');
          
          // Update backend with 100% completion
          const currentPercentage = backendTodayData?.dayPercentage || 0;
          const incrementNeeded = 100 - currentPercentage;
          
          await userAPI.updateLoginData(incrementNeeded); // Send the increment needed
          
          console.log('[MainTabsScreen] Login streak updated to 100%');
          
        } catch (error) {
          console.error('[MainTabsScreen] Failed to update login data:', error);
        } finally {
          isTracking = false;
        }
      }, 30000); // 30 seconds
    };

    const stopUsageTracking = () => {
      if (usageTimer) {
        clearTimeout(usageTimer);
        isTracking = false;
      }
    };

    // Start tracking when component mounts or when app becomes active
    startUsageTracking();

    // Stop tracking when app goes to background
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && !isTracking) {
        startUsageTracking();
      } else if (nextState === 'background' || nextState === 'inactive') {
        stopUsageTracking();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      stopUsageTracking();
      subscription.remove();
    };
  }, [userData, profileRefetch]); // Add userData dependency to wait for data to load

    // Handle hardware back button (Android) and iOS navigation
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        console.log('[MainTabsScreen] Back button pressed');
        
        // First priority: Close any open modals
        const openModals = Object.values(modalRefs.current).filter(modal => modal?.visible);
        console.log('[MainTabsScreen] Open modals:', openModals.length);
        
        if (openModals.length > 0) {
          // Close the most recently opened modal (last in the array)
          const lastOpenModal = openModals[openModals.length - 1];
          console.log('[MainTabsScreen] Closing modal:', lastOpenModal);
          if (lastOpenModal?.onClose) {
            lastOpenModal.onClose();
            return true; // Prevent default back behavior
          }
        }

        // Second priority: If we're not on the Explore tab, go back to previous tab
        if (activeTab !== 'Explore' && tabHistory.length > 1) {
          const previousTab = tabHistory[tabHistory.length - 2];
          console.log('[MainTabsScreen] Going back to previous tab:', previousTab);
          setActiveTab(previousTab);
          setTabHistory(prev => prev.slice(0, -1));
          return true; // Prevent default back behavior
        }
        
        // Third priority: If we're on Explore tab, show exit confirmation
        if (activeTab === 'Explore' && !isExiting) {
          console.log('[MainTabsScreen] Showing exit confirmation');
          setIsExiting(true);
          
          // Show confirmation dialog
          showConfirmation(
            'Exit App',
            'Are you sure you want to exit the app?',
            () => {
              console.log('[MainTabsScreen] User confirmed exit');
              BackHandler.exitApp();
            },
            () => {
              console.log('[MainTabsScreen] Exit cancelled');
              setIsExiting(false);
            },
            'Exit',
            'Cancel'
          );
          return true; // Prevent default back behavior
        }
        
        console.log('[MainTabsScreen] Allowing default back behavior');
        return false; // Allow default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    } else if (Platform.OS === 'ios') {
      // On iOS, prevent swipe-back navigation to login/onboarding screens
      // This ensures users can't accidentally go back to authentication screens
      console.log('[MainTabsScreen] iOS platform detected - preventing swipe-back navigation');
    }
    // iOS handles back navigation through swipe gestures and navigation bars
  }, [activeTab, tabHistory, isExiting]);

  // Handle tab changes and maintain history
  const handleTabPress = (tab: string) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setTabHistory(prev => [...prev, tab]);
    }
  };

  // Function to register modal refs from child components
  const registerModal = useCallback((modalType: string, modalRef: { visible: boolean; onClose: () => void }) => {
    console.log('[MainTabsScreen] Registering modal:', modalType, modalRef);
    modalRefs.current[modalType as keyof typeof modalRefs.current] = modalRef;
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Explore':
        return <ExploreViewController />;
      case 'Application':
        return <Apllication 
          onRegisterModal={(ref) => registerModal('applicationModal', ref)}
          onTabChange={handleTabPress}
        />;
      case 'Saved':
        return <SavedOpportunities 
          onRegisterModal={(ref) => registerModal('opportunityModal', ref)}
          onTabChange={handleTabPress}
        />;
      case 'Analytics':
        return <AnalyticsScreen onTabChange={handleTabPress} />;
      case 'Profile':
        return <ProfileScreen onRegisterModal={(ref) => registerModal('profileModal', ref)} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderTabContent()}</View>
      <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
    <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 }, // add bottom padding to make space for the tab bar
});
