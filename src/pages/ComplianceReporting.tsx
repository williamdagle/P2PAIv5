import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import ApiErrorBoundary from '../components/ApiErrorBoundary';
import { ShieldCheck, FileText, AlertTriangle, Activity, Lock, ClipboardCheck } from 'lucide-react';

const ComplianceReporting: React.FC = () => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const [activeTab, setActiveTab] = useState<string>('reports');
  const [userRole, setUserRole] = useState<string>('');
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_current_user`,
          { method: 'GET' }
        );
        if (response?.role_name) {
          setUserRole(response.role_name);
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      } finally {
        setLoadingRole(false);
      }
    };

    if (globals.access_token) {
      fetchUserRole();
    }
  }, [globals.access_token]);

  const isAdmin = userRole === 'System Admin' || userRole === 'Admin';

  const tabs = [
    { id: 'reports', label: 'Compliance Reports', icon: FileText },
    { id: 'monitoring', label: 'Compliance Monitoring', icon: Activity },
    { id: 'risks', label: 'Risk Assessments', icon: AlertTriangle },
    { id: 'vulnerabilities', label: 'Vulnerability Scans', icon: ShieldCheck },
    { id: 'controls', label: 'Security Controls', icon: Lock },
  ];

  const renderComplianceReports = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Compliance Reports</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and manage compliance reports for regulatory submissions and audits
        </p>
      </div>
      <ApiErrorBoundary functionName="get_compliance_reports" showFunctionHelp={true}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_compliance_reports`}
            columns={['report_name', 'report_type', 'report_date', 'report_status', 'overall_compliance_score']}
            searchable={true}
            searchPlaceholder="Search reports..."
            customRenderers={{
              report_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              overall_compliance_score: (value: number) => {
                if (value === null || value === undefined) return 'N/A';
                const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600';
                return <span className={`font-semibold ${color}`}>{value.toFixed(1)}%</span>;
              },
              report_status: (value: string) => {
                const statusColors: Record<string, string> = {
                  draft: 'bg-gray-100 text-gray-800',
                  in_review: 'bg-blue-100 text-blue-800',
                  approved: 'bg-green-100 text-green-800',
                  submitted: 'bg-purple-100 text-purple-800',
                  archived: 'bg-gray-100 text-gray-600',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              report_type: (value: string) => {
                return value?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
            }}
          />
        </div>
      </ApiErrorBoundary>
    </div>
  );

  const renderComplianceMonitoring = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Compliance Monitoring</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track ongoing compliance status across HIPAA and other regulatory requirements
        </p>
      </div>
      <ApiErrorBoundary functionName="get_compliance_monitoring" showFunctionHelp={true}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_compliance_monitoring`}
            columns={['compliance_framework', 'requirement_name', 'compliance_status', 'check_date', 'risk_level', 'next_check_date']}
            searchable={true}
            searchPlaceholder="Search compliance requirements..."
            customRenderers={{
              check_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              next_check_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              compliance_status: (value: string) => {
                const statusColors: Record<string, string> = {
                  compliant: 'bg-green-100 text-green-800',
                  partially_compliant: 'bg-yellow-100 text-yellow-800',
                  non_compliant: 'bg-red-100 text-red-800',
                  not_applicable: 'bg-gray-100 text-gray-600',
                  in_progress: 'bg-blue-100 text-blue-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              risk_level: (value: string) => {
                if (!value) return <span className="text-gray-400">N/A</span>;
                const riskColors: Record<string, string> = {
                  low: 'bg-green-100 text-green-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  high: 'bg-orange-100 text-orange-800',
                  critical: 'bg-red-100 text-red-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              compliance_framework: (value: string) => {
                return value?.replace(/_/g, ' ').toUpperCase();
              }
            }}
          />
        </div>
      </ApiErrorBoundary>
    </div>
  );

  const renderRiskAssessments = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Risk Assessments</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review formal security risk assessments and mitigation strategies
        </p>
      </div>
      <ApiErrorBoundary functionName="get_risk_assessments" showFunctionHelp={true}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_risk_assessments`}
            columns={['assessment_name', 'assessment_type', 'risk_level', 'status', 'assessment_date', 'priority']}
            searchable={true}
            searchPlaceholder="Search risk assessments..."
            customRenderers={{
              assessment_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              risk_level: (value: string) => {
                const riskColors: Record<string, string> = {
                  low: 'bg-green-100 text-green-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  high: 'bg-orange-100 text-orange-800',
                  critical: 'bg-red-100 text-red-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              priority: (value: string) => {
                const priorityColors: Record<string, string> = {
                  low: 'bg-green-100 text-green-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  high: 'bg-orange-100 text-orange-800',
                  critical: 'bg-red-100 text-red-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              status: (value: string) => {
                const statusColors: Record<string, string> = {
                  identified: 'bg-blue-100 text-blue-800',
                  assessed: 'bg-purple-100 text-purple-800',
                  in_mitigation: 'bg-yellow-100 text-yellow-800',
                  mitigated: 'bg-green-100 text-green-800',
                  accepted: 'bg-gray-100 text-gray-800',
                  closed: 'bg-gray-100 text-gray-600',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              assessment_type: (value: string) => {
                return value?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
            }}
          />
        </div>
      </ApiErrorBoundary>
    </div>
  );

  const renderVulnerabilityScans = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Vulnerability Scans</h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitor security vulnerabilities and remediation efforts
        </p>
      </div>
      <ApiErrorBoundary functionName="get_vulnerability_scans" showFunctionHelp={true}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_vulnerability_scans`}
            columns={['vulnerability_name', 'severity', 'scan_type', 'affected_asset', 'status', 'scan_date']}
            searchable={true}
            searchPlaceholder="Search vulnerabilities..."
            customRenderers={{
              scan_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'N/A';
              },
              severity: (value: string) => {
                const severityColors: Record<string, string> = {
                  info: 'bg-blue-100 text-blue-800',
                  low: 'bg-green-100 text-green-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  high: 'bg-orange-100 text-orange-800',
                  critical: 'bg-red-100 text-red-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value.toUpperCase()}
                  </span>
                );
              },
              status: (value: string) => {
                const statusColors: Record<string, string> = {
                  open: 'bg-red-100 text-red-800',
                  in_progress: 'bg-yellow-100 text-yellow-800',
                  resolved: 'bg-green-100 text-green-800',
                  accepted: 'bg-gray-100 text-gray-800',
                  false_positive: 'bg-blue-100 text-blue-800',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              scan_type: (value: string) => {
                return value?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
            }}
          />
        </div>
      </ApiErrorBoundary>
    </div>
  );

  const renderSecurityControls = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Security Controls</h2>
        <p className="text-sm text-gray-600 mt-1">
          View implemented security controls and their effectiveness
        </p>
      </div>
      <ApiErrorBoundary functionName="get_security_controls" showFunctionHelp={true}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            apiUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_security_controls`}
            columns={['control_name', 'control_type', 'control_category', 'implementation_status', 'effectiveness', 'last_test_date']}
            searchable={true}
            searchPlaceholder="Search security controls..."
            customRenderers={{
              last_test_date: (value: string) => {
                return value ? new Date(value).toLocaleDateString() : 'Not Tested';
              },
              implementation_status: (value: string) => {
                const statusColors: Record<string, string> = {
                  not_implemented: 'bg-red-100 text-red-800',
                  planned: 'bg-blue-100 text-blue-800',
                  partially_implemented: 'bg-yellow-100 text-yellow-800',
                  implemented: 'bg-green-100 text-green-800',
                  deprecated: 'bg-gray-100 text-gray-600',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              effectiveness: (value: string) => {
                if (!value) return <span className="text-gray-400">N/A</span>;
                const effectivenessColors: Record<string, string> = {
                  ineffective: 'bg-red-100 text-red-800',
                  partially_effective: 'bg-yellow-100 text-yellow-800',
                  effective: 'bg-green-100 text-green-800',
                  highly_effective: 'bg-green-100 text-green-900',
                };
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${effectivenessColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {value?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                );
              },
              control_type: (value: string) => {
                return value?.charAt(0).toUpperCase() + value?.slice(1);
              },
              control_category: (value: string) => {
                return value?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
            }}
          />
        </div>
      </ApiErrorBoundary>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'reports':
        return renderComplianceReports();
      case 'monitoring':
        return renderComplianceMonitoring();
      case 'risks':
        return renderRiskAssessments();
      case 'vulnerabilities':
        return renderVulnerabilityScans();
      case 'controls':
        return renderSecurityControls();
      default:
        return renderComplianceReports();
    }
  };

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ClipboardCheck className="w-8 h-8 mr-3 text-blue-600" />
            HIPAA Compliance Reporting
          </h1>
          <p className="text-gray-600">Monitor and manage regulatory compliance status</p>
        </div>

        {loadingRole ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Loading permissions...</p>
          </div>
        ) : !isAdmin ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Admin Access Required
                </h3>
                <p className="text-gray-600">
                  Compliance reporting is restricted to System Admin and Admin users.
                  You currently have the role: <span className="font-medium">{userRole || 'Unknown'}</span>
                </p>
                <p className="text-gray-600 mt-2">
                  Please contact your system administrator if you need access to compliance reports.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-6">
              {renderContent()}
            </div>
          </>
        )}
      </div>
    
  );
};

export default ComplianceReporting;
