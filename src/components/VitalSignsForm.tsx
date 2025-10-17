import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface VitalSignsFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    height_cm: initialData?.height_cm || '',
    weight_kg: initialData?.weight_kg || '',
    temperature_c: initialData?.temperature_c || '',
    heart_rate_bpm: initialData?.heart_rate_bpm || '',
    blood_pressure_systolic: initialData?.blood_pressure_systolic || '',
    blood_pressure_diastolic: initialData?.blood_pressure_diastolic || '',
    respiratory_rate: initialData?.respiratory_rate || '',
    oxygen_saturation: initialData?.oxygen_saturation || '',
    pain_scale: initialData?.pain_scale || '',
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_vital_signs`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_vital_signs`;

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
        throw new Error('Failed to save vital signs');
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Height (cm)"
          type="number"
          step="0.1"
          value={formData.height_cm}
          onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
        />

        <FormField
          label="Weight (kg)"
          type="number"
          step="0.1"
          value={formData.weight_kg}
          onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
        />

        <FormField
          label="Temperature (°C)"
          type="number"
          step="0.1"
          value={formData.temperature_c}
          onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value })}
        />

        <FormField
          label="Heart Rate (bpm)"
          type="number"
          value={formData.heart_rate_bpm}
          onChange={(e) => setFormData({ ...formData, heart_rate_bpm: e.target.value })}
        />

        <FormField
          label="BP Systolic"
          type="number"
          value={formData.blood_pressure_systolic}
          onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
        />

        <FormField
          label="BP Diastolic"
          type="number"
          value={formData.blood_pressure_diastolic}
          onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
        />

        <FormField
          label="Respiratory Rate"
          type="number"
          value={formData.respiratory_rate}
          onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
        />

        <FormField
          label="O2 Saturation (%)"
          type="number"
          value={formData.oxygen_saturation}
          onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
        />

        <FormField
          label="Pain Scale (0-10)"
          type="number"
          min="0"
          max="10"
          value={formData.pain_scale}
          onChange={(e) => setFormData({ ...formData, pain_scale: e.target.value })}
        />
      </div>

      <FormField
        label="Notes"
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

export default VitalSignsForm;
