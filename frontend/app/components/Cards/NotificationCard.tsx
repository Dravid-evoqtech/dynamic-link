import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../hooks/useThemeContext";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

// GradientText component
type GradientTextProps = React.PropsWithChildren<{ style?: TextStyle }>;
const GradientText = ({ children, style }: GradientTextProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <MaskedView
      maskElement={
        <Text
          style={[style, { backgroundColor: "transparent", color: "black" }]}
          onLayout={(e) => setSize(e.nativeEvent.layout)}
        >
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={["#F093FB", "#F5576C"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size.width, height: size.height }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

interface NotificationCardProps {
  style?: ViewStyle;
}

const NotificationCard = ({ style }: NotificationCardProps) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  // Define color palettes
  const light = {
    cardBg: "#fff",
    divider: "#F4F4F4",
    title: "#F093FB", // Gradient, but fallback for subtitle
    subtitle: "#222",
    shadow: "#000",
  };
  const dark = {
    cardBg: "#23272F",
    divider: "#35383F",
    title: "#F093FB", // Gradient, but fallback for subtitle
    subtitle: "#F4F4F4",
    shadow: "#000",
  };
  const colors = isDark ? dark : light;

  return (
    <View style={[styles.shadowWrapper, { shadowColor: colors.shadow }, style]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <View style={styles.row}>
          <Image
            source={require("@/assets/images/icons/trophyicon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.textWrapper}>
            <GradientText style={styles.title}>
              New Achievement Unlocked!
            </GradientText>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>
              Community Helper
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0,
    shadowRadius: 24,
    elevation: 0,
    borderRadius: 14,
    backgroundColor: "transparent",
    position: "absolute",
    top: 125.96,
    left: 37.4,
    opacity: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 258.0,
    height: 58.18,
    paddingTop: 10.36,
    paddingRight: 13.82,
    paddingBottom: 10.36,
    paddingLeft: 13.82,
    opacity: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: 230.37,
    height: 37.45,
    gap: 13.82, // For React Native 0.71+, otherwise use marginRight on icon
    opacity: 1,
  },
  icon: {
    width: 24,
    height: 24,
    opacity: 1,
    transform: [{ rotate: "0deg" }],
  },
  divider: {
    width: 0.86,
    height: 37.45,
    backgroundColor: "#F4F4F4",
    opacity: 1,
  },
  textWrapper: {
    flex: 1,
    justifyContent: "center",
    width: 178.74,
    height: 37.45,
    opacity: 1,
    gap: 3.45, // If not supported, use marginBottom on title
  },
  title: {
    width: 178.74,
    height: 18,
    opacity: 1,
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 12.09,
    lineHeight: 17.27,
    letterSpacing: -0.09,
    marginBottom: 3.45, // gap to subtitle
    // No rotation needed
  },
  subtitle: {
    width: 178.74,
    height: 16,
    opacity: 1,
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 11.23,
    lineHeight: 15.54,
    letterSpacing: -0.09,
    // No rotation needed
  },
});

export default NotificationCard;
