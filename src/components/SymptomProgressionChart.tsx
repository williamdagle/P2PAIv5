import React, { useState } from 'react';
import { Activity, Calendar } from 'lucide-react';

interface SymptomEntry {
  id: string;
  date: string;
  complaint: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration?: string;
  associated_symptoms?: string[];
  notes?: string;
}

interface SymptomProgressionChartProps {
  chiefComplaints: SymptomEntry[];
  symptomName?: string;
}

const SymptomProgressionChart: React.FC<SymptomProgressionChartProps> = ({
  chiefComplaints,
  symptomName,
}) => {
  const [selectedSymptom, setSelectedSymptom] = useState<string>(symptomName || 'all');
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('6m');

  const filterByDateRange = (entries: SymptomEntry[]) => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return entries;
    }

    return entries.filter(e => new Date(e.date) >= cutoffDate);
  };

  const uniqueSymptoms = Array.from(
    new Set(chiefComplaints.map(c => c.complaint.toLowerCase()))
  );

  const filteredData = filterByDateRange(
    selectedSymptom === 'all'
      ? chiefComplaints
      : chiefComplaints.filter(c => c.complaint.toLowerCase() === selectedSymptom.toLowerCase())
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getSeverityScore = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 3;
      case 'moderate':
        return 2;
      case 'mild':
        return 1;
      default:
        return 0;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return '#ef4444';
      case 'moderate':
        return '#f59e0b';
      case 'mild':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const chartWidth = 800;
  const chartHeight = 200;
  const maxSeverity = 3;

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Progression</h3>
        <p className="text-gray-500 text-center py-8">No symptom data available</p>
      </div>
    );
  }

  const pointSpacing = chartWidth / (filteredData.length - 1 || 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Symptom Progression
        </h3>
        <div className="flex gap-2">
          <select
            value={selectedSymptom}
            onChange={(e) => setSelectedSymptom(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Symptoms</option>
            {uniqueSymptoms.map((symptom) => (
              <option key={symptom} value={symptom}>
                {symptom}
              </option>
            ))}
          </select>
          <button
            onClick={() => setTimeRange('1m')}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === '1m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1M
          </button>
          <button
            onClick={() => setTimeRange('3m')}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === '3m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3M
          </button>
          <button
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === '6m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setTimeRange('1y')}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === '1y'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1Y
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Severity Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-gray-600">Severity:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-700">Mild</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-700">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-700">Severe</span>
        </div>
      </div>

      <div className="relative mb-6" style={{ height: '250px' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {/* Grid Lines */}
          <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#e5e7eb" strokeWidth="1" />
          <line
            x1="0"
            y1={chartHeight / 3}
            x2={chartWidth}
            y2={chartHeight / 3}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={(chartHeight * 2) / 3}
            x2={chartWidth}
            y2={(chartHeight * 2) / 3}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          <text x="-5" y="10" fontSize="12" fill="#6b7280" textAnchor="end">
            Severe
          </text>
          <text x="-5" y={chartHeight / 3 + 5} fontSize="12" fill="#6b7280" textAnchor="end">
            Moderate
          </text>
          <text x="-5" y={(chartHeight * 2) / 3 + 5} fontSize="12" fill="#6b7280" textAnchor="end">
            Mild
          </text>

          {/* Line Chart */}
          {filteredData.length > 1 && (
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
              points={filteredData
                .map((entry, index) => {
                  const x = index * pointSpacing;
                  const severityScore = getSeverityScore(entry.severity);
                  const y = chartHeight - (severityScore / maxSeverity) * chartHeight;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          )}

          {/* Data Points */}
          {filteredData.map((entry, index) => {
            const x = index * pointSpacing;
            const severityScore = getSeverityScore(entry.severity);
            const y = chartHeight - (severityScore / maxSeverity) * chartHeight;

            return (
              <g key={entry.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={getSeverityColor(entry.severity)}
                  stroke="white"
                  strokeWidth="2"
                />
                <title>{`${entry.complaint} - ${entry.severity} (${new Date(
                  entry.date
                ).toLocaleDateString()})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filteredData.map((entry) => (
          <div key={entry.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{entry.complaint}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    entry.severity === 'severe'
                      ? 'bg-red-100 text-red-800'
                      : entry.severity === 'moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {entry.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
              {entry.duration && (
                <p className="text-sm text-gray-600">Duration: {entry.duration}</p>
              )}
              {entry.associated_symptoms && entry.associated_symptoms.length > 0 && (
                <p className="text-sm text-gray-600">
                  Associated: {entry.associated_symptoms.join(', ')}
                </p>
              )}
              {entry.notes && <p className="text-sm text-gray-700 mt-1 italic">{entry.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymptomProgressionChart;
