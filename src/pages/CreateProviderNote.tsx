import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { ArrowLeft, Stethoscope, Save, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  template_type: string;
  description: string;
  structure: {
    sections: Array<{
      name: string;
      label: string;
      placeholder?: string;
    }>;
  };
}

const CreateProviderNote: React.FC = () => {
  const navigate = useNavigate();
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    note_date: new Date().toISOString().split('T')[0],
    category: '',
    sections: {} as Record<string, string>
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_note_templates`
      );
      setTemplates(response || []);
    } catch (err) {
      showError('Failed to load templates', 'Using default form.');
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData(prev => ({
        ...prev,
        title: template.name,
        category: template.template_type,
        sections: {}
      }));
    } else {
      setSelectedTemplate(null);
      setFormData(prev => ({
        ...prev,
        sections: {}
      }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionChange = (sectionName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: { ...prev.sections, [sectionName]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!globals.selected_patient_id) {
      showError('No patient selected', 'Please select a patient first.');
      return;
    }

    if (!formData.title.trim()) {
      showError('Title required', 'Please enter a title for the note.');
      return;
    }

    const content = selectedTemplate
      ? selectedTemplate.structure.sections
          .map(section => `${section.label}:\n${formData.sections[section.name] || ''}`)
          .join('\n\n')
      : formData.sections['content'] || '';

    if (!content.trim()) {
      showError('Content required', 'Please enter note content.');
      return;
    }

    setLoading(true);
    try {
      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_clinical_notes`,
        {
          method: 'POST',
          body: JSON.stringify({
            patient_id: globals.selected_patient_id,
            clinic_id: globals.clinic_id,
            provider_id: globals.user_id,
            title: formData.title,
            content: content,
            raw_content: content,
            structured_content: selectedTemplate ? formData.sections : null,
            note_type: 'provider_note',
            category: formData.category || null,
            template_id: selectedTemplate?.id || null,
            note_date: formData.note_date,
            created_by: globals.user_id
          })
        }
      );

      showSuccess('Provider note created successfully');
      onNavigate('ClinicalNotes');
    } catch (err) {
      showError('Failed to create provider note', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('ClinicalNotes')}
            className="mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clinical Notes
          </Button>
          <div className="flex items-center mb-2">
            <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Provider Note</h1>
          </div>
          <p className="text-gray-600">
            Document clinical findings and assessments for {globals.selected_patient_name}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Template">
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No template (Free text)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {t.description}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date" required>
                <input
                  type="date"
                  value={formData.note_date}
                  onChange={(e) => handleChange('note_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>

            <FormField label="Title" required>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the visit or note"
              />
            </FormField>

            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span>Using template: {selectedTemplate.name}</span>
                </div>
                {selectedTemplate.structure.sections.map((section) => (
                  <FormField key={section.name} label={section.label}>
                    <textarea
                      value={formData.sections[section.name] || ''}
                      onChange={(e) => handleSectionChange(section.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={section.placeholder || `Enter ${section.label.toLowerCase()}...`}
                      rows={4}
                    />
                  </FormField>
                ))}
              </div>
            ) : (
              <FormField label="Note Content" required>
                <textarea
                  value={formData.sections['content'] || ''}
                  onChange={(e) => handleSectionChange('content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your clinical notes, findings, assessments, and treatment plans..."
                  rows={12}
                />
              </FormField>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate('ClinicalNotes')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Provider Note
              </Button>
            </div>
          </form>
        </div>
      </div>
    
  );
};

export default CreateProviderNote;
