import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { auditLogger } from '../utils/auditLogger';
import { useGlobal } from '../context/GlobalContext';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { globals } = useGlobal();

  // Log navigation for compliance/auditing
  useEffect(() => {
    const logNavigation = async () => {
      if (!globals.access_token || !globals.clinic_id) return;

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_audit_event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${globals.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            event_type: 'navigation',
            resource_type: 'application',
            action: 'navigate',
            resource_id: location.pathname,
            details: {
              path: location.pathname,
              search: location.search,
              hash: location.hash,
              timestamp: new Date().toISOString()
            },
            phi_accessed: false,
            clinic_id: globals.clinic_id,
            user_id: globals.user_id
          })
        }).catch(err => console.debug('Navigation audit log failed:', err));
      } catch (error) {
        console.debug('Navigation audit log error:', error);
      }
    };

    logNavigation();
  }, [location.pathname, location.search, globals.access_token, globals.clinic_id, globals.user_id]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
