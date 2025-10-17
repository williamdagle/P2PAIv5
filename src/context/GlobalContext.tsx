import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GlobalState } from '../types';

interface GlobalContextType {
  globals: GlobalState;
  setGlobal: <K extends keyof GlobalState>(key: K, value: GlobalState[K]) => void;
  clearGlobals: () => void;
}

const initialGlobals: GlobalState = {
  access_token: '',
  user_id: '',
  clinic_id: '',
  selected_patient_id: '',
  selected_patient_name: '',
  pending_appointment_edit: undefined
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

  return (
    <GlobalContext.Provider value={{ globals, setGlobal, clearGlobals }}>
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