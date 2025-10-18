import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ChartExportForm from '../components/ChartExportForm';

const ChartExport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useGlobal();
  const { addNotification } = useNotification();
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${supabaseUrl}/functions/v1/get_chart_exports`, {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch exports');

      const data = await response.json();
      setExports(data);
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async (exportData: any) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/create_chart_export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) throw new Error('Failed to create export');

      addNotification('success', 'Chart export created successfully');
      setShowExportModal(false);
      fetchExports();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading exports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileDown className="w-8 h-8" />
            Chart Export & Reporting
          </h1>
          <p className="text-gray-600 mt-2">
            Generate and download patient chart exports and reports
          </p>
        </div>
        <Button onClick={() => setShowExportModal(true)}>
          <FileDown className="w-4 h-4 mr-2" />
          New Export
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export History</h2>
          {exports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No exports created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(exp.export_status)}
                        <h3 className="font-medium text-gray-900">
                          {exp.export_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            exp.export_status
                          )}`}
                        >
                          {exp.export_status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          Patient:{' '}
                          {exp.patient
                            ? `${exp.patient.first_name} ${exp.patient.last_name}`
                            : 'Unknown'}
                        </p>
                        <p>
                          Exported by: {exp.exported_by_user?.full_name || 'Unknown'}
                        </p>
                        <p>Created: {formatDate(exp.created_at)}</p>
                        {exp.date_range_start && exp.date_range_end && (
                          <p>
                            Date Range: {formatDate(exp.date_range_start)} -{' '}
                            {formatDate(exp.date_range_end)}
                          </p>
                        )}
                        {exp.sections_included && exp.sections_included.length > 0 && (
                          <p>
                            Sections: {exp.sections_included.length} included
                          </p>
                        )}
                      </div>
                      {exp.recipient_info && (
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                          <p className="font-medium text-blue-900 mb-1">
                            Referral Recipient:
                          </p>
                          <p className="text-blue-800">
                            {exp.recipient_info.name} - {exp.recipient_info.organization}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {exp.export_status === 'completed' && (
                        <Button variant="secondary" size="sm">
                          <FileDown className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Available Export Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">PDF Chart Summary</h4>
            <p className="text-sm text-gray-600">
              Comprehensive patient chart in PDF format with selected sections
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Continuity of Care Document
            </h4>
            <p className="text-sm text-gray-600">
              Standardized CCD format for health information exchange
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Referral Summary</h4>
            <p className="text-sm text-gray-600">
              Focused summary for specialist referrals with recipient information
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Full Chart Print</h4>
            <p className="text-sm text-gray-600">
              Complete patient chart with all available sections
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Create Chart Export"
      >
        <ChartExportForm
          patientId=""
          exportedBy={user?.id || ''}
          organizationId={user?.organization_id || ''}
          onSubmit={handleCreateExport}
          onCancel={() => setShowExportModal(false)}
        />
      </Modal>
    </div>
  );
};

export default ChartExport;
