import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';
import ConfirmDialog from './ConfirmDialog';
import SmartSchedulingAssistant from './SmartSchedulingAssistant';
import { Sparkles } from 'lucide-react';

interface AppointmentFormProps {
  appointment?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const formatDateTimeForInput = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_type_id: '',
    duration_minutes: '30',
    reason: '',
    status: 'scheduled',
    provider_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userLoading, setUserLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(true);
  const [showPastDateConfirm, setShowPastDateConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  // Get current user's internal ID
  useEffect(() => {
    // Prevent infinite loop - only run once per user_id change
    if (currentUserId || !globals.user_id) {
      return;
    }
    
    const getCurrentUser = async () => {
      setUserLoading(true);
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );
        
        if (response.users) {
          const currentUser = response.users.find((user: any) => {
            return user.auth_user_id === globals.user_id;
          });
          
          if (currentUser) {
            setCurrentUserId(currentUser.id);
          } else {
            setErrors({ submit: 'Unable to find your user profile. Please contact support.' });
          }
        } else {
          setErrors({ submit: 'Unable to load user data. Please try again.' });
        }
      } catch (err) {
        setErrors({ submit: 'Unable to load user data. Please refresh and try again.' });
      } finally {
        setUserLoading(false);
      }
    };

    // Always call getCurrentUser when we need to fetch the user
      getCurrentUser();
  }, [globals.user_id, currentUserId]);

  // Load providers
  useEffect(() => {
    const loadProviders = async () => {
      setProvidersLoading(true);
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );

        if (response.users) {
          setProviders(response.users);
        }
      } catch (err) {
        console.error('Failed to load providers:', err);
      } finally {
        setProvidersLoading(false);
      }
    };

    loadProviders();
  }, []);

  // Load appointment types
  useEffect(() => {
    const loadAppointmentTypes = async () => {
      setAppointmentTypesLoading(true);
      try {
        const response = await apiCall<any[]>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_appointment_types`,
          { method: 'GET' }
        );

        if (response && Array.isArray(response)) {
          setAppointmentTypes(response);
        }
      } catch (err) {
        console.error('Failed to load appointment types:', err);
      } finally {
        setAppointmentTypesLoading(false);
      }
    };

    loadAppointmentTypes();
  }, []);

  useEffect(() => {
    if (appointment) {
      console.log('🔍 AppointmentForm - Loading appointment data:', {
        appointment_id: appointment.id,
        provider_id: appointment.provider_id,
        appointment_type_id: appointment.appointment_type_id,
        appointment_date: appointment.appointment_date,
        full_appointment: appointment
      });

      // Extract IDs properly - handle both nested objects and direct IDs
      // First check if provider_id exists at root level (most common)
      let providerId = appointment.provider_id;

      // If it's an object (from joined query), extract the id
      if (typeof providerId === 'object' && providerId !== null) {
        providerId = providerId.id;
      }

      // Handle appointment_type_id similarly
      let appointmentTypeId = appointment.appointment_type_id;

      if (typeof appointmentTypeId === 'object' && appointmentTypeId !== null) {
        appointmentTypeId = appointmentTypeId.id;
      }

      console.log('🔍 AppointmentForm - Extracted IDs:', {
        provider_id: providerId,
        appointment_type_id: appointmentTypeId,
        provider_id_type: typeof appointment.provider_id,
        appointment_type_id_type: typeof appointment.appointment_type_id
      });

      setFormData({
        appointment_date: appointment.appointment_date ?
          formatDateTimeForInput(appointment.appointment_date) : '',
        appointment_type_id: appointmentTypeId || '',
        duration_minutes: appointment.duration_minutes?.toString() || '30',
        reason: appointment.reason || '',
        status: appointment.status || 'scheduled',
        provider_id: providerId || ''
      });

      console.log('✅ AppointmentForm - Form data set:', {
        provider_id: providerId,
        appointment_type_id: appointmentTypeId
      });
    } else if (currentUserId && !formData.provider_id) {
      // Default to current user for new appointments
      setFormData(prev => ({ ...prev, provider_id: currentUserId }));
    }
  }, [appointment, currentUserId]);

  // Auto-populate duration when appointment type is selected
  useEffect(() => {
    if (formData.appointment_type_id && !appointment) {
      const selectedType = appointmentTypes.find(type => type.id === formData.appointment_type_id);
      if (selectedType && selectedType.default_duration_minutes) {
        setFormData(prev => ({
          ...prev,
          duration_minutes: selectedType.default_duration_minutes.toString()
        }));
      }
    }
  }, [formData.appointment_type_id, appointmentTypes, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.appointment_date) newErrors.appointment_date = 'Appointment date is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    if (!formData.provider_id) newErrors.provider_id = 'Provider is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check if appointment date is in the past
    const appointmentDate = new Date(formData.appointment_date);
    const now = new Date();

    if (appointmentDate < now && !pendingSubmit) {
      // Show confirmation dialog for past dates
      setShowPastDateConfirm(true);
      return;
    }

    // Proceed with submission
    await performSubmit();
  };

  const performSubmit = async () => {
    setPendingSubmit(false);
    setShowPastDateConfirm(false);

    try {
      // Convert empty string to null for optional fields
      const appointmentData = {
        ...formData,
        patient_id: globals.selected_patient_id,
        duration_minutes: parseInt(formData.duration_minutes),
        appointment_type_id: formData.appointment_type_id || null
      };

      console.log('📤 AppointmentForm - Submitting appointment data:', appointmentData);

      if (appointment) {
        // Update existing appointment - include ID in the body
        console.log('🔄 Updating appointment:', appointment.id);
        const result = await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_appointments`,
          {
            method: 'PUT',
            body: {
              ...appointmentData,
              id: appointment.id
            }
          }
        );
        console.log('✅ Update response:', result);
      } else {
        // Create new appointment
        console.log('➕ Creating new appointment');
        const result = await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_appointments`,
          {
            method: 'POST',
            body: appointmentData
          }
        );
        console.log('✅ Create response:', result);
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save appointment. Please try again.' });
    }
  };

  const handlePastDateConfirm = () => {
    setPendingSubmit(true);
    performSubmit();
  };

  const handlePastDateCancel = () => {
    setShowPastDateConfirm(false);
    setPendingSubmit(false);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSmartSlotSelection = (startTime: string, endTime: string) => {
    const formattedStartTime = formatDateTimeForInput(startTime);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    setFormData(prev => ({
      ...prev,
      appointment_date: formattedStartTime,
      duration_minutes: durationMinutes.toString()
    }));

    setShowSmartAssistant(false);

    if (errors.appointment_date) {
      setErrors(prev => ({ ...prev, appointment_date: '' }));
    }
  };

  // Show loading state while fetching user
  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading user information...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!appointment && formData.provider_id && (
        <div className="mb-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSmartAssistant(!showSmartAssistant)}
            className="w-full flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {showSmartAssistant ? 'Hide' : 'Show'} AI Scheduling Assistant
          </Button>
        </div>
      )}

      {!appointment && showSmartAssistant && formData.provider_id && (
        <SmartSchedulingAssistant
          providerId={formData.provider_id}
          appointmentTypeId={formData.appointment_type_id || undefined}
          patientId={globals.selected_patient_id}
          onSelectSlot={handleSmartSlotSelection}
          isOpen={showSmartAssistant}
        />
      )}

      <FormField label="Appointment Date & Time" error={errors.appointment_date} required>
        <input
          type="datetime-local"
          value={formData.appointment_date}
          onChange={(e) => handleChange('appointment_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Appointment Type" error={errors.appointment_type_id}>
        <select
          value={formData.appointment_type_id}
          onChange={(e) => handleChange('appointment_type_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={appointmentTypesLoading}
        >
          <option value="">Select appointment type (optional)</option>
          {appointmentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.default_duration_minutes} min)
            </option>
          ))}
        </select>
        {formData.appointment_type_id && (
          <p className="mt-1 text-sm text-gray-500">
            {appointmentTypes.find(t => t.id === formData.appointment_type_id)?.description}
          </p>
        )}
      </FormField>

      <FormField label="Provider" error={errors.provider_id} required>
        <select
          value={formData.provider_id}
          onChange={(e) => handleChange('provider_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={providersLoading}
        >
          <option value="">Select a provider</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.full_name} ({provider.roles?.name || 'No Role'})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Duration (minutes)" error={errors.duration_minutes}>
        <select
          value={formData.duration_minutes}
          onChange={(e) => handleChange('duration_minutes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
        </select>
      </FormField>

      <FormField label="Reason for Visit" error={errors.reason} required>
        <textarea
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter the reason for this appointment"
        />
      </FormField>

      <FormField label="Status" error={errors.status}>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FormField>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {appointment ? 'Update Appointment' : 'Schedule Appointment'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showPastDateConfirm}
        onClose={handlePastDateCancel}
        onConfirm={handlePastDateConfirm}
        title="Past Date Selected"
        message="You have selected a date in the past. Do you want to create this appointment for a past date? This is typically used for entering historical records."
        confirmText="Yes, Create Appointment"
        cancelText="No, Change Date"
        type="warning"
      />
    </form>
  );
};

export default AppointmentForm;