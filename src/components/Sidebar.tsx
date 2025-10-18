import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Users, Calendar, Activity, FlaskConical, Pill, Cable as Capsule, Settings, Home, UserCheck, CalendarDays, FileText, Wrench, ClipboardCheck, CheckSquare, Stethoscope, HeartPulse, ClipboardList, TestTube, Shield, FileDown, FolderOpen, Menu, X, Sparkles, Camera, DollarSign, Package, CreditCard, TrendingUp, ChevronDown, ChevronRight, Building2, UserPlus, File as FileEdit, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import { useClinic } from '../context/ClinicContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

const Sidebar: React.FC = () => {
  const { getAccessToken, signOut } = useAuth();
  const { selectedPatientId, selectedPatientName } = usePatient();
  const { aestheticsEnabled } = useClinic();
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'aesthetics'>('clinical');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'patient-care': true,
    'charting': true,
    'group-intake': true,
    'administration': true,
    'aesthetics-core': true,
    'aesthetics-business': true,
  });
  const navRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  const selectedPatient = selectedPatientId || patientId;

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      await auditLogger.endSession('user_initiated');

      if (session) {
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
  };

  const clinicalSections = {
    'patient-care': {
      title: 'Patient Care',
      items: [
        { name: 'Dashboard', icon: Home, path: '/dashboard' },
        { name: 'Patients', icon: Users, path: '/patients' },
        { name: 'Patient Chart', icon: Stethoscope, path: `/patients/${selectedPatient}/chart`, disabled: !selectedPatient },
        { name: 'Functional Medicine', icon: HeartPulse, path: `/patients/${selectedPatient}/functional-medicine`, disabled: !selectedPatient },
        { name: 'Appointments', icon: Calendar, path: `/patients/${selectedPatient}/appointments`, disabled: !selectedPatient },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
        { name: 'Provider Calendar', icon: CalendarDays, path: '/calendar' },
      ]
    },
    'charting': {
      title: 'Charting & Orders',
      items: [
        { name: 'Clinical Notes', icon: FileText, path: `/patients/${selectedPatient}/clinical-notes`, disabled: !selectedPatient },
        { name: 'Clinical Assessments', icon: ClipboardList, path: '/clinical-assessments' },
        { name: 'Treatment Plans', icon: Activity, path: `/patients/${selectedPatient}/treatment-plans`, disabled: !selectedPatient },
        { name: 'Lab Orders', icon: TestTube, path: '/lab-orders' },
        { name: 'Labs', icon: FlaskConical, path: `/patients/${selectedPatient}/labs`, disabled: !selectedPatient },
        { name: 'Medications', icon: Pill, path: `/patients/${selectedPatient}/medications`, disabled: !selectedPatient },
        { name: 'Supplements', icon: Capsule, path: `/patients/${selectedPatient}/supplements`, disabled: !selectedPatient },
      ]
    },
    'group-intake': {
      title: 'Groups & Intake',
      items: [
        { name: 'Patient Groups', icon: UserPlus, path: '/admin/patient-groups' },
        { name: 'Form Builder', icon: FileEdit, path: '/admin/form-builder' },
        { name: 'Intake Management', icon: ClipboardList, path: '/admin/intake' },
        { name: 'State Configuration', icon: MapPin, path: '/admin/state-configuration' },
      ]
    },
    'administration': {
      title: 'Administration',
      items: [
        { name: 'Admin', icon: Settings, path: '/admin' },
        { name: 'System Settings', icon: Settings, path: '/admin/system-settings' },
        { name: 'Clinic Settings', icon: Building2, path: '/admin/clinic-settings' },
        { name: 'Manage Templates', icon: Wrench, path: '/admin/templates' },
        { name: 'Document Management', icon: FolderOpen, path: '/admin/documents' },
        { name: 'Patient Portal', icon: Shield, path: '/admin/patient-portal' },
        { name: 'Chart Export', icon: FileDown, path: '/admin/chart-export' },
        { name: 'User Migration', icon: UserCheck, path: '/user-migration' },
      ]
    }
  };

  const aestheticsSections = {
    'aesthetics-core': {
      title: 'Patient Services',
      items: [
        { name: 'Aesthetics Dashboard', icon: Sparkles, path: '/aesthetics/dashboard' },
        { name: 'Aesthetic Treatments', icon: Sparkles, path: `/aesthetics/patients/${selectedPatient}/treatments`, disabled: !selectedPatient },
        { name: 'Photos & Analysis', icon: Camera, path: `/aesthetics/patients/${selectedPatient}/photos`, disabled: !selectedPatient },
      ]
    },
    'aesthetics-business': {
      title: 'Business Management',
      items: [
        { name: 'POS & Billing', icon: DollarSign, path: '/aesthetics/pos' },
        { name: 'Inventory', icon: Package, path: '/aesthetics/inventory' },
        { name: 'Memberships', icon: TrendingUp, path: '/aesthetics/memberships' },
        { name: 'Gift Cards', icon: CreditCard, path: '/aesthetics/gift-cards' },
      ]
    }
  };

  const handleMenuItemClick = useCallback(() => {
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop;
    }
    setIsMobileMenuOpen(false);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [sectionId]: !prev[sectionId]
      };
      sessionStorage.setItem('sidebar-expanded-sections', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Auto-switch to aesthetics tab if on an aesthetics page
  useEffect(() => {
    if (location.pathname.startsWith('/aesthetics')) {
      setActiveTab('aesthetics');
    } else {
      setActiveTab('clinical');
    }
  }, [location.pathname]);

  // Load expanded sections from sessionStorage
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

    const savedScrollPosition = sessionStorage.getItem('sidebar-scroll-position');
    if (savedScrollPosition && navRef.current) {
      scrollPositionRef.current = parseInt(savedScrollPosition, 10);
    }
  }, []);

  // Restore scroll position after render
  useEffect(() => {
    if (navRef.current && scrollPositionRef.current > 0) {
      navRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  // Save scroll position to sessionStorage periodically
  useEffect(() => {
    const saveScrollPosition = () => {
      if (navRef.current) {
        sessionStorage.setItem('sidebar-scroll-position', navRef.current.scrollTop.toString());
      }
    };

    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', saveScrollPosition);
      return () => navElement.removeEventListener('scroll', saveScrollPosition);
    }
  }, []);

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

  useEffect(() => {
    sessionStorage.setItem('sidebar-active-tab', activeTab);
  }, [activeTab]);

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isDisabled = item.disabled;
    const isAestheticsTab = activeTab === 'aesthetics';

    if (isDisabled) {
      return (
        <div
          key={item.name}
          className="w-full flex items-center px-6 py-2.5 text-left text-sm text-gray-400 cursor-not-allowed"
        >
          <Icon className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">{item.name}</span>
        </div>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.path}
        onClick={handleMenuItemClick}
        className={({ isActive }) => `
          w-full flex items-center px-6 py-2.5 text-left transition-colors text-sm
          ${isActive
            ? isAestheticsTab
              ? 'bg-pink-50 border-r-4 border-pink-600 text-pink-700'
              : 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none'
          }
        `}
      >
        <Icon className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">{item.name}</span>
      </NavLink>
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
        {aestheticsEnabled && (
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

export default Sidebar;
