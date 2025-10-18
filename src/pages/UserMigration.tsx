import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { Users, AlertTriangle, CheckCircle, XCircle, Key } from 'lucide-react';

interface UserMigrationProps {
  onNavigate: (page: string) => void;
}

interface MigrationResult {
  user_id: string;
  email: string;
  auth_user_id?: string;
  temp_password?: string;
  status: 'success' | 'error';
  error?: string;
}

const UserMigration: React.FC<UserMigrationProps> = ({ onNavigate }) => {
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [migrationStats, setMigrationStats] = useState<{
    total: number;
    success: number;
    errors: number;
  } | null>(null);
  const [migrationError, setMigrationError] = useState<string>('');
  const [migrationSuccess, setMigrationSuccess] = useState<string>('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  const { apiCall, loading, error } = useApi();

  const handleMigration = async () => {
    try {
      setMigrationError('');
      setMigrationSuccess('');
      setMigrationResults([]);
      setMigrationStats(null);
      
      const response = await apiCall<{
        total_users: number;
        migrated_count: number;
        error_count: number;
        results: MigrationResult[];
        message?: string;
      }>(`${import.meta.env.VITE_SUPABASE_URL}functions/v1/migrate_users`, {
        method: 'POST'
      });
      
      setMigrationResults(response.results);
      setMigrationStats({
        total: response.total_users,
        success: response.migrated_count,
        errors: response.error_count
      });
      
      if (response.migrated_count === 0 && response.total_users === 0) {
        setMigrationSuccess('No users found that need migration. All users may already be migrated.');
      } else if (response.migrated_count > 0) {
        setMigrationSuccess(`Successfully migrated ${response.migrated_count} users! Check the table below for temporary passwords.`);
      }
      
    } catch (err) {
      setMigrationError(`Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    
    try {
      await apiCall(`${import.meta.env.VITE_SUPABASE_URL}functions/v1/reset_user_password`, {
        method: 'POST',
        body: {
          email: resetEmail,
          new_password: resetPassword
        }
      });
      
      setResetMessage(`Password updated successfully for ${resetEmail}`);
      setResetEmail('');
      setResetPassword('');
    } catch (err: any) {
      setResetMessage(`Error: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Migration</h1>
              <p className="text-gray-600">Migrate existing users from custom JWT to Supabase Auth</p>
            </div>
            <button
              onClick={() => onNavigate('Login')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to Login
            </button>
          </div>
      

        {/* Migration Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Migrate Users</h2>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Important Notes:</h3>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• This will create Supabase Auth accounts for all users without auth_user_id</li>
                  <li>• Temporary passwords will be generated - users must reset them</li>
                  <li>• This operation cannot be undone</li>
                  <li>• Run this only once during the migration process</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleMigration}
            loading={loading}
            className="mb-4"
            disabled={loading}
          >
            {loading ? 'Migrating Users...' : 'Start User Migration'}
          </Button>

          {migrationSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <p className="text-green-800 text-sm">{migrationSuccess}</p>
              </div>
            </div>
          )}

          {migrationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <p className="text-red-800 text-sm">{migrationError}</p>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {migrationStats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{migrationStats.total}</div>
                <div className="text-sm text-blue-800">Total Users</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{migrationStats.success}</div>
                <div className="text-sm text-green-800">Migrated</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{migrationStats.errors}</div>
                <div className="text-sm text-red-800">Errors</div>
              </div>
            </div>
          )}

          {migrationResults.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Migration Results:</h3>
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp Password</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {migrationResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.email}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {result.temp_password ? (
                          <span className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                            {result.temp_password}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {result.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {migrationResults.some(r => r.temp_password) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-sm">
                    <strong>Important:</strong> Copy the temporary passwords above. You'll need them to log in for the first time.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Password Reset Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Key className="w-6 h-6 text-orange-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Reset User Password</h2>
          </div>
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                autoComplete="username"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
                disabled={resetLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                required
                minLength={6}
                disabled={resetLoading}
              />
            </div>
            
            <Button
              type="submit"
              loading={resetLoading}
              variant="secondary"
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          {resetMessage && (
            <div className={`mt-4 p-3 rounded-md ${
              resetMessage.includes('Error') 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              <div className="flex items-start">
                {resetMessage.includes('Error') ? (
                  <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                )}
              <p className="text-sm">{resetMessage}</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserMigration;
