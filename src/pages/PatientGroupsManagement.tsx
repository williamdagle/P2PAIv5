import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import { Users, Plus, Edit, Trash2, UserPlus, Calendar, CheckCircle } from 'lucide-react';
import type { PatientGroup, Resource, User } from '../types';

interface PatientGroupsManagementProps {
  onNavigate: (page: string) => void;
}

const PatientGroupsManagement: React.FC<PatientGroupsManagementProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const { showSuccess, showError } = useNotification();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PatientGroup | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [providers, setProviders] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'support',
    state_restrictions: [] as string[],
    session_frequency: 'weekly',
    session_duration_minutes: 60,
    resource_id: '',
    provider_id: '',
    max_members: 5,
    status: 'forming',
    start_date: '',
    end_date: '',
    portal_visible: true,
    allow_self_enrollment: false,
    requires_individual_session: true
  });

  useEffect(() => {
    fetchResources();
    fetchProviders();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_resources`,
        { method: 'GET' }
      );
      console.log('[PatientGroupsManagement] Resources response:', response);
      // Handle both array response and object with resources property
      const resourcesData = Array.isArray(response) ? response : (response?.resources || []);
      setResources(resourcesData);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setResources([]);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
        { method: 'GET' }
      );
      console.log('[PatientGroupsManagement] Providers response:', response);
      // Handle both array response and object with users property
      const usersData = Array.isArray(response) ? response : (response?.users || []);
      setProviders(usersData);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setProviders([]);
    }
  };

  const handleCreate = async () => {
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_patient_group`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            resource_id: formData.resource_id || null,
            provider_id: formData.provider_id || null
          })
        }
      );

      showSuccess('Patient group created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to create group', error.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedGroup) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_patient_group`,
        {
          method: 'PUT',
          body: JSON.stringify({
            id: selectedGroup.id,
            ...formData
          })
        }
      );

      showSuccess('Patient group updated successfully');
      setIsEditModalOpen(false);
      setSelectedGroup(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to update group', error.message);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_patient_group?id=${groupId}`,
        { method: 'DELETE' }
      );

      showSuccess('Patient group deleted successfully');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to delete group', error.message);
    }
  };

  const openEditModal = (group: PatientGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      group_type: group.group_type,
      state_restrictions: group.state_restrictions || [],
      session_frequency: group.session_frequency || 'weekly',
      session_duration_minutes: group.session_duration_minutes || 60,
      resource_id: group.resource_id || '',
      provider_id: group.provider_id || '',
      max_members: group.max_members || 5,
      status: group.status,
      start_date: group.start_date || '',
      end_date: group.end_date || '',
      portal_visible: group.portal_visible,
      allow_self_enrollment: group.allow_self_enrollment,
      requires_individual_session: group.requires_individual_session
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      group_type: 'support',
      state_restrictions: [],
      session_frequency: 'weekly',
      session_duration_minutes: 60,
      resource_id: '',
      provider_id: '',
      max_members: 5,
      status: 'forming',
      start_date: '',
      end_date: '',
      portal_visible: true,
      allow_self_enrollment: false,
      requires_individual_session: true
    });
  };

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const renderForm = () => (
    <div className="space-y-4">
      <FormField
        label="Group Name"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
      />

      <FormField
        label="Group Type"
        name="group_type"
        type="select"
        value={formData.group_type}
        onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
        required
      >
        <option value="support">Support</option>
        <option value="therapy">Therapy</option>
        <option value="education">Education</option>
        <option value="wellness">Wellness</option>
        <option value="other">Other</option>
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State Restrictions (Optional)
        </label>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
          {stateOptions.map((state) => (
            <label key={state} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.state_restrictions.includes(state)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      state_restrictions: [...formData.state_restrictions, state]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      state_restrictions: formData.state_restrictions.filter(s => s !== state)
                    });
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{state}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to allow all states. Select specific states to restrict group membership.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Session Frequency"
          name="session_frequency"
          value={formData.session_frequency}
          onChange={(e) => setFormData({ ...formData, session_frequency: e.target.value })}
        />

        <FormField
          label="Session Duration (minutes)"
          name="session_duration_minutes"
          type="number"
          value={formData.session_duration_minutes}
          onChange={(e) => setFormData({ ...formData, session_duration_minutes: parseInt(e.target.value) })}
        />
      </div>

      <FormField
        label="Resource (Optional)"
        name="resource_id"
        type="select"
        value={formData.resource_id}
        onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
      >
        <option value="">No Resource</option>
        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>{resource.name}</option>
        ))}
      </FormField>

      <FormField
        label="Provider (Optional)"
        name="provider_id"
        type="select"
        value={formData.provider_id}
        onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
      >
        <option value="">No Provider</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>{provider.full_name}</option>
        ))}
      </FormField>

      <FormField
        label="Maximum Members"
        name="max_members"
        type="number"
        value={formData.max_members}
        onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
        required
      />

      <FormField
        label="Status"
        name="status"
        type="select"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        required
      >
        <option value="forming">Forming</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />

        <FormField
          label="End Date (Optional)"
          name="end_date"
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.portal_visible}
            onChange={(e) => setFormData({ ...formData, portal_visible: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Visible in Patient Portal</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.allow_self_enrollment}
            onChange={(e) => setFormData({ ...formData, allow_self_enrollment: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Allow Self-Enrollment</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.requires_individual_session}
            onChange={(e) => setFormData({ ...formData, requires_individual_session: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Requires Individual Session Before Group Sessions</span>
        </label>
      </div>
    </div>
  );

  return (
    <Layout>
      <Sidebar currentPage="PatientGroupsManagement" onPageChange={onNavigate} />

      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Patient Groups Management
            </h1>
            <p className="text-gray-600">Manage patient groups, sessions, and membership</p>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Group
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patient_groups`}
            columns={['name', 'group_type', 'status', 'current_member_count', 'max_members', 'start_date', 'actions']}
            searchable={true}
            searchPlaceholder="Search groups..."
            customRenderers={{
              status: (value: string) => {
                const statusColors: Record<string, string> = {
                  forming: 'bg-yellow-100 text-yellow-800',
                  active: 'bg-green-100 text-green-800',
                  completed: 'bg-blue-100 text-blue-800',
                  archived: 'bg-gray-100 text-gray-600'
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              current_member_count: (value: number, row: any) => {
                const max = row.max_members || 'No limit';
                const percentage = row.max_members ? (value / row.max_members) * 100 : 0;
                const color = percentage >= 100 ? 'text-red-600' : percentage >= 80 ? 'text-yellow-600' : 'text-green-600';
                return <span className={`font-semibold ${color}`}>{value} / {max}</span>;
              },
              start_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'Not set';
              },
              actions: (_: any, row: any) => (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(row)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit Group"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
          title="Create New Patient Group"
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
              Create Group
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroup(null);
            resetForm();
          }}
          title="Edit Patient Group"
        >
          {renderForm()}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedGroup(null);
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
    </Layout>
  );
};

export default PatientGroupsManagement;
