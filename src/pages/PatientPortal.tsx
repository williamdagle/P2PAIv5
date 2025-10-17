import React, { useState, useEffect } from 'react';
import { Shield, Mail, Users } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PatientPortalAccessForm from '../components/PatientPortalAccessForm';
import SecureMessaging from '../components/SecureMessaging';
import DataTable from '../components/DataTable';

interface PatientPortalProps {
  onNavigate: (page: string) => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ onNavigate }) => {
  const { user } = useGlobal();
  const { addNotification } = useNotification();
  const [portalAccess, setPortalAccess] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'access' | 'messaging'>('access');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPortalAccess(), fetchMessages()]);
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortalAccess = async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get_patient_portal_access`,
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch portal access');
    const data = await response.json();
    setPortalAccess(data);
  };

  const fetchMessages = async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get_patient_messages`, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    setMessages(data);
  };

  const handleGrantAccess = async (accessData: any) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create_patient_portal_access`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accessData),
        }
      );

      if (!response.ok) throw new Error('Failed to grant portal access');

      addNotification('success', 'Portal access granted successfully');
      setShowAccessModal(false);
      fetchPortalAccess();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const handleSendMessage = async (messageData: any) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create_patient_message`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...messageData,
            patient_id: user?.id,
            organization_id: user?.organization_id,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      addNotification('success', 'Message sent successfully');
      fetchMessages();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/update_patient_message?id=${messageId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_read: true,
            read_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to mark message as read');
      fetchMessages();
    } catch (error: any) {
      addNotification('error', `Error: ${error.message}`);
    }
  };

  const portalAccessColumns = [
    { key: 'patient.first_name', label: 'Patient Name' },
    { key: 'access_level', label: 'Access Level' },
    { key: 'is_active', label: 'Status' },
    { key: 'activation_date', label: 'Activation Date' },
    { key: 'last_login', label: 'Last Login' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading portal data...</div>
      </div>
    );
  }

  return (
    <Layout>
      <Sidebar currentPage="PatientPortal" onPageChange={onNavigate} />

      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Patient Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Manage patient portal access and secure messaging
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('access')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Portal Access
            </button>
            <button
              onClick={() => setActiveTab('messaging')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'messaging'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Secure Messaging
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'access' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Portal Access Management
                </h2>
                <Button onClick={() => setShowAccessModal(true)}>
                  Grant Portal Access
                </Button>
              </div>
              <DataTable columns={portalAccessColumns} data={portalAccess} />
            </div>
          ) : (
            <SecureMessaging
              messages={messages}
              currentUserId={user?.id || ''}
              currentUserType="provider"
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        title="Grant Portal Access"
      >
        <PatientPortalAccessForm
          patientId=""
          organizationId={user?.organization_id || ''}
          onSubmit={handleGrantAccess}
          onCancel={() => setShowAccessModal(false)}
        />
      </Modal>
      </div>
    </Layout>
  );
};

export default PatientPortal;
