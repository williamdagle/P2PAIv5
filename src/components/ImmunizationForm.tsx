import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface ImmunizationFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const ImmunizationForm: React.FC<ImmunizationFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    vaccine_name: initialData?.vaccine_name || '',
    vaccine_code: initialData?.vaccine_code || '',
    dose_number: initialData?.dose_number || '',
    administration_date: initialData?.administration_date || new Date().toISOString().split('T')[0],
    administration_site: initialData?.administration_site || '',
    lot_number: initialData?.lot_number || '',
    manufacturer: initialData?.manufacturer || '',
    expiration_date: initialData?.expiration_date || '',
    route: initialData?.route || '',
    dose_amount: initialData?.dose_amount || '',
    reaction: initialData?.reaction || '',
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.vaccine_name || !formData.administration_date) {
      setError('Vaccine name and administration date are required');
      return;
    }

    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_patient_immunizations`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_patient_immunizations`;

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
        throw new Error('Failed to save immunization');
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
          label="Vaccine Name"
          required
          value={formData.vaccine_name}
          onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
          placeholder="e.g., COVID-19, Influenza"
        />

        <FormField
          label="Vaccine Code (CVX)"
          value={formData.vaccine_code}
          onChange={(e) => setFormData({ ...formData, vaccine_code: e.target.value })}
          placeholder="Optional CVX code"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Administration Date"
          type="date"
          required
          value={formData.administration_date}
          onChange={(e) => setFormData({ ...formData, administration_date: e.target.value })}
        />

        <FormField
          label="Dose Number"
          type="number"
          value={formData.dose_number}
          onChange={(e) => setFormData({ ...formData, dose_number: e.target.value })}
          placeholder="e.g., 1, 2, 3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Administration Site"
          value={formData.administration_site}
          onChange={(e) => setFormData({ ...formData, administration_site: e.target.value })}
          placeholder="e.g., Left arm, Right arm"
        />

        <FormField
          label="Route"
          value={formData.route}
          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
          placeholder="e.g., IM, SC, oral"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Lot Number"
          value={formData.lot_number}
          onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
        />

        <FormField
          label="Dose Amount"
          value={formData.dose_amount}
          onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
          placeholder="e.g., 0.5 mL"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Manufacturer"
          value={formData.manufacturer}
          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
        />

        <FormField
          label="Expiration Date"
          type="date"
          value={formData.expiration_date}
          onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
        />
      </div>

      <FormField
        label="Reaction (if any)"
        type="textarea"
        rows={2}
        value={formData.reaction}
        onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
        placeholder="Document any adverse reactions"
      />

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

export default ImmunizationForm;
