import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';

interface SelectableCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  backgroundColor?: string;
  rightIcon?: React.ReactNode;
  iconBgColor?: string;
  // New props for flexibility
  variant?: 'default' | 'grid' | 'simple';
  borderColor?: string;
  showBorder?: boolean;
  customStyle?: any;
  iconSize?: number;
  titleStyle?: any;
  descriptionStyle?: any;
}

const SelectableCard: React.FC<SelectableCardProps> = ({
  icon,
  title,
  description,
  selected,
  onPress,
  backgroundColor = '#fff',
  rightIcon,
  iconBgColor = '#F0F4FF',
  variant = 'default',
  borderColor = '#267DFF',
  showBorder = true,
  customStyle,
  iconSize = 28,
  titleStyle,
  descriptionStyle,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#14141C' : (backgroundColor ?? '#fff');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardBg },
        selected 
          ? styles.selectedGlow 
          : (isDark ? styles.unselectedBorderDark : styles.unselectedBorderLight),
        customStyle,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[
          styles.title,
          { color: isDark ? '#fff' : '#222' },
          titleStyle
        ]}>
          {title}
        </Text>
        {description && (
          <Text style={[
            styles.description,
            { color: isDark ? '#B0B0B0' : '#667085' },
            descriptionStyle
          ]}>
            {description}
          </Text>
        )}
      </View>
      {rightIcon && (
        <View style={styles.rightIconContainer}>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 18,
    paddingTop: 12,
    paddingRight: 18,
    paddingBottom: 12,
    paddingLeft: 12,
    width: 320,
    height: 72,
    backgroundColor: '#fff',
    opacity: 1,
  },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    maxHeight: 44,
    flex: 1,
    minWidth: 150,
    maxWidth: 150,
  },
  simpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
  },
  gridTextContainer: {
    flex: 1,
  },
  rightIconContainer: {
    marginLeft: 16,
  },
  gridRightIcon: {
    marginLeft: 8,
  },
  title: {
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    verticalAlign: 'middle',
    color: '#fff',
  },
  description: {
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    width: 196,
    height: 20,
    opacity: 0.6,
  },
  gridDescription: {
    fontSize: 12,
    marginTop: 0,
  },
  selectedGlow: {
    borderColor: '#2E90FA',
    borderWidth: 2,
    
    shadowRadius: 20,
    elevation: 20,
  },
  unselectedBorderLight: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  unselectedBorderDark: {
    borderColor: '#33343A',
    borderWidth: 1,
  },
});

export default SelectableCard;
