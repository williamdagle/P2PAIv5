import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PatientContextType {
  selectedPatientId: string | null;
  selectedPatientName: string | null;
  setSelectedPatient: (patientId: string | null, patientName?: string | null) => void;
  clearSelectedPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);

  const setSelectedPatient = useCallback((patientId: string | null, patientName?: string | null) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName || null);
  }, []);

  const clearSelectedPatient = useCallback(() => {
    setSelectedPatientId(null);
    setSelectedPatientName(null);
  }, []);

  const value = React.useMemo(
    () => ({
      selectedPatientId,
      selectedPatientName,
      setSelectedPatient,
      clearSelectedPatient,
    }),
    [selectedPatientId, selectedPatientName, setSelectedPatient, clearSelectedPatient]
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
