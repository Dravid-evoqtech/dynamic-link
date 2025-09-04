import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../../hooks/useThemeContext';
import { applicationsAPI } from '../../services/api';
// Add React Query import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationCardSkeleton } from '../SkeletonLoader';
import { useStandardizedAlert } from '../../hooks/useStandardizedAlert';

interface ApplicationCardProps {
  opportunity: {
    title: string;
    organization: string;
    types?: string;
    states?: string;
    enrollmentType?: string;
  } | null;
  appliedOn: string;
  status: string;
  _id?: string;
  applicant?: string;
  opportunityId?: string;
  onStatusUpdate?: (applicationId: string, newStatus: string) => void; // Add callback prop
}

const getTagColorStyle = (tag: string) => {
  switch (tag) {
    case 'Unpaid Internship':
      return { color: '#D946EF' };
    case 'Paid Internship':
      return { color: '#D946EF' };
    case 'REMOTE':
      return { color: '#22C55E' };
    case 'IN-PERSON':
      return { color: '#2E90FA' };
    case 'Part Time':
      return { color: '#F59E42' };
    case 'Full Time':
      return { color: '#F59E42' };
    case 'Unpaid Program':
      return { color: '#22C55E' };
    case 'Paid Program':
      return { color: '#22C55E' };
    case 'Unpaid Bootcamp':
      return { color: '#F59E42' };
    case 'Paid Bootcamp':
      return { color: '#F59E42' };
    case 'Unpaid Volunteer':
      return { color: '#22C55E' };
    case 'Paid Volunteer':
      return { color: '#22C55E' };
    default:
      return { color: '#6D6D73' };
  }
};

export default function ApplicationCard({
  opportunity,
  appliedOn: rawAppliedOn,
  status: initialStatus,
  _id,
  applicant,
  opportunityId,
  onStatusUpdate,
}: ApplicationCardProps) {
  const { colorScheme } = useTheme();
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const isDark = colorScheme === 'dark';
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Add React Query client
  const queryClient = useQueryClient();

  // React Query for fetching real-time application data
  const { 
    data: applicationData, 
    isLoading: loadingApplication,
    error: applicationError
  } = useQuery({
    queryKey: ['application', _id],
    queryFn: async () => {
      if (!_id) return null;
      const response = await applicationsAPI.getApplicationById(_id);
      return response.data || response;
    },
    enabled: !!_id, // Only run query when _id exists
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: true, // Refetch when app comes back to focus
    refetchOnMount: true, // Refetch when component mounts
  });

  // Use real-time status from React Query, fallback to initial status
  const currentStatus = applicationData?.status || initialStatus;
  
  // Safely destructure from the nested opportunity object
  const {
    title = 'Untitled Opportunity',
    organization: institution = 'Unknown Institution',
    types,
    states,
    enrollmentType,
  } = opportunity || {};

  // Debug: Log when status changes
  useEffect(() => {
    console.log('ApplicationCard status changed:', { 
      _id, 
      initialStatus, 
      currentStatus, 
      title: opportunity?.title,
      fromQuery: !!applicationData?.status 
    });
  }, [currentStatus, _id, initialStatus, opportunity?.title, applicationData?.status]);

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
      
      // Invalidate and refetch the application data
      queryClient.invalidateQueries({ queryKey: ['application', variables.applicationId] });
      
      console.log(`Application status updated to ${variables.updateData.status}`);
      
      // Close modal
      setShowStatusModal(false);
      
      // Show success message
      showSuccess('Success', `Status updated to ${variables.updateData.status}`);
      
      // Notify parent if callback is provided
      if (onStatusUpdate && variables.applicationId) {
        onStatusUpdate(variables.applicationId, variables.updateData.status);
      }
    },
    onError: (error) => {
      console.error('Failed to update application status:', error);
      showError('Error', 'Failed to update status. Please try again.');
    }
  });

  // Handle status update using React Query mutation
  const handleStatusUpdate = async (newStatus: string) => {
    if (!_id || updateStatusMutation.isPending) return;
    
    // For status updates, we need the application ID and new status
    // The API requires opportunity and applicant, so we'll use the available data
    const updateData = {
      opportunity: opportunityId || _id, // Use opportunityId if available, fallback to _id
      applicant: applicant || 'user', // Use applicant if available, fallback to 'user'
      status: newStatus
    };
    
    console.log('Updating application status:', { applicationId: _id, newStatus, updateData });
    
    updateStatusMutation.mutate({
      applicationId: _id,
      updateData
    });
  };

  // Construct tags from available data
  const tags = [];
  
  // Add types if available (e.g., "Unpaid Internship", "Paid Program")
  if (types) {
    tags.push(types);
  }
  
  // Add states if available (e.g., "REMOTE", "IN-PERSON")
  if (states) {
    tags.push(states);
  }
  
  // Add enrollment type if available (e.g., "Part Time", "Full Time")
  if (enrollmentType) {
    tags.push(enrollmentType);
  }
  
  // Filter out any empty tags
  const filteredTags = tags.filter(Boolean) as string[];
  
  // Debug logging
  console.log('Tags constructed:', { types, states, enrollmentType, filteredTags });

  // Format the date for display
  const appliedOn = new Date(rawAppliedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Show skeleton loader while fetching application data
  if (loadingApplication && _id) {
    return <ApplicationCardSkeleton />;
  }

  // Handle case where opportunity is null
  if (!opportunity) {
    return (
      <View style={[
        styles.card,
        { backgroundColor: isDark ? '#23272F' : '#fff' }
      ]}>
        <View style={styles.infoContainer}>
          <Text style={[
            styles.title,
            { color: isDark ? '#fff' : '#222' }
          ]} numberOfLines={2}>Opportunity Not Available</Text>
          <Text style={styles.institution}>Unknown Organization</Text>
          <Text style={[
            styles.appliedOn,
            { color: isDark ? '#B0B0B0' : '#667085' }
          ]}>Applied On: {new Date(rawAppliedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
        <View style={styles.tagsStatusContainer}>
          <View style={styles.tagsRow}>
            <Text style={[styles.tagText, { color: '#6D6D73' }]}>No Details</Text>
          </View>
          
          {/* Status Badge */}
          <TouchableOpacity 
            style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}
            onPress={() => setShowStatusModal(true)}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/icons/clockicon.png')}
              style={styles.statusIcon}
              resizeMode="contain"
            />
            <Text style={styles.statusText}>{currentStatus}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[
        styles.card,
        { backgroundColor: isDark ? '#23272F' : '#fff' }
      ]}>
        <View style={styles.infoContainer}>
          <Text style={[
            styles.title,
            { color: isDark ? '#fff' : '#222' }
          ]} numberOfLines={2}>{title}</Text>
          <Text style={[
            styles.institution
          ]}>{institution}</Text>
          <Text style={[
            styles.appliedOn,
            { color: isDark ? '#B0B0B0' : '#667085' }
          ]}>Applied On: {appliedOn}</Text>
        </View>
        <View style={styles.tagsStatusContainer}>
          <View style={styles.tagsRow}>
            {filteredTags.map((tag: string, idx: number) => (
              <React.Fragment key={tag}>
                <Text style={[styles.tagText, getTagColorStyle(tag)]} numberOfLines={1}>
                  {tag}
                </Text>
                {idx < filteredTags.length - 1 && (
                  <Text style={styles.dot}>•</Text>
                )}
              </React.Fragment>
            ))}
          </View>
          
          {/* Status Badge - Clickable for status update */}
          <TouchableOpacity 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: getStatusColor(currentStatus),
                opacity: updateStatusMutation.isPending ? 0.7 : 1
              }
            ]}
            onPress={() => setShowStatusModal(true)}
            activeOpacity={0.7}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <View style={styles.loadingSpinner}>
                <Text style={styles.loadingText}>⏳</Text>
              </View>
            ) : (
              <Image
                source={require('../../../assets/icons/clockicon.png')}
                style={styles.statusIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.statusText}>
              {currentStatus === 'Pending' ? 'In Review' : currentStatus}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatusModal(false)}
        >
          <TouchableOpacity 
            style={[styles.statusModal, { backgroundColor: isDark ? '#23272F' : '#FFFFFF' }]} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.statusModalContent}>
              <Text style={[styles.statusModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Update Application Status
              </Text>
              <Text style={[styles.statusModalSubtitle, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                Current status: {currentStatus}
              </Text>
              
              <View style={styles.statusModalButtons}>
                {/* First row - 3 buttons */}
                <View style={styles.statusButtonRow}>
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#2E90FA',
                        opacity: currentStatus === 'Pending' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Pending' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Pending')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Pending'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Pending' ? 'Updating...' : 'In Review'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#22C55E',
                        opacity: currentStatus === 'Applied' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Applied' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Applied')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Applied'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Applied' ? 'Updating...' : 'Applied'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#F59E42',
                        opacity: currentStatus === 'Accepted' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Accepted' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Accepted')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Accepted'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Accepted' ? 'Updating...' : 'Accepted'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Second row - 3 buttons */}
                <View style={styles.statusButtonRow}>
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#8B5CF6',
                        opacity: currentStatus === 'Submitted' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Submitted' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Submitted')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Submitted'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Submitted' ? 'Updating...' : 'Submitted'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#EF4444',
                        opacity: currentStatus === 'Withdrawn' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Withdrawn' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Withdrawn')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Withdrawn'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Withdrawn' ? 'Updating...' : 'Withdraw'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusModalButton, 
                      { 
                        backgroundColor: '#6B7280',
                        opacity: currentStatus === 'Rejected' ? 1 : 0.8,
                        transform: [{ scale: currentStatus === 'Rejected' ? 1.05 : 1 }]
                      }
                    ]}
                    onPress={() => handleStatusUpdate('Rejected')}
                    disabled={updateStatusMutation.isPending || currentStatus === 'Rejected'}
                  >
                    <Text style={styles.statusModalButtonText}>
                      {updateStatusMutation.isPending && currentStatus === 'Rejected' ? 'Updating...' : 'Rejected'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.cancelButton,
                  { 
                    backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
                    opacity: updateStatusMutation.isPending ? 0.5 : 1
                  }
                ]}
                onPress={() => setShowStatusModal(false)}
                disabled={updateStatusMutation.isPending}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  {updateStatusMutation.isPending ? 'Updating...' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    <AlertComponent />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    opacity: 1,
    paddingTop: 20,
    paddingRight: 18,
    paddingBottom: 20,
    paddingLeft: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoContainer: {
    height: 68,
    opacity: 1,
    gap: 4,
    marginBottom: 4,
  },
  tagsStatusContainer: {
    height: 24,
    opacity: 1,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  title: {
    height: 24,
    opacity: 1,
    fontFamily: 'Uber Move Text',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    color: 'rgba(16, 16, 23, 1)',
    textAlignVertical: 'center',
  },
  institution: {
    height: 18,
    opacity: 1,
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    color: '#2E90FA',
    textAlignVertical: 'center',
  },
  appliedOn: {
    height: 18,
    opacity: 1,
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    color: 'rgba(109, 109, 115, 1)',
    textAlignVertical: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    marginTop: 0,
    flex: 1,
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
    textAlignVertical: 'center',
    flexShrink: 1,
    maxWidth: 120,
  },
  dot: {
    color: '#6D6D73',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Uber Move Text',
    lineHeight: 20,
    letterSpacing: -0.1,
    textAlignVertical: 'center',
    marginHorizontal: 6,
  },
  statusBadge: {
    height: 24,
    borderRadius: 28,
    opacity: 1,
    gap: 4,
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: 12,
    height: 12,
    opacity: 1,
    transform: [{ rotate: '0deg' }],
  },
  statusText: {
    fontFamily: 'Uber Move Text',
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: -0.1,
    textAlign: 'center',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  statusModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  statusModalTitle: {
    fontFamily: 'Uber Move Text',
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.1,
    marginBottom: 12,
  },
  statusModalSubtitle: {
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    marginBottom: 24,
    textAlign: 'center',
  },
  statusModalButtons: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  statusButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  statusModalButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 48,
    justifyContent: 'center',
  },
  statusModalButtonText: {
    fontFamily: 'Uber Move Text',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.1,
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 52,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Uber Move Text',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  loadingSpinner: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
