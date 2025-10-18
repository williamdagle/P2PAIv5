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
import Button from '../components/Button';
import { Plus, FileText, CreditCard as Edit3, Stethoscope } from 'lucide-react';

interface ClinicalNotesProps {
  onNavigate: (page: string) => void;
}

const ClinicalNotes: React.FC<ClinicalNotesProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingNote, setDeletingNote] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (note: any) => {
    // Navigate to appropriate edit page based on note type
    if (note.note_type === 'provider_note') {
      // Store note data for editing
      // For now, navigate to create page - will enhance later
      onNavigate('CreateProviderNote');
    } else {
      onNavigate('CreateQuickNote');
    }
  };

  const handleDelete = (note: any) => {
    setDeletingNote(note);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;

    setDeleteLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_clinical_notes?id=${deletingNote.id}`,
        { method: 'DELETE' }
      );
      
      showSuccess('Clinical note deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteDialog(false);
      setDeletingNote(null);
    } catch (err) {
      showError('Failed to delete clinical note', 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <Sidebar currentPage="ClinicalNotes" onPageChange={onNavigate} />
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Clinical Notes for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Provider notes, visit documentation, and quick notes</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => onNavigate('CreateQuickNote')}
              variant="secondary"
              className="flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Quick Note
            </Button>
            <Button
              onClick={() => onNavigate('CreateProviderNote')}
              className="flex items-center"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Provider Note
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={refreshKey}
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_clinical_notes?patient_id=${globals.selected_patient_id}`}
            columns={['note_date', 'note_type', 'title', 'category']}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchable={true}
            searchPlaceholder="Search notes by title, content, or category..."
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Clinical Note"
          message={`Are you sure you want to delete "${deletingNote?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default ClinicalNotes;
