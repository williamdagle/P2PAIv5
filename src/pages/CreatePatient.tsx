import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import PatientForm from '../components/PatientForm';
import { ArrowLeft } from 'lucide-react';

const CreatePatient: React.FC = () => {
  const navigate = useNavigate();
  const handleSuccess = () => {
    navigate('/patients');
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  return (
    <div>
      <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/patients')}
            className="mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Patient</h1>
          <p className="text-gray-600">Add a new patient to the system</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <PatientForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    
  );
};

export default CreatePatient;
