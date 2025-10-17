import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface TemplateSection {
  id: string;
  name: string;
  type: 'textarea' | 'text' | 'select' | 'checkbox';
  required: boolean;
  description?: string;
  placeholder?: string;
}

interface TemplateFormProps {
  template?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TEMPLATE_TYPES = [
  { value: 'soap', label: 'SOAP Note' },
  { value: 'follow_up', label: 'Follow-up Visit' },
  { value: 'initial_visit', label: 'Initial Consultation' },
  { value: 'progress', label: 'Progress Note' },
  { value: 'custom', label: 'Custom' }
];

const FIELD_TYPES = [
  { value: 'textarea', label: 'Text Area (Multi-line)' },
  { value: 'text', label: 'Text Input (Single-line)' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'checkbox', label: 'Checkbox' }
];

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSuccess, onCancel }) => {
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'soap',
    description: '',
    is_personal: true
  });
  const [sections, setSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_current_user`,
          { method: 'GET' }
        );
        const isSysAdmin = userData?.role_name === 'System Admin';
        setIsSystemAdmin(isSysAdmin);

        if (!isSysAdmin) {
          setFormData(prev => ({ ...prev, is_personal: true }));
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setFormData(prev => ({ ...prev, is_personal: true }));
      } finally {
        setInitializing(false);
      }
    };

    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        template_type: template.template_type || 'soap',
        description: template.description || '',
        is_personal: template.is_personal || false
      });
      if (template.structure?.sections) {
        setSections(template.structure.sections);
      }
    } else {
      setSections([{
        id: 'section_1',
        name: '',
        type: 'textarea',
        required: true,
        description: '',
        placeholder: ''
      }]);
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionChange = (index: number, field: string, value: any) => {
    setSections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSection = () => {
    setSections(prev => [...prev, {
      id: `section_${Date.now()}`,
      name: '',
      type: 'textarea',
      required: false,
      description: '',
      placeholder: ''
    }]);
  };

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const structure = { sections };
      const payload = {
        ...formData,
        structure
      };

      if (template) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_note_templates`,
          {
            method: 'PUT',
            body: { id: template.id, ...payload }
          }
        );
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_note_templates`,
          {
            method: 'POST',
            body: payload
          }
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Initial Consultation"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Type
        </label>
        <select
          value={formData.template_type}
          onChange={(e) => handleInputChange('template_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {TEMPLATE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of this template's purpose"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isSystemAdmin && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_personal"
            checked={formData.is_personal}
            onChange={(e) => handleInputChange('is_personal', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_personal" className="ml-2 block text-sm text-gray-700">
            Personal Template (only visible to me)
          </label>
        </div>
      )}
      {!isSystemAdmin && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Your templates will be personal and only visible to you.
          </p>
        </div>
      )}

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Template Sections</h3>
          <Button
            type="button"
            onClick={addSection}
            variant="secondary"
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <GripVertical className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                </div>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                    placeholder="e.g., Subjective"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Type
                  </label>
                  <select
                    value={section.type}
                    onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={section.description || ''}
                    onChange={(e) => handleSectionChange(index, 'description', e.target.value)}
                    placeholder="Brief description of what to include"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placeholder (Optional)
                  </label>
                  <input
                    type="text"
                    value={section.placeholder || ''}
                    onChange={(e) => handleSectionChange(index, 'placeholder', e.target.value)}
                    placeholder="Hint text shown in empty field"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center col-span-2">
                  <input
                    type="checkbox"
                    id={`section_required_${index}`}
                    checked={section.required}
                    onChange={(e) => handleSectionChange(index, 'required', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`section_required_${index}`} className="ml-2 block text-sm text-gray-700">
                    Required field
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
