import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import { MapPin, Plus, Edit, AlertCircle } from 'lucide-react';

const StateConfiguration: React.FC = () => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const { showSuccess, showError } = useNotification();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    state_code: '',
    state_name: '',
    data_retention_days: 2555,
    compliance_notes: '',
    is_active: true
  });

  const stateOptions = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
  ];

  const handleCreate = async () => {
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_state_configuration`,
        {
          method: 'POST',
          body: JSON.stringify(formData)
        }
      );

      showSuccess('State configuration created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to create configuration', error.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedConfig) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_state_configuration`,
        {
          method: 'PUT',
          body: JSON.stringify({
            id: selectedConfig.id,
            ...formData
          })
        }
      );

      showSuccess('State configuration updated successfully');
      setIsEditModalOpen(false);
      setSelectedConfig(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to update configuration', error.message);
    }
  };

  const openEditModal = (config: any) => {
    setSelectedConfig(config);
    setFormData({
      state_code: config.state_code,
      state_name: config.state_name,
      data_retention_days: config.data_retention_days,
      compliance_notes: config.compliance_notes || '',
      is_active: config.is_active
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      state_code: '',
      state_name: '',
      data_retention_days: 2555,
      compliance_notes: '',
      is_active: true
    });
  };

  const renderForm = () => (
    <div className="space-y-4">
      {!selectedConfig && (
        <FormField label="State" required>
          <select
            name="state_code"
            value={formData.state_code}
            onChange={(e) => {
              const selected = stateOptions.find(s => s.code === e.target.value);
              setFormData({
                ...formData,
                state_code: e.target.value,
                state_name: selected?.name || ''
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a state</option>
            {stateOptions.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Data Retention (days)" required>
        <input
          type="number"
          name="data_retention_days"
          value={formData.data_retention_days}
          onChange={(e) => setFormData({ ...formData, data_retention_days: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </FormField>

      <FormField label="Compliance Notes">
        <textarea
          name="compliance_notes"
          value={formData.compliance_notes}
          onChange={(e) => setFormData({ ...formData, compliance_notes: e.target.value })}
          rows={4}
          placeholder="Enter any state-specific compliance requirements or notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm font-medium text-gray-700">Active</span>
      </label>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <MapPin className="w-8 h-8 mr-3 text-blue-600" />
              State Configuration
            </h1>
            <p className="text-gray-600">Manage state-specific compliance requirements and data retention policies</p>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add State Configuration
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">State-Specific Compliance</p>
            <p>Configure retention policies and requirements for each state where you practice. Forms can be automatically assigned based on patient state.</p>
          </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_state_configurations`}
            columns={['state_code', 'state_name', 'data_retention_days', 'is_active', 'last_review_date', 'actions']}
            searchable={true}
            searchPlaceholder="Search states..."
            customRenderers={{
              state_code: (value: string) => (
                <span className="font-mono font-semibold text-gray-900">{value}</span>
              ),
              data_retention_days: (value: number) => {
                const years = (value / 365).toFixed(1);
                return `${value} days (~${years} years)`;
              },
              is_active: (value: boolean) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {value ? 'ACTIVE' : 'INACTIVE'}
                </span>
              ),
              last_review_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'Never';
              },
              actions: (_: any, row: any) => (
                <button
                  onClick={() => openEditModal(row)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit Configuration"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )
            }}
          />
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          title="Create State Configuration"
        >
          {renderForm()}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Configuration
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedConfig(null);
            resetForm();
          }}
          title="Edit State Configuration"
        >
          {renderForm()}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedConfig(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </div>
        </Modal>
      </div>
    
  );
};

export default StateConfiguration;
