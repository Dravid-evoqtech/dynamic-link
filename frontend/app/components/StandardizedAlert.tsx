import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import StandardizedModal from './StandardizedModal';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface StandardizedAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
}

const StandardizedAlert: React.FC<StandardizedAlertProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons = [{ text: 'OK', onPress: onClose }],
  type = 'info',
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Standardized colors based on alert type
  const getColors = () => {
    const baseColors = {
      modalBg: isDark ? '#1E1E1E' : '#FFFFFF',
      textPrimary: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#B0B0B0' : '#666666',
      border: isDark ? '#333333' : '#E5E7EB',
      // Explicit border colors for consistency - using solid colors
      buttonBorder: isDark ? '#404040' : '#D1D5DB',
    };

    switch (type) {
      case 'success':
        return {
          ...baseColors,
          accent: '#22C55E',
          accentBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
        };
      case 'warning':
        return {
          ...baseColors,
          accent: '#F59E0B',
          accentBg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
        };
      case 'error':
        return {
          ...baseColors,
          accent: '#EF4444',
          accentBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        };
      default: // info
        return {
          ...baseColors,
          accent: '#3B82F6',
          accentBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        };
    }
  };

  const colors = getColors();

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return {
          backgroundColor: 'transparent',
        };
      case 'cancel':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return { color: '#007AFF' };
      case 'cancel':
        return { color: '#007AFF' };
      default:
        return { color: '#007AFF' };
    }
  };

  return (
    <StandardizedModal
      visible={visible}
      onClose={onClose}
      type="confirmation"
      animationType="fade"
      showCloseButton={false}
    >
      {/* Title */}
      <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{title}</Text>

      {/* Message */}
      {message && (
        <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>{message}</Text>
      )}

      {/* Buttons */}
      <View style={[styles.buttonContainer, { borderTopColor: colors.buttonBorder }]}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              getButtonStyle(button.style),
              buttons.length === 1 ? styles.singleButton : styles.multiButton,
              buttons.length > 1 && index < buttons.length - 1 ? { borderRightColor: colors.buttonBorder } : {},
            ]}
            onPress={() => {
              if (button.onPress) {
                button.onPress();
              }
              onClose();
            }}
          >
            <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </StandardizedModal>
  );
};

const styles = StyleSheet.create({
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: 'UberMoveText-Regular',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
  },
  singleButton: {
    flex: 1,
  },
  multiButton: {
    flex: 1,
    borderRightWidth: 1,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
});

export default StandardizedAlert;
