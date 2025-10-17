import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Layout from '../components/Layout';

const getClientInfo = () => ({
  ip_address: null,
  user_agent: navigator.userAgent
});

const logAuthEvent = async (eventData: {
  email: string;
  auth_user_id?: string;
  event_type: string;
  failure_reason?: string;
  session_id?: string;
}) => {
  try {
    const clientInfo = getClientInfo();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_authentication_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        ...eventData,
        ...clientInfo
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Auth event logging failed:', errorData);
    }
  } catch (error) {
    console.warn('Failed to log auth event:', error);
  }
};

interface LoginProps {
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const { setGlobal } = useGlobal();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await logAuthEvent({
          email,
          event_type: 'login_failure',
          failure_reason: error.message
        });
        setErrors({ submit: error.message });
        return;
      }

      if (data.user && data.session) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('clinic_id, full_name, clinics(feature_flags)')
          .eq('auth_user_id', data.user.id)
          .single();


        if (profileError) {
          await logAuthEvent({
            email,
            auth_user_id: data.user.id,
            event_type: 'login_failure',
            failure_reason: 'Profile load failed'
          });
          setErrors({ submit: 'Failed to load user profile. Please contact support.' });
          await supabase.auth.signOut();
          return;
        }

        if (!profile?.clinic_id) {
          await logAuthEvent({
            email,
            auth_user_id: data.user.id,
            event_type: 'login_failure',
            failure_reason: 'Profile incomplete - missing clinic_id'
          });
          setErrors({ submit: 'User profile incomplete. Please contact support to complete setup.' });
          await supabase.auth.signOut();
          return;
        }

        const newSessionId = crypto.randomUUID();

        await logAuthEvent({
          email,
          auth_user_id: data.user.id,
          event_type: 'login_success',
          session_id: newSessionId
        });

        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        // Initialize audit logger
        auditLogger.setCredentials(
          data.session.access_token,
          profile.clinic_id,
          userProfile?.id || '',
          newSessionId
        );

        // Start user session
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            action: 'start',
            session_id: newSessionId,
            user_id: userProfile?.id,
            clinic_id: profile.clinic_id,
            user_agent: navigator.userAgent
          })
        }).catch(err => console.warn('Failed to start session:', err));

        const featureFlags = (profile as any).clinics?.feature_flags || {};
        const aestheticsEnabled = featureFlags.aesthetics || false;

        setGlobal('access_token', data.session.access_token);
        setGlobal('user_id', data.user.id);
        setGlobal('clinic_id', profile.clinic_id);
        setGlobal('aesthetics_module_enabled', aestheticsEnabled);
        onNavigate('Dashboard');
      } else {
        setErrors({ submit: 'Login failed. No user session created.' });
      }

    } catch (err: any) {
      await logAuthEvent({
        email,
        event_type: 'login_failure',
        failure_reason: err.message || 'Unknown error'
      });
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">P2PAI EMR</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <FormField label="Email" error={errors.email} required>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </FormField>

              <FormField label="Password" error={errors.password} required>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </FormField>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
             
             <div className="mt-4 text-center">
               <button
                 type="button"
                 onClick={() => onNavigate('UserMigration')}
                 className="text-sm text-blue-600 hover:text-blue-800 underline"
               >
                 Need to migrate users? Click here
               </button>
             </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Login;