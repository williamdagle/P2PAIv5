import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import {
  Patient,
  ChartSummaryData,
  VitalSign,
  PatientAllergy,
  PatientImmunization,
  PhysicalExam,
  ChiefComplaint,
  HPI,
  ROS,
  ProblemListItem,
  Medication,
  Supplement,
  Lab,
  TreatmentPlan
} from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import VitalSignsForm from '../components/VitalSignsForm';
import AllergyForm from '../components/AllergyForm';
import ImmunizationForm from '../components/ImmunizationForm';
import PhysicalExamForm from '../components/PhysicalExamForm';
import ChiefComplaintForm from '../components/ChiefComplaintForm';
import HPIForm from '../components/HPIForm';
import ROSForm from '../components/ROSForm';
import ChartSummaryDashboard from '../components/ChartSummaryDashboard';
import ChartSummarySkeleton from '../components/ChartSummarySkeleton';
import ProblemListView from '../components/ProblemListView';
import MedicationReconciliationView from '../components/MedicationReconciliationView';
import LabTrendChart from '../components/LabTrendChart';
import LabTrendsSection from '../components/LabTrendsSection';
import SymptomProgressionChart from '../components/SymptomProgressionChart';
import TreatmentResponseVisualization from '../components/TreatmentResponseVisualization';
import {
  User,
  Activity,
  Heart,
  Stethoscope,
  AlertCircle,
  Syringe,
  TrendingUp,
  FileText,
  Plus,
  ClipboardList,
  MessageSquare,
  Pill,
  TestTube
} from 'lucide-react';

const PatientChart: React.FC = () => {
  const navigate = useNavigate();
  const { globals } = useGlobal();
  const { showError, showSuccess } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [immunizations, setImmunizations] = useState<PatientImmunization[]>([]);
  const [physicalExams, setPhysicalExams] = useState<PhysicalExam[]>([]);
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[]>([]);
  const [hpiRecords, setHpiRecords] = useState<HPI[]>([]);
  const [rosRecords, setRosRecords] = useState<ROS[]>([]);
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labResults, setLabResults] = useState<Lab[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set(['overview']));

  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showImmunizationModal, setShowImmunizationModal] = useState(false);
  const [showPhysicalExamModal, setShowPhysicalExamModal] = useState(false);
  const [showChiefComplaintModal, setShowChiefComplaintModal] = useState(false);
  const [showHPIModal, setShowHPIModal] = useState(false);
  const [showROSModal, setShowROSModal] = useState(false);

  useEffect(() => {
    if (globals.selected_patient_id) {
      loadChartSummary();
    }
  }, [globals.selected_patient_id]);

  useEffect(() => {
    if (globals.selected_patient_id && activeSection !== 'overview' && !loadedSections.has(activeSection)) {
      loadSectionData(activeSection);
    }
  }, [activeSection, globals.selected_patient_id]);

  const handleFormSuccess = (message: string) => {
    showSuccess(message);
    setShowVitalSignsModal(false);
    setShowAllergyModal(false);
    setShowImmunizationModal(false);
    setShowPhysicalExamModal(false);
    setShowChiefComplaintModal(false);
    setShowHPIModal(false);
    setShowROSModal(false);
    loadChartSummary();
    if (activeSection !== 'overview') {
      loadSectionData(activeSection);
    }
  };

  const loadChartSummary = async () => {
    if (!globals.selected_patient_id) return;

    setLoading(true);
    try {
      const summary = await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_chart_summary?patient_id=${globals.selected_patient_id}`,
        { method: 'GET' }
      );

      setChartSummary(summary);
      setVitalSigns(summary.vitalSigns || []);
      setAllergies(summary.allergies || []);
      setProblems(summary.problems || []);
      setMedications(summary.medications || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError('Failed to load chart summary', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSectionData = async (section: string) => {
    if (!globals.selected_patient_id || loadedSections.has(section)) return;

    setSectionLoading(prev => ({ ...prev, [section]: true }));
    try {
      switch (section) {
        case 'vitals':
          const vitalsData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_vital_signs?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setVitalSigns(vitalsData);
          break;

        case 'allergies':
          const allergiesData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patient_allergies?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setAllergies(allergiesData);
          break;

        case 'immunizations':
          const immunizationsData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patient_immunizations?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setImmunizations(immunizationsData);
          break;

        case 'physical-exams':
          const examsData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_physical_exams?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setPhysicalExams(examsData);
          break;

        case 'chief-complaints':
          const ccData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_chief_complaints?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setChiefComplaints(ccData);
          break;

        case 'hpi':
          const hpiData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_hpi?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setHpiRecords(hpiData);
          break;

        case 'ros':
          const rosData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_ros?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setRosRecords(rosData);
          break;

        case 'problems':
          const problemsData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_problem_list?patient_id=${globals.selected_patient_id}`,
            { method: 'GET' }
          );
          setProblems(problemsData);
          break;

        case 'medications':
          const [medsData, supplementsData] = await Promise.all([
            apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_medications?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            ),
            apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_supplements?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            )
          ]);
          setMedications(medsData);
          setSupplements(supplementsData);
          break;

        case 'labs':
          const labResultsData = await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_labs?patient_id=${globals.selected_patient_id}&include_results=true`,
            { method: 'GET' }
          );
          setLabResults(labResultsData);
          break;

        case 'symptoms':
          if (chiefComplaints.length === 0) {
            const ccData = await apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_chief_complaints?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            );
            setChiefComplaints(ccData);
          }
          break;

        case 'treatment':
          const [treatmentMeds, treatmentSupps, treatmentCC] = await Promise.all([
            medications.length === 0 ? apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_medications?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            ) : Promise.resolve(medications),
            supplements.length === 0 ? apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_supplements?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            ) : Promise.resolve(supplements),
            chiefComplaints.length === 0 ? apiCall(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_chief_complaints?patient_id=${globals.selected_patient_id}`,
              { method: 'GET' }
            ) : Promise.resolve(chiefComplaints)
          ]);
          setMedications(treatmentMeds);
          setSupplements(treatmentSupps);
          setChiefComplaints(treatmentCC);
          break;
      }

      setLoadedSections(prev => new Set([...prev, section]));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Failed to load ${section} data`, errorMessage);
    } finally {
      setSectionLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  if (!globals.selected_patient_id) {
    return (
      
        
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Patient Selected</h2>
            <p className="text-gray-500 mb-4">Please select a patient to view their chart</p>
            <Button onClick={() => navigate('/patients')}>
              Go to Patients
            </Button>
          </div>
        </div>
      
    );
  }

  const chartSections = [
    { id: 'overview', label: 'Chart Summary', icon: FileText },
    { id: 'problems', label: 'Problem List', icon: AlertCircle },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'labs', label: 'Lab Trends', icon: TestTube },
    { id: 'symptoms', label: 'Symptom Tracking', icon: Activity },
    { id: 'treatment', label: 'Treatment Response', icon: TrendingUp },
    { id: 'chief-complaints', label: 'Chief Complaints', icon: MessageSquare },
    { id: 'hpi', label: 'HPI', icon: ClipboardList },
    { id: 'ros', label: 'Review of Systems', icon: ClipboardList },
    { id: 'vitals', label: 'Vital Signs', icon: Activity },
    { id: 'allergies', label: 'Allergies', icon: AlertCircle },
    { id: 'immunizations', label: 'Immunizations', icon: Syringe },
    { id: 'physical-exams', label: 'Physical Exams', icon: Stethoscope },
  ];

  const latestVitals = vitalSigns[0];

  return (
    <div>
      <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Chart</h1>
              <p className="text-gray-600">{globals.selected_patient_name || 'Loading...'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/notes/provider')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Chart Sections</h3>
              <nav className="space-y-1">
                {chartSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-4">
            {loading ? (
              <ChartSummarySkeleton />
            ) : (
              <>
                {activeSection === 'overview' && chartSummary && (
                  <ChartSummaryDashboard
                    data={{
                      patient: { name: globals.selected_patient_name },
                      vitalSigns: chartSummary.vitalSigns || [],
                      allergies: chartSummary.allergies || [],
                      problems: chartSummary.problems || [],
                      medications: chartSummary.medications || [],
                      recentActivity: chartSummary.recentActivity || [],
                      completeness: chartSummary.completeness || [],
                    }}
                    onSectionClick={(section) => setActiveSection(section)}
                  />
                )}

                {activeSection === 'problems' && (
                  sectionLoading[activeSection] ? (
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="text-center text-gray-500">Loading problems...</div>
                    </div>
                  ) : (
                    <ProblemListView problems={problems} onRefresh={() => loadSectionData('problems')} />
                  )
                )}

                {activeSection === 'medications' && (
                  sectionLoading[activeSection] ? (
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="text-center text-gray-500">Loading medications...</div>
                    </div>
                  ) : (
                    <MedicationReconciliationView
                      medications={medications}
                      supplements={supplements}
                      onRefresh={() => loadSectionData('medications')}
                    />
                  )
                )}

                {activeSection === 'labs' && (
                  <LabTrendsSection />
                )}

                {activeSection === 'symptoms' && (
                  sectionLoading[activeSection] ? (
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="text-center text-gray-500">Loading symptom data...</div>
                    </div>
                  ) : (
                    <SymptomProgressionChart
                      chiefComplaints={chiefComplaints.map(cc => ({
                        id: cc.id,
                        date: cc.visit_date,
                        complaint: cc.complaint,
                        severity: cc.severity || 'moderate',
                        duration: cc.duration,
                        associated_symptoms: cc.associated_symptoms,
                        notes: cc.notes,
                      }))}
                    />
                  )
                )}

                {activeSection === 'treatment' && (
                  sectionLoading[activeSection] ? (
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="text-center text-gray-500">Loading treatment data...</div>
                    </div>
                  ) : (
                    <TreatmentResponseVisualization
                      treatments={[
                        ...medications.map((med: any) => ({
                          date: med.start_date,
                          type: 'medication',
                          intervention: med.medication_name || med.name,
                          status: med.status,
                        })),
                        ...supplements.map((sup: any) => ({
                          date: sup.start_date,
                          type: 'supplement',
                          intervention: sup.supplement_name || sup.name,
                          status: sup.status,
                        })),
                      ]}
                      symptoms={chiefComplaints.map(cc => ({
                        date: cc.visit_date,
                        severity: cc.severity === 'severe' ? 3 : cc.severity === 'moderate' ? 2 : 1,
                        complaint: cc.complaint,
                      }))}
                    />
                  )
                )}

                {activeSection === 'overview-old' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Chart Overview</h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Latest Vitals</h3>
                          </div>
                          {latestVitals ? (
                            <div className="space-y-1 text-sm">
                              {latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic && (
                                <p className="text-gray-700">
                                  BP: {latestVitals.blood_pressure_systolic}/{latestVitals.blood_pressure_diastolic} mmHg
                                </p>
                              )}
                              {latestVitals.heart_rate_bpm && (
                                <p className="text-gray-700">HR: {latestVitals.heart_rate_bpm} bpm</p>
                              )}
                              {latestVitals.temperature_c && (
                                <p className="text-gray-700">Temp: {latestVitals.temperature_c}°C</p>
                              )}
                              {latestVitals.weight_kg && (
                                <p className="text-gray-700">Weight: {latestVitals.weight_kg} kg</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No vital signs recorded</p>
                          )}
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-gray-900">Active Allergies</h3>
                          </div>
                          {allergies.length > 0 ? (
                            <div className="space-y-1">
                              {allergies.slice(0, 3).map((allergy) => (
                                <div key={allergy.id} className="text-sm">
                                  <span className="font-medium text-red-700">{allergy.allergen}</span>
                                  <span className="text-gray-600 text-xs ml-2">
                                    ({allergy.severity})
                                  </span>
                                </div>
                              ))}
                              {allergies.length > 3 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  +{allergies.length - 3} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No known allergies</p>
                          )}
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Syringe className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">Immunizations</h3>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {immunizations.length}
                          </p>
                          <p className="text-sm text-gray-600">
                            vaccines on record
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveSection('vitals')}
                          className="flex flex-col items-center gap-2 py-4"
                        >
                          <Activity className="w-6 h-6" />
                          <span>Record Vitals</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActiveSection('allergies')}
                          className="flex flex-col items-center gap-2 py-4"
                        >
                          <AlertCircle className="w-6 h-6" />
                          <span>Manage Allergies</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActiveSection('immunizations')}
                          className="flex flex-col items-center gap-2 py-4"
                        >
                          <Syringe className="w-6 h-6" />
                          <span>Add Vaccine</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActiveSection('physical-exams')}
                          className="flex flex-col items-center gap-2 py-4"
                        >
                          <Stethoscope className="w-6 h-6" />
                          <span>Document Exam</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'chief-complaints' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Chief Complaints</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowChiefComplaintModal(true)}>
                        <Plus className="w-4 h-4" />
                        Add Chief Complaint
                      </Button>
                    </div>

                    {chiefComplaints.length > 0 ? (
                      <div className="space-y-4">
                        {chiefComplaints.map((cc) => (
                          <div key={cc.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{cc.complaint}</h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(cc.visit_date).toLocaleDateString()}
                                </p>
                              </div>
                              {cc.severity && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  cc.severity === 'severe' ? 'bg-red-100 text-red-800' :
                                  cc.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {cc.severity}
                                </span>
                              )}
                            </div>
                            {cc.duration && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Duration:</span> {cc.duration}
                              </p>
                            )}
                            {cc.associated_symptoms && cc.associated_symptoms.length > 0 && (
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">Associated symptoms:</span> {cc.associated_symptoms.join(', ')}
                              </p>
                            )}
                            {cc.notes && (
                              <p className="text-sm text-gray-600 mt-2 border-t pt-2">{cc.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No chief complaints recorded</p>
                    )}
                  </div>
                )}

                {activeSection === 'hpi' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">History of Present Illness</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowHPIModal(true)}>
                        <Plus className="w-4 h-4" />
                        Document HPI
                      </Button>
                    </div>

                    {hpiRecords.length > 0 ? (
                      <div className="space-y-4">
                        {hpiRecords.map((hpi) => (
                          <div key={hpi.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {new Date(hpi.visit_date).toLocaleDateString()}
                                </h3>
                                {hpi.chief_complaint && (
                                  <p className="text-sm text-gray-600">
                                    Related to: {hpi.chief_complaint.complaint}
                                  </p>
                                )}
                              </div>
                              {hpi.severity_scale && (
                                <span className="text-sm font-medium text-gray-700">
                                  Severity: {hpi.severity_scale}/10
                                </span>
                              )}
                            </div>

                            {hpi.narrative && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-700">{hpi.narrative}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              {hpi.onset && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Onset:</span>
                                  <p className="text-gray-600">{hpi.onset}</p>
                                </div>
                              )}
                              {hpi.location && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Location:</span>
                                  <p className="text-gray-600">{hpi.location}</p>
                                </div>
                              )}
                              {hpi.duration && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Duration:</span>
                                  <p className="text-gray-600">{hpi.duration}</p>
                                </div>
                              )}
                              {hpi.character && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Character:</span>
                                  <p className="text-gray-600">{hpi.character}</p>
                                </div>
                              )}
                              {hpi.aggravating_factors && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Aggravating:</span>
                                  <p className="text-gray-600">{hpi.aggravating_factors}</p>
                                </div>
                              )}
                              {hpi.relieving_factors && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Relieving:</span>
                                  <p className="text-gray-600">{hpi.relieving_factors}</p>
                                </div>
                              )}
                              {hpi.timing && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Timing:</span>
                                  <p className="text-gray-600">{hpi.timing}</p>
                                </div>
                              )}
                              {hpi.context && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Context:</span>
                                  <p className="text-gray-600">{hpi.context}</p>
                                </div>
                              )}
                              {hpi.associated_signs_symptoms && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">Associated:</span>
                                  <p className="text-gray-600">{hpi.associated_signs_symptoms}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No HPI documented</p>
                    )}
                  </div>
                )}

                {activeSection === 'ros' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Review of Systems</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowROSModal(true)}>
                        <Plus className="w-4 h-4" />
                        Document ROS
                      </Button>
                    </div>

                    {rosRecords.length > 0 ? (
                      <div className="space-y-4">
                        {rosRecords.map((ros) => (
                          <div key={ros.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-medium text-gray-900">
                                {new Date(ros.visit_date).toLocaleDateString()}
                              </h3>
                              {ros.all_systems_negative && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                  All Systems Negative
                                </span>
                              )}
                            </div>

                            {!ros.all_systems_negative && (
                              <div className="space-y-3">
                                {[
                                  { prefix: 'constitutional', label: 'Constitutional', symptoms: ['fever', 'chills', 'weight_loss', 'weight_gain', 'fatigue'] },
                                  { prefix: 'eyes', label: 'Eyes', symptoms: ['vision_changes', 'pain', 'redness', 'discharge'] },
                                  { prefix: 'ent', label: 'ENT', symptoms: ['hearing_loss', 'ear_pain', 'nasal_congestion', 'sore_throat', 'sinus_pain'] },
                                  { prefix: 'cardiovascular', label: 'Cardiovascular', symptoms: ['chest_pain', 'palpitations', 'edema', 'orthopnea'] },
                                  { prefix: 'respiratory', label: 'Respiratory', symptoms: ['shortness_of_breath', 'cough', 'wheezing', 'sputum'] },
                                  { prefix: 'gi', label: 'Gastrointestinal', symptoms: ['nausea', 'vomiting', 'diarrhea', 'constipation', 'abdominal_pain', 'blood_in_stool'] },
                                  { prefix: 'gu', label: 'Genitourinary', symptoms: ['dysuria', 'frequency', 'urgency', 'hematuria', 'incontinence'] },
                                  { prefix: 'musculoskeletal', label: 'Musculoskeletal', symptoms: ['joint_pain', 'muscle_pain', 'stiffness', 'swelling'] },
                                  { prefix: 'skin', label: 'Skin', symptoms: ['rash', 'itching', 'lesions', 'bruising'] },
                                  { prefix: 'neurological', label: 'Neurological', symptoms: ['headache', 'dizziness', 'numbness', 'weakness', 'seizures'] },
                                  { prefix: 'psychiatric', label: 'Psychiatric', symptoms: ['depression', 'anxiety', 'sleep_disturbance', 'mood_changes'] },
                                  { prefix: 'endocrine', label: 'Endocrine', symptoms: ['heat_intolerance', 'cold_intolerance', 'excessive_thirst', 'excessive_urination'] },
                                  { prefix: 'hematologic', label: 'Hematologic', symptoms: ['easy_bruising', 'easy_bleeding', 'lymph_node_swelling'] },
                                  { prefix: 'allergic', label: 'Allergic', symptoms: ['seasonal_allergies', 'frequent_infections'] }
                                ].map((system) => {
                                  const positiveSymptoms = system.symptoms.filter(symptom => ros[`${system.prefix}_${symptom}`]);
                                  const notes = ros[`${system.prefix}_notes`];

                                  if (positiveSymptoms.length === 0 && !notes) return null;

                                  return (
                                    <div key={system.prefix} className="bg-gray-50 p-3 rounded">
                                      <h4 className="font-medium text-gray-900 text-sm mb-1">{system.label}</h4>
                                      {positiveSymptoms.length > 0 && (
                                        <p className="text-xs text-gray-700">
                                          {positiveSymptoms.map(s => s.replace(/_/g, ' ')).join(', ')}
                                        </p>
                                      )}
                                      {notes && (
                                        <p className="text-xs text-gray-600 mt-1 italic">{notes}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {ros.general_notes && (
                              <div className="mt-3 text-sm text-gray-700 border-t pt-3">
                                <span className="font-medium">General Notes:</span> {ros.general_notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No review of systems documented</p>
                    )}
                  </div>
                )}

                {activeSection === 'vitals' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Vital Signs History</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowVitalSignsModal(true)}>
                        <Plus className="w-4 h-4" />
                        Record Vitals
                      </Button>
                    </div>

                    {vitalSigns.length > 0 ? (
                      <div className="space-y-4">
                        {vitalSigns.map((vital) => (
                          <div key={vital.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm text-gray-600">
                                {new Date(vital.recorded_at).toLocaleDateString()} at{' '}
                                {new Date(vital.recorded_at).toLocaleTimeString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Recorded by: {vital.recorder?.full_name || 'Unknown'}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {vital.blood_pressure_systolic && (
                                <div>
                                  <span className="text-gray-600">BP:</span>{' '}
                                  <span className="font-medium">{vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>
                                </div>
                              )}
                              {vital.heart_rate_bpm && (
                                <div>
                                  <span className="text-gray-600">HR:</span>{' '}
                                  <span className="font-medium">{vital.heart_rate_bpm} bpm</span>
                                </div>
                              )}
                              {vital.temperature_c && (
                                <div>
                                  <span className="text-gray-600">Temp:</span>{' '}
                                  <span className="font-medium">{vital.temperature_c}°C</span>
                                </div>
                              )}
                              {vital.oxygen_saturation && (
                                <div>
                                  <span className="text-gray-600">O2 Sat:</span>{' '}
                                  <span className="font-medium">{vital.oxygen_saturation}%</span>
                                </div>
                              )}
                              {vital.weight_kg && (
                                <div>
                                  <span className="text-gray-600">Weight:</span>{' '}
                                  <span className="font-medium">{vital.weight_kg} kg</span>
                                </div>
                              )}
                              {vital.bmi && (
                                <div>
                                  <span className="text-gray-600">BMI:</span>{' '}
                                  <span className="font-medium">{vital.bmi}</span>
                                </div>
                              )}
                            </div>
                            {vital.notes && (
                              <div className="mt-3 text-sm text-gray-700 border-t pt-3">
                                <span className="font-medium">Notes:</span> {vital.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No vital signs recorded yet</p>
                    )}
                  </div>
                )}

                {activeSection === 'allergies' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Allergies</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowAllergyModal(true)}>
                        <Plus className="w-4 h-4" />
                        Add Allergy
                      </Button>
                    </div>

                    {allergies.length > 0 ? (
                      <div className="space-y-3">
                        {allergies.map((allergy) => (
                          <div
                            key={allergy.id}
                            className={`border-l-4 p-4 rounded-r-lg ${
                              allergy.severity === 'life-threatening'
                                ? 'border-red-600 bg-red-50'
                                : allergy.severity === 'severe'
                                ? 'border-orange-500 bg-orange-50'
                                : allergy.severity === 'moderate'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-blue-500 bg-blue-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{allergy.allergen}</h3>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      allergy.severity === 'life-threatening'
                                        ? 'bg-red-200 text-red-800'
                                        : allergy.severity === 'severe'
                                        ? 'bg-orange-200 text-orange-800'
                                        : allergy.severity === 'moderate'
                                        ? 'bg-yellow-200 text-yellow-800'
                                        : 'bg-blue-200 text-blue-800'
                                    }`}
                                  >
                                    {allergy.severity}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                                    {allergy.allergen_type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">
                                  <span className="font-medium">Reaction:</span> {allergy.reaction}
                                </p>
                                {allergy.notes && (
                                  <p className="text-sm text-gray-600 mt-1">{allergy.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No allergies recorded</p>
                    )}
                  </div>
                )}

                {activeSection === 'immunizations' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Immunization Record</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowImmunizationModal(true)}>
                        <Plus className="w-4 h-4" />
                        Add Immunization
                      </Button>
                    </div>

                    {immunizations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-900">Vaccine</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-900">Dose</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-900">Site</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-900">Administered By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {immunizations.map((immunization) => (
                              <tr key={immunization.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {immunization.vaccine_name}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {new Date(immunization.administration_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {immunization.dose_number ? `Dose ${immunization.dose_number}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {immunization.administration_site || '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {immunization.administrator?.full_name || 'Unknown'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No immunizations recorded</p>
                    )}
                  </div>
                )}

                {activeSection === 'physical-exams' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Physical Examinations</h2>
                      <Button className="flex items-center gap-2" onClick={() => setShowPhysicalExamModal(true)}>
                        <Plus className="w-4 h-4" />
                        New Physical Exam
                      </Button>
                    </div>

                    {physicalExams.length > 0 ? (
                      <div className="space-y-4">
                        {physicalExams.map((exam) => (
                          <div key={exam.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="font-medium text-gray-900">
                                {new Date(exam.exam_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                Performed by: {exam.examiner?.full_name || 'Unknown'}
                              </div>
                            </div>
                            {exam.summary && (
                              <p className="text-sm text-gray-700 mb-2">
                                <span className="font-medium">Summary:</span> {exam.summary}
                              </p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              {exam.general_appearance && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">General:</span> Documented
                                </div>
                              )}
                              {exam.cardiovascular && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Cardiovascular:</span> Documented
                                </div>
                              )}
                              {exam.respiratory && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Respiratory:</span> Documented
                                </div>
                              )}
                              {exam.gastrointestinal && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">GI:</span> Documented
                                </div>
                              )}
                              {exam.neurological && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Neurological:</span> Documented
                                </div>
                              )}
                              {exam.musculoskeletal && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Musculoskeletal:</span> Documented
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No physical exams documented</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {showVitalSignsModal && (
        <Modal isOpen={true} title="Record Vital Signs" onClose={() => setShowVitalSignsModal(false)}>
          <VitalSignsForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Vital signs recorded successfully')}
            onCancel={() => setShowVitalSignsModal(false)}
          />
        </Modal>
      )}

      {showAllergyModal && (
        <Modal isOpen={true} title="Add Allergy" onClose={() => setShowAllergyModal(false)}>
          <AllergyForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Allergy added successfully')}
            onCancel={() => setShowAllergyModal(false)}
          />
        </Modal>
      )}

      {showImmunizationModal && (
        <Modal isOpen={true} title="Add Immunization" onClose={() => setShowImmunizationModal(false)}>
          <ImmunizationForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Immunization recorded successfully')}
            onCancel={() => setShowImmunizationModal(false)}
          />
        </Modal>
      )}

      {showPhysicalExamModal && (
        <Modal isOpen={true} title="Document Physical Exam" onClose={() => setShowPhysicalExamModal(false)}>
          <PhysicalExamForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Physical exam documented successfully')}
            onCancel={() => setShowPhysicalExamModal(false)}
          />
        </Modal>
      )}

      {showChiefComplaintModal && (
        <Modal isOpen={true} title="Add Chief Complaint" onClose={() => setShowChiefComplaintModal(false)}>
          <ChiefComplaintForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Chief complaint recorded successfully')}
            onCancel={() => setShowChiefComplaintModal(false)}
          />
        </Modal>
      )}

      {showHPIModal && (
        <Modal isOpen={true} title="Document History of Present Illness" onClose={() => setShowHPIModal(false)}>
          <HPIForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('HPI documented successfully')}
            onCancel={() => setShowHPIModal(false)}
          />
        </Modal>
      )}

      {showROSModal && (
        <Modal isOpen={true} title="Document Review of Systems" onClose={() => setShowROSModal(false)}>
          <ROSForm
            patientId={globals.selected_patient_id!}
            onSuccess={() => handleFormSuccess('Review of Systems documented successfully')}
            onCancel={() => setShowROSModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default PatientChart;
