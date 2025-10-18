import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

// Lazy load pages for code splitting and better initial load time
const Login = lazy(() => import('../pages/Login'));
const UserMigration = lazy(() => import('../pages/UserMigration'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Patients = lazy(() => import('../pages/Patients'));
const CreatePatient = lazy(() => import('../pages/CreatePatient'));
const PatientChart = lazy(() => import('../pages/PatientChart'));
const Appointments = lazy(() => import('../pages/Appointments'));
const TreatmentPlans = lazy(() => import('../pages/TreatmentPlans'));
const Labs = lazy(() => import('../pages/Labs'));
const Supplements = lazy(() => import('../pages/Supplements'));
const Medications = lazy(() => import('../pages/Medications'));
const Admin = lazy(() => import('../pages/Admin'));
const ProviderCalendar = lazy(() => import('../pages/ProviderCalendar'));
const ClinicalNotes = lazy(() => import('../pages/ClinicalNotes'));
const CreateProviderNote = lazy(() => import('../pages/CreateProviderNote'));
const CreateQuickNote = lazy(() => import('../pages/CreateQuickNote'));
const ManageTemplates = lazy(() => import('../pages/ManageTemplates'));
const ComplianceReporting = lazy(() => import('../pages/ComplianceReporting'));
const Tasks = lazy(() => import('../pages/Tasks'));
const FunctionalMedicine = lazy(() => import('../pages/FunctionalMedicine'));
const ClinicalAssessments = lazy(() => import('../pages/ClinicalAssessments'));
const LabOrders = lazy(() => import('../pages/LabOrders'));
const DocumentManagement = lazy(() => import('../pages/DocumentManagement'));
const PatientPortal = lazy(() => import('../pages/PatientPortal'));
const ChartExport = lazy(() => import('../pages/ChartExport'));
const ManageAppointmentTypes = lazy(() => import('../pages/ManageAppointmentTypes'));
const SystemSettings = lazy(() => import('../pages/SystemSettings'));
const ClinicSettings = lazy(() => import('../pages/ClinicSettings'));
const ProviderScheduleManagement = lazy(() => import('../pages/ProviderScheduleManagement'));
const PatientGroupsManagement = lazy(() => import('../pages/PatientGroupsManagement'));
const FormBuilder = lazy(() => import('../pages/FormBuilder'));
const IntakeManagement = lazy(() => import('../pages/IntakeManagement'));
const StateConfiguration = lazy(() => import('../pages/StateConfiguration'));

// Aesthetics module pages
const AestheticsDashboard = lazy(() => import('../pages/AestheticsDashboard'));
const AestheticTreatments = lazy(() => import('../pages/AestheticTreatments'));
const AestheticPhotos = lazy(() => import('../pages/AestheticPhotos'));
const AestheticPOS = lazy(() => import('../pages/AestheticPOS'));
const AestheticInventory = lazy(() => import('../pages/AestheticInventory'));
const AestheticMemberships = lazy(() => import('../pages/AestheticMemberships'));
const AestheticGiftCards = lazy(() => import('../pages/AestheticGiftCards'));

// Import layouts and route wrappers
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AestheticsRoute from '../components/AestheticsRoute';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/user-migration',
    element: <UserMigration />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'patients',
        children: [
          {
            index: true,
            element: <Patients />,
          },
          {
            path: 'create',
            element: <CreatePatient />,
          },
          {
            path: ':patientId/chart',
            element: <PatientChart />,
          },
          {
            path: ':patientId/appointments',
            element: <Appointments />,
          },
          {
            path: ':patientId/treatment-plans',
            element: <TreatmentPlans />,
          },
          {
            path: ':patientId/functional-medicine',
            element: <FunctionalMedicine />,
          },
          {
            path: ':patientId/labs',
            element: <Labs />,
          },
          {
            path: ':patientId/medications',
            element: <Medications />,
          },
          {
            path: ':patientId/supplements',
            element: <Supplements />,
          },
          {
            path: ':patientId/clinical-notes',
            element: <ClinicalNotes />,
          },
        ],
      },
      {
        path: 'calendar',
        element: <ProviderCalendar />,
      },
      {
        path: 'notes',
        children: [
          {
            path: 'provider',
            element: <CreateProviderNote />,
          },
          {
            path: 'quick',
            element: <CreateQuickNote />,
          },
        ],
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'clinical-assessments',
        element: <ClinicalAssessments />,
      },
      {
        path: 'lab-orders',
        element: <LabOrders />,
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <Admin />,
          },
          {
            path: 'system-settings',
            element: <SystemSettings />,
          },
          {
            path: 'clinic-settings',
            element: <ClinicSettings />,
          },
          {
            path: 'compliance',
            element: <ComplianceReporting />,
          },
          {
            path: 'templates',
            element: <ManageTemplates />,
          },
          {
            path: 'appointment-types',
            element: <ManageAppointmentTypes />,
          },
          {
            path: 'provider-schedules',
            element: <ProviderScheduleManagement />,
          },
          {
            path: 'documents',
            element: <DocumentManagement />,
          },
          {
            path: 'patient-portal',
            element: <PatientPortal />,
          },
          {
            path: 'chart-export',
            element: <ChartExport />,
          },
          {
            path: 'patient-groups',
            element: <PatientGroupsManagement />,
          },
          {
            path: 'form-builder',
            element: <FormBuilder />,
          },
          {
            path: 'intake',
            element: <IntakeManagement />,
          },
          {
            path: 'state-configuration',
            element: <StateConfiguration />,
          },
        ],
      },
      {
        path: 'aesthetics',
        element: <AestheticsRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="/aesthetics/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AestheticsDashboard />,
          },
          {
            path: 'patients/:patientId/treatments',
            element: <AestheticTreatments />,
          },
          {
            path: 'patients/:patientId/photos',
            element: <AestheticPhotos />,
          },
          {
            path: 'pos',
            element: <AestheticPOS />,
          },
          {
            path: 'inventory',
            element: <AestheticInventory />,
          },
          {
            path: 'memberships',
            element: <AestheticMemberships />,
          },
          {
            path: 'gift-cards',
            element: <AestheticGiftCards />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
];
