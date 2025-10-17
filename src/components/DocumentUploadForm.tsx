import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from './Button';
import FormField from './FormField';

interface DocumentUploadFormProps {
  patientId: string;
  organizationId: string;
  uploadedBy: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  patientId,
  organizationId,
  uploadedBy,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: 'lab_report',
    description: '',
    category: 'lab_results',
    tags: [] as string[],
    visit_date: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!formData.document_name) {
        setFormData({ ...formData, document_name: selectedFile.name });
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const documentData = {
      patient_id: patientId,
      uploaded_by: uploadedBy,
      document_name: formData.document_name,
      document_type: formData.document_type,
      file_size: file.size,
      file_path: `/documents/${patientId}/${file.name}`,
      mime_type: file.type,
      description: formData.description,
      organization_id: organizationId,
      metadata: {
        category: formData.category,
        tags: formData.tags,
        visit_date: formData.visit_date || null,
        notes: formData.description,
      },
    };

    onSubmit(documentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          {file ? (
            <div className="text-sm">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Click to upload</p>
              <p>PDF, DOC, DOCX, JPG, PNG, or TXT (max 10MB)</p>
            </div>
          )}
        </label>
      </div>

      <FormField
        label="Document Name"
        value={formData.document_name}
        onChange={(e) =>
          setFormData({ ...formData, document_name: e.target.value })
        }
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type
        </label>
        <select
          value={formData.document_type}
          onChange={(e) =>
            setFormData({ ...formData, document_type: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="lab_report">Lab Report</option>
          <option value="imaging">Imaging</option>
          <option value="consent_form">Consent Form</option>
          <option value="referral">Referral</option>
          <option value="insurance">Insurance Document</option>
          <option value="progress_note">Progress Note</option>
          <option value="prescription">Prescription</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="lab_results">Lab Results</option>
          <option value="imaging">Imaging</option>
          <option value="consent_forms">Consent Forms</option>
          <option value="insurance">Insurance</option>
          <option value="referrals">Referrals</option>
          <option value="clinical_notes">Clinical Notes</option>
          <option value="administrative">Administrative</option>
          <option value="other">Other</option>
        </select>
      </div>

      <FormField
        label="Visit Date (Optional)"
        type="date"
        value={formData.visit_date}
        onChange={(e) =>
          setFormData({ ...formData, visit_date: e.target.value })
        }
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="button" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Upload Document</Button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;
