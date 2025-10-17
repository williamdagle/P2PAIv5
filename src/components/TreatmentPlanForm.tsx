import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface TreatmentPlanFormProps {
  treatmentPlan?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({
  treatmentPlan,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  useEffect(() => {
    if (treatmentPlan) {
      setFormData({
        title: treatmentPlan.title || '',
        description: treatmentPlan.description || '',
        status: treatmentPlan.status || 'active'
      });
    }
  }, [treatmentPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const planData = {
        ...formData,
        patient_id: globals.selected_patient_id
      };

      if (treatmentPlan) {
        // Update existing treatment plan
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_treatment_plans?id=${treatmentPlan.id}`,
          {
            method: 'PUT',
            body: planData
          }
        );
      } else {
        // Create new treatment plan
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_treatment_plans`,
          {
            method: 'POST',
            body: planData
          }
        );
      }
      
      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save treatment plan. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Title" error={errors.title} required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter treatment plan title"
        />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter treatment plan description"
        />
      </FormField>

      <FormField label="Status" error={errors.status}>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
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
          {treatmentPlan ? 'Update Treatment Plan' : 'Create Treatment Plan'}
        </Button>
      </div>
    </form>
  );
};

export default TreatmentPlanForm;