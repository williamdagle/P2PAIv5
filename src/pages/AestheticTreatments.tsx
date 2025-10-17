import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import AestheticTreatmentForm from '../components/AestheticTreatmentForm';
import { Sparkles, Plus, Eye, Edit, Trash2, Calendar } from 'lucide-react';

interface AestheticTreatmentsProps {
  onNavigate: (page: string) => void;
}

const AestheticTreatments: React.FC<AestheticTreatmentsProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);

  useEffect(() => {
    if (globals.selected_patient_id) {
      loadTreatments();
    }
  }, [globals.selected_patient_id]);

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const data = await apiCall('get_aesthetic_treatments', 'POST', {
        patient_id: globals.selected_patient_id,
      });
      setTreatments(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load treatments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this treatment record?')) return;

    try {
      await apiCall('delete_aesthetic_treatment', 'POST', { id });
      showSuccess('Treatment deleted successfully');
      loadTreatments();
    } catch (error: any) {
      showError(error.message || 'Failed to delete treatment');
    }
  };

  const handleEdit = (treatment: any) => {
    setSelectedTreatment(treatment);
    setShowFormModal(true);
  };

  const handleView = (treatment: any) => {
    setSelectedTreatment(treatment);
    setShowViewModal(true);
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedTreatment(null);
    loadTreatments();
  };

  if (!globals.selected_patient_id) {
    return (
      <Layout>
        <Sidebar currentPage="AestheticTreatments" onPageChange={onNavigate} />
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Patient Selected</h2>
          <p className="text-gray-600 mb-6">Please select a patient to view treatments</p>
          <Button onClick={() => onNavigate('Patients')}>
            Select Patient
          </Button>
        </div>
      </Layout>
    );
  }

  const columns = [
    {
      key: 'treatment_date',
      label: 'Date',
      render: (row: any) => new Date(row.treatment_date).toLocaleDateString(),
    },
    { key: 'treatment_type', label: 'Type' },
    { key: 'treatment_name', label: 'Treatment' },
    {
      key: 'areas_treated',
      label: 'Areas',
      render: (row: any) => (
        <span className="text-sm">{row.areas_treated?.slice(0, 2).join(', ')}{row.areas_treated?.length > 2 ? '...' : ''}</span>
      ),
    },
    {
      key: 'is_completed',
      label: 'Status',
      render: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${row.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {row.is_completed ? 'Completed' : 'In Progress'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <Sidebar currentPage="AestheticTreatments" onPageChange={onNavigate} />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Sparkles className="w-8 h-8 mr-3 text-pink-500" />
              Aesthetic Treatments for {globals.selected_patient_name}
            </h1>
            <p className="text-gray-600">Treatment history and documentation</p>
          </div>
          <Button
            onClick={() => {
              setSelectedTreatment(null);
              setShowFormModal(true);
            }}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Treatment
          </Button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading treatments...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Treatments Yet</h2>
            <p className="text-gray-600 mb-6">Start documenting aesthetic treatments for this patient</p>
            <Button onClick={() => setShowFormModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Treatment
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <DataTable
              data={treatments}
              columns={columns}
              searchPlaceholder="Search treatments..."
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedTreatment(null);
        }}
        title={selectedTreatment ? 'Edit Treatment' : 'New Treatment'}
        maxWidth="4xl"
      >
        <AestheticTreatmentForm
          treatment={selectedTreatment}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowFormModal(false);
            setSelectedTreatment(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTreatment(null);
        }}
        title="Treatment Details"
        maxWidth="3xl"
      >
        {selectedTreatment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-lg">{new Date(selectedTreatment.treatment_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-lg">{selectedTreatment.treatment_type}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Treatment Name</p>
                <p className="text-lg">{selectedTreatment.treatment_name}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Areas Treated</p>
              <div className="flex flex-wrap gap-2">
                {selectedTreatment.areas_treated?.map((area: string) => (
                  <span key={area} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {selectedTreatment.products_used && selectedTreatment.products_used.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Products Used</p>
                <div className="space-y-2">
                  {selectedTreatment.products_used.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{product.name}</span>
                      <span className="text-gray-600">{product.units} {product.batch && `(Batch: ${product.batch})`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedTreatment.units_used || selectedTreatment.volume_ml) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedTreatment.units_used && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Units Used</p>
                    <p className="text-lg">{selectedTreatment.units_used}</p>
                  </div>
                )}
                {selectedTreatment.volume_ml && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Volume</p>
                    <p className="text-lg">{selectedTreatment.volume_ml} mL</p>
                  </div>
                )}
              </div>
            )}

            {selectedTreatment.technique_notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Technique Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTreatment.technique_notes}</p>
              </div>
            )}

            {selectedTreatment.patient_tolerance && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Patient Tolerance</p>
                <p className="text-gray-700">{selectedTreatment.patient_tolerance}</p>
              </div>
            )}

            {selectedTreatment.immediate_response && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Immediate Response</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTreatment.immediate_response}</p>
              </div>
            )}

            {selectedTreatment.adverse_events && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Adverse Events</p>
                <p className="text-red-700 whitespace-pre-wrap">{selectedTreatment.adverse_events}</p>
              </div>
            )}

            {selectedTreatment.clinical_notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Clinical Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTreatment.clinical_notes}</p>
              </div>
            )}

            {selectedTreatment.follow_up_date && (
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Follow-up Scheduled</p>
                  <p className="text-blue-700">{new Date(selectedTreatment.follow_up_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                handleEdit(selectedTreatment);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Treatment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AestheticTreatments;
