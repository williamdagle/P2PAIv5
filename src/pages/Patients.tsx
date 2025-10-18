import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PatientForm from '../components/PatientForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { setGlobal } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataKey, setDataKey] = useState(0);

  // Add debug logging for Patients page
  React.useEffect(() => {
    console.log('🏥 Patients page mounted');
    console.log('🔗 API URL will be:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patients`);
  }, []);

  const handleRowClick = (row: any) => {
    console.log('👤 Patient selected:', row);
    setGlobal('selected_patient_id', row.id);
    setGlobal('selected_patient_name', `${row.first_name} ${row.last_name}`);
    navigate(`/patients/${row.id}/chart`);
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDelete = (patient: any) => {
    setDeletingPatient(patient);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingPatient) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_patients?id=${deletingPatient.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Patient deleted successfully');
      setDataKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingPatient(null);
    } catch (err) {
      showError('Failed to delete patient', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingPatient ? 'Patient updated successfully' : 'Patient created successfully'
    );
    setShowForm(false);
    setEditingPatient(null);
    setDataKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patients</h1>
            <p className="text-gray-600">Manage patient records and information</p>
          </div>
          <Button
            onClick={() => navigate('/patients/create')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Patient
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={dataKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patients`}
            columns={['first_name', 'last_name', 'dob', 'gender']}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            searchable={true}
            searchPlaceholder="Search patients by name, date of birth, or gender..."
          />
        </div>

        {/* Patient Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingPatient ? 'Edit Patient' : 'Create New Patient'}
          size="lg"
        >
          <PatientForm
            patient={editingPatient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Patient"
          message={`Are you sure you want to delete "${deletingPatient?.first_name} ${deletingPatient?.last_name}"? This action cannot be undone and will remove all associated medical records.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    
  );
};

export default Patients;
