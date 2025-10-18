import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/Button';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import ApiErrorBoundary from '../components/ApiErrorBoundary';
import AppointmentTypeForm from '../components/AppointmentTypeForm';
import ProviderScheduleForm from '../components/ProviderScheduleForm';
import { Building2, Clock, Calendar, DollarSign, ToggleLeft, AlertCircle, CalendarDays, ClipboardCheck, Plus, User, Settings, FileText, Activity, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

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

const ClinicSettings: React.FC = () => {
  const { globals, setGlobal } = useGlobal();
  const { apiCall } = useApi();
  const { showSuccess, showError } = useNotification();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'hours' | 'appointments' | 'billing' | 'features' | 'appointment-types' | 'provider-schedules' | 'compliance'>('hours');
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    feature: string;
    currentValue: boolean;
    pendingValue: boolean;
  }>({
    isOpen: false,
    feature: '',
    currentValue: false,
    pendingValue: false
  });

  // Appointment Types state
  const [showAppointmentTypeModal, setShowAppointmentTypeModal] = useState(false);
  const [editingAppointmentType, setEditingAppointmentType] = useState<any>(null);
  const [deletingAppointmentType, setDeletingAppointmentType] = useState<any>(null);
  const [appointmentTypesRefreshKey, setAppointmentTypesRefreshKey] = useState(0);

  // Provider Schedules state
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Compliance Reporting state
  const [complianceSubTab, setComplianceSubTab] = useState<string>('reports');

  useEffect(() => {
    loadUserRole();
    loadClinicSettings();
  }, []);

  // Handle incoming navigation state to set active tab
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state?.activeTab) {
      setActiveTab(state.activeTab as typeof activeTab);
    }
  }, [location.state]);

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
        const clinicData = response[0];
        console.log('[ClinicSettings] Loaded clinic data:', {
          id: clinicData.id,
          name: clinicData.name,
          aesthetics_module_enabled: clinicData.aesthetics_module_enabled,
          feature_flags: clinicData.feature_flags
        });

        setClinic(clinicData);

        // Sync global state with loaded data
        // Prioritize feature_flags.aesthetics, fallback to aesthetics_module_enabled
        const aestheticsEnabled = clinicData.feature_flags?.aesthetics ?? clinicData.aesthetics_module_enabled ?? false;
        setGlobal('aesthetics_module_enabled', aestheticsEnabled);
        console.log('[ClinicSettings] Updated global aesthetics_module_enabled to:', aestheticsEnabled);
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

      const response = await apiCall<any>(
        url,
        {
          method: 'PUT',
          body: {
            id: clinic.id,
            clinic_settings: clinic.clinic_settings,
            feature_flags: clinic.feature_flags
          }
        }
      );

      const elapsed = Date.now() - startTime;
      console.log('[ClinicSettings] API call succeeded in', elapsed, 'ms');
      console.log('[ClinicSettings] Response clinic data:', response?.clinic);

      showSuccess('Clinic settings updated successfully');

      // Update local state with the response from the server (includes trigger-synced values)
      if (response?.clinic) {
        console.log('[ClinicSettings] Updating local state with server response');
        setClinic(response.clinic);

        // Update global state with the confirmed saved value
        const aestheticsEnabled = response.clinic.feature_flags?.aesthetics ?? response.clinic.aesthetics_module_enabled ?? false;
        setGlobal('aesthetics_module_enabled', aestheticsEnabled);
        console.log('[ClinicSettings] Updated global aesthetics_module_enabled to:', aestheticsEnabled);
      }

      // Reload to ensure we have the latest data from the database
      console.log('[ClinicSettings] Reloading clinic settings to confirm persistence');
      await loadClinicSettings();
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

    // Check if disabling a feature that might have existing data
    const currentValue = clinic.feature_flags[feature as keyof typeof clinic.feature_flags] || false;
    const criticalFeatures = ['aesthetics', 'telemedicine', 'functional_medicine'];

    // If disabling a critical feature, show confirmation dialog
    if (criticalFeatures.includes(feature) && currentValue === true && value === false) {
      setConfirmDialog({
        isOpen: true,
        feature,
        currentValue,
        pendingValue: value
      });
      return;
    }

    // Otherwise, update immediately
    setClinic({
      ...clinic,
      feature_flags: {
        ...clinic.feature_flags,
        [feature]: value
      }
    });
  };

  const handleConfirmFeatureToggle = () => {
    if (!clinic) return;

    setClinic({
      ...clinic,
      feature_flags: {
        ...clinic.feature_flags,
        [confirmDialog.feature]: confirmDialog.pendingValue
      }
    });

    setConfirmDialog({
      isOpen: false,
      feature: '',
      currentValue: false,
      pendingValue: false
    });
  };

  const handleCancelFeatureToggle = () => {
    setConfirmDialog({
      isOpen: false,
      feature: '',
      currentValue: false,
      pendingValue: false
    });
  };

  const getFeatureName = (featureKey: string): string => {
    const featureNames: Record<string, string> = {
      aesthetics: 'Aesthetics',
      telemedicine: 'Telemedicine',
      functional_medicine: 'Functional Medicine',
      patient_portal: 'Patient Portal',
      lab_integration: 'Lab Integration',
      e_prescribing: 'E-Prescribing',
      secure_messaging: 'Secure Messaging',
      document_management: 'Document Management',
      billing_module: 'Billing Module',
      inventory_management: 'Inventory Management'
    };
    return featureNames[featureKey] || featureKey;
  };

  // Load providers when provider-schedules tab is active
  useEffect(() => {
    if (activeTab === 'provider-schedules') {
      loadProviders();
    }
  }, [activeTab]);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
        { method: 'GET' }
      );

      if (response.users) {
        const providerUsers = response.users.filter((u: any) =>
          ['provider', 'clinic_admin', 'admissions_advisor'].includes(u.role)
        );
        setProviders(providerUsers);
      }
    } catch (err) {
      showError('Failed to load providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  // Appointment Types handlers
  const handleAddAppointmentType = () => {
    setEditingAppointmentType(null);
    setShowAppointmentTypeModal(true);
  };

  const handleEditAppointmentType = (type: any) => {
    setEditingAppointmentType(type);
    setShowAppointmentTypeModal(true);
  };

  const handleDeleteAppointmentType = (type: any) => {
    setDeletingAppointmentType(type);
  };

  const handleAppointmentTypeSuccess = () => {
    setShowAppointmentTypeModal(false);
    setEditingAppointmentType(null);
    setAppointmentTypesRefreshKey(prev => prev + 1);
  };

  const handleAppointmentTypeCancel = () => {
    setShowAppointmentTypeModal(false);
    setEditingAppointmentType(null);
  };

  const confirmDeleteAppointmentType = async () => {
    if (!deletingAppointmentType) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_appointment_types?id=${deletingAppointmentType.id}`,
        { method: 'DELETE' }
      );
      setAppointmentTypesRefreshKey(prev => prev + 1);
      showSuccess('Appointment type deleted successfully');
    } catch (err) {
      showError('Failed to delete appointment type');
    } finally {
      setDeletingAppointmentType(null);
    }
  };

  // Provider Schedule handlers
  const handleManageSchedule = (provider: any) => {
    setSelectedProvider(provider);
    setShowScheduleForm(true);
  };

  const handleScheduleSuccess = () => {
    showSuccess('Schedule saved successfully');
    setShowScheduleForm(false);
    setSelectedProvider(null);
  };

  const handleScheduleCancel = () => {
    setShowScheduleForm(false);
    setSelectedProvider(null);
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

  // Render function for Appointment Types tab
  const renderAppointmentTypes = () => {
    const isSystemAdmin = userRole === 'System Admin';

    if (!isSystemAdmin) {
      return (
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                System Admin Access Required
              </h3>
              <p className="text-gray-600">
                Appointment type management is restricted to users with the System Admin role.
                You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Appointment Types</h3>
            <p className="text-sm text-gray-600">Configure appointment types, colors, durations, and approval workflows</p>
          </div>
          <Button onClick={handleAddAppointmentType} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment Type
          </Button>
        </div>

        <ApiErrorBoundary functionName="get_appointment_types" showFunctionHelp={true}>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataTable
              key={appointmentTypesRefreshKey}
              apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_appointment_types`}
              columns={['name', 'color_code', 'default_duration_minutes', 'is_billable', 'requires_approval']}
              customRenderers={{
                color_code: (value: string) => (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: value }} />
                    <span className="text-sm text-gray-600 font-mono">{value}</span>
                  </div>
                ),
                default_duration_minutes: (value: number) => (
                  <span className="text-gray-900">{value} min</span>
                ),
                is_billable: (value: boolean) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {value ? 'Billable' : 'Non-billable'}
                  </span>
                ),
                requires_approval: (value: boolean) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                    {value ? 'Approval Required' : 'No Approval'}
                  </span>
                )
              }}
              showActions={true}
              onEdit={handleEditAppointmentType}
              onDelete={handleDeleteAppointmentType}
              searchable={true}
              searchPlaceholder="Search appointment types..."
            />
          </div>
        </ApiErrorBoundary>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">About Appointment Types</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Define custom appointment types with specific durations and colors</li>
            <li>• Set billable vs non-billable appointments</li>
            <li>• Configure approval requirements for certain appointment types</li>
          </ul>
        </div>
      </div>
    );
  };

  // Render function for Provider Schedules tab
  const renderProviderSchedules = () => (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Provider Schedule Management</h3>
        <p className="text-sm text-gray-600">Configure working hours, breaks, and availability for providers</p>
      </div>

      {loadingProviders ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading providers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{provider.full_name}</h4>
                  <p className="text-sm text-gray-600">{provider.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded">
                    {provider.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Weekly Schedule</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Working Hours & Breaks</span>
                </div>
              </div>

              <Button onClick={() => handleManageSchedule(provider)} className="w-full">
                Manage Schedule
              </Button>
            </div>
          ))}
        </div>
      )}

      {providers.length === 0 && !loadingProviders && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Providers Found</h4>
          <p className="text-gray-600">There are no providers configured in your clinic yet.</p>
        </div>
      )}
    </div>
  );

  // Render function for Compliance tab
  const renderCompliance = () => {
    const isAdmin = userRole === 'System Admin' || userRole === 'Admin';

    if (!isAdmin) {
      return (
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Admin Access Required
              </h3>
              <p className="text-gray-600">
                Compliance reporting is restricted to System Admin and Admin users.
                You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    const complianceTabs = [
      { id: 'reports', label: 'Compliance Reports', icon: FileText },
      { id: 'monitoring', label: 'Compliance Monitoring', icon: Activity },
      { id: 'risks', label: 'Risk Assessments', icon: AlertTriangle },
      { id: 'vulnerabilities', label: 'Vulnerability Scans', icon: ShieldCheck },
      { id: 'controls', label: 'Security Controls', icon: Lock },
    ];

    const renderComplianceContent = () => {
      switch (complianceSubTab) {
        case 'reports':
          return (
            <ApiErrorBoundary functionName="get_compliance_reports" showFunctionHelp={true}>
              <DataTable
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_compliance_reports`}
                columns={['report_name', 'report_type', 'report_date', 'report_status', 'overall_compliance_score']}
                searchable={true}
                searchPlaceholder="Search reports..."
                customRenderers={{
                  report_date: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A',
                  overall_compliance_score: (value: number) => {
                    if (value === null || value === undefined) return 'N/A';
                    const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600';
                    return <span className={`font-semibold ${color}`}>{value.toFixed(1)}%</span>;
                  },
                  report_status: (value: string) => {
                    const statusColors: Record<string, string> = {
                      draft: 'bg-gray-100 text-gray-800',
                      in_review: 'bg-blue-100 text-blue-800',
                      approved: 'bg-green-100 text-green-800',
                      submitted: 'bg-purple-100 text-purple-800',
                    };
                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                        {value?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    );
                  }
                }}
              />
            </ApiErrorBoundary>
          );
        case 'monitoring':
          return (
            <ApiErrorBoundary functionName="get_compliance_monitoring" showFunctionHelp={true}>
              <DataTable
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_compliance_monitoring`}
                columns={['compliance_framework', 'requirement_name', 'compliance_status', 'check_date', 'risk_level']}
                searchable={true}
                customRenderers={{
                  check_date: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A',
                  compliance_status: (value: string) => {
                    const colors: Record<string, string> = {
                      compliant: 'bg-green-100 text-green-800',
                      partially_compliant: 'bg-yellow-100 text-yellow-800',
                      non_compliant: 'bg-red-100 text-red-800',
                    };
                    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value]}`}>{value?.replace(/_/g, ' ').toUpperCase()}</span>;
                  },
                  risk_level: (value: string) => {
                    const colors: Record<string, string> = { low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-red-100 text-red-800' };
                    return value ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value]}`}>{value.toUpperCase()}</span> : 'N/A';
                  }
                }}
              />
            </ApiErrorBoundary>
          );
        case 'risks':
          return (
            <ApiErrorBoundary functionName="get_risk_assessments" showFunctionHelp={true}>
              <DataTable
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_risk_assessments`}
                columns={['assessment_name', 'risk_level', 'status', 'assessment_date']}
                searchable={true}
              />
            </ApiErrorBoundary>
          );
        case 'vulnerabilities':
          return (
            <ApiErrorBoundary functionName="get_vulnerability_scans" showFunctionHelp={true}>
              <DataTable
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_vulnerability_scans`}
                columns={['vulnerability_name', 'severity', 'affected_asset', 'status', 'scan_date']}
                searchable={true}
              />
            </ApiErrorBoundary>
          );
        case 'controls':
          return (
            <ApiErrorBoundary functionName="get_security_controls" showFunctionHelp={true}>
              <DataTable
                apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_security_controls`}
                columns={['control_name', 'control_type', 'implementation_status', 'effectiveness']}
                searchable={true}
              />
            </ApiErrorBoundary>
          );
        default:
          return null;
      }
    };

    return (
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">HIPAA Compliance Reporting</h3>
          <p className="text-sm text-gray-600">Monitor and manage regulatory compliance status</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4 -mb-px">
            {complianceTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setComplianceSubTab(tab.id)}
                  className={`flex items-center py-3 px-3 border-b-2 font-medium text-xs transition-colors ${
                    complianceSubTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {renderComplianceContent()}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      
    );
  }

  if (userRole !== 'System Admin' && userRole !== 'Clinic Admin') {
    return (
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
      
    );
  }

  if (!clinic) {
    return (
      
        
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No clinic found.</p>
        </div>
      
    );
  }

  return (
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
              <button
                onClick={() => setActiveTab('appointment-types')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'appointment-types'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Appointment Types
              </button>
              <button
                onClick={() => setActiveTab('provider-schedules')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'provider-schedules'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Provider Schedules
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'compliance'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 inline mr-2" />
                Compliance
              </button>
            </nav>
          </div>

          <div className={activeTab === 'appointment-types' || activeTab === 'provider-schedules' || activeTab === 'compliance' ? '' : 'p-6'}>
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

            {activeTab === 'appointment-types' && renderAppointmentTypes()}

            {activeTab === 'provider-schedules' && renderProviderSchedules()}

            {activeTab === 'compliance' && renderCompliance()}

            {(activeTab === 'hours' || activeTab === 'appointments' || activeTab === 'billing' || activeTab === 'features') && (
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
            )}
          </div>
        </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelFeatureToggle}
        onConfirm={handleConfirmFeatureToggle}
        title="Disable Feature"
        message={`Are you sure you want to disable ${getFeatureName(confirmDialog.feature)}? This feature may have existing data or active usage. Disabling it will hide related functionality from the interface but will not delete any existing data.`}
        confirmText="Disable Feature"
        cancelText="Cancel"
        type="warning"
      />

      <Modal
        isOpen={showAppointmentTypeModal}
        onClose={handleAppointmentTypeCancel}
        title={editingAppointmentType ? 'Edit Appointment Type' : 'Add New Appointment Type'}
      >
        <AppointmentTypeForm
          appointmentType={editingAppointmentType}
          onSuccess={handleAppointmentTypeSuccess}
          onCancel={handleAppointmentTypeCancel}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingAppointmentType}
        onClose={() => setDeletingAppointmentType(null)}
        onConfirm={confirmDeleteAppointmentType}
        title="Delete Appointment Type"
        message={`Are you sure you want to delete "${deletingAppointmentType?.name}"? This action cannot be undone and may affect existing appointments using this type.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Modal
        isOpen={showScheduleForm}
        onClose={handleScheduleCancel}
        title={`Manage Schedule - ${selectedProvider?.full_name}`}
        size="xl"
      >
        {selectedProvider && (
          <ProviderScheduleForm
            providerId={selectedProvider.id}
            onSuccess={handleScheduleSuccess}
            onCancel={handleScheduleCancel}
          />
        )}
      </Modal>
    </div>
  );
};

export default ClinicSettings;
