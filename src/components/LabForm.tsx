import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface LabFormProps {
  lab?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const LabForm: React.FC<LabFormProps> = ({
  lab,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    lab_name: '',
    test_type: '',
    result: '',
    result_date: ''
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
    if (lab) {
      setFormData({
        lab_name: lab.lab_name || '',
        test_type: lab.test_type || '',
        result: lab.result || '',
        result_date: lab.result_date || ''
      });
    }
  }, [lab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.lab_name) newErrors.lab_name = 'Lab name is required';
    if (!currentUserId) newErrors.submit = 'Unable to identify current user. Please refresh and try again.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const labData = {
        ...formData,
        patient_id: globals.selected_patient_id,
        ordered_by: currentUserId
      };

      if (lab) {
        // Update existing lab
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_labs?id=${lab.id}`,
          {
            method: 'PUT',
            body: labData
          }
        );
      } else {
        // Create new lab
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_labs`,
          {
            method: 'POST',
            body: labData
          }
        );
      }
      
      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save lab result. Please try again.' });
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
      <FormField label="Lab Name" error={errors.lab_name} required>
        <input
          type="text"
          value={formData.lab_name}
          onChange={(e) => handleChange('lab_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter lab test name"
        />
      </FormField>

      <FormField label="Test Type" error={errors.test_type}>
        <input
          type="text"
          value={formData.test_type}
          onChange={(e) => handleChange('test_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter test type"
        />
      </FormField>

      <FormField label="Result" error={errors.result}>
        <textarea
          value={formData.result}
          onChange={(e) => handleChange('result', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter lab result"
        />
      </FormField>

      <FormField label="Result Date" error={errors.result_date}>
        <input
          type="date"
          value={formData.result_date}
          onChange={(e) => handleChange('result_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
          disabled={!currentUserId}
        >
          {lab ? 'Update Lab Result' : 'Add Lab Result'}
        </Button>
      </div>
    </form>
  );
};

export default LabForm;