import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { globals, setGlobal } = useGlobal();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('clinic_id, clinics(aesthetics_module_enabled, feature_flags)')
            .eq('auth_user_id', session.user.id)
            .single();

          if (profile?.clinic_id) {
            const newSessionId = crypto.randomUUID();

            setGlobal('access_token', session.access_token);
            setGlobal('user_id', session.user.id);
            setGlobal('clinic_id', profile.clinic_id);

            const clinicData = (profile as any).clinics;
            const aestheticsEnabled = clinicData?.feature_flags?.aesthetics ?? clinicData?.aesthetics_module_enabled ?? false;
            setGlobal('aesthetics_module_enabled', aestheticsEnabled);

            const { data: userProfile } = await supabase
              .from('users')
              .select('id')
              .eq('auth_user_id', session.user.id)
              .single();

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

            setIsAuthenticated(true);
          } else {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!globals.access_token) {
      checkAuth();
    } else {
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  }, [globals.access_token, setGlobal]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
