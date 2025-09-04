import React, { useState, useCallback } from 'react';
import StandardizedAlert, { AlertButton } from '../components/StandardizedAlert';

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const useStandardizedAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: { title: '' },
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      visible: true,
      options,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods for common alert types
  const showSuccess = useCallback((title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress }],
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress }],
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', onPress }],
    });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress }],
    });
  }, [showAlert]);

  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: cancelText, onPress: onCancel, style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: 'destructive' },
      ],
    });
  }, [showAlert]);

  const AlertComponent = () => (
    <StandardizedAlert
      visible={alertState.visible}
      onClose={hideAlert}
      title={alertState.options.title}
      message={alertState.options.message}
      buttons={alertState.options.buttons}
      type={alertState.options.type}
    />
  );

  return {
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    AlertComponent,
  };
};

export default useStandardizedAlert;
