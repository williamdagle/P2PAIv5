import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import FormField from './FormField';
import { X, Plus, Trash2 } from 'lucide-react';

interface Product {
  name: string;
  units: string;
  batch: string;
}

interface AestheticTreatmentFormProps {
  treatment?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TREATMENT_TYPES = [
  'Botox/Neurotoxin',
  'Dermal Filler',
  'Laser Treatment',
  'Chemical Peel',
  'Microneedling',
  'PDO Threads',
  'PRP/PRF',
  'Skin Tightening',
  'Body Contouring',
  'Hair Restoration',
  'Other'
];

const FACIAL_AREAS = [
  'Forehead',
  'Glabella (Between Brows)',
  "Crow's Feet",
  'Bunny Lines',
  'Nasolabial Folds',
  'Marionette Lines',
  'Lips',
  'Chin',
  'Jawline',
  'Cheeks',
  'Under Eyes',
  'Neck',
  'Décolletage',
  'Full Face',
  'Other'
];

const TOLERANCE_OPTIONS = [
  'Excellent - No discomfort',
  'Good - Minor discomfort',
  'Fair - Moderate discomfort',
  'Poor - Significant discomfort'
];

const AestheticTreatmentForm: React.FC<AestheticTreatmentFormProps> = ({
  treatment,
  onSuccess,
  onCancel,
}) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    treatment_date: treatment?.treatment_date || new Date().toISOString().split('T')[0],
    treatment_type: treatment?.treatment_type || '',
    treatment_name: treatment?.treatment_name || '',
    areas_treated: treatment?.areas_treated || [],
    units_used: treatment?.units_used || '',
    volume_ml: treatment?.volume_ml || '',
    technique_notes: treatment?.technique_notes || '',
    patient_tolerance: treatment?.patient_tolerance || '',
    immediate_response: treatment?.immediate_response || '',
    adverse_events: treatment?.adverse_events || '',
    follow_up_date: treatment?.follow_up_date || '',
    clinical_notes: treatment?.clinical_notes || '',
    is_completed: treatment?.is_completed || false,
  });

  const [products, setProducts] = useState<Product[]>(
    treatment?.products_used || [{ name: '', units: '', batch: '' }]
  );

  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    treatment?.areas_treated || []
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAreaToggle = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([...products, { name: '', units: '', batch: '' }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!globals.selected_patient_id) {
        showError('No patient selected');
        return;
      }

      const batch_numbers = products
        .filter((p) => p.batch)
        .map((p) => p.batch);

      const payload = {
        ...formData,
        patient_id: globals.selected_patient_id,
        clinic_id: globals.clinic_id,
        areas_treated: selectedAreas,
        products_used: products.filter((p) => p.name),
        batch_numbers,
        units_used: formData.units_used ? parseFloat(formData.units_used) : null,
        volume_ml: formData.volume_ml ? parseFloat(formData.volume_ml) : null,
        completed_at: formData.is_completed ? new Date().toISOString() : null,
      };

      if (treatment?.id) {
        await apiCall(`update_aesthetic_treatment`, 'POST', {
          id: treatment.id,
          ...payload,
        });
        showSuccess('Treatment updated successfully');
      } else {
        await apiCall(`create_aesthetic_treatment`, 'POST', payload);
        showSuccess('Treatment created successfully');
      }

      onSuccess();
    } catch (error: any) {
      showError(error.message || 'Failed to save treatment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Treatment Date"
          type="date"
          value={formData.treatment_date}
          onChange={(e) => handleInputChange('treatment_date', e.target.value)}
          required
        />

        <FormField
          label="Treatment Type"
          type="select"
          value={formData.treatment_type}
          onChange={(e) => handleInputChange('treatment_type', e.target.value)}
          required
        >
          <option value="">Select Type</option>
          {TREATMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </FormField>

        <FormField
          label="Treatment Name"
          value={formData.treatment_name}
          onChange={(e) => handleInputChange('treatment_name', e.target.value)}
          placeholder="e.g., Botox 50 units, Juvederm Ultra 2mL"
          required
        />

        <FormField
          label="Follow-up Date"
          type="date"
          value={formData.follow_up_date}
          onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Areas Treated *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {FACIAL_AREAS.map((area) => (
            <label
              key={area}
              className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAreas.includes(area)}
                onChange={() => handleAreaToggle(area)}
                className="rounded text-blue-600"
              />
              <span className="text-sm">{area}</span>
            </label>
          ))}
        </div>
        {selectedAreas.length === 0 && (
          <p className="text-sm text-red-600 mt-1">Select at least one area</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Products Used
          </label>
          <Button type="button" onClick={addProduct} className="text-sm py-1 px-3">
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </Button>
        </div>
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={index} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Product name"
                value={product.name}
                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Units/Volume"
                value={product.units}
                onChange={(e) => handleProductChange(index, 'units', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Batch #"
                value={product.batch}
                onChange={(e) => handleProductChange(index, 'batch', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Total Units Used"
          type="number"
          step="0.01"
          value={formData.units_used}
          onChange={(e) => handleInputChange('units_used', e.target.value)}
          placeholder="For neurotoxins"
        />

        <FormField
          label="Total Volume (mL)"
          type="number"
          step="0.01"
          value={formData.volume_ml}
          onChange={(e) => handleInputChange('volume_ml', e.target.value)}
          placeholder="For fillers"
        />
      </div>

      <FormField
        label="Technique Notes"
        type="textarea"
        rows={3}
        value={formData.technique_notes}
        onChange={(e) => handleInputChange('technique_notes', e.target.value)}
        placeholder="Injection technique, depth, angle, etc."
      />

      <FormField
        label="Patient Tolerance"
        type="select"
        value={formData.patient_tolerance}
        onChange={(e) => handleInputChange('patient_tolerance', e.target.value)}
      >
        <option value="">Select Tolerance Level</option>
        {TOLERANCE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormField>

      <FormField
        label="Immediate Response"
        type="textarea"
        rows={2}
        value={formData.immediate_response}
        onChange={(e) => handleInputChange('immediate_response', e.target.value)}
        placeholder="Immediate post-treatment observations"
      />

      <FormField
        label="Adverse Events"
        type="textarea"
        rows={2}
        value={formData.adverse_events}
        onChange={(e) => handleInputChange('adverse_events', e.target.value)}
        placeholder="Any complications or adverse reactions"
      />

      <FormField
        label="Clinical Notes"
        type="textarea"
        rows={4}
        value={formData.clinical_notes}
        onChange={(e) => handleInputChange('clinical_notes', e.target.value)}
        placeholder="Additional clinical documentation"
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_completed"
          checked={formData.is_completed}
          onChange={(e) => handleInputChange('is_completed', e.target.checked)}
          className="rounded text-blue-600 mr-2"
        />
        <label htmlFor="is_completed" className="text-sm font-medium text-gray-700">
          Mark as Completed
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || selectedAreas.length === 0}
        >
          {loading ? 'Saving...' : treatment ? 'Update Treatment' : 'Create Treatment'}
        </Button>
      </div>
    </form>
  );
};

export default AestheticTreatmentForm;
