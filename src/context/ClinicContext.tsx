import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ClinicFeatures {
  aesthetics?: boolean;
  pos?: boolean;
  memberships?: boolean;
  inventory?: boolean;
  ai_photo_analysis?: boolean;
  gift_cards?: boolean;
}

interface ClinicContextType {
  clinicName: string | null;
  clinicType: string | null;
  aestheticsEnabled: boolean;
  features: ClinicFeatures;
  loading: boolean;
  refreshClinicSettings: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { clinicId, isAuthenticated } = useAuth();
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [clinicType, setClinicType] = useState<string | null>(null);
  const [aestheticsEnabled, setAestheticsEnabled] = useState(false);
  const [features, setFeatures] = useState<ClinicFeatures>({});
  const [loading, setLoading] = useState(true);

  const loadClinicSettings = useCallback(async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('name, clinic_type, aesthetics_module_enabled, feature_flags, aesthetics_features')
        .eq('id', clinicId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClinicName(data.name);
        setClinicType(data.clinic_type);

        const aestheticsFlag = data.feature_flags?.aesthetics ?? data.aesthetics_module_enabled ?? false;
        setAestheticsEnabled(aestheticsFlag);

        setFeatures({
          aesthetics: aestheticsFlag,
          ...data.aesthetics_features,
        });
      }
    } catch (error) {
      console.error('Failed to load clinic settings:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (isAuthenticated && clinicId) {
      loadClinicSettings();
    } else {
      setClinicName(null);
      setClinicType(null);
      setAestheticsEnabled(false);
      setFeatures({});
      setLoading(false);
    }
  }, [clinicId, isAuthenticated, loadClinicSettings]);

  const value = React.useMemo(
    () => ({
      clinicName,
      clinicType,
      aestheticsEnabled,
      features,
      loading,
      refreshClinicSettings: loadClinicSettings,
    }),
    [clinicName, clinicType, aestheticsEnabled, features, loading, loadClinicSettings]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
