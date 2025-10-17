import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import FormField from './FormField';
import Button from './Button';

interface LabTrendResultFormProps {
  result?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const LabTrendResultForm: React.FC<LabTrendResultFormProps> = ({
  result,
  onSuccess,
  onCancel,
}) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();

  const [categories, setCategories] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    lab_marker: result?.lab_marker || '',
    result_value: result?.result_value || '',
    unit: result?.unit || '',
    result_date: result?.result_date || new Date().toISOString().split('T')[0],
    source: result?.source || 'Manual Entry',
    conventional_range_low: result?.conventional_range_low || '',
    conventional_range_high: result?.conventional_range_high || '',
    functional_range_low: result?.functional_range_low || '',
    functional_range_high: result?.functional_range_high || '',
    note: result?.note || '',
  });

  useEffect(() => {
    loadCategories();
    loadMarkers();
  }, []);

  useEffect(() => {
    if (selectedMarker) {
      setFormData((prev) => ({
        ...prev,
        lab_marker: selectedMarker.marker_name,
        unit: selectedMarker.unit,
        conventional_range_low: selectedMarker.conventional_range_low,
        conventional_range_high: selectedMarker.conventional_range_high,
        functional_range_low: selectedMarker.functional_range_low,
        functional_range_high: selectedMarker.functional_range_high,
      }));
    }
  }, [selectedMarker]);

  const loadCategories = async () => {
    try {
      const data = await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_lab_categories`
      );
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadMarkers = async () => {
    try {
      const data = await apiCall(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_lab_marker_metadata`
      );
      setMarkers(data || []);
    } catch (err) {
      console.error('Failed to load markers:', err);
    }
  };

  const filteredMarkers = selectedCategory
    ? markers.filter((m) => m.category_id === selectedCategory)
    : markers;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const markerId = e.target.value;
    const marker = markers.find((m) => m.id === markerId);
    setSelectedMarker(marker || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!globals.selected_patient_id) {
      showError('No patient selected', 'Please select a patient first.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patient_id: globals.selected_patient_id,
        lab_name: formData.lab_marker,
        test_type: formData.lab_marker,
        result: formData.result_value,
        result_value: parseFloat(formData.result_value),
        unit: formData.unit,
        result_date: formData.result_date,
        source: formData.source,
        conventional_range_low: parseFloat(formData.conventional_range_low),
        conventional_range_high: parseFloat(formData.conventional_range_high),
        functional_range_low: parseFloat(formData.functional_range_low),
        functional_range_high: parseFloat(formData.functional_range_high),
        note: formData.note,
      };

      if (result) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_labs?id=${result.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        showSuccess('Lab result updated successfully');
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_labs`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
        showSuccess('Lab result added successfully');
      }

      onSuccess();
    } catch (err) {
      showError('Failed to save lab result', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Category" required>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Lab Marker" required>
          <select
            onChange={handleMarkerSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!selectedCategory}
          >
            <option value="">Select a marker</option>
            {filteredMarkers.map((marker) => (
              <option key={marker.id} value={marker.id}>
                {marker.marker_name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {selectedMarker && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p><strong>Description:</strong> {selectedMarker.description}</p>
          <p><strong>Unit:</strong> {selectedMarker.unit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Result Value" required>
          <input
            type="number"
            step="0.01"
            name="result_value"
            value={formData.result_value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </FormField>

        <FormField label="Unit" required>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </FormField>

        <FormField label="Result Date" required>
          <input
            type="date"
            name="result_date"
            value={formData.result_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </FormField>
      </div>

      <FormField label="Source">
        <input
          type="text"
          name="source"
          value={formData.source}
          onChange={handleChange}
          placeholder="e.g., LabCorp, Quest Diagnostics, Manual Entry"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Reference Ranges</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Conventional Range</p>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Low">
                <input
                  type="number"
                  step="0.01"
                  name="conventional_range_low"
                  value={formData.conventional_range_low}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
              <FormField label="High">
                <input
                  type="number"
                  step="0.01"
                  name="conventional_range_high"
                  value={formData.conventional_range_high}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Functional Medicine Range</p>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Low">
                <input
                  type="number"
                  step="0.01"
                  name="functional_range_low"
                  value={formData.functional_range_low}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
              <FormField label="High">
                <input
                  type="number"
                  step="0.01"
                  name="functional_range_high"
                  value={formData.functional_range_high}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      <FormField label="Clinician Note">
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          placeholder="Add any relevant notes or observations..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : result ? 'Update Result' : 'Add Result'}
        </Button>
      </div>
    </form>
  );
};

export default LabTrendResultForm;
