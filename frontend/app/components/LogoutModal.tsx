import React from "react";
import StandardizedConfirmationModal from "./StandardizedConfirmationModal";

interface LogoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  onClearCache?: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onCancel, onLogout, isLoggingOut, onClearCache }) => {
  return (
    <StandardizedConfirmationModal
      visible={visible}
      onClose={onCancel}
      title="Log out"
      message="Are you sure you want to log out?"
      confirmText="Log out"
      cancelText="Cancel"
      onConfirm={onLogout}
      onCancel={onCancel}
      type="warning"
      loading={isLoggingOut}
    />
  );
};

export default LogoutModal;