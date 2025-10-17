import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ChartSection {
  name: string;
  status: 'complete' | 'partial' | 'empty' | 'required';
  items?: { name: string; completed: boolean; required: boolean }[];
  lastUpdated?: string;
}

interface ChartCompletenessCheckerProps {
  sections: ChartSection[];
  onSectionClick?: (sectionName: string) => void;
}

const ChartCompletenessChecker: React.FC<ChartCompletenessCheckerProps> = ({
  sections,
  onSectionClick,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'required':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'empty':
        return <Info className="w-5 h-5 text-gray-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'required':
        return 'bg-red-50 border-red-200';
      case 'empty':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'partial':
        return 'Incomplete';
      case 'required':
        return 'Required';
      case 'empty':
        return 'Not Started';
      default:
        return 'Unknown';
    }
  };

  const calculateOverallCompleteness = () => {
    const requiredSections = sections.filter(s => s.status === 'required' || s.status === 'complete' || s.status === 'partial');
    const completedSections = sections.filter(s => s.status === 'complete');
    if (requiredSections.length === 0) return 100;
    return Math.round((completedSections.length / requiredSections.length) * 100);
  };

  const overallCompleteness = calculateOverallCompleteness();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart Completeness</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  overallCompleteness === 100
                    ? 'bg-green-600'
                    : overallCompleteness >= 75
                    ? 'bg-blue-600'
                    : overallCompleteness >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${overallCompleteness}%` }}
              ></div>
            </div>
          </div>
          <span className="text-lg font-bold text-gray-900">{overallCompleteness}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-colors ${getStatusColor(
              section.status
            )} ${onSectionClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={() => onSectionClick && onSectionClick(section.name)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(section.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{section.name}</h4>
                  {section.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(section.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  section.status === 'complete'
                    ? 'bg-green-100 text-green-800'
                    : section.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : section.status === 'required'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {getStatusLabel(section.status)}
              </span>
            </div>

            {section.items && section.items.length > 0 && (
              <div className="mt-3 space-y-1 pl-8">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : item.required ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    )}
                    <span
                      className={
                        item.completed
                          ? 'text-gray-700'
                          : item.required
                          ? 'text-red-700 font-medium'
                          : 'text-gray-500'
                      }
                    >
                      {item.name}
                      {item.required && !item.completed && (
                        <span className="ml-1 text-red-600">*</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Chart Documentation Tips</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Complete all required sections before signing the chart</li>
              <li>Review medication reconciliation for accuracy</li>
              <li>Ensure all allergies are documented</li>
              <li>Add problem list items for chronic conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCompletenessChecker;
