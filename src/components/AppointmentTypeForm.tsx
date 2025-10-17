import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Button from './Button';
import FormField from './FormField';

interface AppointmentTypeFormProps {
  appointmentType?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const AppointmentTypeForm: React.FC<AppointmentTypeFormProps> = ({
  appointmentType,
  onSuccess,
  onCancel
}) => {
  const { apiCall } = useApi();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color_code: '#3B82F6',
    default_duration_minutes: 60,
    is_billable: true,
    requires_approval: false,
    max_free_sessions: 0,
    approval_roles: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableRoles = [
    { value: 'system_admin', label: 'System Admin' },
    { value: 'clinic_admin', label: 'Clinic Admin' },
    { value: 'provider', label: 'Provider' },
    { value: 'admissions_advisor', label: 'Admissions Advisor' }
  ];

  useEffect(() => {
    if (appointmentType) {
      setFormData({
        name: appointmentType.name || '',
        description: appointmentType.description || '',
        color_code: appointmentType.color_code || '#3B82F6',
        default_duration_minutes: appointmentType.default_duration_minutes || 60,
        is_billable: appointmentType.is_billable ?? true,
        requires_approval: appointmentType.requires_approval ?? false,
        max_free_sessions: appointmentType.max_free_sessions || 0,
        approval_roles: appointmentType.approval_role_names || appointmentType.approval_roles || []
      });
    }
  }, [appointmentType]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.default_duration_minutes < 5 || formData.default_duration_minutes > 480) {
      newErrors.default_duration_minutes = 'Duration must be between 5 and 480 minutes';
    }

    if (formData.max_free_sessions < 0 || formData.max_free_sessions > 100) {
      newErrors.max_free_sessions = 'Max free sessions must be between 0 and 100';
    }

    if (formData.requires_approval && formData.approval_roles.length === 0) {
      newErrors.approval_roles = 'At least one approval role is required when approval is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);

    try {
      const endpoint = appointmentType
        ? 'update_appointment_types'
        : 'create_appointment_types';

      const payload = appointmentType
        ? { id: appointmentType.id, ...formData }
        : formData;

      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: appointmentType ? 'PUT' : 'POST',
          body: payload
        }
      );

      showNotification(
        `Appointment type ${appointmentType ? 'updated' : 'created'} successfully`,
        'success'
      );
      onSuccess();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to save appointment type',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      approval_roles: prev.approval_roles.includes(role)
        ? prev.approval_roles.filter(r => r !== role)
        : [...prev.approval_roles, role]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="Name" required error={errors.name}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Initial Consultation"
        />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Describe this appointment type..."
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Color" required error={errors.color_code}>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={formData.color_code}
              onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.color_code}
              onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
          </div>
        </FormField>

        <FormField label="Default Duration (minutes)" required error={errors.default_duration_minutes}>
          <input
            type="number"
            value={formData.default_duration_minutes}
            onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="5"
            max="480"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Billable">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_billable}
              onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">This appointment type is billable</span>
          </label>
        </FormField>

        <FormField label="Max Free Sessions" error={errors.max_free_sessions}>
          <input
            type="number"
            value={formData.max_free_sessions}
            onChange={(e) => setFormData({ ...formData, max_free_sessions: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
          />
        </FormField>
      </div>

      <FormField label="Requires Approval">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requires_approval}
            onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Appointments of this type require manager approval</span>
        </label>
      </FormField>

      {formData.requires_approval && (
        <FormField label="Approval Roles" required error={errors.approval_roles}>
          <div className="space-y-2">
            {availableRoles.map(role => (
              <label key={role.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.approval_roles.includes(role.value)}
                  onChange={() => handleRoleToggle(role.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{role.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Users with these roles will be able to approve appointments of this type
          </p>
        </FormField>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
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
          disabled={loading}
        >
          {loading ? 'Saving...' : appointmentType ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentTypeForm;
