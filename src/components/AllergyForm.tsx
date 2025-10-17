import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface AllergyFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const AllergyForm: React.FC<AllergyFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    allergen: initialData?.allergen || '',
    allergen_type: initialData?.allergen_type || 'medication',
    reaction: initialData?.reaction || '',
    severity: initialData?.severity || 'mild',
    onset_date: initialData?.onset_date || '',
    status: initialData?.status || 'active',
    verified: initialData?.verified || false,
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.allergen || !formData.reaction) {
      setError('Allergen and reaction are required');
      return;
    }

    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_patient_allergies`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_patient_allergies`;

      const payload = {
        patient_id: patientId,
        ...formData,
        ...(initialData && { id: initialData.id })
      };

      const response = await fetch(endpoint, {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globals.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save allergy');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <FormField
        label="Allergen"
        required
        value={formData.allergen}
        onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
        placeholder="e.g., Penicillin, Peanuts, Latex"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Allergen Type"
          type="select"
          required
          value={formData.allergen_type}
          onChange={(e) => setFormData({ ...formData, allergen_type: e.target.value })}
        >
          <option value="medication">Medication</option>
          <option value="food">Food</option>
          <option value="environmental">Environmental</option>
          <option value="other">Other</option>
        </FormField>

        <FormField
          label="Severity"
          type="select"
          required
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="life-threatening">Life-Threatening</option>
        </FormField>
      </div>

      <FormField
        label="Reaction"
        type="textarea"
        required
        rows={3}
        value={formData.reaction}
        onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
        placeholder="Describe the allergic reaction"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Onset Date"
          type="date"
          value={formData.onset_date}
          onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
        />

        <FormField
          label="Status"
          type="select"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="resolved">Resolved</option>
        </FormField>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="verified"
          checked={formData.verified}
          onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
          Allergy has been verified
        </label>
      </div>

      <FormField
        label="Additional Notes"
        type="textarea"
        rows={2}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default AllergyForm;
