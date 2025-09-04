import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import EditProfileActionSheet from "./EditProfileActionSheet";
import NotificationModal from "./NotificationModal";
import LogoutModal from "./LogoutModal";
import DeleteAccountModal from "./DeleteAccountModal";
import OpportunityModal from "./OpportunityModal";
import AppearanceModal from "./AppearanceModal";
import { useTheme } from "../../hooks/useThemeContext";
import { authAPI } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getFullVersionString, getBuildNumberOnly } from "../utils/native-version";
import { useStandardizedAlert } from "../hooks/useStandardizedAlert";

 
interface SettingsSectionProps {
  onLogout: () => void;
  isLoggingOut: boolean;
  onRegisterModal?: (modalRef: { visible: boolean; onClose: () => void }) => void;
  onClearCache?: () => void; // Function to clear cache on logout
}
 
const SettingsSection: React.FC<SettingsSectionProps> = ({ onLogout, isLoggingOut, onRegisterModal, onClearCache }) => {
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [opportunityVisible,setOpportunityVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Register modals with parent component for back button handling
  React.useEffect(() => {
    if (onRegisterModal) {
      // Register the most recently opened modal
      if (modalVisible) {
        onRegisterModal({
          visible: modalVisible,
          onClose: () => setModalVisible(false)
        });
      } else if (notificationVisible) {
        onRegisterModal({
          visible: notificationVisible,
          onClose: () => setNotificationVisible(false)
        });
      } else if (appearanceVisible) {
        onRegisterModal({
          visible: appearanceVisible,
          onClose: () => setAppearanceVisible(false)
        });
      } else if (opportunityVisible) {
        onRegisterModal({
          visible: opportunityVisible,
          onClose: () => setOpportunityVisible(false)
        });
      } else if (deleteAccountVisible) {
        onRegisterModal({
          visible: deleteAccountVisible,
          onClose: () => setDeleteAccountVisible(false)
        });
      } else if (logoutVisible) {
        onRegisterModal({
          visible: logoutVisible,
          onClose: () => setLogoutVisible(false)
        });
      }
    }
  }, [modalVisible, notificationVisible, appearanceVisible, opportunityVisible, deleteAccountVisible, logoutVisible, onRegisterModal]);

  const colors = {
    cardBg: isDark ? '#23272F' : '#fff',
    textPrimary: isDark ? '#fff' : '#111827',
    textSecondary: isDark ? '#B0B0B0' : '#888',
    sectionHeading: isDark ? '#fff' : '#fff',
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      // Call the delete account API
      const response = await authAPI.deleteAccount();
      console.log('Account deleted successfully:', response);
      
      // Verify the response contains userId (optional validation)
      if (response && response.userId) {
        console.log('Deleted user ID:', response.userId);
      }
      
      // Show success message
      showSuccess(
        'Account Deleted', 
        'Your account has been successfully deleted. You will be redirected to the onboarding screen.',
        async () => {
          // Clear the user's session from the device
          await AsyncStorage.removeItem('userToken');
          
          // Navigate to the initial screen and clear the navigation stack
          router.replace('/onboarding');
        }
      );
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to delete this account.';
      } else if (error?.status === 404) {
        errorMessage = 'Account not found.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error message to user
      showError('Delete Account Failed', errorMessage);
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* General */}
      <Text style={[styles.sectionHeading, { color: colors.sectionHeading }]}>General</Text>
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.cardBg }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.settingIconWrapper}>
          <Image
            source={require("../../assets/icons/myprofile/editprofileicon.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Edit Profile</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>

      {/* App Settings */}
      <Text style={[styles.sectionHeading, { color: colors.sectionHeading }]}>App settings</Text>
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.cardBg }]}
        onPress={() => setNotificationVisible(true)}
      >
        <View style={[styles.settingIconWrapper]}>
          <Image
            source={require("../../assets/icons/myprofile/notificationicon.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Notifications</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.cardBg }]}
        onPress={() => {
          console.log('🔧 Appearance button clicked');
          setAppearanceVisible(true);
        }}
      >
        <View style={[styles.settingIconWrapper]}>
          <Image
            source={require("../../assets/icons/myprofile/appereance.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Appearance</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>

      {/* Preferences */}
      <Text style={[styles.sectionHeading, { color: colors.sectionHeading }]}>Preferences</Text>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.cardBg }]} onPress={() => setOpportunityVisible(true)}>
        <View style={[styles.settingIconWrapper]}>
          <Image
            source={require("../../assets/icons/myprofile/opportunitypreference.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Opportunity Preferences</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>

      {/* Account */}
      <Text style={[styles.sectionHeading, { color: colors.sectionHeading }]}>Account</Text>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.cardBg }]} onPress={() => setDeleteAccountVisible(true)}>
        <View style={[styles.settingIconWrapper]}>
          <Image
            source={require("../../assets/icons/myprofile/manageaccount.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Manage Account</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.cardBg }]} onPress={() => setLogoutVisible(true)}>
        <View style={[styles.settingIconWrapper]}>
          <Image
            source={require("../../assets/icons/myprofile/logout.png")}
            style={styles.settingIcon}
          />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Log out</Text>
        <Image
          source={require("../../assets/icons/myprofile/arrow-right.png")}
          style={styles.arrowIcon}
        />
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/icons/myprofile/cap.png")}
              style={styles.logoIcon}
            />
          </View>
          <Text style={styles.logoText}>FutureFind</Text>
        </View>
        <Text style={styles.tagline}>Helping teens unlock their future 💫</Text>
        <Text style={styles.version}>{getFullVersionString()}</Text>
        <Text style={styles.buildInfo}>Build: {getBuildNumberOnly()}</Text>
      </View>
      <EditProfileActionSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <NotificationModal
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />

      <AppearanceModal
        visible={appearanceVisible}
        onClose={() => setAppearanceVisible(false)}
      />

       <OpportunityModal
        visible={opportunityVisible}
        onClose={() => setOpportunityVisible(false)}
      />
     
      <DeleteAccountModal
        visible={deleteAccountVisible}
        onCancel={() => setDeleteAccountVisible(false)}
        onDelete={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onClearCache={onClearCache}
      />
    <AlertComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingHorizontal: 2, // use padding instead of margin
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 8,
    marginTop: 8,
    marginHorizontal: 18, // Add left and right margin to match card positioning
    fontFamily: "UberMoveText-Medium",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    width: 339, // Match the desired width
    alignSelf: "center",
    marginHorizontal: 18, // Add left and right margin to match title positioning
  },
  settingIconWrapper: {
    // default blue
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "UberMoveText-Medium",
  },
  arrow: {
    color: "#9CA3AF",
    fontSize: 18,
    fontWeight: "600",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    marginLeft: 4,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E90FA", // Optional: white fill behind icon
    marginRight: 8,
  },

  logoIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },

  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  logoText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "UberMoveText-Medium",
  },

  tagline: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.85,
    fontWeight: "400",
    marginBottom: 1,
    height: 20,
    fontFamily: "UberMoveText-Regular",
  },

  version: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.65,
    fontFamily: "UberMoveText-Regular",
  },

  buildInfo: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.5,
    fontFamily: "UberMoveText-Regular",
    marginTop: 2,
  },

  footerContainer: {
    alignItems: "center",
    marginTop: 14,
    paddingBottom: 20,
  },
});

export default SettingsSection;
