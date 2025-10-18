import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, FlaskConical, Pill, Cable as Capsule, Settings, Home, UserCheck, CalendarDays, FileText, Wrench, ClipboardCheck, CheckSquare, Stethoscope, HeartPulse, ClipboardList, TestTube, Shield, FileDown, FolderOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

interface SidebarEnhancedProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

const SidebarEnhanced: React.FC<SidebarEnhancedProps> = ({ currentPage, onPageChange }) => {
  const { getAccessToken, signOut } = useAuth();
  const { selectedPatientId, selectedPatientName } = usePatient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      await auditLogger.endSession('user_initiated');

      if (session && getAccessToken()) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_authentication_event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            email: session.user.email,
            auth_user_id: session.user.id,
            event_type: 'logout',
            user_agent: navigator.userAgent
          })
        }).catch(() => {
          // Silent fail for audit logging
        });
      }
    } catch {
      // Silent fail for audit logging
    }

    auditLogger.clearCredentials();
    await signOut();
    onPageChange?.('Login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'Patients', icon: Users, page: 'Patients' },
    { name: 'Patient Chart', icon: Stethoscope, page: 'PatientChart', disabled: !selectedPatientId },
    { name: 'Functional Medicine', icon: HeartPulse, page: 'FunctionalMedicine', disabled: !selectedPatientId },
    { name: 'Tasks', icon: CheckSquare, page: 'Tasks' },
    { name: 'Provider Calendar', icon: CalendarDays, page: 'ProviderCalendar' },
    { name: 'Appointments', icon: Calendar, page: 'Appointments', disabled: !selectedPatientId },
    { name: 'Clinical Assessments', icon: ClipboardList, page: 'ClinicalAssessments' },
    { name: 'Lab Orders', icon: TestTube, page: 'LabOrders' },
    { name: 'Treatment Plans', icon: Activity, page: 'TreatmentPlans', disabled: !selectedPatientId },
    { name: 'Clinical Notes', icon: FileText, page: 'ClinicalNotes', disabled: !selectedPatientId },
    { name: 'Labs', icon: FlaskConical, page: 'Labs', disabled: !selectedPatientId },
    { name: 'Medications', icon: Pill, page: 'Medications', disabled: !selectedPatientId },
    { name: 'Supplements', icon: Capsule, page: 'Supplements', disabled: !selectedPatientId },
    { name: 'Admin', icon: Settings, page: 'Admin' },
    { name: 'Compliance Reporting', icon: ClipboardCheck, page: 'ComplianceReporting' },
    { name: 'Manage Templates', icon: Wrench, page: 'ManageTemplates' },
    { name: 'Document Management', icon: FolderOpen, page: 'DocumentManagement' },
    { name: 'Patient Portal', icon: Shield, page: 'PatientPortal' },
    { name: 'Chart Export', icon: FileDown, page: 'ChartExport' },
    { name: 'User Migration', icon: UserCheck, page: 'UserMigration' },
  ];

  const handleMenuItemClick = (page: string, isDisabled: boolean) => {
    if (!isDisabled) {
      onPageChange?.(page);
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg"
        aria-label="Open navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <img src="/p2plogov3.png" alt="P2PAI Logo" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold text-gray-900"></h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="mt-6 flex-1 overflow-y-auto" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.name}
                onClick={() => handleMenuItemClick(item.page, !!isDisabled)}
                disabled={isDisabled}
                role="menuitem"
                aria-label={`Navigate to ${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={isDisabled}
                className={`
                  w-full flex items-center px-6 py-3 text-left transition-colors
                  ${isActive
                    ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer with selected patient and sign out */}
        {selectedPatientName ? (
          <div className="p-4 border-t border-gray-200 bg-blue-50 flex-shrink-0">
            <p className="text-sm font-medium text-blue-900">Selected Patient:</p>
            <p className="text-sm text-blue-700 mb-2">{selectedPatientName}</p>
            <button
              onClick={handleSignOut}
              className="w-full text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label="Sign out of application"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="w-full text-sm text-gray-600 hover:text-gray-800 underline text-center focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1"
              aria-label="Sign out of application"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarEnhanced;
