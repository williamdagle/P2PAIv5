import React from 'react';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SupplementForm from '../components/SupplementForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

interface SupplementsProps {
  onNavigate: (page: string) => void;
}

const Supplements: React.FC<SupplementsProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSupplement, setDeletingSupplement] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddNew = () => {
    setEditingSupplement(null);
    setShowForm(true);
  };

  const handleEdit = (supplement: any) => {
    setEditingSupplement(supplement);
    setShowForm(true);
  };

  const handleDelete = (supplement: any) => {
    setDeletingSupplement(supplement);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingSupplement) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_supplements?id=${deletingSupplement.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Supplement deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingSupplement(null);
    } catch (err) {
      showError('Failed to delete supplement', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingSupplement ? 'Supplement updated successfully' : 'Supplement added successfully'
    );
    setShowForm(false);
    setEditingSupplement(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSupplement(null);
  };

  return (
    <Layout>
      <Sidebar currentPage="Supplements" onPageChange={onNavigate} />
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Supplements for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Nutritional supplements and wellness protocols</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplement
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_supplements?patient_id=${globals.selected_patient_id}`}
            columns={['name', 'dosage', 'frequency', 'start_date', 'end_date']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Supplement Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingSupplement ? 'Edit Supplement' : 'Add New Supplement'}
          size="lg"
        >
          <SupplementForm
            supplement={editingSupplement}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Supplement"
          message={`Are you sure you want to delete "${deletingSupplement?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default Supplements;