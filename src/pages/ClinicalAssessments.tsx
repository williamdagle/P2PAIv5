import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar } from 'lucide-react';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ClinicalAssessmentForm from '../components/ClinicalAssessmentForm';
import { useNotification } from '../hooks/useNotification';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';

const ClinicalAssessments: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, showError } = useNotification();
  const { globals } = useGlobal();
  const { apiCall } = useApi();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const handleCreate = async (data: any) => {
    try {
      await apiCall<any>(
        `${supabaseUrl}/functions/v1/create_clinical_assessments`,
        {
          method: 'POST',
          body: data,
        }
      );

      showSuccess('Clinical assessment created successfully');
      setShowForm(false);
      setSelectedPatient(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to create clinical assessment', error.message);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await apiCall<any>(
        `${supabaseUrl}/functions/v1/update_clinical_assessments?id=${selectedAssessment.id}`,
        {
          method: 'PUT',
          body: data,
        }
      );

      showSuccess('Clinical assessment updated successfully');
      setShowForm(false);
      setSelectedAssessment(null);
      setSelectedPatient(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to update clinical assessment', error.message);
    }
  };

  const handleEdit = (assessment: any) => {
    setSelectedAssessment(assessment);
    setSelectedPatient({ id: assessment.patient_id });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedAssessment(null);
    setSelectedPatient({ id: globals.selected_patient_id });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Clinical Assessments
          </h1>
          <p className="text-gray-600 mt-1">
            Manage patient clinical assessments and diagnoses
          </p>
        </div>
        {globals.selected_patient_id && (
          <Button onClick={handleAddNew} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Assessment
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          key={refreshKey}
          apiUrl={`${supabaseUrl}/functions/v1/get_clinical_assessments${globals.selected_patient_id ? `?patient_id=${globals.selected_patient_id}` : ''}`}
          columns={['visit_date', 'primary_diagnosis', 'primary_diagnosis_icd10', 'risk_stratification', 'created_at']}
          showActions={true}
          onEdit={handleEdit}
          customRenderers={{
            visit_date: (value: string) => new Date(value).toLocaleDateString(),
            created_at: (value: string) => new Date(value).toLocaleDateString(),
            risk_stratification: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value === 'high'
                    ? 'bg-red-100 text-red-800'
                    : value === 'moderate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {value}
              </span>
            ),
          }}
        />
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedAssessment(null);
          setSelectedPatient(null);
        }}
        title={selectedAssessment ? 'Edit Clinical Assessment' : 'Add Clinical Assessment'}
        size="lg"
      >
        {selectedPatient && (
          <ClinicalAssessmentForm
            patientId={selectedPatient.id}
            clinicId={globals.clinic_id || ''}
            onClose={() => {
              setShowForm(false);
              setSelectedAssessment(null);
              setSelectedPatient(null);
            }}
            onSubmit={selectedAssessment ? handleUpdate : handleCreate}
            initialData={selectedAssessment}
          />
        )}
      </Modal>
    
    </div>
  );
};

export default ClinicalAssessments;
