import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import Button from './Button';
import FormField from './FormField';

interface AestheticInventoryFormProps {
  item?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRODUCT_CATEGORIES = [
  'Neurotoxin',
  'Dermal Filler',
  'PRP/PRF',
  'Threads',
  'Skincare Retail',
  'Supplements',
  'Medical Supplies',
  'Equipment',
  'Other'
];

const AestheticInventoryForm: React.FC<AestheticInventoryFormProps> = ({
  item,
  onSuccess,
  onCancel,
}) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    product_name: item?.product_name || '',
    product_category: item?.product_category || '',
    product_brand: item?.product_brand || '',
    sku: item?.sku || '',
    description: item?.description || '',
    unit_size: item?.unit_size || '',
    current_stock: item?.current_stock || '',
    reorder_point: item?.reorder_point || '',
    unit_cost: item?.unit_cost || '',
    retail_price: item?.retail_price || '',
    supplier_name: item?.supplier_name || '',
    supplier_contact: item?.supplier_contact || '',
    notes: item?.notes || '',
    requires_lot_tracking: item?.requires_lot_tracking || false,
    requires_expiration_tracking: item?.requires_expiration_tracking || false,
    is_active: item?.is_active !== undefined ? item.is_active : true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        clinic_id: globals.clinic_id,
        current_stock: formData.current_stock ? parseInt(formData.current_stock) : 0,
        reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        retail_price: formData.retail_price ? parseFloat(formData.retail_price) : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${item ? 'update_aesthetic_inventory' : 'create_aesthetic_inventory'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${globals.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(item ? { id: item.id, ...payload } : payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save inventory item');
      }

      showSuccess(`Inventory item ${item ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error: any) {
      showError(error.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Product Name"
          value={formData.product_name}
          onChange={(e) => handleInputChange('product_name', e.target.value)}
          required
          placeholder="e.g., Botox 100 units"
        />

        <FormField
          label="Category"
          type="select"
          value={formData.product_category}
          onChange={(e) => handleInputChange('product_category', e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </FormField>

        <FormField
          label="Brand"
          value={formData.product_brand}
          onChange={(e) => handleInputChange('product_brand', e.target.value)}
          placeholder="e.g., Allergan, Galderma"
        />

        <FormField
          label="SKU"
          value={formData.sku}
          onChange={(e) => handleInputChange('sku', e.target.value)}
          placeholder="Internal tracking code"
        />

        <FormField
          label="Unit Size"
          value={formData.unit_size}
          onChange={(e) => handleInputChange('unit_size', e.target.value)}
          placeholder="e.g., 100 units, 1 mL, 1 syringe"
        />

        <FormField
          label="Current Stock"
          type="number"
          value={formData.current_stock}
          onChange={(e) => handleInputChange('current_stock', e.target.value)}
          required
        />

        <FormField
          label="Reorder Point"
          type="number"
          value={formData.reorder_point}
          onChange={(e) => handleInputChange('reorder_point', e.target.value)}
          placeholder="Alert when stock reaches this level"
        />

        <FormField
          label="Unit Cost"
          type="number"
          step="0.01"
          value={formData.unit_cost}
          onChange={(e) => handleInputChange('unit_cost', e.target.value)}
          placeholder="0.00"
        />

        <FormField
          label="Retail Price"
          type="number"
          step="0.01"
          value={formData.retail_price}
          onChange={(e) => handleInputChange('retail_price', e.target.value)}
          placeholder="0.00"
        />

        <FormField
          label="Supplier Name"
          value={formData.supplier_name}
          onChange={(e) => handleInputChange('supplier_name', e.target.value)}
          placeholder="e.g., MedSupply Inc"
        />

        <FormField
          label="Supplier Contact"
          value={formData.supplier_contact}
          onChange={(e) => handleInputChange('supplier_contact', e.target.value)}
          placeholder="Phone or email"
        />
      </div>

      <FormField
        label="Description"
        type="textarea"
        rows={2}
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Product description"
      />

      <FormField
        label="Notes"
        type="textarea"
        rows={3}
        value={formData.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        placeholder="Additional information about this product"
      />

      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requires_lot_tracking"
            checked={formData.requires_lot_tracking}
            onChange={(e) => handleInputChange('requires_lot_tracking', e.target.checked)}
            className="rounded text-blue-600 mr-2"
          />
          <label htmlFor="requires_lot_tracking" className="text-sm font-medium text-gray-700">
            Requires Lot/Batch Tracking
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requires_expiration_tracking"
            checked={formData.requires_expiration_tracking}
            onChange={(e) => handleInputChange('requires_expiration_tracking', e.target.checked)}
            className="rounded text-blue-600 mr-2"
          />
          <label htmlFor="requires_expiration_tracking" className="text-sm font-medium text-gray-700">
            Requires Expiration Date Tracking
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="rounded text-blue-600 mr-2"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active (available for use)
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
};

export default AestheticInventoryForm;
