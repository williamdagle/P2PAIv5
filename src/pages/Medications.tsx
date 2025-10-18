import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import MedicationForm from '../components/MedicationForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

const Medications: React.FC = () => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddNew = () => {
    setEditingMedication(null);
    setShowForm(true);
  };

  const handleEdit = (medication: any) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleDelete = (medication: any) => {
    setDeletingMedication(medication);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingMedication) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_medications?id=${deletingMedication.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Medication deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingMedication(null);
    } catch (err) {
      showError('Failed to delete medication', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingMedication ? 'Medication updated successfully' : 'Medication added successfully'
    );
    setShowForm(false);
    setEditingMedication(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMedication(null);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Medications for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Current and historical medication prescriptions</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_medications?patient_id=${globals.selected_patient_id}`}
            columns={['name', 'dosage', 'frequency', 'start_date', 'end_date']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Medication Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingMedication ? 'Edit Medication' : 'Add New Medication'}
          size="lg"
        >
          <MedicationForm
            medication={editingMedication}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Medication"
          message={`Are you sure you want to delete "${deletingMedication?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    
  );
};

export default Medications;
