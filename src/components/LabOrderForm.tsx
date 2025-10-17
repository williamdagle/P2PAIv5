import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import FormField from './FormField';

interface LabOrderFormProps {
  patientId: string;
  clinicId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function LabOrderForm({
  patientId,
  clinicId,
  onClose,
  onSubmit,
  initialData,
}: LabOrderFormProps) {
  const [formData, setFormData] = useState({
    order_date: initialData?.order_date || new Date().toISOString().split('T')[0],
    test_name: initialData?.test_name || '',
    test_code: initialData?.test_code || '',
    test_category: initialData?.test_category || 'chemistry',
    priority: initialData?.priority || 'routine',
    clinical_indication: initialData?.clinical_indication || '',
    icd10_codes: initialData?.icd10_codes || [],
    specimen_type: initialData?.specimen_type || '',
    fasting_required: initialData?.fasting_required || false,
    special_instructions: initialData?.special_instructions || '',
    notes: initialData?.notes || '',
  });

  const [newIcd10, setNewIcd10] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      patient_id: patientId,
      clinic_id: clinicId,
    });
  };

  const addIcd10 = () => {
    if (newIcd10 && !formData.icd10_codes.includes(newIcd10)) {
      setFormData({
        ...formData,
        icd10_codes: [...formData.icd10_codes, newIcd10],
      });
      setNewIcd10('');
    }
  };

  const removeIcd10 = (code: string) => {
    setFormData({
      ...formData,
      icd10_codes: formData.icd10_codes.filter((c: string) => c !== code),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Lab Order' : 'New Lab Order'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <FormField
            label="Order Date"
            type="date"
            value={formData.order_date}
            onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Test Name"
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              required
            />

            <FormField
              label="Test Code (CPT/LOINC)"
              value={formData.test_code}
              onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Test Category"
              type="select"
              value={formData.test_category}
              onChange={(e) => setFormData({ ...formData, test_category: e.target.value })}
            >
              <option value="chemistry">Chemistry</option>
              <option value="hematology">Hematology</option>
              <option value="microbiology">Microbiology</option>
              <option value="pathology">Pathology</option>
              <option value="immunology">Immunology</option>
              <option value="molecular">Molecular</option>
              <option value="other">Other</option>
            </FormField>

            <FormField
              label="Priority"
              type="select"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              required
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </FormField>

            <FormField
              label="Specimen Type"
              value={formData.specimen_type}
              onChange={(e) => setFormData({ ...formData, specimen_type: e.target.value })}
            />
          </div>

          <FormField
            label="Clinical Indication"
            type="textarea"
            value={formData.clinical_indication}
            onChange={(e) => setFormData({ ...formData, clinical_indication: e.target.value })}
            rows={3}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ICD-10 Codes
            </label>
            <div className="space-y-2">
              {formData.icd10_codes.map((code: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm font-medium">{code}</span>
                  <button
                    type="button"
                    onClick={() => removeIcd10(code)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIcd10}
                  onChange={(e) => setNewIcd10(e.target.value)}
                  placeholder="Enter ICD-10 code"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addIcd10}
                  disabled={!newIcd10}
                  icon={Plus}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="fasting_required"
              checked={formData.fasting_required}
              onChange={(e) => setFormData({ ...formData, fasting_required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fasting_required" className="ml-2 block text-sm text-gray-900">
              Fasting Required
            </label>
          </div>

          <FormField
            label="Special Instructions"
            type="textarea"
            value={formData.special_instructions}
            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
            rows={3}
          />

          <FormField
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
