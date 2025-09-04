import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';

const { width } = Dimensions.get('window');

export interface StandardizedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  type?: 'default' | 'confirmation' | 'action' | 'fullscreen';
  animationType?: 'fade' | 'slide';
  showCloseButton?: boolean;
  loading?: boolean;
}

const StandardizedModal: React.FC<StandardizedModalProps> = ({
  visible,
  onClose,
  title,
  message,
  children,
  type = 'default',
  animationType = 'fade',
  showCloseButton = true,
  loading = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Standardized colors
  const colors = {
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    modalBg: isDark ? '#1E1E1E' : '#F2F2F2',
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#333333' : '#E5E7EB',
    closeButton: isDark ? '#B0B0B0' : '#666666',
  };

  const getModalStyle = () => {
    switch (type) {
      case 'fullscreen':
        return [styles.modal, styles.fullscreenModal, { backgroundColor: colors.modalBg }];
      case 'confirmation':
        return [styles.modal, styles.confirmationModal, { backgroundColor: colors.modalBg }];
      case 'action':
        return [styles.modal, styles.actionModal, { backgroundColor: colors.modalBg }];
      default:
        return [styles.modal, styles.defaultModal, { backgroundColor: colors.modalBg }];
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={getModalStyle()}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
            </View>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: colors.closeButton }]}>✕</Text>
                </TouchableOpacity>
              )}
              {title && (
                <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              )}
              {showCloseButton && <View style={styles.closeButton} />}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            )}
            {children}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  defaultModal: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
  },
  confirmationModal: {
    width: 273,
    maxWidth: 273,
  },
  actionModal: {
    width: width * 0.9,
    maxWidth: 400,
  },
  fullscreenModal: {
    width: width * 0.95,
    height: '90%',
    maxHeight: '90%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: 'UberMoveText-Regular',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
});

export default StandardizedModal;
