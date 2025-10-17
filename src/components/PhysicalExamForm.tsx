import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface PhysicalExamFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const PhysicalExamForm: React.FC<PhysicalExamFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    exam_date: initialData?.exam_date || new Date().toISOString().split('T')[0],
    general_appearance: initialData?.general_appearance || '',
    head_eyes_ears_nose_throat: initialData?.head_eyes_ears_nose_throat || '',
    cardiovascular: initialData?.cardiovascular || '',
    respiratory: initialData?.respiratory || '',
    gastrointestinal: initialData?.gastrointestinal || '',
    musculoskeletal: initialData?.musculoskeletal || '',
    neurological: initialData?.neurological || '',
    skin: initialData?.skin || '',
    psychiatric: initialData?.psychiatric || '',
    summary: initialData?.summary || '',
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
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_physical_exams`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_physical_exams`;

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
        throw new Error('Failed to save physical exam');
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
        label="Exam Date"
        type="date"
        required
        value={formData.exam_date}
        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
      />

      <FormField
        label="General Appearance"
        type="textarea"
        rows={2}
        value={formData.general_appearance}
        onChange={(e) => setFormData({ ...formData, general_appearance: e.target.value })}
        placeholder="Overall patient appearance and condition"
      />

      <FormField
        label="HEENT (Head, Eyes, Ears, Nose, Throat)"
        type="textarea"
        rows={2}
        value={formData.head_eyes_ears_nose_throat}
        onChange={(e) => setFormData({ ...formData, head_eyes_ears_nose_throat: e.target.value })}
      />

      <FormField
        label="Cardiovascular"
        type="textarea"
        rows={2}
        value={formData.cardiovascular}
        onChange={(e) => setFormData({ ...formData, cardiovascular: e.target.value })}
      />

      <FormField
        label="Respiratory"
        type="textarea"
        rows={2}
        value={formData.respiratory}
        onChange={(e) => setFormData({ ...formData, respiratory: e.target.value })}
      />

      <FormField
        label="Gastrointestinal"
        type="textarea"
        rows={2}
        value={formData.gastrointestinal}
        onChange={(e) => setFormData({ ...formData, gastrointestinal: e.target.value })}
      />

      <FormField
        label="Musculoskeletal"
        type="textarea"
        rows={2}
        value={formData.musculoskeletal}
        onChange={(e) => setFormData({ ...formData, musculoskeletal: e.target.value })}
      />

      <FormField
        label="Neurological"
        type="textarea"
        rows={2}
        value={formData.neurological}
        onChange={(e) => setFormData({ ...formData, neurological: e.target.value })}
      />

      <FormField
        label="Skin"
        type="textarea"
        rows={2}
        value={formData.skin}
        onChange={(e) => setFormData({ ...formData, skin: e.target.value })}
      />

      <FormField
        label="Psychiatric"
        type="textarea"
        rows={2}
        value={formData.psychiatric}
        onChange={(e) => setFormData({ ...formData, psychiatric: e.target.value })}
      />

      <FormField
        label="Summary"
        type="textarea"
        rows={3}
        value={formData.summary}
        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
        placeholder="Overall impression and key findings"
      />

      <FormField
        label="Additional Notes"
        type="textarea"
        rows={2}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

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

export default PhysicalExamForm;
