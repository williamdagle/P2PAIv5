import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface ClinicFormProps {
  clinic?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ClinicForm: React.FC<ClinicFormProps> = ({ clinic, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    clinic_type: '',
    clinic_code: '',
    organization_id: ''
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_organizations`,
          { method: 'GET' }
        );
        if (response?.organizations) {
          setOrganizations(response.organizations);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        clinic_type: clinic.clinic_type || '',
        clinic_code: clinic.clinic_code || '',
        organization_id: clinic.organization_id || ''
      });
    }
  }, [clinic]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Clinic name is required';
    }

    if (!formData.clinic_type) {
      newErrors.clinic_type = 'Clinic type is required';
    }

    if (!formData.organization_id) {
      newErrors.organization_id = 'Organization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (clinic) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_clinics`,
          {
            method: 'PUT',
            body: {
              id: clinic.id,
              ...formData
            }
          }
        );
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_clinics`,
          {
            method: 'POST',
            body: formData
          }
        );
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save clinic:', err);
    }
  };

  const clinicTypes = [
    'Functional Medicine',
    'Med-Spa',
    'Aesthetics',
    'Wellness Center',
    'Anti-Aging',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Clinic Name" error={errors.name} required>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Clinic Type <span className="text-red-500">*</span>
        </label>
        <select
          name="clinic_type"
          value={formData.clinic_type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a type...</option>
          {clinicTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.clinic_type && (
          <p className="mt-1 text-sm text-red-600">{errors.clinic_type}</p>
        )}
      </div>

      <FormField label="Clinic Code" error={errors.clinic_code}>
        <input
          type="text"
          name="clinic_code"
          value={formData.clinic_code}
          onChange={handleChange}
          placeholder="e.g., FUNC-001"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization <span className="text-red-500">*</span>
        </label>
        <select
          name="organization_id"
          value={formData.organization_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!!clinic}
        >
          <option value="">Select an organization...</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        {errors.organization_id && (
          <p className="mt-1 text-sm text-red-600">{errors.organization_id}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : clinic ? 'Update Clinic' : 'Create Clinic'}
        </Button>
      </div>
    </form>
  );
};

export default ClinicForm;
