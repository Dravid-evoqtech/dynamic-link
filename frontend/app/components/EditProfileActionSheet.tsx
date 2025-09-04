import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from 'expo-location';
import NextButton from "./NextButton";
import Background from "./Background";
import PrimaryButton from "./PrimaryButton";
import { useTheme } from "../../hooks/useThemeContext";
import { userAPI, authAPI } from "../services/api";
import { useStandardizedAlert } from "../hooks/useStandardizedAlert";

const avatarIcon = require("../../assets/icons/myprofile/profileavtar.icon.png");

const { height, width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const EditProfileActionSheet: React.FC<Props> = ({ visible, onClose, onProfileUpdated }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();

  // State for form data
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    email: '',
    dateOfBirth: '',
    location: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const handleChangeProfilePicture = () => {
    // For now, directly open camera. In a full implementation, you'd create a custom modal
    // or use a different approach for multiple options
    openCamera();
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showError("Permission required", "Camera permission is required to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showError("Permission required", "Photo library permission is required to select photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Permission denied', 'Permission to access location was denied. Please enable it in your settings.');
        setFetchingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('Location:', location);

      // ⚠️ IMPORTANT: Replace with your actual Google Maps API Key
      const apiKey = "YOUR_GOOGLE_MAPS_API_KEY"; 
      const { latitude, longitude } = location.coords;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        updateFormField('location', address);
        showSuccess('Location Updated', 'Your current location has been fetched successfully.');
      } else {
        showError('Error', 'No address found for this location.');
      }

    } catch (error) {
      console.error('Failed to fetch location:', error);
      showError('Error', 'Failed to fetch current location. Please check your network and API key.');
    } finally {
      setFetchingLocation(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchUserData();
    } else {
      // Reset local image state when sheet is closed to avoid re-uploading
      setProfileImageUri(null);
    }
  }, [visible]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      const data = response.data?.data || response.data || response; // Handle nested data structure
      
      // Set user data with proper avatar URL
      setUserData({
        ...data,
        profilePicture: data.avatar?.avatarUrl || data.profilePicture // Use avatar.avatarUrl if available
      });
      
      const dobDate = data.dateOfBirth ? new Date(data.dateOfBirth) : new Date();

      setFormData({
        bio: data.bio || '',
        email: data.email || '',
        dateOfBirth: data.dateOfBirth ? dobDate.toLocaleDateString() : '',
        location: data.location?.title || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setDate(dobDate);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const response = await userAPI.updateProfilePicture(imageUri);
      
      if (response.data?.avatar?.avatarUrl) {
        // Update local state with new image URL
        setUserData((prev: any) => ({
          ...prev,
          profilePicture: response.data.avatar.avatarUrl,
          avatar: response.data.avatar
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      showError('Error', 'Failed to upload profile picture. Please try again.');
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    let imageUpdated = false;
    let otherDataUpdated = false;
    let passwordUpdated = false;
    let profileUpdateData: any = {};

    try {
      // Handle profile picture update if a new image was selected
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        try {
          // First: Update profile picture only (FormData)
          const response = await userAPI.updateProfilePicture(profileImageUri);
          
          if (response.data?.avatar?.avatarUrl) {
            // Update local state with new image URL
            setUserData((prev: any) => ({
              ...prev,
              profilePicture: response.data.avatar.avatarUrl,
              avatar: response.data.avatar
            }));
            imageUpdated = true;
            console.log('Profile picture updated successfully');
          }
        } catch (error) {
          console.error('Failed to update profile picture:', error);
          showError('Error', 'Failed to update profile picture. Please try again.');
          setSaving(false);
          return;
        }
      }
      
      // Handle profile data update separately (JSON)
      if (formData.bio.trim()) profileUpdateData.bio = formData.bio.trim();
      if (formData.dateOfBirth.trim()) profileUpdateData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.location.trim()) {
        profileUpdateData.location = { title: formData.location.trim() };
      }
      
      if (Object.keys(profileUpdateData).length > 0) {
        try {
          await userAPI.updateProfilePatch(profileUpdateData);
          console.log('Profile data updated successfully');
          otherDataUpdated = true;
        } catch (error) {
          console.error('Failed to update profile data:', error);
          showError('Error', 'Profile data update failed. Please try again.');
        }
      }

      if (formData.newPassword && formData.currentPassword) {
        if (formData.newPassword !== formData.confirmNewPassword) {
          showError('Error', 'New passwords do not match');
          setSaving(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          showError('Error', 'Password must be at least 6 characters long');
          setSaving(false);
          return;
        }

        try {
          await authAPI.changePassword({
            oldPassword: formData.currentPassword,
            newPassword: formData.newPassword
          });
          console.log('Password updated successfully');
          passwordUpdated = true;
        } catch (passwordError) {
          console.error('Failed to update password:', passwordError);
          showError('Error', 'Profile updated but password update failed. Please try again.');
        }
      }

      if (imageUpdated || otherDataUpdated || passwordUpdated) {
        showSuccess('Success', 'Profile updated successfully!');
        // Notify parent to refresh profile data
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      showError('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setFormData(prev => ({
      ...prev,
      dateOfBirth: currentDate.toLocaleDateString('en-US')
    }));
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
          <Background>
            {/* Content */}
            <View style={styles.contentWrapper}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose}>
                  <Image
                    source={
                      isDark
                        ? require("../../assets/icons/editprofile/leftarrow(D).png")
                        : require("../../assets/icons/editprofile/leftarrow.png")
                    }
                    style={styles.iconImagearrow}
                  />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 20 }} />
              </View>
              {/* <Text style={styles.headerTitle}>Edit Profile</Text> */}
              <Text style={styles.subheading}>
                Update your basic info and academic details
              </Text>

              {/* Scrollable Content */}
              <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={false}
                keyboardShouldPersistTaps="handled"
                alwaysBounceVertical={true}
                bounces={true}
                overScrollMode="always"
                contentInsetAdjustmentBehavior="automatic"
                automaticallyAdjustContentInsets={true}
              >
                {/* Profile Picture */}
                <TouchableOpacity 
                  style={[styles.profileSection, { backgroundColor: isDark ? '#23272F' : '#F9FAFB' }]}
                  onPress={handleChangeProfilePicture}
                  disabled={uploadingImage}
                >
                  <Image
                    source={profileImageUri 
                      ? { uri: profileImageUri }
                      : userData?.profilePicture 
                        ? { uri: userData.profilePicture } 
                        : avatarIcon} 
                    style={styles.avatarImage} 
                  />
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                  <View style={styles.profileTextWrapper}>
                    <Text style={[styles.profileTitle, { color: isDark ? '#fff' : '#101017' }]}>Profile Picture</Text>
                    <Text style={styles.changeLink}>
                      {uploadingImage ? 'Uploading...' : 'Change Profile'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerLabel}>Personal Info</Text>
                  <View style={styles.divider} />
                </View>



                {/* About You */}
                <Text style={styles.inputFieldTitle}>About You</Text>
                <View style={[styles.inputWrapper, styles.bioWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <TextInput
                    style={[styles.input, styles.bioInput, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Short Bio"
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    multiline
                    value={formData.bio}
                    onChangeText={(text) => updateFormField('bio', text)}
                  />
                </View>

                {/* Email */}
                <Text style={styles.inputFieldTitle}>Email (read-only)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/mail-line (1).png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Email"
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    value={formData.email}
                    editable={false}
                  />
                </View>

                {/* Date of Birth */}
                <Text style={styles.inputFieldTitle}>Date of Birth</Text>
                <TouchableWithoutFeedback onPress={() => setShowDatePicker(true)}>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/calendar-line.png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Date of Birth"
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    value={formData.dateOfBirth}
                      editable={false}
                  />
                </View>
                </TouchableWithoutFeedback>
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                {/* Location */}
                <Text style={styles.inputFieldTitle}>Location</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/map-pin-line.png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder={fetchingLocation ? "Fetching location..." : "Location"}
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    value={formData.location}
                    onChangeText={(text) => updateFormField('location', text)}
                  />
                  <TouchableOpacity onPress={fetchCurrentLocation} disabled={fetchingLocation}>
                    {fetchingLocation ? (
                      <ActivityIndicator size="small" color={isDark ? '#fff' : '#2E90FA'} style={styles.locationLoader} />
                    ) : (
                    <Image
                      source={require("../../assets/icons/editprofile/focus-3-line.png")}
                      style={[styles.rightIcon, { tintColor: isDark ? '#fff' : undefined }]}
                    />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerLabel}>Password Settings</Text>
                  <View style={styles.divider} />
                </View>

                {/* Current Password*/}
                <Text style={styles.inputFieldTitle}>Current Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/lock-line (1).png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Enter Current Password"
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    secureTextEntry={!showCurrentPwd}
                    value={formData.currentPassword}
                    onChangeText={(text) => updateFormField('currentPassword', text)}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPwd(prev => !prev)}>
                    <Image
                      source={require("../../assets/images/icons/password.png")}
                      style={[styles.rightIcon, { 
                        tintColor: isDark ? '#fff' : undefined,
                        opacity: showCurrentPwd ? 1 : 0.6 
                      }]}
                    />
                  </TouchableOpacity>
                </View>

                {/* New Password*/}
                <Text style={styles.inputFieldTitle}>New Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/lock-line (1).png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Enter New Password"
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    secureTextEntry={!showNewPwd}
                    value={formData.newPassword}
                    onChangeText={(text) => updateFormField('newPassword', text)}
                  />
                  <TouchableOpacity onPress={() => setShowNewPwd(prev => !prev)}>
                    <Image
                      source={require("../../assets/images/icons/password.png")}
                      style={[styles.rightIcon, { 
                        tintColor: isDark ? '#fff' : undefined,
                        opacity: showNewPwd ? 1 : 0.6 
                      }]}
                    />
                  </TouchableOpacity>
                </View>

                                {/* Confirm New Password*/}
                <Text style={styles.inputFieldTitle}>Confirm New Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#23272F' : '#fff' }]}>
                  <Image
                    source={require("../../assets/icons/editprofile/lock-line (1).png")}
                    style={[styles.iconImage, { tintColor: isDark ? '#fff' : undefined }]}
                  />
                  <TextInput 
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]} 
                    placeholder="Confirm New Password" 
                    placeholderTextColor={isDark ? '#B0B0B0' : '#999'}
                    secureTextEntry={!showConfirmPwd}
                    value={formData.confirmNewPassword}
                    onChangeText={(text) => updateFormField('confirmNewPassword', text)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPwd(prev => !prev)}>
                    <Image
                      source={require("../../assets/images/icons/password.png")}
                      style={[styles.rightIcon, { 
                        tintColor: isDark ? '#fff' : undefined,
                        opacity: showConfirmPwd ? 1 : 0.6 
                      }]}
                    />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Save Changes Button */}
              <View style={styles.saveButtonContainer}>
                <PrimaryButton
                  title={saving ? "Saving..." : "Save Changes"}
                  onPress={handleSaveChanges}
                  style={styles.saveButton}
                  disabled={saving}
                />
              </View>
            </View>
          </Background>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
    <AlertComponent />
  </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  iconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: "contain",
  },
  rightIcon: {
  width: 20,
  height: 20,
  resizeMode: "contain",
  marginLeft: 10,
},
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },

  iconImagearrow: {
    width: 38,
    height: 38,
    marginRight: 10,
    marginBottom: 6,
    resizeMode: "contain",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardWrapper: {
    alignItems: "flex-start",
    marginVertical: 12,
    marginTop: 2,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "white",
    marginBottom: 8,
    marginLeft: 12,
    fontFamily: "UberMoveText-Regular",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 160,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "400",
    color: "#101017", // Indigo tone similar to your background\
    fontFamily: "UberMoveText-Regular",
  },

  inputFieldTitle: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 11,
    marginTop: 6,

    color: "#FFFFFF",
    fontFamily: "UberMoveText-Regular",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 2,
    elevation: 2, // optional: for subtle shadow
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
  },
  bioWrapper: {
    height: 100,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  bioInput: {
    textAlignVertical: "top",
    height: "100%",
  },
  sheetContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
    paddingBottom: 20,
  },
  saveButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButton: {
    borderRadius: 20,
    height: 54,
    width: 320,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backArrow: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    height: 28,
    color: "#fff",
  },
  headerTitle2: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    alignItems: "flex-start",
  },
  subheading: {
    fontSize: 15,
    fontFamily: "UberMoveText-Regular",
    color: "#fff",
    marginBottom: 8,
    marginTop: 6,
    opacity: 0.9,
  },
  scrollContainer: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },

  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E0E7FF",
    marginRight: 14,
  },

  profileTextWrapper: {
    flexDirection: "column",
  },

  profileTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#101017",
    fontFamily: "UberMoveText-Medium",
  },

  changeLink: {
    fontSize: 15,
    color: "#2E90FA",
    fontFamily: "UberMoveText-Regular",
  },
  inputfieltitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  changeProfileText: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E4E5",
  },
  dividerLabel: {
    marginHorizontal: 10,
    color: "#fff",
    fontWeight: "400",
    fontSize: 13,
    fontFamily: "UberMoveText-Regular",
  },
  starsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationLoader: {
    marginLeft: 10,
  }
});

export default EditProfileActionSheet;