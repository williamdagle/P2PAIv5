import { useEffect } from 'react';
import { useRoutes, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { auditLogger } from './utils/auditLogger';
import NotificationContainer from './components/NotificationContainer';
import { routes } from './routes';

const AppContent: React.FC = () => {
  const routing = useRoutes(routes);
  const navigate = useNavigate();
  const { globals } = useGlobal();

  // Listen for auth state changes and handle logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        await auditLogger.endSession('user_initiated');
        auditLogger.clearCredentials();
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Track session activity every 5 minutes
  useEffect(() => {
    if (!globals.access_token) return;

    const activityInterval = setInterval(() => {
      auditLogger.logSessionActivity();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(activityInterval);
  }, [globals.access_token]);

  return <>{routing}</>;
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
