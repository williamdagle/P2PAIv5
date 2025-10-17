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
import UserForm from '../components/UserForm';
import ClinicForm from '../components/ClinicForm';
import { Plus, Users, Building2, AlertCircle, Share2 } from 'lucide-react';

interface AdminProps {
  onNavigate: (page: string) => void;
}

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deletingClinic, setDeletingClinic] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [clinicRefreshKey, setClinicRefreshKey] = useState(0);
  const [orgRefreshKey, setOrgRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [loadingRole, setLoadingRole] = useState(true);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: any) => {
    setDeletingUser(user);
  };

  const handleUserSuccess = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleUserCancel = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_users?id=${deletingUser.id}`,
        { method: 'DELETE' }
      );
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeletingUser(null);
    }
  };

  const handleAddClinic = () => {
    setEditingClinic(null);
    setShowClinicModal(true);
  };

  const handleEditClinic = (clinic: any) => {
    setEditingClinic(clinic);
    setShowClinicModal(true);
  };

  const handleDeleteClinic = (clinic: any) => {
    setDeletingClinic(clinic);
  };

  const handleClinicSuccess = () => {
    setShowClinicModal(false);
    setEditingClinic(null);
    setClinicRefreshKey(prev => prev + 1);
  };

  const handleClinicCancel = () => {
    setShowClinicModal(false);
    setEditingClinic(null);
  };

  const confirmDeleteClinic = async () => {
    if (!deletingClinic) return;

    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_clinics?id=${deletingClinic.id}`,
        { method: 'DELETE' }
      );
      setClinicRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete clinic:', err);
    } finally {
      setDeletingClinic(null);
    }
  };


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

  const isAdmin = userRole === 'System Admin';

  return (
    <Layout>
      <Sidebar currentPage="Admin" onPageChange={onNavigate} />
      
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Clinic and user management</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Session</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">User ID:</span> {globals.user_id}</p>
              <p><span className="font-medium">Clinic ID:</span> {globals.clinic_id}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {loadingRole ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Loading user permissions...</p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    System Admin Access Required
                  </h3>
                  <p className="text-gray-600">
                    User management is restricted to users with the System Admin role.
                    You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
                  </p>
                  <p className="text-gray-600 mt-2">
                    Please contact your system administrator if you need access to manage users.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Clinic Users</h2>
                </div>
                <Button
                  onClick={handleAddUser}
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
              <ApiErrorBoundary
                functionName="get_users"
                showFunctionHelp={true}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <DataTable
                    key={refreshKey}
                    apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`}
                    columns={['email', 'full_name', 'role']}
                    showActions={true}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    searchable={true}
                    searchPlaceholder="Search users by name or email..."
                  />
                </div>
              </ApiErrorBoundary>
            </div>
          )}

          {isAdmin && (
            <>
              <div>
                <div className="flex items-center mb-4">
                  <Share2 className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
                </div>
                <ApiErrorBoundary
                  functionName="get_organizations"
                  showFunctionHelp={true}
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <DataTable
                      key={orgRefreshKey}
                      apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_organizations`}
                      columns={['name', 'org_id', 'enable_data_sharing']}
                      customRenderers={{
                        enable_data_sharing: (value: boolean, row: any) => (
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value || false}
                              onChange={async (e) => {
                                const newValue = e.target.checked;
                                try {
                                  await apiCall(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_organizations`,
                                    {
                                      method: 'PUT',
                                      body: {
                                        id: row.id,
                                        enable_data_sharing: newValue
                                      }
                                    }
                                  );
                                  setOrgRefreshKey(prev => prev + 1);
                                } catch (err) {
                                  console.error('Failed to update organization:', err);
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {value ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        )
                      }}
                    />
                  </div>
                </ApiErrorBoundary>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="w-6 h-6 text-green-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Clinics</h2>
                  </div>
                  <Button
                    onClick={handleAddClinic}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Clinic
                  </Button>
                </div>
                <ApiErrorBoundary
                  functionName="get_clinics"
                  showFunctionHelp={true}
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <DataTable
                      key={clinicRefreshKey}
                      apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_clinics`}
                      columns={['name', 'clinic_type', 'clinic_code', 'aesthetics_module_enabled']}
                      customRenderers={{
                        aesthetics_module_enabled: (value: boolean, row: any) => (
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value || false}
                              onChange={async (e) => {
                                const newValue = e.target.checked;
                                try {
                                  await apiCall(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_clinics`,
                                    {
                                      method: 'PUT',
                                      body: {
                                        id: row.id,
                                        aesthetics_module_enabled: newValue
                                      }
                                    }
                                  );
                                  setClinicRefreshKey(prev => prev + 1);
                                  if (row.id === globals.clinic_id) {
                                    window.location.reload();
                                  }
                                } catch (err) {
                                  console.error('Failed to update clinic:', err);
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {value ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        )
                      }}
                      showActions={true}
                      onEdit={handleEditClinic}
                      onDelete={handleDeleteClinic}
                      searchable={true}
                      searchPlaceholder="Search clinics by name or type..."
                    />
                  </div>
                </ApiErrorBoundary>
              </div>
            </>
          )}
        </div>

        <Modal
          isOpen={showUserModal}
          onClose={handleUserCancel}
          title={editingUser ? 'Edit User' : 'Add New User'}
        >
          <UserForm
            user={editingUser}
            onSuccess={handleUserSuccess}
            onCancel={handleUserCancel}
          />
        </Modal>

        <Modal
          isOpen={showClinicModal}
          onClose={handleClinicCancel}
          title={editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
        >
          <ClinicForm
            clinic={editingClinic}
            onSuccess={handleClinicSuccess}
            onCancel={handleClinicCancel}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete ${deletingUser?.full_name}? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
        />

        <ConfirmDialog
          isOpen={!!deletingClinic}
          onClose={() => setDeletingClinic(null)}
          onConfirm={confirmDeleteClinic}
          title="Delete Clinic"
          message={`Are you sure you want to delete ${deletingClinic?.name}? This action cannot be undone and will affect all users and data associated with this clinic.`}
          confirmText="Delete"
          confirmVariant="danger"
        />
      </div>
    </Layout>
  );
};

export default Admin;