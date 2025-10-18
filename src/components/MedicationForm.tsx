import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import { Medication } from '../types';
import Button from './Button';
import FormField from './FormField';

interface MedicationFormProps {
  medication?: Medication;
  onSuccess: () => void;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({
  medication,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userLoading, setUserLoading] = useState(true);
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  // Get current user's internal ID
  useEffect(() => {
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
          const currentUser = response.users.find((user: any) => 
            user.auth_user_id === globals.user_id
          );
          
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

    getCurrentUser();
  }, [globals.user_id, currentUserId, apiCall]);

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        frequency: medication.frequency || '',
        start_date: medication.start_date || '',
        end_date: medication.end_date || ''
      });
    }
  }, [medication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Medication name is required';
    if (!currentUserId) newErrors.submit = 'Unable to identify current user. Please refresh and try again.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const medicationData = {
        ...formData,
        patient_id: globals.selected_patient_id,
        prescribed_by: currentUserId
      };

      if (medication) {
        // Update existing medication
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_medications?id=${medication.id}`,
          {
            method: 'PUT',
            body: medicationData
          }
        );
      } else {
        // Create new medication
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_medications`,
          {
            method: 'POST',
            body: medicationData
          }
        );
      }
      
      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save medication. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
      <FormField label="Medication Name" error={errors.name} required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter medication name"
        />
      </FormField>

      <FormField label="Dosage" error={errors.dosage}>
        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => handleChange('dosage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 10mg, 1 tablet"
        />
      </FormField>

      <FormField label="Frequency" error={errors.frequency}>
        <input
          type="text"
          value={formData.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Once daily, Twice daily, As needed"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Start Date" error={errors.start_date}>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="End Date" error={errors.end_date}>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

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
          disabled={!currentUserId}
        >
          {medication ? 'Update Medication' : 'Add Medication'}
        </Button>
      </div>
    </form>
  );
};

export default MedicationForm;