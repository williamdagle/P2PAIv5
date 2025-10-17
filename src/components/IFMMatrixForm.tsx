import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import FormField from './FormField';

interface IFMMatrixFormProps {
  patientId: string;
  clinicId: string;
  existingData?: any;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const systemFields = [
  { key: 'assimilation', name: 'Assimilation', description: 'Digestion, Absorption, Microbiome' },
  { key: 'defense_repair', name: 'Defense & Repair', description: 'Immune System' },
  { key: 'energy', name: 'Energy', description: 'Mitochondrial, Thyroid, Adrenal' },
  { key: 'biotransformation', name: 'Biotransformation', description: 'Detoxification' },
  { key: 'transport', name: 'Transport', description: 'Cardiovascular, Lymphatic' },
  { key: 'communication', name: 'Communication', description: 'Hormonal, Neurotransmitter' },
  { key: 'structural', name: 'Structural', description: 'Musculoskeletal, Cellular' },
];

const IFMMatrixForm: React.FC<IFMMatrixFormProps> = ({
  patientId,
  clinicId,
  existingData,
  onSuccess,
  onCancel,
}) => {
  const { globals } = useGlobal();
  const { showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_name: '',
    overall_summary: '',
    priority_systems: [] as string[],
    ...systemFields.reduce((acc, system) => ({
      ...acc,
      [`${system.key}_status`]: 'optimal',
      [`${system.key}_findings`]: '',
      [`${system.key}_interventions`]: '',
    }), {}),
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...formData,
        ...existingData,
        assessment_date: existingData.assessment_date || formData.assessment_date,
        priority_systems: existingData.priority_systems || [],
      });
    }
  }, [existingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = existingData
        ? 'update_ifm_matrix_assessments'
        : 'create_ifm_matrix_assessments';

      const payload = existingData
        ? { ...formData, id: existingData.id }
        : { ...formData, patient_id: patientId, clinic_id: clinicId };

      await apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSuccess(
        existingData ? 'IFM Matrix assessment updated successfully' : 'IFM Matrix assessment created successfully'
      );
    } catch (error: any) {
      showError(error.message || 'Failed to save IFM Matrix assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePrioritySystem = (systemName: string) => {
    setFormData((prev) => ({
      ...prev,
      priority_systems: prev.priority_systems.includes(systemName)
        ? prev.priority_systems.filter((s) => s !== systemName)
        : [...prev.priority_systems, systemName],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Assessment Date"
          type="date"
          value={formData.assessment_date}
          onChange={(e) => handleChange('assessment_date', e.target.value)}
          required
        />
        <FormField
          label="Assessment Name"
          value={formData.assessment_name}
          onChange={(e) => handleChange('assessment_name', e.target.value)}
          placeholder="e.g., Initial Assessment, 3-Month Follow-up"
        />
      </div>

      <div className="space-y-6">
        {systemFields.map((system) => (
          <div key={system.key} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{system.name}</h4>
                <p className="text-sm text-gray-600">{system.description}</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.priority_systems.includes(system.name)}
                  onChange={() => togglePrioritySystem(system.name)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Priority</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData[`${system.key}_status` as keyof typeof formData] as string}
                  onChange={(e) => handleChange(`${system.key}_status`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="optimal">Optimal</option>
                  <option value="suboptimal">Suboptimal</option>
                  <option value="impaired">Impaired</option>
                </select>
              </div>

              <FormField
                label="Findings"
                textarea
                rows={3}
                value={formData[`${system.key}_findings` as keyof typeof formData] as string}
                onChange={(e) => handleChange(`${system.key}_findings`, e.target.value)}
                placeholder="Clinical findings for this system..."
              />

              <FormField
                label="Interventions"
                textarea
                rows={3}
                value={formData[`${system.key}_interventions` as keyof typeof formData] as string}
                onChange={(e) => handleChange(`${system.key}_interventions`, e.target.value)}
                placeholder="Recommended interventions..."
              />
            </div>
          </div>
        ))}
      </div>

      <FormField
        label="Overall Summary"
        textarea
        rows={4}
        value={formData.overall_summary}
        onChange={(e) => handleChange('overall_summary', e.target.value)}
        placeholder="Comprehensive summary of the assessment..."
      />

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : existingData ? 'Update Assessment' : 'Create Assessment'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default IFMMatrixForm;
