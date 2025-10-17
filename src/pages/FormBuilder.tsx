import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { FileText, Plus, Edit, Trash2, Copy, Eye, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { FormDefinition, FormField as FormFieldType } from '../types';

interface FormBuilderProps {
  onNavigate: (page: string) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const { showNotification } = useNotification();

  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);

  const [formMetadata, setFormMetadata] = useState({
    form_name: '',
    form_code: '',
    category: 'intake',
    description: ''
  });

  const [formFields, setFormFields] = useState<FormFieldType[]>([]);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Number' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'signature', label: 'Signature' },
    { value: 'file_upload', label: 'File Upload' }
  ];

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await apiCall<FormDefinition[]>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_form_definitions`,
        { method: 'GET' }
      );
      setForms(response || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  const addField = () => {
    const newField: FormFieldType = {
      field_id: `field_${Date.now()}`,
      field_name: `field_${formFields.length + 1}`,
      field_label: 'New Field',
      field_type: 'text',
      required: false,
      validation: {},
      options: [],
      conditional_logic: {}
    };
    setFormFields([...formFields, newField]);
    setExpandedFields(prev => ({ ...prev, [newField.field_id]: true }));
  };

  const updateField = (index: number, updates: Partial<FormFieldType>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  const removeField = (index: number) => {
    const fieldId = formFields[index].field_id;
    setFormFields(formFields.filter((_, i) => i !== index));
    setExpandedFields(prev => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });
  };

  const duplicateField = (index: number) => {
    const field = formFields[index];
    const duplicate = {
      ...field,
      field_id: `field_${Date.now()}`,
      field_name: `${field.field_name}_copy`
    };
    setFormFields([...formFields.slice(0, index + 1), duplicate, ...formFields.slice(index + 1)]);
    setExpandedFields(prev => ({ ...prev, [duplicate.field_id]: true }));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updated = [...formFields];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setFormFields(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedFieldIndex !== null && draggedFieldIndex !== toIndex) {
      moveField(draggedFieldIndex, toIndex);
    }
    setDraggedFieldIndex(null);
  };

  const handleSaveForm = async () => {
    if (!formMetadata.form_name || !formMetadata.form_code) {
      showNotification('Please provide form name and code', 'error');
      return;
    }

    if (formFields.length === 0) {
      showNotification('Please add at least one field to the form', 'error');
      return;
    }

    try {
      const formSchema = {
        fields: formFields,
        metadata: {
          title: formMetadata.form_name,
          description: formMetadata.description
        }
      };

      await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_form_definition`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...formMetadata,
            form_schema: formSchema,
            version_name: 'v1.0 - Initial Version'
          })
        }
      );

      showNotification('Form created successfully', 'success');
      setIsDesigning(false);
      setFormMetadata({ form_name: '', form_code: '', category: 'intake', description: '' });
      setFormFields([]);
      setExpandedFields({});
      fetchForms();
    } catch (error: any) {
      showNotification(error.message || 'Failed to create form', 'error');
    }
  };

  const toggleFieldExpansion = (fieldId: string) => {
    setExpandedFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const renderFieldEditor = (field: FormFieldType, index: number) => {
    const isExpanded = expandedFields[field.field_id] ?? true;

    return (
      <div
        key={field.field_id}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        className="bg-white border border-gray-300 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
            <button
              onClick={() => toggleFieldExpansion(field.field_id)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <span className="font-medium text-gray-900">{field.field_label}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {fieldTypes.find(t => t.value === field.field_type)?.label}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => duplicateField(index)}
              className="text-blue-600 hover:text-blue-800"
              title="Duplicate Field"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeField(index)}
              className="text-red-600 hover:text-red-800"
              title="Remove Field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 pl-8">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Field Label">
                <input
                  type="text"
                  name="field_label"
                  value={field.field_label}
                  onChange={(e) => updateField(index, { field_label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <FormField label="Field Name (Internal)">
                <input
                  type="text"
                  name="field_name"
                  value={field.field_name}
                  onChange={(e) => updateField(index, { field_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Field Type">
                <select
                  name="field_type"
                  value={field.field_type}
                  onChange={(e) => updateField(index, { field_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-center space-x-2 mt-7">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Required Field</label>
              </div>
            </div>

            <FormField label="Placeholder Text">
              <input
                type="text"
                name="placeholder"
                value={field.placeholder || ''}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <FormField label="Help Text">
              <textarea
                name="help_text"
                value={field.help_text || ''}
                onChange={(e) => updateField(index, { help_text: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            {(field.field_type === 'dropdown' || field.field_type === 'radio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (one per line)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={field.options?.map(o => o.label).join('\n') || ''}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter(l => l.trim());
                    const options = lines.map((line, i) => ({
                      value: line.toLowerCase().replace(/\s+/g, '_'),
                      label: line
                    }));
                    updateField(index, { options });
                  }}
                  placeholder="Enter options, one per line"
                />
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Conditional Logic (Optional)</h4>
              <p className="text-xs text-gray-500">
                Show this field only if certain conditions are met. This feature allows for dynamic forms.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFormDesigner = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Form Name" required>
            <input
              type="text"
              name="form_name"
              value={formMetadata.form_name}
              onChange={(e) => setFormMetadata({ ...formMetadata, form_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </FormField>

          <FormField label="Form Code" required>
            <input
              type="text"
              name="form_code"
              value={formMetadata.form_code}
              onChange={(e) => setFormMetadata({ ...formMetadata, form_code: e.target.value })}
              placeholder="unique_form_code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </FormField>

          <FormField label="Category">
            <select
              name="category"
              value={formMetadata.category}
              onChange={(e) => setFormMetadata({ ...formMetadata, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="intake">Intake</option>
              <option value="consent">Consent</option>
              <option value="assessment">Assessment</option>
              <option value="survey">Survey</option>
              <option value="other">Other</option>
            </select>
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            name="description"
            value={formMetadata.description}
            onChange={(e) => setFormMetadata({ ...formMetadata, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </FormField>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
          <Button onClick={addField} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>

        {formFields.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No fields added yet</p>
            <Button onClick={addField} variant="secondary" size="sm">
              Add Your First Field
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {formFields.map((field, index) => renderFieldEditor(field, index))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="secondary"
          onClick={() => {
            setIsDesigning(false);
            setFormMetadata({ form_name: '', form_code: '', category: 'intake', description: '' });
            setFormFields([]);
            setExpandedFields({});
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleSaveForm}>
          Save Form
        </Button>
      </div>
    </div>
  );

  const renderFormsList = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Forms</h2>
            <p className="text-sm text-gray-600 mt-1">Manage custom intake and assessment forms</p>
          </div>
          <Button onClick={() => setIsDesigning(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create New Form
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {forms.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms created yet</h3>
            <p className="text-gray-600 mb-6">Create your first custom form to get started</p>
            <Button onClick={() => setIsDesigning(true)}>
              Create Your First Form
            </Button>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{form.form_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">{form.category}</span>
                    <span>Code: {form.form_code}</span>
                    <span className={form.is_published ? 'text-green-600' : 'text-yellow-600'}>
                      {form.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 p-2" title="Preview Form">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-2" title="Edit Form">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-2" title="Delete Form">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <Sidebar currentPage="FormBuilder" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Form Builder
          </h1>
          <p className="text-gray-600">Design custom intake forms with drag-and-drop interface</p>
        </div>

        {isDesigning ? renderFormDesigner() : renderFormsList()}
      </div>
    </Layout>
  );
};

export default FormBuilder;
