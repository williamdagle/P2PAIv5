import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, FlaskConical, Pill, Cable as Capsule, Settings, Home, UserCheck, CalendarDays, FileText, Wrench, ClipboardCheck, CheckSquare, Stethoscope, HeartPulse, ClipboardList, TestTube, Shield, FileDown, FolderOpen, Menu, X, Sparkles, Camera, DollarSign, Package, CreditCard, TrendingUp, ChevronDown, ChevronRight, Building2, UserPlus, FileEdit, MapPin } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

interface SidebarProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { globals, clearGlobals } = useGlobal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'aesthetics'>('clinical');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'patient-care': true,
    'charting': true,
    'group-intake': true,
    'administration': false,
    'aesthetics-core': true,
    'aesthetics-business': true,
  });
  const navRef = React.useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      await auditLogger.endSession('user_initiated');

      if (session && globals.access_token) {
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
    await supabase.auth.signOut();
    clearGlobals();
    onPageChange?.('Login');
  };

  const clinicalSections = {
    'patient-care': {
      title: 'Patient Care',
      items: [
        { name: 'Dashboard', icon: Home, page: 'Dashboard' },
        { name: 'Patients', icon: Users, page: 'Patients' },
        { name: 'Patient Chart', icon: Stethoscope, page: 'PatientChart', disabled: !globals.selected_patient_id },
        { name: 'Functional Medicine', icon: HeartPulse, page: 'FunctionalMedicine', disabled: !globals.selected_patient_id },
        { name: 'Appointments', icon: Calendar, page: 'Appointments', disabled: !globals.selected_patient_id },
        { name: 'Tasks', icon: CheckSquare, page: 'Tasks' },
        { name: 'Provider Calendar', icon: CalendarDays, page: 'ProviderCalendar' },
      ]
    },
    'charting': {
      title: 'Charting & Orders',
      items: [
        { name: 'Clinical Notes', icon: FileText, page: 'ClinicalNotes', disabled: !globals.selected_patient_id },
        { name: 'Clinical Assessments', icon: ClipboardList, page: 'ClinicalAssessments' },
        { name: 'Treatment Plans', icon: Activity, page: 'TreatmentPlans', disabled: !globals.selected_patient_id },
        { name: 'Lab Orders', icon: TestTube, page: 'LabOrders' },
        { name: 'Labs', icon: FlaskConical, page: 'Labs', disabled: !globals.selected_patient_id },
        { name: 'Medications', icon: Pill, page: 'Medications', disabled: !globals.selected_patient_id },
        { name: 'Supplements', icon: Capsule, page: 'Supplements', disabled: !globals.selected_patient_id },
      ]
    },
    'group-intake': {
      title: 'Groups & Intake',
      items: [
        { name: 'Patient Groups', icon: UserPlus, page: 'PatientGroupsManagement' },
        { name: 'Form Builder', icon: FileEdit, page: 'FormBuilder' },
        { name: 'Intake Management', icon: ClipboardList, page: 'IntakeManagement' },
        { name: 'State Configuration', icon: MapPin, page: 'StateConfiguration' },
      ]
    },
    'administration': {
      title: 'Administration',
      items: [
        { name: 'Admin', icon: Settings, page: 'Admin' },
        { name: 'System Settings', icon: Settings, page: 'SystemSettings' },
        { name: 'Clinic Settings', icon: Building2, page: 'ClinicSettings' },
        { name: 'Compliance Reporting', icon: ClipboardCheck, page: 'ComplianceReporting' },
        { name: 'Manage Templates', icon: Wrench, page: 'ManageTemplates' },
        { name: 'Manage Appointment Types', icon: CalendarDays, page: 'ManageAppointmentTypes' },
        { name: 'Provider Schedules', icon: CalendarDays, page: 'ProviderScheduleManagement' },
        { name: 'Document Management', icon: FolderOpen, page: 'DocumentManagement' },
        { name: 'Patient Portal', icon: Shield, page: 'PatientPortal' },
        { name: 'Chart Export', icon: FileDown, page: 'ChartExport' },
        { name: 'User Migration', icon: UserCheck, page: 'UserMigration' },
      ]
    }
  };

  const aestheticsSections = {
    'aesthetics-core': {
      title: 'Patient Services',
      items: [
        { name: 'Aesthetics Dashboard', icon: Sparkles, page: 'AestheticsDashboard' },
        { name: 'Aesthetic Treatments', icon: Sparkles, page: 'AestheticTreatments', disabled: !globals.selected_patient_id },
        { name: 'Photos & Analysis', icon: Camera, page: 'AestheticPhotos', disabled: !globals.selected_patient_id },
      ]
    },
    'aesthetics-business': {
      title: 'Business Management',
      items: [
        { name: 'POS & Billing', icon: DollarSign, page: 'AestheticPOS' },
        { name: 'Inventory', icon: Package, page: 'AestheticInventory' },
        { name: 'Memberships', icon: TrendingUp, page: 'AestheticMemberships' },
        { name: 'Gift Cards', icon: CreditCard, page: 'AestheticGiftCards' },
      ]
    }
  };

  const handleMenuItemClick = (page: string, isDisabled: boolean) => {
    if (!isDisabled) {
      onPageChange?.(page);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Auto-switch to aesthetics tab if on an aesthetics page
  useEffect(() => {
    const aestheticsPages = ['AestheticsDashboard', 'AestheticTreatments', 'AestheticPhotos', 'AestheticPOS', 'AestheticInventory', 'AestheticMemberships', 'AestheticGiftCards'];
    if (currentPage && aestheticsPages.includes(currentPage)) {
      setActiveTab('aesthetics');
    }
  }, [currentPage]);

  // Persist tab selection in sessionStorage
  useEffect(() => {
    const savedTab = sessionStorage.getItem('sidebar-active-tab');
    if (savedTab === 'clinical' || savedTab === 'aesthetics') {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('sidebar-active-tab', activeTab);
  }, [activeTab]);

  // Persist expanded sections in sessionStorage
  useEffect(() => {
    const savedSections = sessionStorage.getItem('sidebar-expanded-sections');
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        setExpandedSections(parsed);
      } catch {
        // If parsing fails, use default state
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

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

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isActive = currentPage === item.page;
    const isDisabled = item.disabled;
    const isAestheticsTab = activeTab === 'aesthetics';

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
          w-full flex items-center px-6 py-2.5 text-left transition-colors text-sm
          ${isActive
            ? isAestheticsTab
              ? 'bg-pink-50 border-r-4 border-pink-600 text-pink-700'
              : 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'
            : isDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none'
          }
        `}
      >
        <Icon className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">{item.name}</span>
      </button>
    );
  };

  const renderSection = (sectionId: string, section: any) => {
    const isExpanded = expandedSections[sectionId];
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={sectionId} className="mb-1">
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full flex items-center justify-between px-6 py-2 text-left hover:bg-gray-50 transition-colors"
          aria-expanded={isExpanded}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {section.title}
          </span>
          <ChevronIcon className="w-4 h-4 text-gray-400" />
        </button>
        {isExpanded && (
          <div className="mt-1">
            {section.items.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

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
        <div className="p-6 border-b border-gray-200 relative flex items-center justify-center">
          <img src="/p2plogov6.png" alt="P2PAI Logo" className="h-8 w-auto" />
          
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>


        {/* Tabs - Only show if aesthetics module is enabled */}
        {globals.aesthetics_module_enabled && (
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setActiveTab('clinical')}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${activeTab === 'clinical'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Clinical
            </button>
            <button
              onClick={() => setActiveTab('aesthetics')}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${activeTab === 'aesthetics'
                  ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Aesthetics
            </button>
          </div>
        )}

        {/* Navigation menu */}
        <nav ref={navRef} className="mt-2 flex-1 overflow-y-auto" role="menu">
          {activeTab === 'clinical' ? (
            <>
              {Object.entries(clinicalSections).map(([id, section]) =>
                renderSection(id, section)
              )}
            </>
          ) : (
            <>
              {Object.entries(aestheticsSections).map(([id, section]) =>
                renderSection(id, section)
              )}
            </>
          )}
        </nav>

        {/* Footer with selected patient and sign out */}
        {globals.selected_patient_name ? (
          <div className="p-4 border-t border-gray-200 bg-blue-50 flex-shrink-0">
            <p className="text-sm font-medium text-blue-900">Selected Patient:</p>
            <p className="text-sm text-blue-700 mb-2">{globals.selected_patient_name}</p>
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

export default Sidebar;
