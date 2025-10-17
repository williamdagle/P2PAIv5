import { useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';

export function useNotification() {
  const { globals, addNotification, removeNotification } = useGlobal();

  const showSuccess = useCallback((title: string, message?: string) => {
    console.log('[useNotification] showSuccess called:', title, message);
    addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string) => {
    console.log('[useNotification] showError called:', title, message);
    addNotification({ type: 'error', title, message });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    console.log('[useNotification] showWarning called:', title, message);
    addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    console.log('[useNotification] showInfo called:', title, message);
    addNotification({ type: 'info', title, message });
  }, [addNotification]);

  return {
    notifications: globals.notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}