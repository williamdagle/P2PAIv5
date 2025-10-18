import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import Button from './Button';
import FormField from './FormField';

interface SupplementFormProps {
  supplement?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const SupplementForm: React.FC<SupplementFormProps> = ({
  supplement,
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
  const { user } = useAuth();
  const { selectedPatientId } = usePatient();

  // Get current user's internal ID
  useEffect(() => {
    if (currentUserId || !user?.id) {
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
          const currentUser = response.users.find((u: any) =>
            u.auth_user_id === user?.id
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
  }, [user?.id, currentUserId, apiCall]);

  useEffect(() => {
    if (supplement) {
      setFormData({
        name: supplement.name || '',
        dosage: supplement.dosage || '',
        frequency: supplement.frequency || '',
        start_date: supplement.start_date || '',
        end_date: supplement.end_date || ''
      });
    }
  }, [supplement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Supplement name is required';
    if (!currentUserId) newErrors.submit = 'Unable to identify current user. Please refresh and try again.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const supplementData = {
        ...formData,
        patient_id: selectedPatientId,
        recommended_by: currentUserId
      };

      if (supplement) {
        // Update existing supplement
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_supplements?id=${supplement.id}`,
          {
            method: 'PUT',
            body: supplementData
          }
        );
      } else {
        // Create new supplement
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_supplements`,
          {
            method: 'POST',
            body: supplementData
          }
        );
      }
      
      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save supplement. Please try again.' });
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
      <FormField label="Supplement Name" error={errors.name} required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter supplement name"
        />
      </FormField>

      <FormField label="Dosage" error={errors.dosage}>
        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => handleChange('dosage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 500mg, 2 capsules"
        />
      </FormField>

      <FormField label="Frequency" error={errors.frequency}>
        <input
          type="text"
          value={formData.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Once daily, Twice daily, With meals"
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
          {supplement ? 'Update Supplement' : 'Add Supplement'}
        </Button>
      </div>
    </form>
  );
};

export default SupplementForm;