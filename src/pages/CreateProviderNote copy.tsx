import React, { useState } from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import ProviderNoteForm from '../components/notes/ProviderNoteForm';
import { ArrowLeft, Stethoscope } from 'lucide-react';

interface CreateProviderNoteProps {
  onNavigate: (page: string) => void;
}

const CreateProviderNote: React.FC<CreateProviderNoteProps> = ({ onNavigate }) => {
  const handleSuccess = () => {
    onNavigate('ClinicalNotes');
  };

  const handleCancel = () => {
    onNavigate('ClinicalNotes');
  };

  return (
    <Layout>
      <Sidebar currentPage="CreateProviderNote" onPageChange={onNavigate} />
      
      <div>
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('ClinicalNotes')}
            className="mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clinical Notes
          </Button>
          <div className="flex items-center mb-2">
            <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Provider Note</h1>
          </div>
          <p className="text-gray-600">Document clinical findings, assessments, and treatment plans</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
          <ProviderNoteForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CreateProviderNote;
