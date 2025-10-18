import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DocumentUploadForm from '../components/DocumentUploadForm';
import DocumentViewer from '../components/DocumentViewer';

const DocumentManagement: React.FC = () => {
  const { user } = useGlobal();
  const { addNotification } = useNotification();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get_patient_documents`,
        {
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch documents');

      const data = await response.json();
      setDocuments(data);
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (documentData: any) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create_patient_documents`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData),
        }
      );

      if (!response.ok) throw new Error('Failed to upload document');

      const newDoc = await response.json();

      if (documentData.metadata) {
        await fetch(`${supabaseUrl}/functions/v1/create_document_metadata`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_id: newDoc.id,
            category: documentData.metadata.category,
            tags: documentData.metadata.tags,
            visit_date: documentData.metadata.visit_date,
            notes: documentData.metadata.notes,
            organization_id: documentData.organization_id,
          }),
        });
      }

      addNotification('success', 'Document uploaded successfully');
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete_patient_documents?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete document');

      addNotification('success', 'Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const handleDownloadDocument = (document: any) => {
    addNotification('info', 'Document download functionality to be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    
      

      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Document Management
          </h1>
          <p className="text-gray-600 mt-2">
            Upload, organize, and manage patient documents
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DocumentViewer
          documents={documents}
          onDelete={handleDeleteDocument}
          onDownload={handleDownloadDocument}
        />
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <DocumentUploadForm
          patientId={selectedPatientId || ''}
          organizationId={user?.organization_id || ''}
          uploadedBy={user?.id || ''}
          onSubmit={handleUploadDocument}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>
      </div>
    
  );
};

export default DocumentManagement;
