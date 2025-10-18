import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ClinicProvider } from './ClinicContext';
import { PatientProvider } from './PatientContext';
import { NotificationProvider } from './NotificationContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ClinicProvider>
        <PatientProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </PatientProvider>
      </ClinicProvider>
    </AuthProvider>
  );
};
