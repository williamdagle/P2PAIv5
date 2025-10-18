import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ProviderScheduleForm from '../components/ProviderScheduleForm';
import { Calendar, Clock, Settings, User } from 'lucide-react';

const ProviderScheduleManagement: React.FC = () => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await apiCall<any>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
        { method: 'GET' }
      );

      if (response.users) {
        const providerUsers = response.users.filter((u: any) =>
          ['provider', 'clinic_admin', 'admissions_advisor'].includes(u.role)
        );
        setProviders(providerUsers);
      }
    } catch (err) {
      showError('Failed to load providers', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSchedule = (provider: any) => {
    setSelectedProvider(provider);
    setShowScheduleForm(true);
  };

  const handleScheduleSuccess = () => {
    showSuccess('Schedule saved successfully');
    setShowScheduleForm(false);
    setSelectedProvider(null);
  };

  const handleScheduleCancel = () => {
    setShowScheduleForm(false);
    setSelectedProvider(null);
  };

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Schedule Management</h1>
          <p className="text-gray-600">Configure working hours, breaks, and availability for providers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading providers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{provider.full_name}</h3>
                    <p className="text-sm text-gray-600">{provider.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {provider.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Weekly Schedule</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Working Hours & Breaks</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Preferences</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleManageSchedule(provider)}
                  className="w-full"
                >
                  Manage Schedule
                </Button>
              </div>
            ))}
          </div>
        )}

        {providers.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Providers Found</h3>
            <p className="text-gray-600">
              There are no providers configured in your clinic yet.
            </p>
          </div>
        )}

        <Modal
          isOpen={showScheduleForm}
          onClose={handleScheduleCancel}
          title={`Manage Schedule - ${selectedProvider?.full_name}`}
          size="xl"
        >
          {selectedProvider && (
            <ProviderScheduleForm
              providerId={selectedProvider.id}
              onSuccess={handleScheduleSuccess}
              onCancel={handleScheduleCancel}
            />
          )}
        </Modal>
      </div>
    
  );
};

export default ProviderScheduleManagement;
