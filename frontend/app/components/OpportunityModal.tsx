import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Background from './Background';
import PrimaryButton from './PrimaryButton';
import { useTheme } from '../../hooks/useThemeContext';
import { userAPI, userDataAPI } from '../services/api';
import { OpportunityDetailsSkeleton, SelectionListSkeleton, OpportunityPreferencesSkeleton, CardItemSkeleton } from './SkeletonLoader';

// --- Reusable Section Header with Dividers ---
const Section = ({ title }: { title: string }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionDivider} />
    <Text style={styles.sectionHeader}>{title}</Text>
    <View style={styles.sectionDivider} />
  </View>
);

// --- Reusable Card Item ---
const CardItem = ({ icon, label, style, iconStyle, onRemove }: any) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.cardItem, style]}>
      <Image source={icon} style={[styles.cardIcon, iconStyle]} />
      <Text style={styles.cardLabel}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={[styles.removeText, { color: isDark ? '#fff' : '#666' }]}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- Dashed Add Button ---
const AddButton = ({ onPress }: { onPress: () => void }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity 
      style={[
        styles.addButtonDashed,
        { borderColor: isDark ? '#33343A' : 'rgba(255, 255, 255, 0.3)' }
      ]} 
      onPress={onPress}
    >
      <Ionicons name="add" size={18} color="rgba(255, 255, 255, 1)" />
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );
};

// --- Main Modal Component ---
type AppearanceModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AppearanceModal({ visible, onClose }: AppearanceModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  // State for real user data
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State for showing lists
  const [showProgramList, setShowProgramList] = useState(false);
  const [showAvailabilityList, setShowAvailabilityList] = useState(false);
  const [showInterestsList, setShowInterestsList] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [availableInterests, setAvailableInterests] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [updatingPrograms, setUpdatingPrograms] = useState(false);
  const [updatingSeasons, setUpdatingSeasons] = useState(false);
  const [updatingInterests, setUpdatingInterests] = useState(false);

  // Local state for pending changes
  const [pendingPrograms, setPendingPrograms] = useState<any[]>([]);
  const [pendingAvailability, setPendingAvailability] = useState<any[]>([]);
  const [pendingInterests, setPendingInterests] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // State for selection modal
  const [selectionModal, setSelectionModal] = useState({ visible: false, type: '', options: [] });

  // Initialize pending state with current user data
  useEffect(() => {
    if (userData) {
      setPendingPrograms(userData.programs || []);
      setPendingAvailability(userData.availability || []);
      setPendingInterests(userData.interests || []);
    }
  }, [userData]);

  // Fetch user data when modal opens
  useEffect(() => {
    if (visible) {
      fetchUserData();
    }
  }, [visible]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      const data = response.data || response;
      setUserData(data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async () => {
    if (!showProgramList && availablePrograms.length === 0) {
      setLoadingPrograms(true);
      try {
        const response = await userDataAPI.getOpportunityProgramTypes();
        const data = response.data || response;
        setAvailablePrograms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoadingPrograms(false);
      }
    }
    setShowProgramList(!showProgramList);
  };

  const handleAddAvailability = async () => {
    if (!showAvailabilityList && availableSeasons.length === 0) {
      setLoadingSeasons(true);
      try {
        const response = await userDataAPI.getAvailabilitySeasons();
        const data = response.data || response;
        setAvailableSeasons(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch seasons:', error);
      } finally {
        setLoadingSeasons(false);
      }
    }
    setShowAvailabilityList(!showAvailabilityList);
  };

  const handleAddInterest = async () => {
    if (!showInterestsList && availableInterests.length === 0) {
      // Fetch interests when opening for the first time
      setLoadingInterests(true);
      try {
        const response = await userDataAPI.getOpportunityDomains();
        const data = response.data || response;
        setAvailableInterests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch interests:', error);
      } finally {
        setLoadingInterests(false);
      }
    }
    setShowInterestsList(!showInterestsList);
  };

  const handleSelectProgram = async (program: any) => {
    const programId = program._id;
    
    if (pendingPrograms.some((prog: any) => prog._id === programId)) {
      console.log('Program already selected');
      setShowProgramList(false);
      return;
    }
    
    // Add to pending state only
    setPendingPrograms(prev => [...prev, program]);
    setShowProgramList(false);
  };

  const handleSelectSeason = async (season: any) => {
    const seasonId = season._id;
    
    if (pendingAvailability.some((avail: any) => avail._id === seasonId)) {
      console.log('Season already selected');
      setShowAvailabilityList(false);
      return;
    }
    
    // Add to pending state only
    setPendingAvailability(prev => [...prev, season]);
    setShowAvailabilityList(false);
  };

  const handleSelectInterest = async (interest: any) => {
    const interestId = interest._id;
    
    if (pendingInterests.some((int: any) => int._id === interestId)) {
      console.log('Interest already selected');
      setShowInterestsList(false);
      return;
    }
    
    // Add to pending state only
    setPendingInterests(prev => [...prev, interest]);
    setShowInterestsList(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const programIds = pendingPrograms.map(prog => prog._id);
      const availabilityIds = pendingAvailability.map(avail => avail._id);
      const interestIds = pendingInterests.map(int => int._id);

      // Save sequentially with individual error handling
      try {
        await userAPI.updatePrograms(programIds);
        console.log('Programs updated successfully');
      } catch (error) {
        console.error('Failed to update programs:', error);
        throw new Error('Failed to update programs');
      }

      try {
        await userAPI.updateAvailability(availabilityIds);
        console.log('Availability updated successfully');
      } catch (error) {
        console.error('Failed to update availability:', error);
        throw new Error('Failed to update availability');
      }

      try {
        await userAPI.updateInterests(interestIds);
        console.log('Interests updated successfully');
      } catch (error) {
        console.error('Failed to update interests:', error);
        throw new Error('Failed to update interests');
      }

      // Update the actual user data
      setUserData((prev: any) => ({
        ...prev,
        programs: pendingPrograms,
        availability: pendingAvailability,
        interests: pendingInterests
      }));

      console.log('All changes saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes. Please try again.');
      // Refresh user data to get latest version
      await fetchUserData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProgram = (programId: string) => {
    setPendingPrograms(prev => prev.filter(prog => prog._id !== programId));
  };

  const handleRemoveAvailability = (availabilityId: string) => {
    setPendingAvailability(prev => prev.filter(avail => avail._id !== availabilityId));
  };

  const handleRemoveInterest = (interestId: string) => {
    setPendingInterests(prev => prev.filter(int => int._id !== interestId));
  };

  // Transform API data to display format
  const getLookingForData = () => {
    if (!pendingPrograms) return [];
    return pendingPrograms.map((program: any) => ({
      icon: getIconForProgram(program.title),
      label: program.title,
      _id: program._id,
      onRemove: () => handleRemoveProgram(program._id)
    }));
  };

  const getAvailabilityData = () => {
    if (!pendingAvailability) return [];
    return pendingAvailability.map((season: any) => ({
      icon: getIconForSeason(season.title),
      label: season.title,
      _id: season._id,
      onRemove: () => handleRemoveAvailability(season._id)
    }));
  };

  const getLocationData = () => {
    if (!userData?.location) return { label: 'Location not set' };
    return {
      icon: require('../../assets/images/icons/LocationIcon.png'),
      label: userData.location.title,
      editIcon: require('../../assets/images/icons/CurrentLocation.png')
    };
  };

  const getInterestsData = () => {
    if (!pendingInterests) return [];
    return pendingInterests.map((interest: any) => ({
      icon: getIconForInterest(interest.title || interest.label),
      label: interest.title || interest.label,
      _id: interest._id,
      onRemove: () => handleRemoveInterest(interest._id)
    }));
  };

  // Helper functions to get appropriate icons
  const getIconForProgram = (title: string) => {
    const iconMap: { [key: string]: any } = {
      'Internship': require('../../assets/icons/graduation-cap-fill.png'),
      'Research': require('../../assets/icons/book-shelf-fill.png'),
      'Volunteer': require('../../assets/icons/dateiconbg.png'),
    };
    return iconMap[title] || require('../../assets/icons/dateiconbg.png');
  };

  const getIconForSeason = (title: string) => {
    const iconMap: { [key: string]: any } = {
      'Summer': require('../../assets/images/icons/SeasonAvailability/Summer(L).png'),
      'Winter': require('../../assets/images/icons/SeasonAvailability/Winter(L).png'),
      'Spring': require('../../assets/images/icons/SeasonAvailability/Spring(L).png'),
      'Fall': require('../../assets/images/icons/SeasonAvailability/Fall(L).png'),
    };
    return iconMap[title] || require('../../assets/images/icons/SeasonAvailability/Summer(L).png');
  };

  const getIconForInterest = (title: string) => {
    if (!title) return require('../../assets/images/icons/Interests/Science.png');
    
    const lowerTitle = title.toLowerCase();
    const iconMap: { [key: string]: any } = {
      'medicine': require('../../assets/images/icons/Interests/Medicine.png'),
      'engineering': require('../../assets/images/icons/Interests/Engineering.png'),
      'computer science': require('../../assets/images/icons/Interests/Computer_Science.png'),
      'science': require('../../assets/images/icons/Interests/Science.png'),
      'arts': require('../../assets/images/icons/Interests/Arts.png'),
      'environment': require('../../assets/images/icons/Interests/Environment.png'),
      'business': require('../../assets/images/icons/Interests/Business.png'),
      'psychology': require('../../assets/images/icons/Interests/Psychology.png'),
      'law': require('../../assets/images/icons/Interests/Law_Civics.png'),
'civics': require('../../assets/images/icons/Interests/Law_Civics.png'),
      'travel': require('../../assets/images/icons/Interests/Travel_Culture.png'),
'culture': require('../../assets/images/icons/Interests/Travel_Culture.png'),
      'hospitality': require('../../assets/images/icons/Interests/Hospitality.png'),
      'media': require('../../assets/images/icons/Interests/Media_Film.png'),
'film': require('../../assets/images/icons/Interests/Media_Film.png'),
      'education': require('../../assets/images/icons/Interests/Education_Teaching.png'),
'teaching': require('../../assets/images/icons/Interests/Education_Teaching.png'),
    };
    
    // Check for exact matches first
    if (iconMap[lowerTitle]) {
      return iconMap[lowerTitle];
    }
    
    // Check for partial matches
    for (const key in iconMap) {
      if (lowerTitle.includes(key) || key.includes(lowerTitle)) {
        return iconMap[key];
      }
    }
    
    // Default fallback
    return require('../../assets/images/icons/Interests/Science.png');
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Background>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={onClose}>
                  <Image source={isDark ? require("../../assets/icons/editprofile/leftarrow(D).png") : require("../../assets/icons/editprofile/leftarrow.png")} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Opportunity Preferences</Text>
              </View>
                             <ScrollView 
                 contentContainerStyle={styles.scrollContent} 
                 showsVerticalScrollIndicator={false}
                 scrollEnabled={true}
                 nestedScrollEnabled={true}
                 keyboardShouldPersistTaps="handled"
                 alwaysBounceVertical={true}
               >
                 <OpportunityPreferencesSkeleton />
               </ScrollView>
            </Background>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
          <Background>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose}>
                <Image
                  source={
                    isDark
                      ? require("../../assets/icons/editprofile/leftarrow(D).png")
                      : require("../../assets/icons/editprofile/leftarrow.png")
                  }
                  style={styles.backIcon}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Opportunity Preferences</Text>
            </View>
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              nestedScrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              alwaysBounceVertical={true}
              bounces={true}
              overScrollMode="always"
              contentInsetAdjustmentBehavior="automatic"
              automaticallyAdjustContentInsets={true}
            >
              <Text style={styles.subtitle}>Opportunity Preferences</Text>
              <Text style={styles.subtitle1}>Help us match you with better opportunities</Text>
              
              {/* Looking For - Real Data */}
              <Section title="Looking For" />
              <View style={styles.cardListColumn}>
                {getLookingForData().map((item, i) => (
                  <CardItem 
                    key={i} 
                    icon={item.icon} 
                    label={item.label} 
                    onRemove={item.onRemove}
                  />
                ))}
                <AddButton onPress={handleAddProgram} />
                {showProgramList && (
                  <View style={styles.selectionList}>
                    {loadingPrograms ? (
                      <SelectionListSkeleton />
                    ) : (
                                             <ScrollView 
                         style={styles.selectionScrollView}
                         showsVerticalScrollIndicator={false}
                         nestedScrollEnabled={false}
                         scrollEnabled={true}
                       >
                         {availablePrograms.map((program) => (
                          <TouchableOpacity 
                            key={program._id}
                            style={styles.selectionItem}
                            onPress={() => handleSelectProgram(program)}
                          >
                            <Image 
                              source={getIconForProgram(program.title)} 
                              style={styles.selectionIcon} 
                            />
                            <Text style={styles.selectionText}>
                              {program.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Availability - Real Data */}
              <Section title="Availability" />
              <View style={styles.cardListColumn}>
                {getAvailabilityData().map((item, i) => (
                  <CardItem 
                    key={i} 
                    icon={item.icon} 
                    label={item.label} 
                    onRemove={item.onRemove}
                  />
                ))}
                <AddButton onPress={handleAddAvailability} />
                {showAvailabilityList && (
                  <View style={styles.selectionList}>
                    {loadingSeasons ? (
                      <SelectionListSkeleton />
                    ) : (
                                             <ScrollView 
                         style={styles.selectionScrollView}
                         showsVerticalScrollIndicator={false}
                         nestedScrollEnabled={false}
                         scrollEnabled={true}
                       >
                         {availableSeasons.map((season) => (
                          <TouchableOpacity 
                            key={season._id}
                            style={styles.selectionItem}
                            onPress={() => handleSelectSeason(season)}
                          >
                            <Image 
                              source={getIconForSeason(season.title)} 
                              style={styles.selectionIcon} 
                            />
                            <Text style={styles.selectionText}>
                              {season.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Location Preferences - Real Data */}
              <Section title="Location Preferences" />
              <View style={[
                styles.locationRow,
                { backgroundColor: isDark ? '#14141C' : '#fff' }
              ]}>
                <Image 
                  source={getLocationData().icon} 
                  style={[
                    styles.locationIcon,
                    { tintColor: isDark ? '#fff' : '#101017' }
                  ]} 
                />
                <Text style={[
                  styles.locationLabel,
                  { color: isDark ? '#fff' : '#101017' }
                ]}>{getLocationData().label}</Text>
                <TouchableOpacity style={styles.locationEditButton}>
                  <Image 
                    source={getLocationData().editIcon} 
                    style={[
                      styles.locationEditIcon,
                      { tintColor: isDark ? '#fff' : 'rgba(16, 16, 23, 1)' }
                    ]} 
                  />
                </TouchableOpacity>
              </View>

              {/* Interests - Real Data */}
              <Section title="Interests" />
              <View style={styles.cardListColumn}>
                {getInterestsData().map((item, i) => (
                  <CardItem 
                    key={i} 
                    icon={item.icon} 
                    label={item.label} 
                    style={styles.interestCard} 
                    iconStyle={styles.interestIcon}
                    onRemove={item.onRemove}
                  />
                ))}
                <AddButton onPress={handleAddInterest} />
                {showInterestsList && (
                  <View style={styles.selectionList}>
                    {loadingInterests ? (
                      <SelectionListSkeleton />
                    ) : (
                                             <ScrollView 
                         style={styles.selectionScrollView}
                         showsVerticalScrollIndicator={false}
                         nestedScrollEnabled={false}
                         scrollEnabled={true}
                         contentContainerStyle={{ gap: 8 }}
                       >
                         {availableInterests.map((interest) => (
                          <TouchableOpacity 
                            key={interest._id}
                            style={styles.selectionItem}
                            onPress={() => handleSelectInterest(interest)}
                          >
                            <Image 
                              source={getIconForInterest(interest.title || interest.label)} 
                              style={styles.selectionIcon} 
                            />
                            <Text style={styles.selectionText}>
                              {interest.title || interest.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Save Changes Button */}
              <View style={styles.saveButtonContainer}>
                <PrimaryButton
                  title={isSaving ? "Saving..." : "Save Changes"}
                  onPress={handleSaveChanges}
                  style={styles.saveButton}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </Background>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16,16,23,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    height: '95%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  backIcon: {
    width: 38,
    height: 38,
    
    marginRight:50,
  },
  modalTitle: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 17,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 45,
  },
  subtitle: {
      fontFamily: 'Uber Move Text', // Ensure this font is loaded in your project
      fontWeight: '500',
      fontStyle: 'normal', // 'Medium' typically corresponds to fontWeight: '500' and normal fontStyle
      fontSize: 18,
      color: 'rgba(255, 255, 255, 1)',
      marginBottom: 8,
     },
  subtitle1: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 1)',
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3F0FF',
  },
  sectionHeader: {
  fontFamily: 'Uber Move Text', // Ensure this font is loaded in your project
  fontWeight: '400',
  fontStyle: 'normal', // 'Regular' typically corresponds to fontWeight: '400' and normal fontStyle
  fontSize: 13,
  lineHeight: 18,
  letterSpacing: -0.1,
  textAlign: 'center',
  marginHorizontal: 10,
  color: 'rgba(255, 255, 255, 1)',
},
  cardListColumn: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 12,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 16,
      width: 311,
      height: 38,
      opacity: 1,
      paddingTop: 8,
      paddingRight: 14,
      paddingBottom: 8,
      paddingLeft: 12,
  },
  cardItemFull: {
    marginRight: 0,
  },
  cardIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  cardLabel: {
      fontFamily: 'Uber Move Text', // Ensure this font is loaded in your project
      fontWeight: '400',
      fontStyle: 'normal', // 'Regular' typically corresponds to fontWeight: '400' and normal fontStyle
      fontSize: 15,
      color: '#101017', // From the cardLabel example
      flex: 1, // From the cardLabel example
    },
  addButtonDashed: {
    flexDirection: 'row',
    width: 311,
    height: 38,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 1,
    paddingTop: 8,
    paddingRight: 14,
    paddingBottom: 8,
    paddingLeft: 12,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 1)',
    // Note: React Native's borderStyle: 'dashed' does not support custom dash patterns like 'dashes: 5, 5'.
    // It will use a default dashed pattern.
  },
  addButtonText: {
    fontFamily: 'UberMoveText-Medium',
    fontWeight: '500',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 1)',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 50,
    width: 339,
    gap: 10,
    marginBottom: 12,

  },
  locationIcon: {
    width: 15,
    height: 18.11,
    resizeMode: 'contain',
    marginLeft: 12,
  },
  locationLabel: {
    fontFamily: 'UberMoveText-Regular',
    fontWeight: '400',
    fontSize: 15,
    color: '#101017',
    flex: 1,
  },
  locationEditButton: {
    padding: 5,
    marginLeft: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    
  },
  locationEditIcon: {
    width: 18.33,
    height: 18.33,
    resizeMode: 'contain',
    tintColor: 'rgba(16, 16, 23, 1)',
    opacity: 0.6,
  },
 
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 0,
    flexGrow: 1,
  },
  saveButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    borderRadius: 20,
    height: 54,
    width: 320,
  },
  selectionList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    maxHeight: 150, // Limit height to show 2-3 items
  },
  selectionScrollView: {
    maxHeight: 150,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  selectionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  selectionText: {
    fontFamily: 'UberMoveText-Regular',
    fontSize: 15,
    color: '#fff',
  },
  loadingText: {
    fontFamily: 'UberMoveText-Regular',
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    padding: 12,
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  interestCard: {
    // Add specific styling for interest cards if needed
  },
  interestIcon: {
    // Add specific styling for interest icons if needed
  },
});
