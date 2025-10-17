import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import FormField from './FormField';

interface ClinicalAssessmentFormProps {
  patientId: string;
  clinicId: string;
  chiefComplaintId?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function ClinicalAssessmentForm({
  patientId,
  clinicId,
  chiefComplaintId,
  onClose,
  onSubmit,
  initialData,
}: ClinicalAssessmentFormProps) {
  const [formData, setFormData] = useState({
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    chief_complaint_id: chiefComplaintId || initialData?.chief_complaint_id || '',
    primary_diagnosis: initialData?.primary_diagnosis || '',
    primary_diagnosis_icd10: initialData?.primary_diagnosis_icd10 || '',
    clinical_impression: initialData?.clinical_impression || '',
    assessment_summary: initialData?.assessment_summary || '',
    risk_stratification: initialData?.risk_stratification || 'low',
    prognosis: initialData?.prognosis || '',
    differential_diagnoses: initialData?.differential_diagnoses || [],
  });

  const [newDifferential, setNewDifferential] = useState({ diagnosis: '', icd10: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      patient_id: patientId,
      clinic_id: clinicId,
    });
  };

  const addDifferential = () => {
    if (newDifferential.diagnosis) {
      setFormData({
        ...formData,
        differential_diagnoses: [...formData.differential_diagnoses, newDifferential],
      });
      setNewDifferential({ diagnosis: '', icd10: '' });
    }
  };

  const removeDifferential = (index: number) => {
    setFormData({
      ...formData,
      differential_diagnoses: formData.differential_diagnoses.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Clinical Assessment' : 'New Clinical Assessment'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              label="Visit Date"
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Primary Diagnosis"
                value={formData.primary_diagnosis}
                onChange={(e) => setFormData({ ...formData, primary_diagnosis: e.target.value })}
                required
              />

              <FormField
                label="ICD-10 Code"
                value={formData.primary_diagnosis_icd10}
                onChange={(e) => setFormData({ ...formData, primary_diagnosis_icd10: e.target.value })}
              />
            </div>

            <FormField
              label="Clinical Impression"
              type="textarea"
              value={formData.clinical_impression}
              onChange={(e) => setFormData({ ...formData, clinical_impression: e.target.value })}
              rows={4}
            />

            <FormField
              label="Assessment Summary"
              type="textarea"
              value={formData.assessment_summary}
              onChange={(e) => setFormData({ ...formData, assessment_summary: e.target.value })}
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Risk Stratification"
                type="select"
                value={formData.risk_stratification}
                onChange={(e) => setFormData({ ...formData, risk_stratification: e.target.value })}
                required
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </FormField>

              <FormField
                label="Prognosis"
                value={formData.prognosis}
                onChange={(e) => setFormData({ ...formData, prognosis: e.target.value })}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Differential Diagnoses</h3>

              <div className="space-y-4">
                {formData.differential_diagnoses.map((diff: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{diff.diagnosis}</p>
                      {diff.icd10 && <p className="text-sm text-gray-600">ICD-10: {diff.icd10}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDifferential(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                  <FormField
                    label="Diagnosis"
                    value={newDifferential.diagnosis}
                    onChange={(e) => setNewDifferential({ ...newDifferential, diagnosis: e.target.value })}
                  />
                  <FormField
                    label="ICD-10 Code"
                    value={newDifferential.icd10}
                    onChange={(e) => setNewDifferential({ ...newDifferential, icd10: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addDifferential}
                      disabled={!newDifferential.diagnosis}
                      icon={Plus}
                    >
                      Add Differential Diagnosis
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update Assessment' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
