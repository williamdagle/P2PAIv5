import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApiWithCircuitBreaker } from '../hooks/useApiWithCircuitBreaker';

interface SystemStatusProps {
  className?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ className = '' }) => {
  const { getCircuitBreakerStatus } = useApiWithCircuitBreaker();

  const functions = [
    { name: 'get_users', label: 'User Management' },
    { name: 'get_clinics', label: 'Clinic Information' },
    { name: 'get_patients', label: 'Patient Data' },
    { name: 'get_appointments', label: 'Appointments' }
  ];

  const getStatusIcon = (functionName: string) => {
    const status = getCircuitBreakerStatus(functionName);
    
    if (status.isOpen) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (status.failures > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = (functionName: string) => {
    const status = getCircuitBreakerStatus(functionName);
    
    if (status.isOpen) {
      return 'Unavailable';
    } else if (status.failures > 0) {
      return `${status.failures} failures`;
    } else {
      return 'Available';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">System Status</h3>
      <div className="space-y-2">
        {functions.map((func) => (
          <div key={func.name} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{func.label}</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(func.name)}
              <span className="text-xs text-gray-500">{getStatusText(func.name)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;