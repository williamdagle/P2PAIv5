import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TreatmentPlanForm from '../components/TreatmentPlanForm';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

const TreatmentPlans: React.FC = () => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddNew = () => {
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = (plan: any) => {
    setDeletingPlan(plan);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingPlan) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_treatment_plans?id=${deletingPlan.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Treatment plan deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingPlan(null);
    } catch (err) {
      showError('Failed to delete treatment plan', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    showSuccess(
      editingPlan ? 'Treatment plan updated successfully' : 'Treatment plan created successfully'
    );
    setShowForm(false);
    setEditingPlan(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Treatment Plans for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">View and manage patient treatment protocols</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Treatment Plan
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_treatment_plans?patient_id=${globals.selected_patient_id}`}
            columns={['title', 'description', 'status']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Treatment Plan Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingPlan ? 'Edit Treatment Plan' : 'Create New Treatment Plan'}
          size="lg"
        >
          <TreatmentPlanForm
            treatmentPlan={editingPlan}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Treatment Plan"
          message={`Are you sure you want to delete "${deletingPlan?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    
  );
};

export default TreatmentPlans;
