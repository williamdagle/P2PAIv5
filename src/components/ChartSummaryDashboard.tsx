import React, { useMemo } from 'react';
import { Activity, AlertCircle, Stethoscope, Heart, TrendingUp, FileText, Clock } from 'lucide-react';

interface ChartSummaryData {
  patient: any;
  vitalSigns: any[];
  allergies: any[];
  problems: any[];
  medications: any[];
  recentActivity: any[];
  completeness: {
    section: string;
    status: 'complete' | 'partial' | 'empty';
  }[];
}

interface ChartSummaryDashboardProps {
  data: ChartSummaryData;
  onSectionClick: (section: string) => void;
}

const ChartSummaryDashboard: React.FC<ChartSummaryDashboardProps> = React.memo(({ data, onSectionClick }) => {
  const latestVitals = useMemo(() => {
    if (!data.vitalSigns || data.vitalSigns.length === 0) return null;
    return data.vitalSigns[0];
  }, [data.vitalSigns]);

  const getCompletenessColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'empty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeProblems = useMemo(() =>
    data.problems?.filter(p => p.status === 'active' || p.status === 'chronic') || [],
    [data.problems]
  );

  const activeAllergies = useMemo(() =>
    data.allergies?.filter(a => a.status === 'active') || [],
    [data.allergies]
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Problems</p>
              <p className="text-2xl font-bold text-gray-900">{activeProblems.length}</p>
            </div>
            <Stethoscope className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Allergies</p>
              <p className="text-2xl font-bold text-gray-900">{activeAllergies.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medications</p>
              <p className="text-2xl font-bold text-gray-900">{data.medications?.length || 0}</p>
            </div>
            <Heart className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Visits</p>
              <p className="text-2xl font-bold text-gray-900">{data.recentActivity?.length || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Latest Vital Signs */}
      {latestVitals && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Latest Vital Signs
            </h3>
            <button
              onClick={() => onSectionClick('vitals')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {latestVitals.blood_pressure_systolic && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">BP</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestVitals.blood_pressure_systolic}/{latestVitals.blood_pressure_diastolic}
                </p>
              </div>
            )}
            {latestVitals.heart_rate_bpm && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Heart Rate</p>
                <p className="text-lg font-semibold text-gray-900">{latestVitals.heart_rate_bpm} bpm</p>
              </div>
            )}
            {latestVitals.temperature_c && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Temp</p>
                <p className="text-lg font-semibold text-gray-900">{latestVitals.temperature_c}°C</p>
              </div>
            )}
            {latestVitals.weight_kg && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Weight</p>
                <p className="text-lg font-semibold text-gray-900">{latestVitals.weight_kg} kg</p>
              </div>
            )}
            {latestVitals.bmi && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">BMI</p>
                <p className="text-lg font-semibold text-gray-900">{latestVitals.bmi}</p>
              </div>
            )}
            {latestVitals.oxygen_saturation && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">O2 Sat</p>
                <p className="text-lg font-semibold text-gray-900">{latestVitals.oxygen_saturation}%</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Recorded: {new Date(latestVitals.recorded_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Active Problems */}
      {activeProblems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Active Problems
            </h3>
            <button
              onClick={() => onSectionClick('problems')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {activeProblems.slice(0, 5).map((problem: any) => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => onSectionClick('problems')}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{problem.problem}</p>
                  {problem.icd10_code && (
                    <p className="text-sm text-gray-600">ICD-10: {problem.icd10_code}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    problem.severity === 'severe' ? 'bg-red-100 text-red-800' :
                    problem.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {problem.severity || 'N/A'}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {problem.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Allergies */}
      {activeAllergies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Active Allergies
            </h3>
            <button
              onClick={() => onSectionClick('allergies')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {activeAllergies.map((allergy: any) => (
              <div
                key={allergy.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{allergy.allergen}</p>
                  <p className="text-sm text-gray-600">{allergy.reaction}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  allergy.severity === 'life-threatening' ? 'bg-red-600 text-white' :
                  allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  allergy.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {allergy.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Completeness */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Chart Completeness
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.completeness.map((item) => (
            <div
              key={item.section}
              className={`p-3 rounded text-center cursor-pointer hover:opacity-80 ${getCompletenessColor(item.status)}`}
              onClick={() => onSectionClick(item.section.toLowerCase().replace(' ', '-'))}
            >
              <p className="text-sm font-medium">{item.section}</p>
              <p className="text-xs mt-1 capitalize">{item.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 10).map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ChartSummaryDashboard.displayName = 'ChartSummaryDashboard';

export default ChartSummaryDashboard;
