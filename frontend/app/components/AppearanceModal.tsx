import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import Background from "./Background";
import { useTheme } from "../../hooks/useThemeContext";

const { width, height } = Dimensions.get("window");


interface Props {
  visible: boolean;
  onClose: () => void;
}

const AppearanceModal: React.FC<Props> = ({ visible, onClose }) => {
  console.log('AppearanceModal rendered, visible:', visible);
  
  const { theme, setTheme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  console.log('Current theme from context:', theme);

  const handleThemeChange = (newTheme: "Light" | "Dark" | "System") => {
    console.log('Theme change requested:', newTheme);
    setSelected(newTheme);
    const themeValue = newTheme === 'Light' ? 'light' : 
                     newTheme === 'Dark' ? 'dark' : 'system';
    console.log('Calling setTheme with:', themeValue);
    setTheme(themeValue);
  };

  const [selected, setSelected] = useState<"Light" | "Dark" | "System">(theme === 'light' ? "Light" : theme === 'dark' ? "Dark" : "System");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.sheet} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <Background>
            <View style={styles.gradient}>
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
                <Text style={styles.headerTitle}>Appearance</Text>
                <View style={{ width: 30 }} />
              </View>

              {/* Section Title */}
              <Text style={styles.sectionTitle}>App theme</Text>
              <Text style={styles.sectionSubtitle}>
                Choose a preferred theme for the app
              </Text>

              {/* ✅ Single White Card Container */}
              <View
                style={[
                  styles.themeCardWrapper,
                  { backgroundColor: isDark ? "#23272F" : "#F9FAFB" },
                ]}
              >
                {["Light", "Dark", "System"].map((theme) => (
                  <Pressable
                    key={theme}
                    onPress={() => handleThemeChange(theme as any)}
                    style={styles.individualOption}
                  >
                    <Image
                      source={
                        theme === "Light"
                          ? require("../../assets/icons/lightmode.png")
                          : theme === "Dark"
                          ? require("../../assets/icons/darkmode.png")
                          : require("../../assets/icons/systemdefault.png")
                      }
                      style={styles.previewImage}
                    />
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.outerCircle,
                          selected === theme && styles.outerCircleSelected,
                        ]}
                      >
                        {selected === theme && <View style={styles.innerCircle} />}
                      </View>
                      <Text
                        style={[
                          styles.themeLabel,
                          { color: isDark ? "#fff" : "#101828" },
                        ]}
                      >
                        {theme}
                      </Text>
                    </View>
                  </Pressable>
                ))}
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
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: height * 0.88,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backIcon: {
    width: 38,
    height: 38,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#fff",
    fontFamily: "UberMoveText-Medium",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
    marginTop: 10,
    fontFamily: "UberMoveText-Medium",
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#f3f4f6",
    marginBottom: 16,
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
  },

  // ✅ This wraps all 3 images in one white container
  themeCardWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },

  individualOption: {
    alignItems: "center",
    width: "30%",
  },
  previewImage: {
    width: 55,
    height: 120,
    resizeMode: "cover",
    borderRadius: 6,
    marginBottom: 12,
  },
  radioContainer: {
    alignItems: "center",
  },
  outerCircle: {
    width: 18,
    height: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  outerCircleSelected: {
    borderColor: "#0F80FA",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0F80FA",
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
});

export default AppearanceModal;
