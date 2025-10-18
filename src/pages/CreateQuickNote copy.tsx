import React, { useState } from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import QuickNoteForm from '../components/notes/QuickNoteForm';
import { ArrowLeft, CreditCard as Edit3 } from 'lucide-react';

interface CreateQuickNoteProps {
  onNavigate: (page: string) => void;
}

const CreateQuickNote: React.FC<CreateQuickNoteProps> = ({ onNavigate }) => {
  const handleSuccess = () => {
    onNavigate('ClinicalNotes');
  };

  const handleCancel = () => {
    onNavigate('ClinicalNotes');
  };

  return (
    <Layout>
      <Sidebar currentPage="CreateQuickNote" onPageChange={onNavigate} />
      
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
            <Edit3 className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Quick Note</h1>
          </div>
          <p className="text-gray-600">Add a quick note or observation about the patient</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <QuickNoteForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CreateQuickNote;
