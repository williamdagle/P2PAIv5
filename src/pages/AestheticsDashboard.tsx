import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import {
  Sparkles,
  Camera,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  User,
  FileText,
  ShoppingBag,
} from 'lucide-react';

interface AestheticsDashboardProps {
  onNavigate: (page: string) => void;
}

const AestheticsDashboard: React.FC<AestheticsDashboardProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weeklyRevenue: 0,
    activeMemberships: 0,
    lowStockItems: 0,
    recentTreatments: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(false);
  };

  const quickActions = [
    {
      title: 'New Treatment',
      description: 'Document aesthetic treatment',
      icon: Sparkles,
      action: () => onNavigate('AestheticTreatments'),
      color: 'bg-blue-500',
      disabled: !globals.selected_patient_id,
    },
    {
      title: 'Upload Photos',
      description: 'Before/after documentation',
      icon: Camera,
      action: () => onNavigate('AestheticPhotos'),
      color: 'bg-green-500',
      disabled: !globals.selected_patient_id,
    },
    {
      title: 'Schedule Appointment',
      description: 'Book aesthetic procedure',
      icon: Calendar,
      action: () => onNavigate('AestheticAppointments'),
      color: 'bg-purple-500',
    },
    {
      title: 'Process Payment',
      description: 'POS and billing',
      icon: DollarSign,
      action: () => onNavigate('AestheticPOS'),
      color: 'bg-emerald-500',
    },
    {
      title: 'Manage Inventory',
      description: 'Products and supplies',
      icon: Package,
      action: () => onNavigate('AestheticInventory'),
      color: 'bg-orange-500',
    },
    {
      title: 'Memberships',
      description: 'Patient memberships',
      icon: TrendingUp,
      action: () => onNavigate('AestheticMemberships'),
      color: 'bg-pink-500',
    },
  ];

  const statCards = [
    { label: 'Today Appointments', value: stats.todayAppointments, icon: Calendar, color: 'text-blue-600' },
    { label: 'Weekly Revenue', value: `$${stats.weeklyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Memberships', value: stats.activeMemberships, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Low Stock Alerts', value: stats.lowStockItems, icon: Package, color: 'text-orange-600' },
  ];

  return (
    <Layout>
      <Sidebar currentPage="AestheticsDashboard" onPageChange={onNavigate} />

      <div>
        {globals.selected_patient_id && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Selected Patient</p>
                <p className="text-sm text-blue-700">{globals.selected_patient_name}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Sparkles className="w-8 h-8 mr-3 text-pink-500" />
            Aesthetics Dashboard
          </h1>
          <p className="text-gray-600">Manage treatments, photos, appointments, and billing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={!action.disabled ? action.action : undefined}
                  disabled={action.disabled}
                  className={`
                    bg-white p-6 rounded-lg shadow-md border-l-4 transition-all hover:shadow-lg text-left
                    ${action.color.replace('bg-', 'border-')}
                    ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:scale-105 cursor-pointer'}
                  `}
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{action.description}</p>
                      {action.disabled && (
                        <p className="text-xs text-amber-600">Select a patient first</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-700">
              <div className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                1
              </div>
              <span>Select a patient from the Patients section</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <div className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                2
              </div>
              <span>Document treatments and upload before/after photos</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <div className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                3
              </div>
              <span>Schedule follow-up appointments and process payments</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <div className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                4
              </div>
              <span>Manage inventory, memberships, and gift cards</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AestheticsDashboard;
