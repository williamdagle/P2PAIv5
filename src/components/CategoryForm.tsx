import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Button from './Button';

interface CategoryFormProps {
  category?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue', className: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', className: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amber', className: 'bg-amber-500' },
  { value: '#EF4444', label: 'Red', className: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Purple', className: 'bg-purple-500' },
  { value: '#EC4899', label: 'Pink', className: 'bg-pink-500' },
  { value: '#06B6D4', label: 'Cyan', className: 'bg-cyan-500' },
  { value: '#6B7280', label: 'Gray', className: 'bg-gray-500' }
];

const ICON_OPTIONS = [
  'FileText', 'Stethoscope', 'Activity', 'Clipboard', 'Heart',
  'Brain', 'Eye', 'Users', 'Calendar', 'AlertCircle'
];

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0].value,
    icon: ICON_OPTIONS[0],
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || COLOR_OPTIONS[0].value,
        icon: category.icon || ICON_OPTIONS[0],
        is_active: category.is_active !== undefined ? category.is_active : true,
        sort_order: category.sort_order || 0
      });
    }
  }, [category]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_note_categories`,
          {
            method: 'PUT',
            body: { id: category.id, ...formData }
          }
        );
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_note_categories`,
          {
            method: 'POST',
            body: formData
          }
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Primary Care"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of this category"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Category Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_OPTIONS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleInputChange('color', color.value)}
              className={`
                flex items-center justify-center p-3 rounded-lg border-2 transition-all
                ${formData.color === color.value
                  ? 'border-gray-800 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className={`w-8 h-8 rounded-full ${color.className}`}></div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon
        </label>
        <select
          value={formData.icon}
          onChange={(e) => handleInputChange('icon', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ICON_OPTIONS.map(icon => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort Order
        </label>
        <input
          type="number"
          value={formData.sort_order}
          onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => handleInputChange('is_active', e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
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
          {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
