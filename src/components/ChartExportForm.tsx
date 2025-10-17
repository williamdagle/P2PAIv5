import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import Button from './Button';
import FormField from './FormField';

interface ChartExportFormProps {
  patientId: string;
  exportedBy: string;
  organizationId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ChartExportForm: React.FC<ChartExportFormProps> = ({
  patientId,
  exportedBy,
  organizationId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    export_type: 'pdf',
    export_format: 'pdf',
    date_range_start: '',
    date_range_end: '',
    sections_included: [] as string[],
    recipient_info: {
      name: '',
      organization: '',
      address: '',
      phone: '',
      email: '',
      fax: '',
    },
  });

  const availableSections = [
    { id: 'demographics', label: 'Patient Demographics' },
    { id: 'allergies', label: 'Allergies' },
    { id: 'medications', label: 'Medications' },
    { id: 'problems', label: 'Problem List' },
    { id: 'vital_signs', label: 'Vital Signs' },
    { id: 'immunizations', label: 'Immunizations' },
    { id: 'lab_results', label: 'Lab Results' },
    { id: 'clinical_notes', label: 'Clinical Notes' },
    { id: 'treatment_plans', label: 'Treatment Plans' },
    { id: 'appointments', label: 'Appointment History' },
    { id: 'fm_timeline', label: 'Functional Medicine Timeline' },
    { id: 'ifm_matrix', label: 'IFM Matrix Assessments' },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections_included: prev.sections_included.includes(sectionId)
        ? prev.sections_included.filter((s) => s !== sectionId)
        : [...prev.sections_included, sectionId],
    }));
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      sections_included: availableSections.map((s) => s.id),
    }));
  };

  const handleSelectNone = () => {
    setFormData((prev) => ({
      ...prev,
      sections_included: [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const exportData = {
      patient_id: patientId,
      exported_by: exportedBy,
      export_type: formData.export_type,
      export_format: formData.export_format,
      date_range_start: formData.date_range_start || null,
      date_range_end: formData.date_range_end || null,
      sections_included: formData.sections_included,
      recipient_info:
        formData.export_type === 'referral_summary' ? formData.recipient_info : null,
      export_status: 'pending',
      organization_id: organizationId,
    };

    onSubmit(exportData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Export Type
        </label>
        <select
          value={formData.export_type}
          onChange={(e) =>
            setFormData({ ...formData, export_type: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="pdf">PDF Chart Summary</option>
          <option value="ccd">Continuity of Care Document (CCD)</option>
          <option value="referral_summary">Referral Summary</option>
          <option value="chart_print">Full Chart Print</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Date Range Start (Optional)"
          type="date"
          value={formData.date_range_start}
          onChange={(e) =>
            setFormData({ ...formData, date_range_start: e.target.value })
          }
        />
        <FormField
          label="Date Range End (Optional)"
          type="date"
          value={formData.date_range_end}
          onChange={(e) =>
            setFormData({ ...formData, date_range_end: e.target.value })
          }
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Sections to Include
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <span className="text-gray-400">|</span>
            <button
              type="button"
              onClick={handleSelectNone}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select None
            </button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {availableSections.map((section) => (
              <div key={section.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={section.id}
                  checked={formData.sections_included.includes(section.id)}
                  onChange={() => handleSectionToggle(section.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={section.id} className="text-sm text-gray-700">
                  {section.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {formData.export_type === 'referral_summary' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Recipient Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Recipient Name"
              value={formData.recipient_info.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_info: {
                    ...formData.recipient_info,
                    name: e.target.value,
                  },
                })
              }
            />
            <FormField
              label="Organization"
              value={formData.recipient_info.organization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_info: {
                    ...formData.recipient_info,
                    organization: e.target.value,
                  },
                })
              }
            />
            <FormField
              label="Phone"
              value={formData.recipient_info.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_info: {
                    ...formData.recipient_info,
                    phone: e.target.value,
                  },
                })
              }
            />
            <FormField
              label="Email"
              type="email"
              value={formData.recipient_info.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_info: {
                    ...formData.recipient_info,
                    email: e.target.value,
                  },
                })
              }
            />
            <FormField
              label="Fax"
              value={formData.recipient_info.fax}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_info: {
                    ...formData.recipient_info,
                    fax: e.target.value,
                  },
                })
              }
            />
          </div>
          <FormField
            label="Address"
            value={formData.recipient_info.address}
            onChange={(e) =>
              setFormData({
                ...formData,
                recipient_info: {
                  ...formData.recipient_info,
                  address: e.target.value,
                },
              })
            }
          />
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> The exported document will be generated and available
          for download. Ensure all patient information is accurate before exporting.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Download className="w-4 h-4 mr-2" />
          Generate Export
        </Button>
      </div>
    </form>
  );
};

export default ChartExportForm;
