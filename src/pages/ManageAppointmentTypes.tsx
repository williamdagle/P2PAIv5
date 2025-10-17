import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/DataTable';
import ApiErrorBoundary from '../components/ApiErrorBoundary';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AppointmentTypeForm from '../components/AppointmentTypeForm';
import { Plus, Calendar, AlertCircle } from 'lucide-react';

interface ManageAppointmentTypesProps {
  onNavigate: (page: string) => void;
}

const ManageAppointmentTypes: React.FC<ManageAppointmentTypesProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [deletingType, setDeletingType] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_current_user`,
          { method: 'GET' }
        );
        if (response?.role_name) {
          setUserRole(response.role_name);
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      } finally {
        setLoadingRole(false);
      }
    };

    if (globals.access_token) {
      fetchUserRole();
    }
  }, [globals.access_token]);

  const isSystemAdmin = userRole === 'System Admin';

  const handleAdd = () => {
    setEditingType(null);
    setShowModal(true);
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setShowModal(true);
  };

  const handleDelete = (type: any) => {
    setDeletingType(type);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingType(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingType(null);
  };

  const confirmDelete = async () => {
    if (!deletingType) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_appointment_types?id=${deletingType.id}`,
        { method: 'DELETE' }
      );
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete appointment type:', err);
    } finally {
      setDeletingType(null);
    }
  };

  return (
    <Layout>
      <Sidebar currentPage="ManageAppointmentTypes" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Appointment Types</h1>
          <p className="text-gray-600">Configure appointment types, colors, durations, and approval workflows</p>
        </div>

        {loadingRole ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Loading permissions...</p>
          </div>
        ) : !isSystemAdmin ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  System Admin Access Required
                </h3>
                <p className="text-gray-600">
                  Appointment type management is restricted to users with the System Admin role.
                  You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
                </p>
                <p className="text-gray-600 mt-2">
                  Please contact your system administrator if you need access to manage appointment types.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Appointment Types</h2>
              </div>
              <Button
                onClick={handleAdd}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Appointment Type
              </Button>
            </div>

            <ApiErrorBoundary
              functionName="get_appointment_types"
              showFunctionHelp={true}
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <DataTable
                  key={refreshKey}
                  apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_appointment_types`}
                  columns={['name', 'color_code', 'default_duration_minutes', 'is_billable', 'requires_approval']}
                  customRenderers={{
                    color_code: (value: string) => (
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: value }}
                        />
                        <span className="text-sm text-gray-600 font-mono">{value}</span>
                      </div>
                    ),
                    default_duration_minutes: (value: number) => (
                      <span className="text-gray-900">{value} min</span>
                    ),
                    is_billable: (value: boolean) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {value ? 'Billable' : 'Non-billable'}
                      </span>
                    ),
                    requires_approval: (value: boolean) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {value ? 'Approval Required' : 'No Approval'}
                      </span>
                    )
                  }}
                  showActions={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  searchable={true}
                  searchPlaceholder="Search appointment types..."
                />
              </div>
            </ApiErrorBoundary>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-2">About Appointment Types</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Define custom appointment types with specific durations and colors</li>
                <li>• Set billable vs non-billable appointments</li>
                <li>• Configure approval requirements for certain appointment types</li>
                <li>• Specify which roles can approve appointments when approval is required</li>
                <li>• Set maximum free sessions allowed per patient for each type</li>
              </ul>
            </div>
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={handleCancel}
          title={editingType ? 'Edit Appointment Type' : 'Add New Appointment Type'}
        >
          <AppointmentTypeForm
            appointmentType={editingType}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!deletingType}
          onClose={() => setDeletingType(null)}
          onConfirm={confirmDelete}
          title="Delete Appointment Type"
          message={`Are you sure you want to delete "${deletingType?.name}"? This action cannot be undone and may affect existing appointments using this type.`}
          confirmText="Delete"
          confirmVariant="danger"
        />
      </div>
    </Layout>
  );
};

export default ManageAppointmentTypes;
