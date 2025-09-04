import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import Background from '../Background';
import ApplicationCard from './ApplicationCard';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useThemeContext';
import OpportunityContent from './OpportunityContent';
import { applicationsAPI } from '../../services/api';
import { ApplicationDetailsSkeleton, ApplicationStatusSkeleton } from '../SkeletonLoader';
// Add React Query import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ApplicationDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  application: any;
};

export default function ApplicationDetailsModal({ visible, onClose, onRefresh, application }: ApplicationDetailsModalProps) {
  if (!application) return null;
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  // Add React Query client
  const queryClient = useQueryClient();

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Remove unused state variables since React Query handles them
  const [checkingSavedStatus, setCheckingSavedStatus] = useState(false);

  // React Query for fetching application details
  const { 
    data: fullApplication, 
    isLoading: loading, 
    error: queryError,
    refetch: fetchApplicationDetails 
  } = useQuery({
    queryKey: ['application', application._id],
    queryFn: async () => {
      if (!application?._id) return null;
      const response = await applicationsAPI.getApplicationById(application._id);
      const appData = response.data || response;
      
      // Set saved status from the API response
      setIsSaved(appData.isSaved || false);
      
      return appData;
    },
    enabled: visible && !!application?._id, // Only run query when modal is visible and has application ID
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // React Query mutation for updating application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, updateData }: { applicationId: string, updateData: any }) => {
      return await applicationsAPI.updateApplication(applicationId, updateData);
    },
    onSuccess: (data, variables) => {
      // Update the cache with new data
      queryClient.setQueryData(['application', variables.applicationId], (oldData: any) => ({
        ...oldData,
        status: variables.updateData.status
      }));
      
      // Invalidate and refetch the applications list to ensure filtering works properly
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      // Trigger refresh in parent component
      if (onRefresh) {
        onRefresh();
      }
      
      console.log(`Application status updated to ${variables.updateData.status}`);
    },
    onError: (error) => {
      console.error('Failed to update application status:', error);
    }
  });

  // React Query mutation for withdrawing application
  const withdrawMutation = useMutation({
    mutationFn: async ({ applicationId, updateData }: { applicationId: string, updateData: any }) => {
      return await applicationsAPI.updateApplication(applicationId, updateData);
    },
    onSuccess: (data, variables) => {
      // Update the cache with withdrawn status
      queryClient.setQueryData(['application', variables.applicationId], (oldData: any) => ({
        ...oldData,
        status: 'Withdrawn'
      }));
      
      // Invalidate and refetch the applications list to ensure filtering works properly
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      // Trigger refresh in parent component
      if (onRefresh) {
        onRefresh();
      }
      
      console.log('Application withdrawn successfully');
      setShowWithdrawConfirm(false);
      onClose();
    },
    onError: (error) => {
      console.error('Failed to withdraw application:', error);
    }
  });

  // React Query mutation for saving/unsaving application
  const toggleSaveMutation = useMutation({
    mutationFn: async ({ applicationId, shouldSave }: { applicationId: string, shouldSave: boolean }) => {
      if (shouldSave) {
        return await applicationsAPI.saveApplication(applicationId);
      } else {
        return await applicationsAPI.removeSavedApplication(applicationId);
      }
    },
    onSuccess: (data, variables) => {
      // Update local state
      setIsSaved(variables.shouldSave);
    },
    onError: (error, variables) => {
      // Revert UI state if API call fails
      setIsSaved(!variables.shouldSave);
      
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('already saved')) {
        setIsSaved(true);
      } else {
        console.error('Failed to toggle save application:', error);
      }
    }
  });

  // Handle status update using React Query mutation
  const handleStatusUpdate = async (newStatus: string) => {
    if (!fullApplication?._id || updateStatusMutation.isPending) return;
    
    const updateData = {
      opportunity: fullApplication.opportunity?._id || fullApplication.opportunity,
      applicant: fullApplication.applicant?._id || fullApplication.applicant,
      status: newStatus
    };
    
    updateStatusMutation.mutate({
      applicationId: fullApplication._id,
      updateData
    });
  };

  // Handle withdraw using React Query mutation
  const handleWithdraw = async () => {
    if (!fullApplication?._id || withdrawMutation.isPending) return;
    
    const updateData = {
      opportunity: fullApplication.opportunity?._id || fullApplication.opportunity,
      applicant: fullApplication.applicant?._id || fullApplication.applicant,
      status: 'Withdrawn'
    };
    
    withdrawMutation.mutate({
      applicationId: fullApplication._id,
      updateData
    });
  };

  // Handle toggle save using React Query mutation
  const handleToggleSaveApplication = async () => {
    if (!application._id || toggleSaveMutation.isPending) return;
    
    // Optimistic update - update UI immediately
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    toggleSaveMutation.mutate({
      applicationId: application._id,
      shouldSave: newSavedState
    });
  };

  // Remove the old useEffect since React Query handles data fetching
  // useEffect(() => { ... }, [visible, application]);

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return '#2E90FA';
      case 'Applied':
        return '#22C55E';
      case 'Accepted':
        return '#F59E42';
      case 'Withdrawn':
        return '#EF4444';
      case 'Pending':
        return '#6D6D73';
      default:
        return '#6D6D73';
    }
  };

  // Move styles inside component to access isDark
  const dynamicStyles = StyleSheet.create({
    confirmModal: {
      width: '100%',
      backgroundColor: isDark ? '#23272F' : '#fff',
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    confirmTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#101017',
      marginBottom: 12,
      fontFamily: 'UberMoveText-Medium',
    },
    confirmText: {
      fontSize: 15,
      color: isDark ? '#B0B0B0' : '#6D6D73',
      textAlign: 'center',
      marginBottom: 24,
      fontFamily: 'UberMoveText-Regular',
      lineHeight: 22,
    },
    cancelButton: {
      backgroundColor: isDark ? '#3A3A3A' : '#F6F5F4',
      marginRight: 10,
    },
    cancelButtonText: {
      color: isDark ? '#FFFFFF' : '#101017',
      fontWeight: '500',
      fontSize: 15,
      fontFamily: 'UberMoveText-Medium',
    },
    helpBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#23272F' : 'rgba(255,255,255,1)',
      borderRadius: 17,
      padding: 12,
      marginBottom: 16,
      gap: 8,
      height: 62,
      width: '100%',
    },
    helpText: {
      fontFamily: 'UberMoveText-Regular',
      fontWeight: '400',
      fontSize: 11,
      lineHeight: 11,
      letterSpacing: -0.1,
      color: isDark ? 'rgba(200, 200, 200, 1)' : 'rgba(109, 109, 115, 1)',
    },
    helpEmail: {
      fontFamily: 'UberMoveText-Medium',
      fontWeight: '500',
      fontSize: 12,
      lineHeight: 18,
      letterSpacing: -0.1,
      color: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(16, 16, 23, 1)',
    },
  });



  // Use dynamicStyles for theme-dependent elements
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Background>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Image
                source={
                  isDark
                    ? require('../../../assets/icons/closeicon(D).png')
                    : require('../../../assets/icons/closeicon(L).png')
                }
                style={styles.closeIcon}
              />
            </TouchableOpacity>
            <View style={styles.contentContainer}>
              {loading ? (
                <View style={styles.skeletonContainer}>
                  <ApplicationDetailsSkeleton />
                </View>
              ) : queryError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Failed to load application details. Please try again.
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => fetchApplicationDetails()}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : fullApplication ? (
                <>
                  <Text style={styles.modalTitle}>Application details</Text>
                  <View style={styles.cardWrapper}>
                    <ApplicationCard {...fullApplication} />
                  </View>
                  
                  {/* Overview Section */}
                  <Text style={styles.sectionTitle}>Overview</Text>
                  <View style={styles.overviewRow}>
                     <OpportunityContent 
                       startDate={fullApplication.opportunity?.startDate || 'TBD'}
                       duration={fullApplication.opportunity?.duration || 'TBD'}
                       eligibility={fullApplication.opportunity?.eligibility || 'TBD'}
                     />
                  </View>

                  {/* Application Status Section */}
                  <Text style={styles.sectionTitle}>Application Status</Text>
                  <View style={styles.statusContainer}>
                    <View style={styles.currentStatusRow}>
                      <Text style={styles.statusLabel}>Current Status:</Text>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(fullApplication.status) }
                      ]}>
                        <Text style={styles.statusText}>{fullApplication.status}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.statusDescription}>
                      Update your application status to reflect your current situation
                    </Text>
                    
                    <View style={styles.statusButtons}>
                      <TouchableOpacity 
                        style={[
                          styles.statusButton, 
                          { 
                            backgroundColor: '#2E90FA',
                            opacity: fullApplication.status === 'Submitted' ? 1 : 0.7
                          }
                        ]}
                        onPress={() => handleStatusUpdate('Submitted')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.statusButtonText}>Submitted</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.statusButton, 
                          { 
                            backgroundColor: '#22C55E',
                            opacity: fullApplication.status === 'Applied' ? 1 : 0.7
                          }
                        ]}
                        onPress={() => handleStatusUpdate('Applied')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.statusButtonText}>Applied</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.statusButton, 
                          { 
                            backgroundColor: '#F59E42',
                            opacity: fullApplication.status === 'Accepted' ? 1 : 0.7
                          }
                        ]}
                        onPress={() => handleStatusUpdate('Accepted')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.statusButtonText}>Accepted</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.statusButton, 
                          { 
                            backgroundColor: '#EF4444',
                            opacity: fullApplication.status === 'Withdrawn' ? 1 : 0.7
                          }
                        ]}
                        onPress={() => handleStatusUpdate('Withdrawn')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.statusButtonText}>Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Need Help Section */}
                  <Text style={styles.sectionTitle}>Need Help?</Text>
                  <View style={[styles.helpBox, dynamicStyles.helpBox]}>
                    {/* Replaced MaterialIcons with Image component */}
                    <Image
                      source={require('../../../assets/icons/emailiconwithbg.png')}
                      style={styles.helpIcon}
                    />
                    <Text style={[styles.helpText, dynamicStyles.helpText]}>
                      If you have questions or update your application{"\n"}
                      <Text
                        style={[styles.helpEmail, dynamicStyles.helpEmail]}
                        onPress={() => Linking.openURL('mailto:opportunities@deeptechlabs.com')}
                      >
                        opportunities@deeptechlabs.com
                      </Text>
                    </Text>
                  </View>
                  
                  {/* Bottom Buttons */}
                  <View style={styles.bottomButtonsContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.heartButton,
                        { 
                          borderColor: isDark ? '#3A3A3A' : '#fff',
                          backgroundColor: 'transparent',
                          opacity: (checkingSavedStatus || toggleSaveMutation.isPending) ? 0.5 : 1
                        }
                      ]}
                      onPress={handleToggleSaveApplication}
                      disabled={toggleSaveMutation.isPending || checkingSavedStatus}
                    >
                      <Ionicons 
                        name={isSaved ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isSaved ? "#2E90FA" : (isDark ? "#fff" : "#fff")} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.withdrawButton, 
                        { 
                          backgroundColor: isDark ? '#23272F' : '#fff',
                          opacity: (withdrawMutation.isPending || fullApplication.status === 'Withdrawn') ? 0.5 : 1
                        }
                      ]}
                      onPress={() => setShowWithdrawConfirm(true)}
                      disabled={withdrawMutation.isPending || fullApplication.status === 'Withdrawn'}
                    >
                      <Text style={[
                        styles.withdrawButtonText,
                        { color: isDark ? '#fff' : 'rgba(16, 16, 23, 1)' }
                      ]}>
                        {withdrawMutation.isPending ? 'Updating...' : 
                         fullApplication.status === 'Withdrawn' ? 'Already Withdrawn' : 'Withdraw Application'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          </Background>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Confirmation Modal for withdrawing application */}
      <Modal
        visible={showWithdrawConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmModal, dynamicStyles.confirmModal]}>
            <Text style={[styles.confirmTitle, dynamicStyles.confirmTitle]}>
              Withdraw Application?
            </Text>
            <Text style={[styles.confirmText, dynamicStyles.confirmText]}>
              Are you sure you want to withdraw your application for "{application.title}"? This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, dynamicStyles.cancelButton]}
                onPress={() => setShowWithdrawConfirm(false)}
              >
                <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
                              <TouchableOpacity
                  style={[
                    styles.confirmButton, 
                    styles.withdrawConfirmButton,
                    { opacity: withdrawMutation.isPending ? 0.7 : 1 }
                  ]}
                  onPress={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                >
                  <Text style={styles.withdrawConfirmButtonText}>
                    {withdrawMutation.isPending ? 'Withdrawing...' : 'Yes, Withdraw'}
                  </Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#101017',
    marginBottom: 12,
    fontFamily: 'UberMoveText-Medium',
  },
  confirmText: {
    fontSize: 15,
    color: '#6D6D73',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'UberMoveText-Regular',
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 29,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F6F5F4',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#101017',
    fontWeight: '500',
    fontSize: 15,
    fontFamily: 'UberMoveText-Medium',
  },
  withdrawConfirmButton: {
    backgroundColor: '#F04438', // A red color for destructive action
  },
  withdrawConfirmButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
    fontFamily: 'UberMoveText-Medium',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16,16,23,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    height: 750,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    opacity: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 18,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 36,
    height: 36,
  },
  closeText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  contentContainer: {
    width: '100%',
    height: 657,
    opacity: 1,
    position: 'absolute',
    top: 0,
    alignItems: 'stretch',
    paddingHorizontal: 18,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'UberMoveText-Medium',
    lineHeight: 28,
    letterSpacing: -0.1,
    marginBottom: 28,
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  cardWrapper: {
    marginBottom: -8,
  },
  sectionTitle: {
  fontFamily: 'UberMoveText-Medium',
  fontWeight: '500', 
  fontSize: 15,
  lineHeight: 22,
  color: 'rgba(255, 255, 255, 1)', // White color
  marginTop: 12,
  marginBottom: 4,
  alignSelf: 'flex-start',
  // Text Shadow properties
  textShadowColor: 'rgba(0, 0, 0, 0.25)', // Shadow color
  textShadowOffset: { width: 0, height: 1 }, // X and Y offset (0px 1px)
  textShadowRadius: 1, // Blur radius (1px)
},
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: 100,
    marginHorizontal: 2,
  },
  overviewIcon: {
    marginBottom: 4,
  },
  overviewLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  overviewValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,1)',
    borderRadius: 17,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    height: 62,
    width: '100%',
  },
  helpIcon: { 
    width: 38, 
    height: 38, 
  },
  helpText: {
  fontFamily: 'UberMoveText-Regular',
  fontWeight: '400', // Corresponds to Regular
  fontSize: 11,
  lineHeight: 11, // 100% of 11px font-size
  letterSpacing: -0.1,
  color: 'rgba(109, 109, 115, 1)',
},
  helpEmail: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500', // Matches font-weight: 500;
    fontSize: 12, // Matches font-size: 12px;
    lineHeight: 18, // Matches line-height: 18px;
    letterSpacing: -0.1, // Matches letter-spacing: -0.1px;
    color: 'rgba(16, 16, 23, 1)', // Changed to white as per your original intent for "big bf white"
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 29,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartButton: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,   }, withdrawButton: { 
  flex: 1,
  height: 54,        
  borderRadius: 20, 
  opacity: 1,       
  padding: 16,       
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center', 
},
  withdrawButtonText: {
  fontFamily: 'Inter-Medium',
  fontWeight: '500', // Corresponds to Medium
  fontSize: 15,
  lineHeight: 22, // 100% of font-size + extra leading
  letterSpacing: -0.1,
  textAlign: 'center',
},
  // Status section styles
  statusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'UberMoveText-Regular',
    marginBottom: 16,
    lineHeight: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
    height: 28,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '600',
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100, // Add some top padding to account for the title space
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'UberMoveText-Regular',
    color: '#fff',
  },
  retryButton: {
    backgroundColor: '#2E90FA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    color: '#FFFFFF',
  },

});