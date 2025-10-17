import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import MembershipForm from '../components/MembershipForm';
import { TrendingUp, Plus, Users, DollarSign, CreditCard, AlertCircle } from 'lucide-react';

interface AestheticMembershipsProps {
  onNavigate: (page: string) => void;
}

const AestheticMemberships: React.FC<AestheticMembershipsProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [stats, setStats] = useState({
    activeMembers: 0,
    monthlyRevenue: 0,
    totalCredits: 0,
  });

  useEffect(() => {
    loadMemberships();
    loadPatients();
  }, [globals.clinic_id]);

  const loadMemberships = async () => {
    if (!globals.clinic_id) return;

    try {
      const data = await apiCall('get_aesthetic_memberships', 'GET', null, {
        clinic_id: globals.clinic_id,
      });
      setMemberships(data || []);

      const active = data?.filter((m: any) => m.status === 'active') || [];
      const monthlyRevenue = active.reduce((sum: number, m: any) => sum + parseFloat(m.monthly_fee || 0), 0);
      const totalCredits = active.reduce((sum: number, m: any) => sum + parseFloat(m.credits_balance || 0), 0);

      setStats({
        activeMembers: active.length,
        monthlyRevenue,
        totalCredits,
      });
    } catch (error: any) {
      showError(error.message || 'Failed to load memberships');
    }
  };

  const loadPatients = async () => {
    if (!globals.clinic_id) return;

    try {
      const data = await apiCall('get_patients', 'GET', null, {
        clinic_id: globals.clinic_id,
      });
      setPatients(data || []);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
    }
  };

  const handleCreateMembership = async (data: any) => {
    setLoading(true);
    try {
      await apiCall('create_membership', 'POST', data);
      showSuccess('Membership created successfully!');
      setShowEnrollModal(false);
      setSelectedPatient(null);
      loadMemberships();
    } catch (error: any) {
      showError(error.message || 'Failed to create membership');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMembership = async (membershipId: string) => {
    if (!confirm('Are you sure you want to cancel this membership?')) return;

    try {
      await apiCall('cancel_membership', 'POST', {
        membership_id: membershipId,
        cancellation_reason: 'Cancelled by staff',
      });
      showSuccess('Membership cancelled successfully');
      loadMemberships();
    } catch (error: any) {
      showError(error.message || 'Failed to cancel membership');
    }
  };

  const handleSelectPatient = (patient: any) => {
    const hasActiveMembership = memberships.some(
      (m: any) => m.patient_id === patient.id && m.status === 'active'
    );

    if (hasActiveMembership) {
      showError('This patient already has an active membership');
      return;
    }

    setSelectedPatient(patient);
    setShowEnrollModal(true);
  };

  return (
    <Layout>
      <Sidebar currentPage="AestheticMemberships" onPageChange={onNavigate} />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Patient Memberships
            </h1>
            <p className="text-gray-600">Manage recurring membership programs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalCredits.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enroll New Member</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-4">Select a patient to enroll in a membership program</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {patients.slice(0, 6).map((patient: any) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{patient.email}</div>
                </button>
              ))}
            </div>
            {patients.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No patients found. Create patients first.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Active Memberships</h2>
          </div>
          <DataTable
            data={memberships}
            columns={[
              {
                key: 'patient_id',
                label: 'Patient',
                render: (row: any) => {
                  const patient = patients.find((p: any) => p.id === row.patient_id);
                  return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
                },
              },
              {
                key: 'membership_name',
                label: 'Tier',
                render: (row: any) => (
                  <span className="font-semibold">{row.membership_name}</span>
                ),
              },
              {
                key: 'monthly_fee',
                label: 'Monthly Fee',
                render: (row: any) => `$${parseFloat(row.monthly_fee).toFixed(2)}`,
              },
              {
                key: 'credits_balance',
                label: 'Credits',
                render: (row: any) => (
                  <span className="font-semibold text-purple-600">
                    ${parseFloat(row.credits_balance).toFixed(2)}
                  </span>
                ),
              },
              {
                key: 'discount_percentage',
                label: 'Discount',
                render: (row: any) => `${row.discount_percentage}%`,
              },
              {
                key: 'status',
                label: 'Status',
                render: (row: any) => {
                  const colors: any = {
                    active: 'bg-green-100 text-green-800',
                    paused: 'bg-yellow-100 text-yellow-800',
                    cancelled: 'bg-red-100 text-red-800',
                    expired: 'bg-gray-100 text-gray-800',
                  };

                  return (
                    <span className={`px-2 py-1 text-xs rounded-full ${colors[row.status]}`}>
                      {row.status.toUpperCase()}
                    </span>
                  );
                },
              },
              {
                key: 'start_date',
                label: 'Start Date',
                render: (row: any) => new Date(row.start_date).toLocaleDateString(),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row: any) => (
                  row.status === 'active' && (
                    <button
                      onClick={() => handleCancelMembership(row.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )
                ),
              },
            ]}
            searchPlaceholder="Search memberships..."
          />
        </div>

        {selectedPatient && (
          <Modal
            isOpen={showEnrollModal}
            onClose={() => {
              setShowEnrollModal(false);
              setSelectedPatient(null);
            }}
            title="Enroll in Membership"
            maxWidth="6xl"
          >
            <MembershipForm
              clinicId={globals.clinic_id}
              patientId={selectedPatient.id}
              patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
              onSubmit={handleCreateMembership}
              onCancel={() => {
                setShowEnrollModal(false);
                setSelectedPatient(null);
              }}
              loading={loading}
            />
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default AestheticMemberships;
