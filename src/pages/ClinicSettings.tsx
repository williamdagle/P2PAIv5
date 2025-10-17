import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { Building2, Clock, Calendar, DollarSign, ToggleLeft, AlertCircle } from 'lucide-react';

interface ClinicSettingsProps {
  onNavigate: (page: string) => void;
}

interface ClinicData {
  id: string;
  name: string;
  clinic_settings: {
    business_hours?: Record<string, any>;
    holidays?: string[];
    timezone?: string;
    fee_schedule?: {
      currency?: string;
      tax_rate?: number;
    };
    appointment_settings?: {
      require_insurance_verification?: boolean;
      allow_online_booking?: boolean;
      auto_confirm_appointments?: boolean;
    };
    notification_preferences?: {
      appointment_reminders?: boolean;
      reminder_hours_before?: number;
      send_confirmations?: boolean;
    };
    billing_settings?: {
      default_payment_terms?: string;
      accept_credit_cards?: boolean;
      accept_insurance?: boolean;
    };
  };
  feature_flags: {
    patient_portal?: boolean;
    telemedicine?: boolean;
    lab_integration?: boolean;
    e_prescribing?: boolean;
    secure_messaging?: boolean;
    document_management?: boolean;
    billing_module?: boolean;
    functional_medicine?: boolean;
    aesthetics?: boolean;
    inventory_management?: boolean;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const ClinicSettings: React.FC<ClinicSettingsProps> = ({ onNavigate }) => {
  const { globals, setGlobal } = useGlobal();
  const { apiCall } = useApi();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'hours' | 'appointments' | 'billing' | 'features'>('hours');
  const [clinic, setClinic] = useState<ClinicData | null>(null);

  useEffect(() => {
    loadUserRole();
    loadClinicSettings();
  }, []);

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

  const loadClinicSettings = async () => {
    setLoading(true);
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_clinics?id=${globals.clinic_id}`,
        { method: 'GET' }
      );
      if (response && response.length > 0) {
        setClinic(response[0]);
      }
    } catch (err) {
      showError('Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic) return;

    console.log('[ClinicSettings] handleSave started');
    console.log('[ClinicSettings] Clinic data:', {
      id: clinic.id,
      name: clinic.name,
      clinic_settings: clinic.clinic_settings,
      feature_flags: clinic.feature_flags
    });

    setSaving(true);
    const startTime = Date.now();

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_clinics`;
      console.log('[ClinicSettings] Making API call to:', url);

      const response = await apiCall(
        url,
        {
          method: 'PUT',
          body: {
            id: clinic.id,
            clinic_settings: clinic.clinic_settings,
            feature_flags: clinic.feature_flags,
            aesthetics_module_enabled: clinic.feature_flags?.aesthetics || false
          }
        }
      );

      const elapsed = Date.now() - startTime;
      console.log('[ClinicSettings] API call succeeded in', elapsed, 'ms');
      console.log('[ClinicSettings] Response:', response);

      showSuccess('Clinic settings updated successfully');
      console.log('[ClinicSettings] Success notification shown');

      // Update global state to reflect aesthetics module changes
      if (clinic.feature_flags?.aesthetics !== undefined) {
        setGlobal('aesthetics_module_enabled', clinic.feature_flags.aesthetics);
        console.log('[ClinicSettings] Updated aesthetics_module_enabled to:', clinic.feature_flags.aesthetics);
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      console.error('[ClinicSettings] API call failed after', elapsed, 'ms');
      console.error('[ClinicSettings] Error:', err);
      showError('Failed to save clinic settings', err?.message || 'Unknown error');
    } finally {
      setSaving(false);
      console.log('[ClinicSettings] handleSave completed');
    }
  };

  const updateClinicSetting = (path: string, value: any) => {
    if (!clinic) return;

    const keys = path.split('.');
    const updated = { ...clinic };
    let current: any = updated.clinic_settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setClinic(updated);
  };

  const updateFeatureFlag = (feature: string, value: boolean) => {
    if (!clinic) return;
    setClinic({
      ...clinic,
      feature_flags: {
        ...clinic.feature_flags,
        [feature]: value
      }
    });
  };

  const updateBusinessHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (!clinic) return;

    const businessHours = clinic.clinic_settings.business_hours || {};
    const dayHours = businessHours[day] || { open: '09:00', close: '17:00', closed: false };

    setClinic({
      ...clinic,
      clinic_settings: {
        ...clinic.clinic_settings,
        business_hours: {
          ...businessHours,
          [day]: {
            ...dayHours,
            [field]: value
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <Sidebar currentPage="ClinicSettings" onPageChange={onNavigate} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  if (userRole !== 'System Admin' && userRole !== 'Clinic Admin') {
    return (
      <Layout>
        <Sidebar currentPage="ClinicSettings" onPageChange={onNavigate} />
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Settings</h1>
            <p className="text-gray-600">Configure clinic-specific preferences</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Admin Access Required
                </h3>
                <p className="text-gray-600">
                  Clinic settings management requires System Admin or Clinic Admin role.
                  You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
        <Sidebar currentPage="ClinicSettings" onPageChange={onNavigate} />
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No clinic found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Sidebar currentPage="ClinicSettings" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Settings</h1>
          <p className="text-gray-600">{clinic.name} - Configure clinic-specific preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('hours')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hours'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Business Hours
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'billing'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Billing
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'features'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ToggleLeft className="w-4 h-4 inline mr-2" />
                Features
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'hours' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Business Hours</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Timezone">
                    <select
                      value={clinic.clinic_settings.timezone || 'America/New_York'}
                      onChange={(e) => updateClinicSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Phoenix">Arizona (MST)</option>
                      <option value="America/Anchorage">Alaska Time (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                    </select>
                  </FormField>
                </div>

                <div className="space-y-3">
                  {DAYS.map((day) => {
                    const hours = clinic.clinic_settings.business_hours?.[day] || { open: '09:00', close: '17:00', closed: false };
                    return (
                      <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-28 font-medium text-gray-900">{DAY_LABELS[day]}</div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hours.closed}
                            onChange={(e) => updateBusinessHour(day, 'closed', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Closed</span>
                        </label>
                        {!hours.closed && (
                          <>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateBusinessHour(day, 'open', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateBusinessHour(day, 'close', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Settings</h3>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={clinic.clinic_settings.appointment_settings?.require_insurance_verification || false}
                      onChange={(e) => updateClinicSetting('appointment_settings.require_insurance_verification', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Require Insurance Verification</span>
                      <p className="text-xs text-gray-500">Verify insurance before confirming appointments</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={clinic.clinic_settings.appointment_settings?.allow_online_booking || false}
                      onChange={(e) => updateClinicSetting('appointment_settings.allow_online_booking', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Allow Online Booking</span>
                      <p className="text-xs text-gray-500">Let patients book appointments online</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={clinic.clinic_settings.appointment_settings?.auto_confirm_appointments || false}
                      onChange={(e) => updateClinicSetting('appointment_settings.auto_confirm_appointments', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Auto-Confirm Appointments</span>
                      <p className="text-xs text-gray-500">Automatically confirm new appointments</p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Send Appointment Reminders">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clinic.clinic_settings.notification_preferences?.appointment_reminders ?? true}
                          onChange={(e) => updateClinicSetting('notification_preferences.appointment_reminders', e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Enable reminders</span>
                      </label>
                    </FormField>

                    <FormField label="Reminder Hours Before">
                      <input
                        type="number"
                        value={clinic.clinic_settings.notification_preferences?.reminder_hours_before || 24}
                        onChange={(e) => updateClinicSetting('notification_preferences.reminder_hours_before', parseInt(e.target.value) || 24)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        max="168"
                      />
                    </FormField>

                    <FormField label="Send Confirmations">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clinic.clinic_settings.notification_preferences?.send_confirmations ?? true}
                          onChange={(e) => updateClinicSetting('notification_preferences.send_confirmations', e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Auto-send confirmations</span>
                      </label>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Billing Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Currency">
                    <select
                      value={clinic.clinic_settings.fee_schedule?.currency || 'USD'}
                      onChange={(e) => updateClinicSetting('fee_schedule.currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </FormField>

                  <FormField label="Tax Rate (%)">
                    <input
                      type="number"
                      value={clinic.clinic_settings.fee_schedule?.tax_rate || 0}
                      onChange={(e) => updateClinicSetting('fee_schedule.tax_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </FormField>

                  <FormField label="Default Payment Terms">
                    <select
                      value={clinic.clinic_settings.billing_settings?.default_payment_terms || 'due_on_service'}
                      onChange={(e) => updateClinicSetting('billing_settings.default_payment_terms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="due_on_service">Due on Service</option>
                      <option value="net_15">Net 15 Days</option>
                      <option value="net_30">Net 30 Days</option>
                      <option value="net_60">Net 60 Days</option>
                    </select>
                  </FormField>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Payment Methods</h4>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clinic.clinic_settings.billing_settings?.accept_credit_cards ?? true}
                      onChange={(e) => updateClinicSetting('billing_settings.accept_credit_cards', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Accept Credit Cards</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clinic.clinic_settings.billing_settings?.accept_insurance ?? true}
                      onChange={(e) => updateClinicSetting('billing_settings.accept_insurance', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Accept Insurance</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Feature Toggles</h3>
                <p className="text-sm text-gray-600">Enable or disable specific features for this clinic</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries({
                    patient_portal: { label: 'Patient Portal', description: 'Patient self-service portal' },
                    telemedicine: { label: 'Telemedicine', description: 'Video consultations' },
                    lab_integration: { label: 'Lab Integration', description: 'External lab connections' },
                    e_prescribing: { label: 'E-Prescribing', description: 'Electronic prescriptions' },
                    secure_messaging: { label: 'Secure Messaging', description: 'HIPAA-compliant messaging' },
                    document_management: { label: 'Document Management', description: 'Document storage and sharing' },
                    billing_module: { label: 'Billing Module', description: 'Billing and payments' },
                    functional_medicine: { label: 'Functional Medicine', description: 'Functional medicine tools' },
                    aesthetics: { label: 'Aesthetics', description: 'Aesthetics module' },
                    inventory_management: { label: 'Inventory Management', description: 'Product inventory tracking' }
                  }).map(([key, { label, description }]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={clinic.feature_flags[key as keyof typeof clinic.feature_flags] || false}
                        onChange={(e) => updateFeatureFlag(key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={loadClinicSettings}
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

export default ClinicSettings;
