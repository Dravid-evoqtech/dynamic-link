import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import StandardizedModal from './StandardizedModal';

export interface StandardizedConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const StandardizedConfirmationModal: React.FC<StandardizedConfirmationModalProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Standardized colors based on confirmation type
  const getColors = () => {
    const baseColors = {
      modalBg: isDark ? '#1E1E1E' : '#FFFFFF',
      textPrimary: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#B0B0B0' : '#666666',
      border: isDark ? '#F2F2F2' : '#E5E7EB',
    };

    switch (type) {
      case 'danger':
        return {
          ...baseColors,
          accent: '#EF4444',
          accentBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        };
      case 'warning':
        return {
          ...baseColors,
          accent: '#F59E0B',
          accentBg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <StandardizedModal
      visible={visible}
      onClose={onClose}
      type="confirmation"
      animationType="fade"
      showCloseButton={false}
      loading={loading}
    >
      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      {/* Message */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { borderRightColor: colors.border }
          ]}
          onPress={handleCancel}
          disabled={loading}
        >
                     <Text style={[styles.cancelButtonText, { color: '#007AFF' }]}>
             {cancelText}
           </Text>
         </TouchableOpacity>

         <TouchableOpacity
           style={[
             styles.button,
             styles.confirmButton,
             loading && styles.loadingButton
           ]}
           onPress={handleConfirm}
           disabled={loading}
         >
           {loading ? (
             <ActivityIndicator size="small" color="#007AFF" />
           ) : (
             <Text style={[styles.confirmButtonText, { color: '#007AFF' }]}>
               {confirmText}
             </Text>
           )}
        </TouchableOpacity>
      </View>
    </StandardizedModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
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
  cancelButton: {
    backgroundColor: 'transparent',
    borderRightWidth: 1,
  },
  confirmButton: {
    backgroundColor: 'transparent',
  },
  loadingButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Regular',
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
  },
});

export default StandardizedConfirmationModal;
