import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useThemeContext";

interface OpportunityContentProps {
  startDate: string;
  duration: string;
  eligibility: string;
}

const OpportunityContent: React.FC<OpportunityContentProps> = ({ startDate, duration, eligibility }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    cardBg: isDark ? '#23272F' : '#F5F9FF',
    textPrimary: isDark ? '#fff' : '#000000',
    textSecondary: isDark ? '#B0B0B0' : '#6D6D73',
  };

  return (
    <View style={styles.contentWrapper}>
      <View style={styles.infoCardRow}>
        <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
          <Image source={require("../../../assets/icons/dateiconbg.png")} style={styles.icon} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Start Date</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{startDate}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
          <Image source={require("../../../assets/icons/durationicon.png")} style={styles.icon} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{duration}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
          <Image source={require("../../../assets/icons/eligibilityicon.png")} style={styles.icon} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Eligibility</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{eligibility}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Regular",
    color: "#FFFFFF",
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  tagContainer: {
    borderRadius: 24,
    paddingVertical: 6,
  },
  tag: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 15,
    color: "#FFFFFF",
    marginHorizontal: 20,
    fontWeight: "500",
    fontFamily: "UberMoveText-Regular",
    marginBottom: 6,
  },
  sectionTitle2: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    marginBottom: 8,
  },
  infoCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    width: '100%',
  },
  infoCard: {
    width: 107.67,
    borderRadius: 17,
    height: 89,
    padding: 12,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "400",
    marginBottom: 2,
    fontFamily: "UberMoveText-Regular",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
  },
    icon: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
});

export default OpportunityContent;