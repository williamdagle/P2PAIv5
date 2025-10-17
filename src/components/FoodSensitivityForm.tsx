import React, { useState, useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import FormField from './FormField';

interface FoodSensitivityFormProps {
  patientId: string;
  clinicId: string;
  existingData?: any;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const FoodSensitivityForm: React.FC<FoodSensitivityFormProps> = ({
  patientId,
  clinicId,
  existingData,
  onSuccess,
  onCancel,
}) => {
  const { showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    food_item: '',
    sensitivity_type: 'sensitivity',
    reaction_symptoms: '',
    reaction_severity: 'mild',
    reaction_onset_time: '',
    testing_method: '',
    test_date: '',
    status: 'active',
    elimination_start_date: '',
    reintroduction_date: '',
    reintroduction_outcome: '',
    notes: '',
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...formData,
        ...existingData,
        test_date: existingData.test_date || '',
        elimination_start_date: existingData.elimination_start_date || '',
        reintroduction_date: existingData.reintroduction_date || '',
        reaction_symptoms: existingData.reaction_symptoms?.join(', ') || '',
      });
    }
  }, [existingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        test_date: formData.test_date || null,
        elimination_start_date: formData.elimination_start_date || null,
        reintroduction_date: formData.reintroduction_date || null,
        reaction_symptoms: formData.reaction_symptoms
          ? formData.reaction_symptoms.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const finalPayload = existingData
        ? { ...payload, id: existingData.id }
        : { ...payload, patient_id: patientId, clinic_id: clinicId };

      const endpoint = existingData ? 'update_food_sensitivities' : 'create_food_sensitivities';

      await apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(finalPayload),
      });

      onSuccess(
        existingData ? 'Food sensitivity updated successfully' : 'Food sensitivity created successfully'
      );
    } catch (error: any) {
      showError(error.message || 'Failed to save food sensitivity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Food Item"
        value={formData.food_item}
        onChange={(e) => handleChange('food_item', e.target.value)}
        placeholder="e.g., Dairy, Gluten, Eggs"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity Type</label>
          <select
            value={formData.sensitivity_type}
            onChange={(e) => handleChange('sensitivity_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="allergy">Allergy (IgE)</option>
            <option value="intolerance">Intolerance</option>
            <option value="sensitivity">Sensitivity (IgG)</option>
            <option value="suspected">Suspected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reaction Severity</label>
          <select
            value={formData.reaction_severity}
            onChange={(e) => handleChange('reaction_severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      <FormField
        label="Reaction Symptoms (comma-separated)"
        value={formData.reaction_symptoms}
        onChange={(e) => handleChange('reaction_symptoms', e.target.value)}
        placeholder="bloating, headache, fatigue, rash"
        required
      />

      <FormField
        label="Reaction Onset Time"
        value={formData.reaction_onset_time}
        onChange={(e) => handleChange('reaction_onset_time', e.target.value)}
        placeholder="e.g., Immediate, 30 minutes, 2 hours, next day"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Testing Method"
          value={formData.testing_method}
          onChange={(e) => handleChange('testing_method', e.target.value)}
          placeholder="e.g., IgE blood test, IgG panel, Elimination diet"
        />

        <FormField
          label="Test Date"
          type="date"
          value={formData.test_date}
          onChange={(e) => handleChange('test_date', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="eliminated">Eliminated</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Elimination & Reintroduction</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Elimination Start Date"
            type="date"
            value={formData.elimination_start_date}
            onChange={(e) => handleChange('elimination_start_date', e.target.value)}
          />

          <FormField
            label="Reintroduction Date"
            type="date"
            value={formData.reintroduction_date}
            onChange={(e) => handleChange('reintroduction_date', e.target.value)}
          />
        </div>

        <FormField
          label="Reintroduction Outcome"
          textarea
          rows={2}
          value={formData.reintroduction_outcome}
          onChange={(e) => handleChange('reintroduction_outcome', e.target.value)}
          placeholder="Describe the outcome when food was reintroduced..."
        />
      </div>

      <FormField
        label="Additional Notes"
        textarea
        rows={2}
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
      />

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : existingData ? 'Update Sensitivity' : 'Add Sensitivity'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default FoodSensitivityForm;
