import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface ChiefComplaintFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const ChiefComplaintForm: React.FC<ChiefComplaintFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    complaint: initialData?.complaint || '',
    duration: initialData?.duration || '',
    severity: initialData?.severity || 'moderate',
    associated_symptoms: initialData?.associated_symptoms?.join(', ') || '',
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.complaint) {
      setError('Chief complaint is required');
      return;
    }

    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_chief_complaints`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_chief_complaints`;

      const payload = {
        patient_id: patientId,
        visit_date: formData.visit_date,
        complaint: formData.complaint,
        duration: formData.duration,
        severity: formData.severity,
        associated_symptoms: formData.associated_symptoms
          ? formData.associated_symptoms.split(',').map(s => s.trim()).filter(s => s)
          : [],
        notes: formData.notes,
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
        throw new Error('Failed to save chief complaint');
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
        label="Visit Date"
        type="date"
        required
        value={formData.visit_date}
        onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
      />

      <FormField
        label="Chief Complaint"
        type="textarea"
        required
        rows={3}
        value={formData.complaint}
        onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
        placeholder="Primary reason for visit"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Duration"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="e.g., 3 days, 2 weeks"
        />

        <FormField
          label="Severity"
          type="select"
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </FormField>
      </div>

      <FormField
        label="Associated Symptoms"
        value={formData.associated_symptoms}
        onChange={(e) => setFormData({ ...formData, associated_symptoms: e.target.value })}
        placeholder="Comma-separated list (e.g., fever, cough, fatigue)"
      />

      <FormField
        label="Additional Notes"
        type="textarea"
        rows={3}
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

export default ChiefComplaintForm;
