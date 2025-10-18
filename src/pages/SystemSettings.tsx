import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { Settings, Clock, Shield, Bell, Database, Activity, AlertCircle, Share2 } from 'lucide-react';

interface SystemSettingsProps {
  onNavigate: (page: string) => void;
}

interface SystemSettingsData {
  id: string;
  default_appointment_duration_minutes: number;
  appointment_buffer_minutes: number;
  max_advance_booking_days: number;
  allow_double_booking: boolean;
  default_business_hours: Record<string, any>;
  session_timeout_minutes: number;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  max_login_attempts: number;
  account_lockout_minutes: number;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  notification_email_from: string;
  appointment_reminder_hours_before: number;
  send_appointment_confirmations: boolean;
  audit_log_retention_days: number;
  patient_record_retention_years: number;
  enable_patient_portal: boolean;
  enable_telemedicine: boolean;
  enable_lab_integrations: boolean;
  enable_billing_module: boolean;
  default_lab_result_critical_notification: boolean;
  lab_result_auto_notify_provider: boolean;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'security' | 'notifications' | 'data' | 'features'>('appointments');
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgRefreshKey, setOrgRefreshKey] = useState(0);

  useEffect(() => {
    loadUserRole();
    loadSettings();
    loadOrganizations();
  }, [orgRefreshKey]);

  const loadUserRole = async () => {
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_current_user`,
        { method: 'GET' }
      );
      if (response?.role_name) {
        setUserRole(response.role_name);
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_system_settings`,
        { method: 'GET' }
      );
      if (response) {
        setSettings(response);
      }
    } catch (err) {
      showError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await apiCall<any[]>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_organizations`,
        { method: 'GET' }
      );
      if (response) {
        setOrganizations(response);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const handleToggleOrgSharing = async (orgId: string, currentValue: boolean) => {
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_organizations`,
        {
          method: 'PUT',
          body: {
            id: orgId,
            enable_data_sharing: !currentValue
          }
        }
      );
      setOrgRefreshKey(prev => prev + 1);
      showSuccess('Organization data sharing updated');
    } catch (err) {
      showError('Failed to update organization sharing setting');
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_system_settings`,
        {
          method: 'PUT',
          body: settings
        }
      );
      showSuccess('System settings updated successfully');
    } catch (err) {
      showError('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettingsData, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value
    });
  };

  if (loading) {
    return (
      <Layout>
        <Sidebar currentPage="SystemSettings" onPageChange={onNavigate} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  if (userRole !== 'System Admin') {
    return (
      <Layout>
        <Sidebar currentPage="SystemSettings" onPageChange={onNavigate} />
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Configure system-wide defaults and preferences</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  System Admin Access Required
                </h3>
                <p className="text-gray-600">
                  System settings management is restricted to users with the System Admin role.
                  You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
                </p>
                <p className="text-gray-600 mt-2">
                  Please contact your system administrator if you need access to system settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <Sidebar currentPage="SystemSettings" onPageChange={onNavigate} />
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No settings found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Sidebar currentPage="SystemSettings" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure system-wide defaults and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'data'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Data Retention
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'features'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Features
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Defaults</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Default Appointment Duration (minutes)">
                    <input
                      type="number"
                      value={settings.default_appointment_duration_minutes}
                      onChange={(e) => updateSetting('default_appointment_duration_minutes', parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="5"
                      max="480"
                    />
                  </FormField>

                  <FormField label="Appointment Buffer (minutes)">
                    <input
                      type="number"
                      value={settings.appointment_buffer_minutes}
                      onChange={(e) => updateSetting('appointment_buffer_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      max="60"
                    />
                  </FormField>

                  <FormField label="Max Advance Booking (days)">
                    <input
                      type="number"
                      value={settings.max_advance_booking_days}
                      onChange={(e) => updateSetting('max_advance_booking_days', parseInt(e.target.value) || 90)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="365"
                    />
                  </FormField>

                  <FormField label="Allow Double Booking">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allow_double_booking}
                        onChange={(e) => updateSetting('allow_double_booking', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Enable double booking</span>
                    </label>
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Session Timeout (minutes)">
                    <input
                      type="number"
                      value={settings.session_timeout_minutes}
                      onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value) || 480)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="15"
                      max="1440"
                    />
                  </FormField>

                  <FormField label="Password Min Length">
                    <input
                      type="number"
                      value={settings.password_min_length}
                      onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value) || 8)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="8"
                      max="32"
                    />
                  </FormField>

                  <FormField label="Max Login Attempts">
                    <input
                      type="number"
                      value={settings.max_login_attempts}
                      onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="3"
                      max="10"
                    />
                  </FormField>

                  <FormField label="Account Lockout (minutes)">
                    <input
                      type="number"
                      value={settings.account_lockout_minutes}
                      onChange={(e) => updateSetting('account_lockout_minutes', parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="5"
                      max="120"
                    />
                  </FormField>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Password Requirements</h4>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.password_require_uppercase}
                      onChange={(e) => updateSetting('password_require_uppercase', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Require uppercase letters</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.password_require_lowercase}
                      onChange={(e) => updateSetting('password_require_lowercase', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Require lowercase letters</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.password_require_numbers}
                      onChange={(e) => updateSetting('password_require_numbers', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Require numbers</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.password_require_special_chars}
                      onChange={(e) => updateSetting('password_require_special_chars', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Require special characters</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Enable Email Notifications">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enable_email_notifications}
                        onChange={(e) => updateSetting('enable_email_notifications', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Enable email notifications</span>
                    </label>
                  </FormField>

                  <FormField label="Enable SMS Notifications">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enable_sms_notifications}
                        onChange={(e) => updateSetting('enable_sms_notifications', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Enable SMS notifications</span>
                    </label>
                  </FormField>

                  <FormField label="Notification From Email">
                    <input
                      type="email"
                      value={settings.notification_email_from}
                      onChange={(e) => updateSetting('notification_email_from', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </FormField>

                  <FormField label="Appointment Reminder (hours before)">
                    <input
                      type="number"
                      value={settings.appointment_reminder_hours_before}
                      onChange={(e) => updateSetting('appointment_reminder_hours_before', parseInt(e.target.value) || 24)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="168"
                    />
                  </FormField>

                  <FormField label="Send Appointment Confirmations">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.send_appointment_confirmations}
                        onChange={(e) => updateSetting('send_appointment_confirmations', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Auto-send confirmations</span>
                    </label>
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Data Retention Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Audit Log Retention (days)">
                    <input
                      type="number"
                      value={settings.audit_log_retention_days}
                      onChange={(e) => updateSetting('audit_log_retention_days', parseInt(e.target.value) || 2555)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="365"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 365 days (1 year) for compliance</p>
                  </FormField>

                  <FormField label="Patient Record Retention (years)">
                    <input
                      type="number"
                      value={settings.patient_record_retention_years}
                      onChange={(e) => updateSetting('patient_record_retention_years', parseInt(e.target.value) || 7)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="7"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 7 years for HIPAA compliance</p>
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">System-Wide Feature Toggles</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.enable_patient_portal}
                      onChange={(e) => updateSetting('enable_patient_portal', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Patient Portal</span>
                      <p className="text-xs text-gray-500">Enable patient self-service portal</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.enable_telemedicine}
                      onChange={(e) => updateSetting('enable_telemedicine', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Telemedicine</span>
                      <p className="text-xs text-gray-500">Enable video consultations</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.enable_lab_integrations}
                      onChange={(e) => updateSetting('enable_lab_integrations', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Lab Integrations</span>
                      <p className="text-xs text-gray-500">Enable external lab connections</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.enable_billing_module}
                      onChange={(e) => updateSetting('enable_billing_module', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Billing Module</span>
                      <p className="text-xs text-gray-500">Enable billing and payments</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.default_lab_result_critical_notification}
                      onChange={(e) => updateSetting('default_lab_result_critical_notification', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Critical Lab Notifications</span>
                      <p className="text-xs text-gray-500">Auto-notify on critical results</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.lab_result_auto_notify_provider}
                      onChange={(e) => updateSetting('lab_result_auto_notify_provider', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Auto-Notify Providers</span>
                      <p className="text-xs text-gray-500">Notify providers of new results</p>
                    </div>
                  </label>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center mb-4">
                    <Share2 className="w-5 h-5 text-purple-600 mr-2" />
                    <h4 className="text-md font-semibold text-gray-900">Organization Data Sharing</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Enable data sharing across clinics within the same organization. When enabled, authorized users can access patient data from any clinic in the organization.
                  </p>

                  {organizations.length > 0 ? (
                    <div className="space-y-3">
                      {organizations.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs text-gray-500">Org ID: {org.org_id}</p>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={org.enable_data_sharing || false}
                              onChange={() => handleToggleOrgSharing(org.id, org.enable_data_sharing)}
                              className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {org.enable_data_sharing ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No organizations configured</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={loadSettings}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;
