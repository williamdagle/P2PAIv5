import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LabForm from '../components/LabForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

const Labs: React.FC = () => {
  const navigate = useNavigate();
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingLab, setDeletingLab] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!globals.selected_patient_id) {
    return (
      
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please select a patient first</p>
            <Button onClick={() => navigate('/patients')}>
              Go to Patients
            </Button>
          </div>
        </div>
      
    );
  }

  const handleAddNew = () => {
    setEditingLab(null);
    setShowForm(true);
  };

  const handleEdit = (lab: any) => {
    setEditingLab(lab);
    setShowForm(true);
  };

  const handleDelete = (lab: any) => {
    setDeletingLab(lab);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingLab) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_labs?id=${deletingLab.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Lab result deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingLab(null);
    } catch (err) {
      showError('Failed to delete lab result', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingLab ? 'Lab result updated successfully' : 'Lab result added successfully'
    );
    setShowForm(false);
    setEditingLab(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingLab(null);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Labs for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Laboratory test results and diagnostic reports</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lab Result
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_labs?patient_id=${globals.selected_patient_id}`}
            columns={['lab_name', 'test_type', 'result', 'result_date']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Lab Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingLab ? 'Edit Lab Result' : 'Add New Lab Result'}
          size="lg"
        >
          <LabForm
            lab={editingLab}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Lab Result"
          message={`Are you sure you want to delete "${deletingLab?.lab_name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    
  );
};

export default Labs;
