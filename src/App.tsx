import { useEffect } from 'react';
import { useRoutes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePatient } from './context/PatientContext';
import { supabase } from './lib/supabase';
import { endSession } from './utils/auditLoggerStateless';
import NotificationContainer from './components/NotificationContainer';
import { routes } from './routes';
import debug from './utils/debug';

const AppContent: React.FC = () => {
  const routing = useRoutes(routes);
  const navigate = useNavigate();
  const { user, clinicId, userId } = useAuth();
  const { clearSelectedPatient } = usePatient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        if (userId && clinicId) {
          await endSession(user?.id || '', userId, clinicId, 'user_initiated');
        }
        clearSelectedPatient();
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, user, userId, clinicId, clearSelectedPatient]);

  useEffect(() => {
    if (userId && clinicId) {
      const activityInterval = setInterval(() => {
        debug.log('Logging periodic session activity');
      }, 5 * 60 * 1000);

      return () => clearInterval(activityInterval);
    }
  }, [userId, clinicId]);

  return <>{routing}</>;
};

function App() {
  return (
    <>
      <AppContent />
      <NotificationContainer />
    </>
  );
}

export default App;
