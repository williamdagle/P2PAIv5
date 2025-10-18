import { useCallback } from 'react';
import { useNotificationContext } from '../context/NotificationContext';

export function useNotification() {
  const { addNotification } = useNotificationContext();

  const showSuccess = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 5000
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 7000
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 5000
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
