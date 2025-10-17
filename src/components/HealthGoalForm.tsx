import React, { useState, useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import FormField from './FormField';

interface HealthGoalFormProps {
  patientId: string;
  clinicId: string;
  existingData?: any;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const HealthGoalForm: React.FC<HealthGoalFormProps> = ({
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
    goal_type: 'wellness',
    priority: 'medium',
    status: 'active',
    specific_goal: '',
    measurable_criteria: '',
    achievable_plan: '',
    relevant_reason: '',
    time_bound_deadline: '',
    baseline_value: '',
    target_value: '',
    current_value: '',
    progress_percentage: '0',
    barriers: '',
    support_needed: '',
    notes: '',
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...formData,
        ...existingData,
        time_bound_deadline: existingData.time_bound_deadline || '',
        progress_percentage: existingData.progress_percentage?.toString() || '0',
        barriers: existingData.barriers?.join(', ') || '',
        support_needed: existingData.support_needed?.join(', ') || '',
      });
    }
  }, [existingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = existingData ? 'update_health_goals' : 'create_health_goals';

      const payload = {
        ...formData,
        progress_percentage: parseInt(formData.progress_percentage) || 0,
        time_bound_deadline: formData.time_bound_deadline || null,
        barriers: formData.barriers
          ? formData.barriers.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        support_needed: formData.support_needed
          ? formData.support_needed.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const finalPayload = existingData
        ? { ...payload, id: existingData.id }
        : { ...payload, patient_id: patientId, clinic_id: clinicId };

      await apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(finalPayload),
      });

      onSuccess(existingData ? 'Health goal updated successfully' : 'Health goal created successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to save health goal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">SMART Goals Framework</h3>
        <p className="text-xs text-blue-800">
          <strong>S</strong>pecific, <strong>M</strong>easurable, <strong>A</strong>chievable,{' '}
          <strong>R</strong>elevant, <strong>T</strong>ime-bound
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
          <select
            value={formData.goal_type}
            onChange={(e) => handleChange('goal_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="symptom_reduction">Symptom Reduction</option>
            <option value="lifestyle_change">Lifestyle Change</option>
            <option value="lab_improvement">Lab Improvement</option>
            <option value="wellness">Wellness</option>
            <option value="functional_capacity">Functional Capacity</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="achieved">Achieved</option>
            <option value="paused">Paused</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SMART Goal Components</h3>

        <FormField
          label="Specific Goal"
          textarea
          rows={2}
          value={formData.specific_goal}
          onChange={(e) => handleChange('specific_goal', e.target.value)}
          placeholder="Clear, specific description of what you want to achieve..."
          required
        />

        <FormField
          label="Measurable Criteria"
          textarea
          rows={2}
          value={formData.measurable_criteria}
          onChange={(e) => handleChange('measurable_criteria', e.target.value)}
          placeholder="How will success be measured? What metrics will be tracked?"
        />

        <FormField
          label="Achievable Plan"
          textarea
          rows={3}
          value={formData.achievable_plan}
          onChange={(e) => handleChange('achievable_plan', e.target.value)}
          placeholder="Action steps to achieve this goal..."
        />

        <FormField
          label="Relevant Reason"
          textarea
          rows={2}
          value={formData.relevant_reason}
          onChange={(e) => handleChange('relevant_reason', e.target.value)}
          placeholder="Why is this goal important to you?"
        />

        <FormField
          label="Time-Bound Deadline"
          type="date"
          value={formData.time_bound_deadline}
          onChange={(e) => handleChange('time_bound_deadline', e.target.value)}
        />
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Baseline Value"
            value={formData.baseline_value}
            onChange={(e) => handleChange('baseline_value', e.target.value)}
            placeholder="Starting point"
          />

          <FormField
            label="Target Value"
            value={formData.target_value}
            onChange={(e) => handleChange('target_value', e.target.value)}
            placeholder="Desired outcome"
          />

          <FormField
            label="Current Value"
            value={formData.current_value}
            onChange={(e) => handleChange('current_value', e.target.value)}
            placeholder="Current status"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress Percentage: {formData.progress_percentage}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress_percentage}
            onChange={(e) => handleChange('progress_percentage', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Barriers (comma-separated)"
          textarea
          rows={2}
          value={formData.barriers}
          onChange={(e) => handleChange('barriers', e.target.value)}
          placeholder="time constraints, lack of support, cost"
        />

        <FormField
          label="Support Needed (comma-separated)"
          textarea
          rows={2}
          value={formData.support_needed}
          onChange={(e) => handleChange('support_needed', e.target.value)}
          placeholder="accountability partner, meal planning, exercise program"
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
          {loading ? 'Saving...' : existingData ? 'Update Goal' : 'Create Goal'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default HealthGoalForm;
