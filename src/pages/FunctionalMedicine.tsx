import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TimelineUnified from '../components/TimelineUnified';
import IFMMatrixVisualization from '../components/IFMMatrixVisualization';
import IFMMatrixForm from '../components/IFMMatrixForm';
import LifestyleAssessmentForm from '../components/LifestyleAssessmentForm';
import HealthGoalForm from '../components/HealthGoalForm';
import FoodSensitivityForm from '../components/FoodSensitivityForm';
import { User, Calendar, Grid2x2 as Grid, HeartPulse, Target, Apple } from 'lucide-react';

interface FunctionalMedicineProps {
  onNavigate: (page: string) => void;
}

const FunctionalMedicine: React.FC<FunctionalMedicineProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showError, showSuccess } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('timeline');

  const [ifmMatrixData, setIfmMatrixData] = useState<any>(null);
  const [lifestyleAssessments, setLifestyleAssessments] = useState<any[]>([]);
  const [healthGoals, setHealthGoals] = useState<any[]>([]);
  const [foodSensitivities, setFoodSensitivities] = useState<any[]>([]);

  const [showIFMMatrixModal, setShowIFMMatrixModal] = useState(false);
  const [showLifestyleModal, setShowLifestyleModal] = useState(false);
  const [showHealthGoalModal, setShowHealthGoalModal] = useState(false);
  const [showFoodSensitivityModal, setShowFoodSensitivityModal] = useState(false);

  useEffect(() => {
    if (globals.selected_patient_id) {
      loadFMData();
    }
  }, [globals.selected_patient_id]);

  const handleFormSuccess = (message: string) => {
    showSuccess(message);
    setShowIFMMatrixModal(false);
    setShowLifestyleModal(false);
    setShowHealthGoalModal(false);
    setShowFoodSensitivityModal(false);
    loadFMData();
  };

  const loadFMData = async () => {
    if (!globals.selected_patient_id) return;

    setLoading(true);
    try {
      const [matrix, lifestyle, goals, foodSens] = await Promise.all([
        apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_ifm_matrix_assessments?patient_id=${globals.selected_patient_id}&limit=1`,
          { method: 'GET' }
        ).catch(() => []),
        apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_lifestyle_assessments?patient_id=${globals.selected_patient_id}&limit=1`,
          { method: 'GET' }
        ).catch(() => []),
        apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_health_goals?patient_id=${globals.selected_patient_id}`,
          { method: 'GET' }
        ).catch(() => []),
        apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_food_sensitivities?patient_id=${globals.selected_patient_id}&status=active`,
          { method: 'GET' }
        ).catch(() => []),
      ]);

      setIfmMatrixData(matrix[0] || null);
      setLifestyleAssessments(lifestyle);
      setHealthGoals(goals);
      setFoodSensitivities(foodSens);
    } catch (err: any) {
      showError('Failed to load functional medicine data', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!globals.selected_patient_id) {
    return (
      <Layout>
        <Sidebar currentPage="FunctionalMedicine" onPageChange={onNavigate} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Patient Selected</h2>
            <p className="text-gray-500 mb-4">Please select a patient to view functional medicine features</p>
            <Button onClick={() => onNavigate('Patients')}>
              Go to Patients
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const sections = [
    { id: 'timeline', label: 'FM Timeline', icon: Calendar },
    { id: 'matrix', label: 'IFM Matrix', icon: Grid },
    { id: 'lifestyle', label: 'Lifestyle', icon: HeartPulse },
    { id: 'goals', label: 'Health Goals', icon: Target },
    { id: 'food', label: 'Food Sensitivities', icon: Apple },
  ];

  return (
    <Layout>
      <Sidebar currentPage="FunctionalMedicine" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Functional Medicine</h1>
              <p className="text-gray-600">{globals.selected_patient_name || 'Loading...'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-green-50 text-green-700 font-medium'
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
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center text-gray-500">Loading functional medicine data...</div>
              </div>
            ) : (
              <>
                {activeSection === 'timeline' && (
                  <TimelineUnified
                    patientId={globals.selected_patient_id!}
                    patientName={globals.selected_patient_name || 'Patient'}
                    showFMFields={true}
                    onNavigate={onNavigate}
                  />
                )}

                {activeSection === 'matrix' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <IFMMatrixVisualization
                      data={ifmMatrixData}
                      onEdit={() => setShowIFMMatrixModal(true)}
                    />
                  </div>
                )}

                {activeSection === 'lifestyle' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Lifestyle Assessments</h2>
                      <Button onClick={() => setShowLifestyleModal(true)}>
                        {lifestyleAssessments.length > 0 ? 'Update Assessment' : 'Create Assessment'}
                      </Button>
                    </div>

                    {lifestyleAssessments.length > 0 ? (
                      <div className="space-y-4">
                        {lifestyleAssessments.map((assessment) => (
                          <div key={assessment.id} className="border-2 border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-semibold text-gray-900">
                                Assessment Date: {new Date(assessment.assessment_date).toLocaleDateString()}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {assessment.sleep_hours_average && (
                                <div className="bg-blue-50 p-3 rounded">
                                  <p className="font-semibold text-blue-900">Sleep</p>
                                  <p className="text-blue-800">{assessment.sleep_hours_average} hrs/night - {assessment.sleep_quality}</p>
                                </div>
                              )}
                              {assessment.exercise_frequency && (
                                <div className="bg-green-50 p-3 rounded">
                                  <p className="font-semibold text-green-900">Exercise</p>
                                  <p className="text-green-800">{assessment.exercise_frequency}</p>
                                </div>
                              )}
                              {assessment.diet_type && (
                                <div className="bg-yellow-50 p-3 rounded">
                                  <p className="font-semibold text-yellow-900">Diet</p>
                                  <p className="text-yellow-800">{assessment.diet_type}</p>
                                </div>
                              )}
                              {assessment.stress_level && (
                                <div className="bg-red-50 p-3 rounded">
                                  <p className="font-semibold text-red-900">Stress Level</p>
                                  <p className="text-red-800 capitalize">{assessment.stress_level}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>No lifestyle assessments yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'goals' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Health Goals</h2>
                      <Button onClick={() => setShowHealthGoalModal(true)}>
                        Add Goal
                      </Button>
                    </div>

                    {healthGoals.length > 0 ? (
                      <div className="space-y-4">
                        {healthGoals.map((goal) => (
                          <div key={goal.id} className="border-2 border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{goal.specific_goal}</h3>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {goal.priority} priority
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                                    goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {goal.status.replace('_', ' ')}
                                  </span>
                                </div>
                                {goal.measurable_criteria && (
                                  <p className="text-sm text-gray-700 mb-2">{goal.measurable_criteria}</p>
                                )}
                                {goal.time_bound_deadline && (
                                  <p className="text-xs text-gray-600">
                                    Target: {new Date(goal.time_bound_deadline).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{goal.progress_percentage}%</div>
                                <div className="text-xs text-gray-600">Progress</div>
                              </div>
                            </div>

                            {goal.progress_percentage > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${goal.progress_percentage}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>No health goals yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'food' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Food Sensitivities</h2>
                      <Button onClick={() => setShowFoodSensitivityModal(true)}>
                        Add Sensitivity
                      </Button>
                    </div>

                    {foodSensitivities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foodSensitivities.map((sensitivity) => (
                          <div
                            key={sensitivity.id}
                            className={`border-l-4 p-4 rounded-r-lg ${
                              sensitivity.reaction_severity === 'severe'
                                ? 'border-red-500 bg-red-50'
                                : sensitivity.reaction_severity === 'moderate'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-yellow-500 bg-yellow-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900">{sensitivity.food_item}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 capitalize">
                                {sensitivity.sensitivity_type}
                              </span>
                            </div>
                            {sensitivity.reaction_symptoms && sensitivity.reaction_symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {sensitivity.reaction_symptoms.map((symptom: string, i: number) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-white rounded-full text-gray-700">
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>No food sensitivities recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showIFMMatrixModal && (
        <Modal
          isOpen={true}
          title={ifmMatrixData ? 'Update IFM Matrix Assessment' : 'Create IFM Matrix Assessment'}
          onClose={() => setShowIFMMatrixModal(false)}
        >
          <IFMMatrixForm
            patientId={globals.selected_patient_id!}
            clinicId={globals.user?.clinic_id || ''}
            existingData={ifmMatrixData}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowIFMMatrixModal(false)}
          />
        </Modal>
      )}

      {showLifestyleModal && (
        <Modal
          isOpen={true}
          title={lifestyleAssessments.length > 0 ? 'Update Lifestyle Assessment' : 'Create Lifestyle Assessment'}
          onClose={() => setShowLifestyleModal(false)}
        >
          <LifestyleAssessmentForm
            patientId={globals.selected_patient_id!}
            clinicId={globals.user?.clinic_id || ''}
            existingData={lifestyleAssessments[0]}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowLifestyleModal(false)}
          />
        </Modal>
      )}

      {showHealthGoalModal && (
        <Modal
          isOpen={true}
          title="Add Health Goal"
          onClose={() => setShowHealthGoalModal(false)}
        >
          <HealthGoalForm
            patientId={globals.selected_patient_id!}
            clinicId={globals.user?.clinic_id || ''}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowHealthGoalModal(false)}
          />
        </Modal>
      )}

      {showFoodSensitivityModal && (
        <Modal
          isOpen={true}
          title="Add Food Sensitivity"
          onClose={() => setShowFoodSensitivityModal(false)}
        >
          <FoodSensitivityForm
            patientId={globals.selected_patient_id!}
            clinicId={globals.user?.clinic_id || ''}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowFoodSensitivityModal(false)}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default FunctionalMedicine;
