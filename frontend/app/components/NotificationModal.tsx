import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import Background from "./Background";
import PrimaryButton from "./PrimaryButton";
import { useTheme } from "../../hooks/useThemeContext";
import { notificationAPI } from "../services/api";

const { height, width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NotificationSettings {
  newOpportunities: boolean;
  applicationUpdates: boolean;
  dailyStreakReminders: boolean;
}

const NotificationModal: React.FC<Props> = ({ visible, onClose }) => {
  const [newOpportunities, setNewOpportunities] = useState(true);
  // const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [dailyStreakReminders, setDailyStreakReminders] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getSettings();
      const settings = response.data || response;
      
      if (settings) {
        setNewOpportunities(settings.newOpportunities ?? true);
        // setApplicationUpdates(settings.applicationUpdates ?? true);
        setDailyStreakReminders(settings.dailyStreakReminders ?? true);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      // Use default values if API fails
      setNewOpportunities(true);
      // setApplicationUpdates(true);
      setDailyStreakReminders(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const settings: NotificationSettings = {
        newOpportunities,
        applicationUpdates: false, // Set to false since it's commented out in the UI
        dailyStreakReminders,
      };
      
      await notificationAPI.updateSettings(settings);
      console.log('Notification preferences saved:', settings);
      onClose();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <Background>
            <View style={styles.innerContainer}>
              {/* Header */}
              <View style={styles.header}>
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
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 30 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* New Opportunities */}
                <View style={[styles.card, { backgroundColor: isDark ? '#23272F' : '#F9FAFB' }]}>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#101017' }]}>New Opportunities</Text>
                    <Text style={[styles.cardSubtitle, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                      Get alerts when new internships or programs match your profile.
                    </Text>
                  </View>
                  <Switch
                    value={newOpportunities}
                    onValueChange={setNewOpportunities}
                    trackColor={{ false: isDark ? "#35383F" : "#ccc", true: "#0F80FA" }}
                    thumbColor="#fff"
                    disabled={loading}
                  />
                </View>

                {/* Daily Streak Reminders */}
                <View style={[styles.card, { backgroundColor: isDark ? '#23272F' : '#F9FAFB' }]}>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#101017' }]}>Daily Streak Reminders</Text>
                    <Text style={[styles.cardSubtitle, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                      Stay on track and keep your login streak alive.
                    </Text>
                  </View>
                  <Switch
                    value={dailyStreakReminders}
                    onValueChange={setDailyStreakReminders}
                    trackColor={{ false: isDark ? "#35383F" : "#ccc", true: "#0F80FA" }}
                    thumbColor="#fff"
                    disabled={loading}
                  />
                </View>

                {/* Application Updates */}
                {/* <View style={[styles.card, { backgroundColor: isDark ? '#23272F' : '#F9FAFB' }]}>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#101017' }]}>Application Updates</Text>
                    <Text style={[styles.cardSubtitle, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                      Get updates about your application status and new opportunities.
                    </Text>
                  </View>
                  <Switch
                    value={false} // Commented out
                    onValueChange={() => {}} // Commented out
                    trackColor={{ false: isDark ? "#35383F" : "#ccc", true: "#0F80FA" }}
                    thumbColor="#fff"
                    disabled={loading}
                  />
                </View> */}
              </ScrollView>

              {/* Save Changes Button */}
              <View style={styles.saveButtonContainer}>
                <PrimaryButton
                  title={loading ? "Saving..." : "Save Changes"}
                  onPress={handleSaveChanges}
                  style={styles.saveButton}
                  disabled={loading}
                />
              </View>
            </View>
          </Background>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.88,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backIcon: {
    width: 38,
    height: 38,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
    marginTop: 4,
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
});

export default NotificationModal;
