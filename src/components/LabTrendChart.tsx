import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LabResult {
  id: string;
  test_component: string;
  result_value: string;
  result_unit: string;
  result_date: string;
  reference_range?: string;
  abnormal_flag?: string;
}

interface LabTrendChartProps {
  labResults: LabResult[];
  testName: string;
}

const LabTrendChart: React.FC<LabTrendChartProps> = ({ labResults, testName }) => {
  const [selectedRange, setSelectedRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  const filterByDateRange = (results: LabResult[]) => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (selectedRange) {
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
        return results;
    }

    return results.filter(r => new Date(r.result_date) >= cutoffDate);
  };

  const sortedResults = filterByDateRange(labResults)
    .sort((a, b) => new Date(a.result_date).getTime() - new Date(b.result_date).getTime());

  if (sortedResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{testName} Trend</h3>
        <p className="text-gray-500 text-center py-8">No data available for the selected time range</p>
      </div>
    );
  }

  const numericValues = sortedResults
    .map(r => parseFloat(r.result_value))
    .filter(v => !isNaN(v));

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;

  const parseReferenceRange = (refRange?: string) => {
    if (!refRange) return null;
    const match = refRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2]),
      };
    }
    return null;
  };

  const referenceRange = sortedResults[0]?.reference_range
    ? parseReferenceRange(sortedResults[0].reference_range)
    : null;

  const calculateY = (value: number) => {
    const adjustedMax = maxValue + padding;
    const adjustedMin = minValue - padding;
    const normalizedValue = (value - adjustedMin) / (adjustedMax - adjustedMin);
    return 100 - normalizedValue * 100;
  };

  const chartWidth = 800;
  const chartHeight = 300;
  const pointSpacing = chartWidth / (sortedResults.length - 1 || 1);

  const getTrendIcon = () => {
    if (sortedResults.length < 2) return <Minus className="w-5 h-5 text-gray-500" />;
    const first = parseFloat(sortedResults[0].result_value);
    const last = parseFloat(sortedResults[sortedResults.length - 1].result_value);
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 5) return <Minus className="w-5 h-5 text-gray-500" />;
    if (change > 0) return <TrendingUp className="w-5 h-5 text-green-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const getTrendPercentage = () => {
    if (sortedResults.length < 2) return '0%';
    const first = parseFloat(sortedResults[0].result_value);
    const last = parseFloat(sortedResults[sortedResults.length - 1].result_value);
    const change = ((last - first) / first) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{testName} Trend</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
            {getTrendIcon()}
            <span className="text-sm font-medium text-gray-700">{getTrendPercentage()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRange('3m')}
            className={`px-3 py-1 rounded text-sm ${
              selectedRange === '3m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3M
          </button>
          <button
            onClick={() => setSelectedRange('6m')}
            className={`px-3 py-1 rounded text-sm ${
              selectedRange === '6m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setSelectedRange('1y')}
            className={`px-3 py-1 rounded text-sm ${
              selectedRange === '1y'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1Y
          </button>
          <button
            onClick={() => setSelectedRange('all')}
            className={`px-3 py-1 rounded text-sm ${
              selectedRange === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: '320px' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {/* Reference Range Band */}
          {referenceRange && (
            <rect
              x="0"
              y={calculateY(referenceRange.max) + '%'}
              width={chartWidth}
              height={`${calculateY(referenceRange.min) - calculateY(referenceRange.max)}%`}
              fill="#86efac"
              opacity="0.2"
            />
          )}

          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2={chartWidth}
              y2={`${y}%`}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Line Chart */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={sortedResults
              .map((result, index) => {
                const value = parseFloat(result.result_value);
                const x = index * pointSpacing;
                const y = calculateY(value);
                return `${x},${(y * chartHeight) / 100}`;
              })
              .join(' ')}
          />

          {/* Data Points */}
          {sortedResults.map((result, index) => {
            const value = parseFloat(result.result_value);
            const x = index * pointSpacing;
            const y = (calculateY(value) * chartHeight) / 100;
            const isAbnormal = result.abnormal_flag && result.abnormal_flag !== 'normal';

            return (
              <g key={result.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={isAbnormal ? '#ef4444' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="2"
                />
                <title>
                  {`${result.result_value} ${result.result_unit} - ${new Date(
                    result.result_date
                  ).toLocaleDateString()}`}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Data Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {new Date(result.result_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{result.result_value}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{result.result_unit}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{result.reference_range || '-'}</td>
                <td className="px-4 py-2">
                  {result.abnormal_flag && result.abnormal_flag !== 'normal' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      {result.abnormal_flag}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabTrendChart;
