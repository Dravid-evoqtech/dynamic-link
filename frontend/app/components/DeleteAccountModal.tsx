import React from "react";
import StandardizedConfirmationModal from "./StandardizedConfirmationModal";

interface DeleteAccountModalProps {
  visible: boolean;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onCancel, onDelete, isDeleting }) => {
  return (
    <StandardizedConfirmationModal
      visible={visible}
      onClose={onCancel}
      title="Delete Account"
      message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
      confirmText="Delete Account"
      cancelText="Cancel"
      onConfirm={onDelete}
      onCancel={onCancel}
      type="danger"
      loading={isDeleting}
    />
  );
};

export default DeleteAccountModal;