import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { auditLogger } from './utils/auditLogger';
import NotificationContainer from './components/NotificationContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import CreatePatient from './pages/CreatePatient';
import PatientChart from './pages/PatientChart';
import Appointments from './pages/Appointments';
import TreatmentPlans from './pages/TreatmentPlans';
import Labs from './pages/Labs';
import Supplements from './pages/Supplements';
import Admin from './pages/Admin';
import UserMigration from './pages/UserMigration';
import ProviderCalendar from './pages/ProviderCalendar';
import ClinicalNotes from './pages/ClinicalNotes';
import CreateProviderNote from './pages/CreateProviderNote';
import CreateQuickNote from './pages/CreateQuickNote';
import ManageTemplates from './pages/ManageTemplates';
import ComplianceReporting from './pages/ComplianceReporting';
import Tasks from './pages/Tasks';
import FunctionalMedicine from './pages/FunctionalMedicine';
import ClinicalAssessments from './pages/ClinicalAssessments';
import LabOrders from './pages/LabOrders';
import DocumentManagement from './pages/DocumentManagement';
import PatientPortal from './pages/PatientPortal';
import ChartExport from './pages/ChartExport';
import AestheticsDashboard from './pages/AestheticsDashboard';
import AestheticTreatments from './pages/AestheticTreatments';
import AestheticPhotos from './pages/AestheticPhotos';
import AestheticPOS from './pages/AestheticPOS';
import AestheticInventory from './pages/AestheticInventory';
import AestheticMemberships from './pages/AestheticMemberships';
import AestheticGiftCards from './pages/AestheticGiftCards';
import Medications from './pages/Medications';
import ManageAppointmentTypes from './pages/ManageAppointmentTypes';
import SystemSettings from './pages/SystemSettings';
import ClinicSettings from './pages/ClinicSettings';
import ProviderScheduleManagement from './pages/ProviderScheduleManagement';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('Login');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { setGlobal, globals } = useGlobal();

  // Check for existing Supabase session on app load
  useEffect(() => {
    if (sessionChecked) return;
    
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('clinic_id, clinics(aesthetics_module_enabled)')
              .eq('auth_user_id', session.user.id)
              .single();
            
            if (profile?.clinic_id) {
              const newSessionId = crypto.randomUUID();

              setGlobal('access_token', session.access_token);
              setGlobal('user_id', session.user.id);
              setGlobal('clinic_id', profile.clinic_id);
              setGlobal('aesthetics_module_enabled', (profile as any).clinics?.aesthetics_module_enabled || false);
              setSessionId(newSessionId);

              const { data: userProfile } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .single();

              // Initialize audit logger with credentials
              auditLogger.setCredentials(
                session.access_token,
                profile.clinic_id,
                userProfile?.id || '',
                newSessionId
              );

              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                  action: 'start',
                  session_id: newSessionId,
                  user_id: userProfile?.id,
                  clinic_id: profile.clinic_id,
                  user_agent: navigator.userAgent
                })
              }).catch(err => console.warn('Failed to log session start:', err));

              setCurrentPage('Dashboard');
            } else {
              await supabase.auth.signOut();
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            await supabase.auth.signOut();
          }
        }
      } catch (sessionError) {
        console.error('Session check error:', sessionError);
      } finally {
        setIsLoading(false);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [sessionChecked, setGlobal]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        await auditLogger.endSession('user_initiated');
        auditLogger.clearCredentials();
        setCurrentPage('Login');
        setSessionChecked(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track session activity every 5 minutes
  useEffect(() => {
    if (currentPage === 'Login' || !globals.access_token) return;

    const activityInterval = setInterval(() => {
      auditLogger.logSessionActivity();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(activityInterval);
  }, [currentPage, globals.access_token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    const pageProps = { onNavigate: setCurrentPage };

    switch (currentPage) {
      case 'Login':
        return <Login {...pageProps} />;
      case 'UserMigration':
        return <UserMigration {...pageProps} />;
      case 'Dashboard':
        return <Dashboard {...pageProps} />;
      case 'Patients':
        return <Patients {...pageProps} />;
      case 'CreatePatient':
        return <CreatePatient {...pageProps} />;
      case 'PatientChart':
        return <PatientChart {...pageProps} />;
      case 'Appointments':
        return <Appointments {...pageProps} />;
      case 'TreatmentPlans':
        return <TreatmentPlans {...pageProps} />;
      case 'TimelineEvents':
        return <FunctionalMedicine {...pageProps} />;
      case 'Labs':
        return <Labs {...pageProps} />;
      case 'Supplements':
        return <Supplements {...pageProps} />;
      case 'Admin':
        return <Admin {...pageProps} />;
      case 'ProviderCalendar':
        return <ProviderCalendar {...pageProps} />;
      case 'ClinicalNotes':
        return <ClinicalNotes {...pageProps} />;
      case 'CreateProviderNote':
        return <CreateProviderNote {...pageProps} />;
      case 'CreateQuickNote':
        return <CreateQuickNote {...pageProps} />;
      case 'ManageTemplates':
        return <ManageTemplates {...pageProps} />;
      case 'ComplianceReporting':
        return <ComplianceReporting {...pageProps} />;
      case 'Tasks':
        return <Tasks {...pageProps} />;
      case 'FunctionalMedicine':
        return <FunctionalMedicine {...pageProps} />;
      case 'ClinicalAssessments':
        return <ClinicalAssessments {...pageProps} />;
      case 'LabOrders':
        return <LabOrders {...pageProps} />;
      case 'DocumentManagement':
        return <DocumentManagement {...pageProps} />;
      case 'PatientPortal':
        return <PatientPortal {...pageProps} />;
      case 'ChartExport':
        return <ChartExport {...pageProps} />;
      case 'Medications':
        return <Medications {...pageProps} />;
      case 'AestheticsDashboard':
        return <AestheticsDashboard {...pageProps} />;
      case 'AestheticTreatments':
        return <AestheticTreatments {...pageProps} />;
      case 'AestheticPhotos':
        return <AestheticPhotos {...pageProps} />;
      case 'AestheticPOS':
        return <AestheticPOS {...pageProps} />;
      case 'AestheticInventory':
        return <AestheticInventory {...pageProps} />;
      case 'AestheticMemberships':
        return <AestheticMemberships {...pageProps} />;
      case 'AestheticGiftCards':
        return <AestheticGiftCards {...pageProps} />;
      case 'ManageAppointmentTypes':
        return <ManageAppointmentTypes {...pageProps} />;
      case 'SystemSettings':
        return <SystemSettings {...pageProps} />;
      case 'ClinicSettings':
        return <ClinicSettings {...pageProps} />;
      case 'ProviderScheduleManagement':
        return <ProviderScheduleManagement {...pageProps} />;
      default:
        return <Login {...pageProps} />;
    }
  };

  return renderPage();
};

function App() {
  return (
    <GlobalProvider>
      <AppContent />
      <NotificationContainer />
    </GlobalProvider>
  );
}

export default App;