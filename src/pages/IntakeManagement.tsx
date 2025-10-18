import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import { ClipboardList, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const IntakeManagement: React.FC = () => {
  const { globals } = useGlobal();
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue'>('assigned');

  const tabs = [
    { id: 'all' as const, label: 'All Assignments', icon: ClipboardList },
    { id: 'assigned' as const, label: 'Pending', icon: Clock },
    { id: 'in_progress' as const, label: 'In Progress', icon: AlertCircle },
    { id: 'completed' as const, label: 'Completed', icon: CheckCircle },
    { id: 'overdue' as const, label: 'Overdue', icon: XCircle }
  ];

  const getApiUrl = () => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_form_assignments`;
    if (activeTab === 'all') return baseUrl;
    if (activeTab === 'overdue') {
      return `${baseUrl}?status=assigned`;
    }
    return `${baseUrl}?status=${activeTab}`;
  };

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
            Intake Management
          </h1>
          <p className="text-gray-600">Monitor and manage patient intake form assignments</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            key={activeTab}
            apiUrl={getApiUrl()}
            columns={['patient_name', 'form_name', 'category', 'status', 'priority', 'assigned_date', 'due_date']}
            searchable={true}
            searchPlaceholder="Search form assignments..."
            customRenderers={{
              patient_name: (_: any, row: any) => {
                const patient = row.patient;
                return patient ? `${patient.first_name} ${patient.last_name}` : 'N/A';
              },
              form_name: (_: any, row: any) => {
                return row.form?.form_name || 'N/A';
              },
              category: (_: any, row: any) => {
                const category = row.form?.category || 'other';
                return category.charAt(0).toUpperCase() + category.slice(1);
              },
              status: (value: string) => {
                const statusConfig: Record<string, { color: string; icon: any }> = {
                  assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock },
                  in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
                  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                  expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
                  waived: { color: 'bg-gray-100 text-gray-600', icon: XCircle }
                };
                const config = statusConfig[value] || statusConfig.assigned;
                const Icon = config.icon;
                return (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {value.replace('_', ' ').toUpperCase()}
                  </span>
                );
              },
              priority: (value: string) => {
                const priorityColors: Record<string, string> = {
                  low: 'bg-gray-100 text-gray-600',
                  medium: 'bg-blue-100 text-blue-800',
                  high: 'bg-orange-100 text-orange-800',
                  urgent: 'bg-red-100 text-red-800'
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[value] || 'bg-gray-100'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              assigned_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              due_date: (value: string, row: any) => {
                if (!value) return 'No due date';
                const dueDate = new Date(value);
                const today = new Date();
                const isOverdue = dueDate < today && row.status !== 'completed';
                return (
                  <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                    {dueDate.toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </span>
                );
              }
            }}
          />
        </div>
      </div>
    
  );
};

export default IntakeManagement;
