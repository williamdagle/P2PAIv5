import React, { useState, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Button from './Button';
import FormField from './FormField';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface AestheticPhotoUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  treatmentId?: string;
}

const PHOTO_TYPES = ['Before', 'After', 'During', 'Follow-up', 'Consultation'];

const STANDARD_VIEWS = [
  'Frontal',
  'Left Profile',
  'Right Profile',
  'Left Oblique',
  'Right Oblique',
  'Smile',
  'Close-up',
  'Detail',
  'Other'
];

const AestheticPhotoUploadForm: React.FC<AestheticPhotoUploadFormProps> = ({
  onSuccess,
  onCancel,
  treatmentId,
}) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    photo_date: new Date().toISOString().split('T')[0],
    photo_type: 'Before',
    view_angle: '',
    treatment_area: '',
    notes: '',
    is_primary: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showError('Image size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showError('Please select a photo to upload');
      return;
    }

    if (!globals.selected_patient_id) {
      showError('No patient selected');
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const payload = {
          patient_id: globals.selected_patient_id,
          clinic_id: globals.clinic_id,
          treatment_id: treatmentId || null,
          photo_date: formData.photo_date,
          photo_type: formData.photo_type,
          view_angle: formData.view_angle,
          treatment_area: formData.treatment_area,
          notes: formData.notes,
          is_primary: formData.is_primary,
          file_data: base64String,
          file_name: selectedFile.name,
          content_type: selectedFile.type,
        };

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload_aesthetic_photo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${globals.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload photo');
        }

        showSuccess('Photo uploaded successfully');
        onSuccess();
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error: any) {
      showError(error.message || 'Failed to upload photo');
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-96 mx-auto rounded-lg shadow-lg"
            />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="mt-4 text-sm text-gray-600">{selectedFile?.name}</p>
          </div>
        ) : (
          <div>
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-5 h-5 mr-2" />
              Select Photo
            </label>
            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG, or HEIC up to 10MB
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Photo Date"
          type="date"
          value={formData.photo_date}
          onChange={(e) => handleInputChange('photo_date', e.target.value)}
          required
        />

        <FormField
          label="Photo Type"
          type="select"
          value={formData.photo_type}
          onChange={(e) => handleInputChange('photo_type', e.target.value)}
          required
        >
          {PHOTO_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </FormField>

        <FormField
          label="View Angle"
          type="select"
          value={formData.view_angle}
          onChange={(e) => handleInputChange('view_angle', e.target.value)}
        >
          <option value="">Select View</option>
          {STANDARD_VIEWS.map((view) => (
            <option key={view} value={view}>
              {view}
            </option>
          ))}
        </FormField>

        <FormField
          label="Treatment Area"
          value={formData.treatment_area}
          onChange={(e) => handleInputChange('treatment_area', e.target.value)}
          placeholder="e.g., Forehead, Lips, Jawline"
        />
      </div>

      <FormField
        label="Notes"
        type="textarea"
        rows={3}
        value={formData.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        placeholder="Lighting, positioning, or other relevant details"
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_primary"
          checked={formData.is_primary}
          onChange={(e) => handleInputChange('is_primary', e.target.checked)}
          className="rounded text-blue-600 mr-2"
        />
        <label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
          Set as primary photo for this patient
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !selectedFile}>
          {loading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </div>
    </form>
  );
};

export default AestheticPhotoUploadForm;
