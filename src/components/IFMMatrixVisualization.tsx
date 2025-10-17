import React from 'react';
import { Activity, Shield, Zap, Droplet, Wind, Radio, Grid } from 'lucide-react';

interface IFMMatrixData {
  id?: string;
  assessment_date?: string;
  assessment_name?: string;
  assimilation_status?: string;
  assimilation_findings?: string;
  assimilation_interventions?: string;
  defense_repair_status?: string;
  defense_repair_findings?: string;
  defense_repair_interventions?: string;
  energy_status?: string;
  energy_findings?: string;
  energy_interventions?: string;
  biotransformation_status?: string;
  biotransformation_findings?: string;
  biotransformation_interventions?: string;
  transport_status?: string;
  transport_findings?: string;
  transport_interventions?: string;
  communication_status?: string;
  communication_findings?: string;
  communication_interventions?: string;
  structural_status?: string;
  structural_findings?: string;
  structural_interventions?: string;
  overall_summary?: string;
  priority_systems?: string[];
}

interface IFMMatrixVisualizationProps {
  data: IFMMatrixData | null;
  onEdit?: () => void;
}

const systemsConfig = [
  {
    key: 'assimilation',
    name: 'Assimilation',
    description: 'Digestion, Absorption, Microbiome',
    icon: Activity,
    color: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
  },
  {
    key: 'defense_repair',
    name: 'Defense & Repair',
    description: 'Immune System',
    icon: Shield,
    color: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'energy',
    name: 'Energy',
    description: 'Mitochondrial, Thyroid, Adrenal',
    icon: Zap,
    color: 'from-yellow-500 to-orange-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    key: 'biotransformation',
    name: 'Biotransformation',
    description: 'Detoxification Pathways',
    icon: Droplet,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'transport',
    name: 'Transport',
    description: 'Cardiovascular, Lymphatic',
    icon: Wind,
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
  },
  {
    key: 'communication',
    name: 'Communication',
    description: 'Hormonal, Neurotransmitter',
    icon: Radio,
    color: 'from-indigo-500 to-blue-600',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  {
    key: 'structural',
    name: 'Structural Integrity',
    description: 'Musculoskeletal, Cellular',
    icon: Grid,
    color: 'from-gray-500 to-slate-600',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-50',
  },
];

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'optimal':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'suboptimal':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'impaired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const IFMMatrixVisualization: React.FC<IFMMatrixVisualizationProps> = ({ data, onEdit }) => {
  if (!data) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No IFM Matrix Assessment</h3>
        <p className="text-gray-600 mb-4">Create an assessment to visualize functional systems</p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Assessment
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {data.assessment_name || 'IFM Matrix Assessment'}
          </h3>
          {data.assessment_date && (
            <p className="text-sm text-gray-600 mt-1">
              Date: {new Date(data.assessment_date).toLocaleDateString()}
            </p>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Assessment
          </button>
        )}
      </div>

      {data.priority_systems && data.priority_systems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <strong>Priority Systems:</strong> {data.priority_systems.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemsConfig.map((system) => {
          const statusKey = `${system.key}_status` as keyof IFMMatrixData;
          const findingsKey = `${system.key}_findings` as keyof IFMMatrixData;
          const interventionsKey = `${system.key}_interventions` as keyof IFMMatrixData;

          const status = data[statusKey] as string | undefined;
          const findings = data[findingsKey] as string | undefined;
          const interventions = data[interventionsKey] as string | undefined;
          const Icon = system.icon;

          const isPriority = data.priority_systems?.includes(system.name);

          return (
            <div
              key={system.key}
              className={`relative rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${
                isPriority ? 'ring-2 ring-amber-400 ring-offset-2' : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${system.color} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-8 h-8" />
                  {isPriority && (
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">
                      PRIORITY
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold">{system.name}</h4>
                <p className="text-sm opacity-90">{system.description}</p>
              </div>

              <div className={`p-4 ${system.bgColor}`}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Status
                    </label>
                    <div
                      className={`mt-1 px-3 py-2 rounded-lg border-2 font-medium text-sm ${getStatusColor(
                        status
                      )}`}
                    >
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not assessed'}
                    </div>
                  </div>

                  {findings && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Findings
                      </label>
                      <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                        {findings}
                      </p>
                    </div>
                  )}

                  {interventions && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Interventions
                      </label>
                      <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                        {interventions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.overall_summary && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Overall Summary</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{data.overall_summary}</p>
        </div>
      )}
    </div>
  );
};

export default IFMMatrixVisualization;
