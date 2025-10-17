import React, { useState } from 'react';
import { FileText, Plus, Star, Clock } from 'lucide-react';
import Button from './Button';

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: 'visit' | 'specialty' | 'custom';
  sections: string[];
  isStarred?: boolean;
  lastUsed?: string;
  useCount?: number;
}

interface ChartTemplateSelectorProps {
  templates: ChartTemplate[];
  onSelectTemplate: (template: ChartTemplate) => void;
  onCreateCustom?: () => void;
}

const ChartTemplateSelector: React.FC<ChartTemplateSelectorProps> = ({
  templates,
  onSelectTemplate,
  onCreateCustom,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const defaultTemplates: ChartTemplate[] = [
    {
      id: 'annual-wellness',
      name: 'Annual Wellness Visit',
      description: 'Comprehensive annual examination with preventive care screening',
      category: 'visit',
      sections: [
        'Chief Complaint',
        'Review of Systems',
        'Physical Exam',
        'Vital Signs',
        'Preventive Screening',
        'Health Goals',
        'Assessment & Plan',
      ],
      useCount: 45,
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'acute-visit',
      name: 'Acute Illness Visit',
      description: 'Quick assessment for acute conditions',
      category: 'visit',
      sections: [
        'Chief Complaint',
        'History of Present Illness',
        'Focused Physical Exam',
        'Vital Signs',
        'Assessment & Plan',
      ],
      useCount: 120,
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isStarred: true,
    },
    {
      id: 'chronic-followup',
      name: 'Chronic Disease Follow-up',
      description: 'Follow-up visit for chronic condition management',
      category: 'visit',
      sections: [
        'Interval History',
        'Medication Review',
        'Vital Signs',
        'Problem List Update',
        'Treatment Response',
        'Assessment & Plan',
      ],
      useCount: 78,
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isStarred: true,
    },
    {
      id: 'fm-initial',
      name: 'Functional Medicine Initial Consult',
      description: 'Comprehensive functional medicine assessment',
      category: 'specialty',
      sections: [
        'Chief Complaint',
        'History of Present Illness',
        'FM Timeline',
        'IFM Matrix Assessment',
        'Lifestyle Assessment',
        'Food Sensitivities',
        'Health Goals',
        'Treatment Plan',
      ],
      useCount: 32,
      isStarred: true,
    },
    {
      id: 'fm-followup',
      name: 'Functional Medicine Follow-up',
      description: 'Follow-up for functional medicine patients',
      category: 'specialty',
      sections: [
        'Interval History',
        'Treatment Response',
        'Lifestyle Progress',
        'Symptom Tracking',
        'Lab Review',
        'Updated Plan',
      ],
      useCount: 56,
    },
    {
      id: 'telehealth',
      name: 'Telehealth Visit',
      description: 'Virtual visit documentation',
      category: 'visit',
      sections: [
        'Chief Complaint',
        'History of Present Illness',
        'Virtual Examination Notes',
        'Assessment & Plan',
        'Patient Education',
      ],
      useCount: 89,
    },
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const starredTemplates = filteredTemplates.filter((t) => t.isStarred);
  const recentTemplates = [...filteredTemplates]
    .filter((t) => t.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Chart Templates</h2>
        {onCreateCustom && (
          <Button onClick={onCreateCustom} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Template
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('visit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === 'visit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Visit Types
          </button>
          <button
            onClick={() => setSelectedCategory('specialty')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === 'specialty'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Specialty
          </button>
          <button
            onClick={() => setSelectedCategory('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {starredTemplates.length > 0 && selectedCategory === 'all' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            Starred Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={onSelectTemplate} />
            ))}
          </div>
        </div>
      )}

      {recentTemplates.length > 0 && selectedCategory === 'all' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recently Used
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={onSelectTemplate} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {selectedCategory === 'all' ? 'All Templates' : 'Filtered Templates'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onSelect={onSelectTemplate} />
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const TemplateCard: React.FC<{
  template: ChartTemplate;
  onSelect: (template: ChartTemplate) => void;
}> = ({ template, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(template)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {template.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
        </div>
        {template.useCount && (
          <span className="text-xs text-gray-500">{template.useCount} uses</span>
        )}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
      <div className="flex flex-wrap gap-1">
        {template.sections.slice(0, 3).map((section, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
            {section}
          </span>
        ))}
        {template.sections.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            +{template.sections.length - 3} more
          </span>
        )}
      </div>
      {template.lastUsed && (
        <p className="text-xs text-gray-500 mt-2">
          Last used {new Date(template.lastUsed).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default ChartTemplateSelector;
