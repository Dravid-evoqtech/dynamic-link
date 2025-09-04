import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeContext';
import StandardizedModal from './StandardizedModal';

interface UnlockOpportunityModalProps {
  visible: boolean;
  onCancel: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
  opportunityTitle?: string;
  pointsRequired?: number;
  onUnlockSuccess?: (opportunityTitle: string, pointsRequired: number) => void;
  onUnlockError?: (errorMessage: string, pointsRequired: number) => void;
}

const UnlockOpportunityModal: React.FC<UnlockOpportunityModalProps> = ({ 
  visible, 
  onCancel, 
  onUnlock, 
  isUnlocking,
  opportunityTitle = "this opportunity",
  pointsRequired = 10,
  onUnlockSuccess,
  onUnlockError
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Theme-aware colors
  const colors = {
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#333333' : '#E5E7EB',
    iconContainerBg: isDark ? 'rgba(46, 144, 250, 0.2)' : 'rgba(46, 144, 250, 0.1)',
    iconContainerBorder: isDark ? 'rgba(46, 144, 250, 0.3)' : 'rgba(46, 144, 250, 0.2)',
  };



  const handleUnlock = async () => {
    try {
      // Clear any previous error
      setErrorMessage(null);
      
      await onUnlock();
      
      // Call success callback
      if (onUnlockSuccess) {
        onUnlockSuccess(opportunityTitle, pointsRequired);
      }
    } catch (error) {
      // Show user-friendly error message based on the error
      let message = "Failed to unlock opportunity. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Not enough points")) {
          message = "Insufficient points! You need more points to unlock this opportunity.";
        } else if (error.message.includes("400")) {
          message = "Bad request. Please check your account and try again.";
        } else if (error.message.includes("401")) {
          message = "Authentication failed. Please log in again.";
        } else if (error.message.includes("403")) {
          message = "Access denied. You don't have permission to unlock this opportunity.";
        } else if (error.message.includes("404")) {
          message = "Opportunity not found. It may have been removed.";
        } else if (error.message.includes("500")) {
          message = "Server error. Please try again later.";
        }
      }
      
      // Set error message to display in the modal
      setErrorMessage(message);
      
      // Error will be shown in modal
    }
  };

  // Clear error when modal is closed
  const handleCancel = () => {
    // If there's an error message, notify parent before closing
    if (errorMessage && onUnlockError) {
      onUnlockError(errorMessage, pointsRequired);
    }
    setErrorMessage(null);
    onCancel();
  };

  return (
    <StandardizedModal
      visible={visible}
      onClose={handleCancel}
      type="confirmation"
      animationType="fade"
      showCloseButton={false}
      loading={false}
    >
      {/* Lock Icon */}
      <View style={[unlockStyles.iconContainer, { backgroundColor: colors.iconContainerBg, borderColor: colors.iconContainerBorder }]}>
        <MaterialIcons name="lock" size={32} color="#2E90FA" />
      </View>
      
      <Text style={[unlockStyles.title, { color: colors.textPrimary }]}>Unlock Opportunity</Text>
      <Text style={[unlockStyles.message, { color: colors.textSecondary }]}>
        Unlock "{opportunityTitle}" to view full details and apply. This will cost you {pointsRequired} points.
      </Text>
      
      {/* Error Message Display */}
      {errorMessage && (
        <View style={[unlockStyles.errorContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={[unlockStyles.errorText, { color: '#EF4444' }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={[unlockStyles.buttonContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[unlockStyles.button, unlockStyles.cancelButton, { borderRightColor: colors.border }]}
          onPress={handleCancel}
          disabled={isUnlocking}
        >
          <Text style={[unlockStyles.cancelText, { color: '#007AFF' }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[unlockStyles.button, unlockStyles.unlockButton]}
          onPress={handleUnlock} 
          disabled={isUnlocking}
        >
          {isUnlocking ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[unlockStyles.unlockText, { color: '#007AFF' }]}>Unlock</Text>
          )}
        </TouchableOpacity>
      </View>
    </StandardizedModal>
  );
};

const unlockStyles = StyleSheet.create({
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    alignSelf: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "UberMoveText-Medium",
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    marginBottom: 18,
    textAlign: "center",
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRightWidth: 1,
  },
  unlockButton: {
    backgroundColor: "transparent",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "400",
    fontFamily: "UberMoveText-Regular",
    textAlign: "center",
  },
  unlockText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "UberMoveText-Medium",
    textAlign: "center",
  },
  errorContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "UberMoveText-Medium",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default UnlockOpportunityModal;
