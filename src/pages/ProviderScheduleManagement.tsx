import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProviderScheduleManagement: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/clinic-settings', { state: { activeTab: 'provider-schedules' } });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Redirecting to Clinic Settings...</span>
    </div>
  );
};

export default ProviderScheduleManagement;
