import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useThemeContext';

interface InterestChipProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onPress: () => void;
  borderColor: string;
  style?: ViewStyle;
}

const InterestChip: React.FC<InterestChipProps> = ({
  icon, label, selected, onPress, borderColor, style
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? {
          borderColor: '#2E90FA',
          borderWidth: 2,
          backgroundColor: isDark ? '#14141C' : '#fff',
        } : {
          borderColor: isDark ? '#33343A' : '#E5E7EB',
          borderWidth: 1,
          backgroundColor: isDark ? '#14141C' : '#fff',
        },
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={[
        styles.label,
        { color: isDark ? '#fff' : '#222' }
      ]}>{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 46,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    margin: 0,
    opacity: 1,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: '#222',
    textAlignVertical: 'center', // vertical-align: middle equivalent
  },
});

export default InterestChip; 
