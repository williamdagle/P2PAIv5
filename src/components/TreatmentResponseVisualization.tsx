import React from 'react';
import { TrendingUp, TrendingDown, Activity, CheckCircle } from 'lucide-react';

interface TreatmentEvent {
  date: string;
  type: 'medication' | 'supplement' | 'lifestyle' | 'procedure';
  intervention: string;
  status: string;
}

interface SymptomSnapshot {
  date: string;
  severity: number;
  complaint: string;
}

interface OutcomeMetric {
  date: string;
  metric: string;
  value: number;
  unit: string;
}

interface TreatmentResponseVisualizationProps {
  treatments: TreatmentEvent[];
  symptoms: SymptomSnapshot[];
  outcomes?: OutcomeMetric[];
  startDate?: string;
  endDate?: string;
}

const TreatmentResponseVisualization: React.FC<TreatmentResponseVisualizationProps> = ({
  treatments,
  symptoms,
  outcomes = [],
  startDate,
  endDate,
}) => {
  const start = startDate ? new Date(startDate) : new Date(Math.min(...symptoms.map(s => new Date(s.date).getTime())));
  const end = endDate ? new Date(endDate) : new Date();
  const timeSpan = end.getTime() - start.getTime();

  const getPositionX = (date: string) => {
    const eventTime = new Date(date).getTime();
    return ((eventTime - start.getTime()) / timeSpan) * 100;
  };

  const groupedByDate = treatments.reduce((acc, treatment) => {
    const dateKey = new Date(treatment.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(treatment);
    return acc;
  }, {} as Record<string, TreatmentEvent[]>);

  const getTreatmentColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-500';
      case 'supplement':
        return 'bg-green-500';
      case 'lifestyle':
        return 'bg-purple-500';
      case 'procedure':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateSymptomTrend = () => {
    if (symptoms.length < 2) return { trend: 'stable', percentage: 0 };
    const firstSymptom = symptoms[0];
    const lastSymptom = symptoms[symptoms.length - 1];
    const change = ((lastSymptom.severity - firstSymptom.severity) / firstSymptom.severity) * 100;

    if (change < -10) return { trend: 'improving', percentage: Math.abs(change) };
    if (change > 10) return { trend: 'worsening', percentage: change };
    return { trend: 'stable', percentage: Math.abs(change) };
  };

  const trend = calculateSymptomTrend();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Treatment Response Timeline
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
          {trend.trend === 'improving' ? (
            <>
              <TrendingDown className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Improving {trend.percentage.toFixed(0)}%
              </span>
            </>
          ) : trend.trend === 'worsening' ? (
            <>
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Worsening {trend.percentage.toFixed(0)}%
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Stable</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-700">Medication</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-700">Supplement</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-gray-700">Lifestyle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-700">Procedure</span>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative bg-gray-50 rounded-lg p-6 mb-6" style={{ minHeight: '200px' }}>
        {/* Time axis */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>

        {/* Date markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          <span>{start.toLocaleDateString()}</span>
          <span>{end.toLocaleDateString()}</span>
        </div>

        {/* Treatment events */}
        {Object.entries(groupedByDate).map(([date, treatmentList]) => {
          const position = getPositionX(date);
          return (
            <div
              key={date}
              className="absolute"
              style={{ left: `${position}%`, top: '20px' }}
            >
              <div className="relative group">
                {/* Event marker */}
                <div className="flex flex-col gap-1 items-center">
                  {treatmentList.map((treatment, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded ${getTreatmentColor(
                        treatment.type
                      )} cursor-pointer hover:scale-110 transition-transform`}
                    ></div>
                  ))}
                </div>

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                    <p className="font-medium mb-1">{new Date(date).toLocaleDateString()}</p>
                    {treatmentList.map((treatment, idx) => (
                      <p key={idx} className="text-gray-300">
                        • {treatment.intervention}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Vertical line to timeline */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full h-16 w-px bg-gray-300"></div>
              </div>
            </div>
          );
        })}

        {/* Symptom severity overlay */}
        {symptoms.length > 1 && (
          <svg className="absolute top-8 left-0 w-full h-24 pointer-events-none">
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,4"
              points={symptoms
                .map((symptom) => {
                  const x = getPositionX(symptom.date);
                  const y = 100 - (symptom.severity / 3) * 80;
                  return `${x}%,${y}%`;
                })
                .join(' ')}
            />
          </svg>
        )}
      </div>

      {/* Treatment List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Interventions</h4>
        {treatments.length === 0 ? (
          <p className="text-gray-500 text-sm">No treatments recorded</p>
        ) : (
          <div className="space-y-2">
            {treatments.map((treatment, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className={`w-3 h-3 rounded ${getTreatmentColor(treatment.type)}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{treatment.intervention}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(treatment.date).toLocaleDateString()} • {treatment.type}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    treatment.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : treatment.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {treatment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outcome Metrics */}
      {outcomes.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Outcome Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outcomes.map((outcome, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">{outcome.metric}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {outcome.value} {outcome.unit}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date(outcome.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentResponseVisualization;
