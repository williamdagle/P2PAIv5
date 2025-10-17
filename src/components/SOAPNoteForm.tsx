import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import FormField from './FormField';

interface SOAPNoteFormProps {
  patientId: string;
  clinicId: string;
  assessmentId?: string;
  chiefComplaintId?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function SOAPNoteForm({
  patientId,
  clinicId,
  assessmentId,
  chiefComplaintId,
  onClose,
  onSubmit,
  initialData,
}: SOAPNoteFormProps) {
  const [formData, setFormData] = useState({
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    note_format: initialData?.note_format || 'soap',
    chief_complaint_id: chiefComplaintId || initialData?.chief_complaint_id || '',
    assessment_id: assessmentId || initialData?.assessment_id || '',
    subjective: initialData?.subjective || '',
    objective: initialData?.objective || '',
    assessment: initialData?.assessment || '',
    plan: initialData?.plan || '',
    cpt_codes: initialData?.cpt_codes || [],
    visit_type: initialData?.visit_type || 'office',
    complexity_level: initialData?.complexity_level || 'moderate',
    time_spent_minutes: initialData?.time_spent_minutes || '',
    counseling_minutes: initialData?.counseling_minutes || '',
    is_signed: initialData?.is_signed || false,
  });

  const [newCptCode, setNewCptCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      patient_id: patientId,
      clinic_id: clinicId,
      time_spent_minutes: formData.time_spent_minutes ? parseInt(formData.time_spent_minutes) : null,
      counseling_minutes: formData.counseling_minutes ? parseInt(formData.counseling_minutes) : null,
    });
  };

  const addCptCode = () => {
    if (newCptCode && !formData.cpt_codes.includes(newCptCode)) {
      setFormData({
        ...formData,
        cpt_codes: [...formData.cpt_codes, newCptCode],
      });
      setNewCptCode('');
    }
  };

  const removeCptCode = (code: string) => {
    setFormData({
      ...formData,
      cpt_codes: formData.cpt_codes.filter((c: string) => c !== code),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit SOAP Note' : 'New SOAP Note'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Visit Date"
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              required
            />

            <FormField
              label="Note Format"
              type="select"
              value={formData.note_format}
              onChange={(e) => setFormData({ ...formData, note_format: e.target.value })}
              required
            >
              <option value="soap">SOAP (Subjective-Objective-Assessment-Plan)</option>
              <option value="apso">APSO (Assessment-Plan-Subjective-Objective)</option>
            </FormField>

            <FormField
              label="Visit Type"
              type="select"
              value={formData.visit_type}
              onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
            >
              <option value="">Not specified</option>
              <option value="office">Office Visit</option>
              <option value="telehealth">Telehealth</option>
              <option value="hospital">Hospital Visit</option>
              <option value="home">Home Visit</option>
            </FormField>
          </div>

          <div className="space-y-6">
            <FormField
              label="Subjective (Patient's perspective, symptoms, HPI)"
              type="textarea"
              value={formData.subjective}
              onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
              rows={5}
              placeholder="Chief complaint, history of present illness, patient-reported symptoms..."
            />

            <FormField
              label="Objective (Vital signs, exam findings, test results)"
              type="textarea"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              rows={5}
              placeholder="Vital signs, physical examination findings, lab results..."
            />

            <FormField
              label="Assessment (Diagnosis, clinical impression)"
              type="textarea"
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              rows={5}
              placeholder="Primary diagnosis, differential diagnoses, clinical reasoning..."
            />

            <FormField
              label="Plan (Treatment plan, orders, follow-up)"
              type="textarea"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              rows={5}
              placeholder="Medications, treatments, orders, referrals, follow-up instructions..."
            />
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                label="Complexity Level"
                type="select"
                value={formData.complexity_level}
                onChange={(e) => setFormData({ ...formData, complexity_level: e.target.value })}
              >
                <option value="">Not specified</option>
                <option value="straightforward">Straightforward</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Time Spent (minutes)"
                  type="number"
                  value={formData.time_spent_minutes}
                  onChange={(e) => setFormData({ ...formData, time_spent_minutes: e.target.value })}
                  min={0}
                />

                <FormField
                  label="Counseling (minutes)"
                  type="number"
                  value={formData.counseling_minutes}
                  onChange={(e) => setFormData({ ...formData, counseling_minutes: e.target.value })}
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPT Codes (Billing)
              </label>
              <div className="space-y-2">
                {formData.cpt_codes.map((code: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="flex-1 text-sm font-medium">{code}</span>
                    <button
                      type="button"
                      onClick={() => removeCptCode(code)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCptCode}
                    onChange={(e) => setNewCptCode(e.target.value)}
                    placeholder="Enter CPT code"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addCptCode}
                    disabled={!newCptCode}
                    icon={Plus}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="is_signed"
                checked={formData.is_signed}
                onChange={(e) => setFormData({ ...formData, is_signed: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_signed" className="ml-2 block text-sm text-gray-900">
                Sign and finalize this note
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update Note' : 'Create Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
