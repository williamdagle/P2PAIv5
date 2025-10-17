import React, { useState } from 'react';
import Button from './Button';
import FormField from './FormField';

interface PatientPortalAccessFormProps {
  patientId: string;
  organizationId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const PatientPortalAccessForm: React.FC<PatientPortalAccessFormProps> = ({
  patientId,
  organizationId,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    patient_id: patientId,
    user_id: initialData?.user_id || '',
    access_level: initialData?.access_level || 'read_only',
    is_active: initialData?.is_active ?? true,
    permissions: initialData?.permissions || {
      view_labs: true,
      view_medications: true,
      view_appointments: true,
      view_documents: true,
      send_messages: true,
    },
    organization_id: organizationId,
  });

  const handlePermissionChange = (permission: string, value: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Patient Portal User ID"
        value={formData.user_id}
        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
        placeholder="Enter auth user ID for patient portal login"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Access Level
        </label>
        <select
          value={formData.access_level}
          onChange={(e) =>
            setFormData({ ...formData, access_level: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="read_only">Read Only</option>
          <option value="limited">Limited Access</option>
          <option value="full">Full Access</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.checked })
          }
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Portal Access Active
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Portal Permissions
        </label>
        <div className="space-y-2 bg-gray-50 p-4 rounded-md">
          {Object.entries(formData.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={key}
                checked={value}
                onChange={(e) => handlePermissionChange(key, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={key} className="text-sm text-gray-700">
                {key
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Access' : 'Grant Access'}
        </Button>
      </div>
    </form>
  );
};

export default PatientPortalAccessForm;
