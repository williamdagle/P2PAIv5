import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { auditLogger } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAccessToken, clinicId, userId } = useAuth();

  // Log navigation for compliance/auditing
  useEffect(() => {
    const logNavigation = async () => {
      const accessToken = getAccessToken();
      if (!accessToken || !clinicId) return;

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_audit_event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
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
            clinic_id: clinicId,
            user_id: userId
          })
        }).catch(err => console.debug('Navigation audit log failed:', err));
      } catch (error) {
        console.debug('Navigation audit log error:', error);
      }
    };

    logNavigation();
  }, [location.pathname, location.search, getAccessToken, clinicId, userId]);

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
