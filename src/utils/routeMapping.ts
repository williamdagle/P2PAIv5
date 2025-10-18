// Map old page names to new route paths for navigation
export const pageToRoute: Record<string, string> = {
  'Dashboard': '/dashboard',
  'Patients': '/patients',
  'CreatePatient': '/patients/create',
  'PatientChart': '/patients/:patientId/chart',
  'Appointments': '/patients/:patientId/appointments',
  'TreatmentPlans': '/patients/:patientId/treatment-plans',
  'FunctionalMedicine': '/patients/:patientId/functional-medicine',
  'Labs': '/patients/:patientId/labs',
  'Medications': '/patients/:patientId/medications',
  'Supplements': '/patients/:patientId/supplements',
  'ClinicalNotes': '/patients/:patientId/clinical-notes',
  'ProviderCalendar': '/calendar',
  'CreateProviderNote': '/notes/provider',
  'CreateQuickNote': '/notes/quick',
  'Tasks': '/tasks',
  'ClinicalAssessments': '/clinical-assessments',
  'LabOrders': '/lab-orders',
  'Admin': '/admin',
  'SystemSettings': '/admin/system-settings',
  'ClinicSettings': '/admin/clinic-settings',
  'ComplianceReporting': '/admin/compliance',
  'ManageTemplates': '/admin/templates',
  'ManageAppointmentTypes': '/admin/appointment-types',
  'ProviderScheduleManagement': '/admin/provider-schedules',
  'DocumentManagement': '/admin/documents',
  'PatientPortal': '/admin/patient-portal',
  'ChartExport': '/admin/chart-export',
  'PatientGroupsManagement': '/admin/patient-groups',
  'FormBuilder': '/admin/form-builder',
  'IntakeManagement': '/admin/intake',
  'StateConfiguration': '/admin/state-configuration',
  'UserMigration': '/user-migration',
  'AestheticsDashboard': '/aesthetics/dashboard',
  'AestheticTreatments': '/aesthetics/patients/:patientId/treatments',
  'AestheticPhotos': '/aesthetics/patients/:patientId/photos',
  'AestheticPOS': '/aesthetics/pos',
  'AestheticInventory': '/aesthetics/inventory',
  'AestheticMemberships': '/aesthetics/memberships',
  'AestheticGiftCards': '/aesthetics/gift-cards',
};

// Helper to build route with patient ID
export function buildRoute(page: string, patientId?: string): string {
  const route = pageToRoute[page] || '/';

  if (patientId && route.includes(':patientId')) {
    return route.replace(':patientId', patientId);
  }

  return route;
}
