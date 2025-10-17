import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { GlobalState, NotificationData } from '../types';

interface GlobalContextType {
  globals: GlobalState;
  setGlobal: <K extends keyof GlobalState>(key: K, value: GlobalState[K]) => void;
  clearGlobals: () => void;
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const initialGlobals: GlobalState = {
  access_token: '',
  user_id: '',
  clinic_id: '',
  selected_patient_id: '',
  selected_patient_name: '',
  pending_appointment_edit: undefined,
  notifications: []
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globals, setGlobals] = useState<GlobalState>(initialGlobals);

  const setGlobal = <K extends keyof GlobalState>(key: K, value: GlobalState[K]) => {
    setGlobals(prev => ({ ...prev, [key]: value }));
  };

  const clearGlobals = () => {
    setGlobals(initialGlobals);
    // Clear any stored session data
    localStorage.removeItem('supabase.auth.token');
  };

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    console.log('[GlobalContext] Adding notification:', newNotification);
    setGlobals(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification]
    }));
  }, []);

  const removeNotification = useCallback((id: string) => {
    console.log('[GlobalContext] Removing notification:', id);
    setGlobals(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  }, []);

  return (
    <GlobalContext.Provider value={{ globals, setGlobal, clearGlobals, addNotification, removeNotification }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};