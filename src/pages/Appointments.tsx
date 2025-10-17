import React from 'react';
import { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AppointmentForm from '../components/AppointmentForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

interface AppointmentsProps {
  onNavigate: (page: string) => void;
}

const Appointments: React.FC<AppointmentsProps> = ({ onNavigate }) => {
  const { globals, setGlobal } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check for pending appointment edit on mount
  useEffect(() => {
    if (globals.pending_appointment_edit) {
      setEditingAppointment(globals.pending_appointment_edit);
      setShowForm(true);
      // Clear the pending edit
      setGlobal('pending_appointment_edit', undefined);
    }
  }, [globals.pending_appointment_edit, setGlobal]);

  const handleAddNew = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = (appointment: any) => {
    setDeletingAppointment(appointment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingAppointment) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_appointments`,
        {
          method: 'DELETE',
          body: { id: deletingAppointment.id }
        }
      );

      showSuccess('Appointment deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingAppointment(null);
    } catch (err) {
      showError('Failed to delete appointment', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingAppointment ? 'Appointment updated successfully' : 'Appointment scheduled successfully'
    );
    setShowForm(false);
    setEditingAppointment(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  return (
    <Layout>
      <Sidebar currentPage="Appointments" onPageChange={onNavigate} />
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Appointments for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">View scheduled appointments and visit history</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_appointments?patient_id=${globals.selected_patient_id}`}
            columns={['appointment_date', 'provider_name', 'appointment_type_name', 'reason', 'status']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            customRenderers={{
              appointment_date: (value) => {
                if (!value) return '-';
                const date = new Date(value);
                return date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              },
              provider_name: (value) => value || 'Not Assigned',
              appointment_type_name: (value) => value || 'No Type',
              status: (value) => {
                const statusColors: Record<string, string> = {
                  scheduled: 'bg-blue-100 text-blue-800',
                  completed: 'bg-green-100 text-green-800',
                  cancelled: 'bg-red-100 text-red-800'
                };
                const colorClass = statusColors[value?.toLowerCase()] || 'bg-gray-100 text-gray-800';
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                    {value || 'Unknown'}
                  </span>
                );
              }
            }}
          />
        </div>

        {/* Appointment Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
          size="lg"
        >
          <AppointmentForm
            appointment={editingAppointment}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Appointment"
          message={`Are you sure you want to delete this appointment? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default Appointments;