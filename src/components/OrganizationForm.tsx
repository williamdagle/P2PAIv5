import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import Button from './Button';

interface OrganizationFormProps {
  organization: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organization, onSuccess, onCancel }) => {
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const { apiCall, loading, error } = useApi();
  const orgRef = useRef(organization);

  console.log('OrganizationForm rendered with organization:', organization);
  console.log('Organization ID from prop:', organization?.id);

  useEffect(() => {
    console.log('OrganizationForm useEffect - organization changed:', organization);
    if (organization) {
      orgRef.current = organization;
      setDataSharingEnabled(organization.enable_data_sharing || false);
    }
  }, [organization]);

  if (!organization) {
    console.error('OrganizationForm: No organization provided');
    return <div className="p-4 text-center text-red-600">Error: No organization data</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const org = orgRef.current;
    console.log('Organization object from ref:', org);
    console.log('Organization ID from ref:', org?.id);

    if (!org?.id) {
      console.error('No organization ID found in ref');
      return;
    }

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_organizations`,
        {
          method: 'PUT',
          body: JSON.stringify({
            id: org.id,
            enable_data_sharing: dataSharingEnabled
          })
        }
      );
      onSuccess();
    } catch (err) {
      console.error('Failed to update organization:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {organization?.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Organization ID: {organization?.org_id}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">About Data Sharing</h4>
        <p className="text-sm text-blue-800">
          When enabled, this organization's data will be visible to other organizations
          that also have data sharing enabled. This allows for cross-organization
          collaboration and data insights while maintaining security controls.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="enable_data_sharing"
          checked={dataSharingEnabled}
          onChange={(e) => setDataSharingEnabled(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="enable_data_sharing" className="text-sm font-medium text-gray-900">
          Enable Data Sharing
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default OrganizationForm;
