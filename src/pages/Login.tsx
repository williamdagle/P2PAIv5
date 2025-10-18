import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import { supabase } from '../lib/supabase';
import debug from '../utils/debug';
import Button from '../components/Button';
import FormField from '../components/FormField';

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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { clearSelectedPatient } = usePatient();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

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
        await logAuthEvent({
          email,
          auth_user_id: data.user.id,
          event_type: 'login_success'
        });

        debug.log('Login successful, session managed by Supabase');
        clearSelectedPatient();
        navigate(from, { replace: true });
      } else {
        setErrors({ submit: 'Login failed. No user session created.' });
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await logAuthEvent({
        email,
        event_type: 'login_failure',
        failure_reason: errorMessage
      });
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
             <Link
               to="/user-migration"
               className="text-sm text-blue-600 hover:text-blue-800 underline"
             >
               Need to migrate users? Click here
             </Link>
           </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
