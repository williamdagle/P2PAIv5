import React, { useState } from 'react';
import Button from './Button';
import FormField from './FormField';
import { useGlobal } from '../context/GlobalContext';

interface ProblemListFormProps {
  problem?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProblemListForm({
  problem,
  onSuccess,
  onCancel,
}: ProblemListFormProps) {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    problem: problem?.problem || '',
    icd10_code: problem?.icd10_code || '',
    snomed_code: problem?.snomed_code || '',
    onset_date: problem?.onset_date || '',
    resolution_date: problem?.resolution_date || '',
    status: problem?.status || 'active',
    severity: problem?.severity || 'moderate',
    priority: problem?.priority || 3,
    notes: problem?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = problem
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_problem_list`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_problem_list`;

      const payload = {
        ...formData,
        patient_id: globals.selected_patient_id,
        clinic_id: globals.clinic_id,
        ...(problem && { id: problem.id })
      };

      const response = await fetch(endpoint, {
        method: problem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globals.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save problem');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <FormField label="Problem" required>
        <input
          type="text"
          value={formData.problem}
          onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="ICD-10 Code">
          <input
            type="text"
            value={formData.icd10_code}
            onChange={(e) => setFormData({ ...formData, icd10_code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="SNOMED Code">
          <input
            type="text"
            value={formData.snomed_code}
            onChange={(e) => setFormData({ ...formData, snomed_code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Onset Date">
          <input
            type="date"
            value={formData.onset_date}
            onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Resolution Date">
          <input
            type="date"
            value={formData.resolution_date}
            onChange={(e) => setFormData({ ...formData, resolution_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField label="Status" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="active">Active</option>
            <option value="chronic">Chronic</option>
            <option value="resolved">Resolved</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>

        <FormField label="Severity">
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Not specified</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </FormField>

        <FormField label="Priority" required>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 3 })}
            min={1}
            max={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </FormField>
      </div>

      <FormField label="Notes">
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : problem ? 'Update Problem' : 'Add Problem'}
        </Button>
      </div>
    </form>
  );
}
