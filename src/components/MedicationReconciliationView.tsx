import React, { useState } from 'react';
import { Pill, Plus, CreditCard as Edit2, AlertTriangle, CheckCircle, LayoutGrid, Table } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import MedicationForm from './MedicationForm';
import SupplementForm from './SupplementForm';
import DataTable from './DataTable';
import ConfirmDialog from './ConfirmDialog';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';

interface Medication {
  id: string;
  medication_name: string;
  name?: string;
  dosage: string;
  frequency: string;
  route?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'discontinued' | 'completed';
  prescriber?: string;
  indication?: string;
  notes?: string;
  created_at: string;
}

interface MedicationReconciliationViewProps {
  medications: Medication[];
  supplements?: any[];
  onRefresh: () => void;
}

const MedicationReconciliationView: React.FC<MedicationReconciliationViewProps> = ({
  medications,
  supplements = [],
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<any | null>(null);
  const [view, setView] = useState<'medications' | 'supplements' | 'all'>('all');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [deletingSupplement, setDeletingSupplement] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'medication' | 'supplement'>('medication');
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const { globals } = useGlobal();

  const activeMedications = medications.filter(med => {
    if (!med.end_date) return true;
    const endDate = new Date(med.end_date);
    const today = new Date();
    return endDate >= today;
  });
  const inactiveMedications = medications.filter(med => {
    if (!med.end_date) return false;
    const endDate = new Date(med.end_date);
    const today = new Date();
    return endDate < today;
  });
  const activeSupplements = supplements.filter((sup: any) => {
    if (!sup.end_date) return true;
    const endDate = new Date(sup.end_date);
    const today = new Date();
    return endDate >= today;
  });

  const handleFormSuccess = () => {
    setShowAddModal(false);
    setEditingMedication(null);
    setEditingSupplement(null);
    onRefresh();
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowAddModal(true);
  };

  const handleEditSupplement = (supplement: any) => {
    setEditingSupplement(supplement);
    setShowAddModal(true);
  };

  const handleDelete = (medication: Medication) => {
    setDeletingMedication(medication);
    setDeleteType('medication');
    setShowDeleteDialog(true);
  };

  const handleDeleteSupplement = (supplement: any) => {
    setDeletingSupplement(supplement);
    setDeleteType('supplement');
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteType === 'medication' && deletingMedication) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_medications?id=${deletingMedication.id}`,
          { method: 'DELETE' }
        );
        showSuccess('Medication deleted successfully');
        setDeletingMedication(null);
      } else if (deleteType === 'supplement' && deletingSupplement) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_supplements?id=${deletingSupplement.id}`,
          { method: 'DELETE' }
        );
        showSuccess('Supplement deleted successfully');
        setDeletingSupplement(null);
      }

      setShowDeleteDialog(false);
      onRefresh();
    } catch (err) {
      showError(`Failed to delete ${deleteType}`, 'Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComputedStatus = (med: Medication): 'active' | 'discontinued' | 'completed' => {
    if (!med.end_date) return 'active';
    const endDate = new Date(med.end_date);
    const today = new Date();
    return endDate >= today ? 'active' : 'completed';
  };

  const renderMedicationCard = (med: Medication) => {
    const computedStatus = getComputedStatus(med);
    return (
      <div
        key={med.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{med.medication_name || med.name}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                {computedStatus}
              </span>
            </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Dosage:</span> {med.dosage}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Frequency:</span> {med.frequency}
            </p>
            {med.route && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Route:</span> {med.route}
              </p>
            )}
            {med.indication && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Indication:</span> {med.indication}
              </p>
            )}
            <p className="text-sm text-gray-700">
              <span className="font-medium">Started:</span>{' '}
              {new Date(med.start_date).toLocaleDateString()}
            </p>
            {med.end_date && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Ended:</span>{' '}
                {new Date(med.end_date).toLocaleDateString()}
              </p>
            )}
            {med.prescriber && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Prescriber:</span> {med.prescriber}
              </p>
            )}
            {med.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">{med.notes}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditingMedication(med)}
          className="text-blue-600 hover:text-blue-900 ml-4"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    );
  };

  const renderSupplementCard = (sup: any) => {
    const computedStatus = getComputedStatus(sup);
    return (
      <div
        key={sup.id}
        className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{sup.name}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                {computedStatus}
              </span>
            </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Dosage:</span> {sup.dosage}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Frequency:</span> {sup.frequency}
            </p>
            {sup.brand && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Brand:</span> {sup.brand}
              </p>
            )}
            {sup.purpose && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Purpose:</span> {sup.purpose}
              </p>
            )}
            <p className="text-sm text-gray-700">
              <span className="font-medium">Started:</span>{' '}
              {new Date(sup.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleEditSupplement(sup)}
          className="text-blue-600 hover:text-blue-900 ml-4"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            Medication Reconciliation
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setView('all')}
              className={`px-3 py-1 rounded text-sm ${
                view === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({activeMedications.length + activeSupplements.length})
            </button>
            <button
              onClick={() => setView('medications')}
              className={`px-3 py-1 rounded text-sm ${
                view === 'medications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Medications ({activeMedications.length})
            </button>
            <button
              onClick={() => setView('supplements')}
              className={`px-3 py-1 rounded text-sm ${
                view === 'supplements'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Supplements ({activeSupplements.length})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setDisplayMode('cards')}
              className={`px-3 py-2 flex items-center gap-2 ${
                displayMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-2 flex items-center gap-2 border-l border-gray-300 ${
                displayMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-700 font-medium">Active Medications</p>
              <p className="text-2xl font-bold text-green-900">{activeMedications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Pill className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700 font-medium">Active Supplements</p>
              <p className="text-2xl font-bold text-blue-900">{activeSupplements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">Total Active</p>
              <p className="text-2xl font-bold text-yellow-900">
                {activeMedications.length + activeSupplements.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {displayMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {view === 'medications' ? (
            <DataTable
              apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_medications?patient_id=${globals.selected_patient_id}`}
              columns={['name', 'dosage', 'frequency', 'start_date', 'end_date', 'status']}
              showActions={true}
              searchable={true}
              searchPlaceholder="Search medications..."
              onEdit={handleEdit}
              onDelete={handleDelete}
              customRenderers={{
                name: (value: any, row: any) => row.medication_name || row.name || '-',
                status: (value: any, row: any) => {
                  const computedStatus = getComputedStatus(row);
                  return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                      {computedStatus}
                    </span>
                  );
                },
                start_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                end_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
              }}
            />
          ) : view === 'supplements' ? (
            <DataTable
              apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_supplements?patient_id=${globals.selected_patient_id}`}
              columns={['name', 'dosage', 'frequency', 'start_date', 'end_date', 'status']}
              showActions={true}
              searchable={true}
              searchPlaceholder="Search supplements..."
              onEdit={handleEditSupplement}
              onDelete={handleDeleteSupplement}
              customRenderers={{
                name: (value: any, row: any) => row.name || '-',
                status: (value: any, row: any) => {
                  const computedStatus = getComputedStatus(row);
                  return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                      {computedStatus}
                    </span>
                  );
                },
                start_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                end_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
              }}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medications</h3>
                <DataTable
                  apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_medications?patient_id=${globals.selected_patient_id}`}
                  columns={['name', 'dosage', 'frequency', 'start_date', 'end_date', 'status']}
                  showActions={true}
                  searchable={false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  customRenderers={{
                    name: (value: any, row: any) => row.medication_name || row.name || '-',
                    status: (value: any, row: any) => {
                      const computedStatus = getComputedStatus(row);
                      return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                          {computedStatus}
                        </span>
                      );
                    },
                    start_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                    end_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supplements</h3>
                <DataTable
                  apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_supplements?patient_id=${globals.selected_patient_id}`}
                  columns={['name', 'dosage', 'frequency', 'start_date', 'end_date', 'status']}
                  showActions={true}
                  searchable={false}
                  onEdit={handleEditSupplement}
                  onDelete={handleDeleteSupplement}
                  customRenderers={{
                    name: (value: any, row: any) => row.name || '-',
                    status: (value: any, row: any) => {
                      const computedStatus = getComputedStatus(row);
                      return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(computedStatus)}`}>
                          {computedStatus}
                        </span>
                      );
                    },
                    start_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                    end_date: (value: any) => value ? new Date(value).toLocaleDateString() : '-',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Active Medications */}
          {(view === 'all' || view === 'medications') && activeMedications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Medications</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeMedications.map(renderMedicationCard)}
              </div>
            </div>
          )}

          {/* Active Supplements */}
          {(view === 'all' || view === 'supplements') && activeSupplements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Supplements</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeSupplements.map(renderSupplementCard)}
              </div>
            </div>
          )}

          {/* Inactive Medications */}
          {view === 'medications' && inactiveMedications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Inactive Medications</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inactiveMedications.map(renderMedicationCard)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {activeMedications.length === 0 && activeSupplements.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No active medications or supplements</p>
          <p className="text-sm text-gray-500 mt-1">Add medications to track patient regimen</p>
        </div>
      )}

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Medication"
        >
          <MedicationForm onSuccess={handleFormSuccess} onCancel={() => setShowAddModal(false)} />
        </Modal>
      )}

      {editingMedication && (
        <Modal
          isOpen={!!editingMedication}
          onClose={() => setEditingMedication(null)}
          title="Edit Medication"
        >
          <MedicationForm
            medication={editingMedication}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingMedication(null)}
          />
        </Modal>
      )}

      {editingSupplement && (
        <Modal
          isOpen={!!editingSupplement}
          onClose={() => setEditingSupplement(null)}
          title="Edit Supplement"
        >
          <SupplementForm
            supplement={editingSupplement}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingSupplement(null)}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType === 'medication' ? 'Medication' : 'Supplement'}`}
        message={`Are you sure you want to delete "${
          deleteType === 'medication'
            ? (deletingMedication?.medication_name || deletingMedication?.name)
            : (deletingSupplement?.name)
        }"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default MedicationReconciliationView;
