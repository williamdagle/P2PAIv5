import React, { useState } from 'react';
import { Plus, TestTube, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LabOrderForm from '../components/LabOrderForm';
import { useNotification } from '../hooks/useNotification';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';

interface LabOrdersProps {
  onNavigate: (page: string) => void;
}

const LabOrders: React.FC<LabOrdersProps> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, showError } = useNotification();
  const { globals } = useGlobal();
  const { apiCall } = useApi();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const handleCreate = async (data: any) => {
    try {
      await apiCall<any>(
        `${supabaseUrl}/functions/v1/create_lab_orders`,
        {
          method: 'POST',
          body: data,
        }
      );

      showSuccess('Lab order created successfully');
      setShowForm(false);
      setSelectedPatient(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError('Failed to create lab order', error.message);
    }
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setSelectedPatient({ id: order.patient_id });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedOrder(null);
    setSelectedPatient({ id: globals.selected_patient_id });
    setShowForm(true);
  };


  return (
    <Layout>
      <Sidebar currentPage="LabOrders" onPageChange={onNavigate} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TestTube className="w-8 h-8 text-blue-600" />
            Lab Orders
          </h1>
          <p className="text-gray-600 mt-1">
            Manage laboratory test orders and results
          </p>
        </div>
        {globals.selected_patient_id && (
          <Button onClick={handleAddNew} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Lab Order
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          key={refreshKey}
          apiUrl={`${supabaseUrl}/functions/v1/get_lab_orders${globals.selected_patient_id ? `?patient_id=${globals.selected_patient_id}` : ''}`}
          columns={['order_date', 'test_name', 'test_category', 'priority', 'order_status']}
          showActions={true}
          onEdit={handleEdit}
          customRenderers={{
            order_date: (value: string) => new Date(value).toLocaleDateString(),
            priority: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value === 'stat'
                    ? 'bg-red-100 text-red-800'
                    : value === 'urgent'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {value.toUpperCase()}
              </span>
            ),
            order_status: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value === 'resulted'
                    ? 'bg-green-100 text-green-800'
                    : value === 'in_lab'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {value.replace('_', ' ')}
              </span>
            ),
          }}
        />
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedOrder(null);
          setSelectedPatient(null);
        }}
        title={selectedOrder ? 'Edit Lab Order' : 'Add Lab Order'}
        size="lg"
      >
        {selectedPatient && (
          <LabOrderForm
            patientId={selectedPatient.id}
            clinicId={globals.clinic_id || ''}
            onClose={() => {
              setShowForm(false);
              setSelectedOrder(null);
              setSelectedPatient(null);
            }}
            onSubmit={handleCreate}
            initialData={selectedOrder}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default LabOrders;
