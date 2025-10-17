import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface HPIFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const HPIForm: React.FC<HPIFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    onset: initialData?.onset || '',
    location: initialData?.location || '',
    duration: initialData?.duration || '',
    character: initialData?.character || '',
    aggravating_factors: initialData?.aggravating_factors || '',
    relieving_factors: initialData?.relieving_factors || '',
    timing: initialData?.timing || '',
    severity_scale: initialData?.severity_scale || '',
    context: initialData?.context || '',
    associated_signs_symptoms: initialData?.associated_signs_symptoms || '',
    narrative: initialData?.narrative || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_hpi`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_hpi`;

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
        throw new Error('Failed to save HPI');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
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
        label="Narrative (Free Text HPI)"
        type="textarea"
        rows={4}
        value={formData.narrative}
        onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
        placeholder="Describe the patient's presenting illness in narrative form"
      />

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">OLDCARTS Framework</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Onset"
            value={formData.onset}
            onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
            placeholder="When did it start?"
          />

          <FormField
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Where is it?"
          />

          <FormField
            label="Duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="How long does it last?"
          />

          <FormField
            label="Character"
            value={formData.character}
            onChange={(e) => setFormData({ ...formData, character: e.target.value })}
            placeholder="What is it like?"
          />
        </div>

        <FormField
          label="Aggravating Factors"
          type="textarea"
          rows={2}
          value={formData.aggravating_factors}
          onChange={(e) => setFormData({ ...formData, aggravating_factors: e.target.value })}
          placeholder="What makes it worse?"
        />

        <FormField
          label="Relieving Factors"
          type="textarea"
          rows={2}
          value={formData.relieving_factors}
          onChange={(e) => setFormData({ ...formData, relieving_factors: e.target.value })}
          placeholder="What makes it better?"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Timing"
            value={formData.timing}
            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
            placeholder="When does it occur?"
          />

          <FormField
            label="Severity (1-10)"
            type="number"
            min="1"
            max="10"
            value={formData.severity_scale}
            onChange={(e) => setFormData({ ...formData, severity_scale: e.target.value })}
          />
        </div>

        <FormField
          label="Context"
          type="textarea"
          rows={2}
          value={formData.context}
          onChange={(e) => setFormData({ ...formData, context: e.target.value })}
          placeholder="Under what circumstances?"
        />

        <FormField
          label="Associated Signs & Symptoms"
          type="textarea"
          rows={2}
          value={formData.associated_signs_symptoms}
          onChange={(e) => setFormData({ ...formData, associated_signs_symptoms: e.target.value })}
          placeholder="What else is happening?"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t">
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

export default HPIForm;
