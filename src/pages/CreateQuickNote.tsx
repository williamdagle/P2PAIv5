import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { ArrowLeft, CreditCard as Edit3, Save } from 'lucide-react';

interface CreateQuickNoteProps {
  onNavigate: (page: string) => void;
}

const CreateQuickNote: React.FC<CreateQuickNoteProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    note_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_note_categories`
      );
      setCategories(response || []);
    } catch (err) {
      showError('Failed to load categories', 'Continuing without categories.');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.content.trim()) {
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
            content: formData.content,
            raw_content: formData.content,
            note_type: 'quick_note',
            category: formData.category_id || null,
            note_date: formData.note_date,
            created_by: globals.user_id
          })
        }
      );

      showSuccess('Quick note created successfully');
      onNavigate('ClinicalNotes');
    } catch (err) {
      showError('Failed to create quick note', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Sidebar currentPage="CreateQuickNote" onPageChange={onNavigate} />

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
            <Edit3 className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Quick Note</h1>
          </div>
          <p className="text-gray-600">
            Add a quick note or observation for {globals.selected_patient_name}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Title" required>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description of the note"
                />
              </FormField>

              <FormField label="Date" required>
                <input
                  type="date"
                  value={formData.note_date}
                  onChange={(e) => handleChange('note_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </FormField>
            </div>

            <FormField label="Category">
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a category (optional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Note Content" required>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your clinical observations, patient updates, or other relevant information..."
                rows={8}
              />
            </FormField>

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
                Save Quick Note
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateQuickNote;