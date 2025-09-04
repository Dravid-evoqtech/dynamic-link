import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useThemeContext";
import { FilterSkeleton } from '../SkeletonLoader';

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  onApplyFilters?: (filters: { type: string; program: string; sortBy: string }) => void;
  currentFilters?: { type: string; program: string; sortBy: string };
}

const FilterActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  navigation,
  onApplyFilters,
  currentFilters,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  const [type, setType] = useState("All");
  const [program, setProgram] = useState("Internship");
  const [sortBy, setSortBy] = useState("Featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      // Set the current filter values when modal opens
      if (currentFilters) {
        setType(currentFilters.type);
        setProgram(currentFilters.program);
        setSortBy(currentFilters.sortBy);
      }
      // Simulate loading filter options
      setTimeout(() => setLoading(false), 500);
    }
  }, [visible, currentFilters]);

  const renderFilterGroup = (
    title: string,
    options: string[],
    selected: string,
    setSelected: (value: string) => void
  ) => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: isDark ? '#fff' : '#fff' }]}>{title}</Text>
      <View style={[styles.filterContainer, { 
        borderColor: isDark ? '#fff' : '#fff',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'
      }]}>
        {options.map((option, index) => (
          <React.Fragment key={option}>
            <TouchableOpacity
              onPress={() => setSelected(option)}
              style={[
                styles.filterItem,
                selected === option && [styles.filterItemSelected, { backgroundColor: isDark ? '#fff' : '#fff' }],
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isDark ? '#fff' : '#fff' },
                  selected === option && [styles.filterTextSelected, { color: isDark ? '#161622' : '#101017' }],
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
            {index < options.length - 1 && (
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: isDark ? '#fff' : '#fff' }]} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.sheetOuter} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={isDark ? ["#161622", "#2A2A3A"] : ["#0F80FA", "#A5CFFD"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.sheetInner}
          >
            {/* Stars */}
            <View style={styles.starsContainer}>
              {Array.from({ length: 40 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.star,
                    {
                      top: Math.random() * 60 + 4,
                      left: Math.random() * (width - 12) + 6,
                      opacity: Math.random() * 0.6 + 0.3,
                      width: Math.random() * 1.2 + 0.8,
                      height: Math.random() * 1.2 + 0.8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.header, { color: isDark ? '#fff' : '#fff' }]}>Filters</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#fff'} />
              </TouchableOpacity>
            </View>

              {loading ? (
                <FilterSkeleton />
              ) : (
                <>
                  {renderFilterGroup(
                    "Type",
                    ["All", "Remote", "In-Person", "Hybrid"],
                    type,
                    setType
                  )}
                  {renderFilterGroup(
                    "Program",
                    ["Internship", "Volunteering", "Research"],
                    program,
                    setProgram
                  )}
                  {renderFilterGroup(
                    "Sort by",
                    ["Featured", "Newest", "Ending Soon"],
                    sortBy,
                    setSortBy
                  )}

                  <TouchableOpacity
                    style={[styles.applyButton, { 
                      backgroundColor: isDark ? '#0676EF' : '#0676EF'
                    }]}
                    onPress={() => {
                      onApplyFilters?.({ type, program, sortBy });
                      onClose();
                    }}
                  >
                    <Text style={[styles.applyText, { color: isDark ? '#fff' : '#fff' }]}>Apply</Text>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetOuter: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    position: "relative", // Needed for absolute positioning of stars
  },
  sheetInner: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop:15,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  // Stars styles
  starsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height: 60,
    zIndex: 2,
  },
  star: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  // Existing styles
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 3, // Above stars
  },
  header: {
    fontWeight: "500", // Updated from '700' to '500'
    fontSize: 24, // Matches
    lineHeight: 32, // New: Updated from height: 21. This is crucial for preventing clipping.
    letterSpacing: -0.48, // New: -2% of 24px font size (24 * 0.02 = 0.48)
    opacity: 1,
    fontFamily: "UberMoveText-Medium",
  },
  section: {
    marginBottom: 20,
    zIndex: 3, // Above stars
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
    fontFamily: "UberMoveText-Medium",
  },
  filterContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    height: 42,
    zIndex: 3, // Above stars
    gap: 6,
  },
  filterItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterItemSelected: {
    margin: 3,
    borderRadius: 10,
    flex: 1,
  },
  dividerContainer: {
    width: 1,
    justifyContent: "center",
  },
  divider: {
    height: 12,
    width: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "UberMoveText-Medium",
    letterSpacing: -0.08,
    lineHeight: 16,
  },
  filterTextSelected: {
    fontWeight: "500",
    fontSize: 13,
    fontFamily: "UberMoveText-Medium",
    letterSpacing: -0.08,
    lineHeight: 16,
  },
  applyButton: {
    marginTop: 10, // Keeping existing margin
    height: 54, // Matches
    width: 336, // Matches
    alignSelf: "center", // Keeping existing alignment
    borderRadius: 20, // Updated from 22 to 20 // Updated from paddingVertical: 12, paddingHorizontal: 50 to padding: 16
    flexDirection: "row", // New: Flow: Horizontal
    justifyContent: "center", // Center content horizontally within the button
    alignItems: "center", // Center content vertically within the button
    gap: 8,
    zIndex: 3, // Keeping existing zIndex
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  applyText: {
    fontSize: 15, // Matches
    fontWeight: "500", // Matches
    width: 41, // Matches
    height: 22, // Matches
    letterSpacing: -0.1, // Matches
    lineHeight: 22, // Matches
    fontFamily: "UberMoveText-Medium",
    textAlign: "center", // New: Horizontal alignment
  },
});

export default FilterActionSheet;
