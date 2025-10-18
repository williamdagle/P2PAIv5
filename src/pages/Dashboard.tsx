import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import Button from '../components/Button';
import SystemStatus from '../components/SystemStatus';
import { Users, Calendar, Activity, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { globals } = useGlobal();

  const quickActions = [
    {
      title: 'Patient Management',
      description: 'View and manage patient records',
      icon: Users,
      action: () => navigate('/patients'),
      color: 'bg-blue-500'
    },
    {
      title: 'Appointments',
      description: 'Schedule and view appointments',
      icon: Calendar,
      action: () => navigate('/appointments'),
      color: 'bg-green-500',
      disabled: !globals.selected_patient_id
    },
    {
      title: 'Treatment Plans',
      description: 'Manage patient treatment plans',
      icon: Activity,
      action: () => navigate('/treatment-plans'),
      color: 'bg-purple-500',
      disabled: !globals.selected_patient_id
    },
    {
      title: 'Analytics',
      description: 'View clinic performance metrics',
      icon: BarChart3,
      action: () => navigate('/admin'),
      color: 'bg-orange-500'
    }
  ];

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to P2PAI</h1>
          <p className="text-gray-600">your Functional Medicine EMR system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className={`
                  bg-white p-6 rounded-lg shadow-md border-l-4 transition-all hover:shadow-lg
                  ${action.color.replace('bg-', 'border-')}
                  ${action.disabled ? 'opacity-50' : 'hover:transform hover:scale-105 cursor-pointer'}
                `}
                onClick={!action.disabled ? action.action : undefined}
              >
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {action.description}
                    </p>
                    {action.disabled && (
                      <p className="text-xs text-amber-600">
                        Select a patient first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</div>
                <span>Start by viewing your patient list in the Patients section</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">2</div>
                <span>Select a patient to access their medical records and appointments</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">3</div>
                <span>Use the Admin panel to manage users and clinic settings</span>
              </div>
            </div>
          </div>
          
          <SystemStatus />
        </div>
      </div>
    
  );
};

export default Dashboard;
