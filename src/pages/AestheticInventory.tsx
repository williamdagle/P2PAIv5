import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AestheticInventoryForm from '../components/AestheticInventoryForm';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { Package, Plus, AlertTriangle, TrendingDown, Calendar, Edit, Trash2, PlusCircle, MinusCircle } from 'lucide-react';

interface AestheticInventoryProps {
  onNavigate: (page: string) => void;
}

const AestheticInventory: React.FC<AestheticInventoryProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [adjustingItem, setAdjustingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    expiringSoon: 0
  });

  useEffect(() => {
    loadInventory();
  }, [refreshKey]);

  const loadInventory = async () => {
    try {
      const data = await apiCall('get_aesthetic_inventory', 'POST', {});
      setInventory(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load inventory');
    }
  };

  const calculateStats = (items: any[]) => {
    const activeItems = items.filter(item => item.is_active);
    const lowStock = activeItems.filter(item =>
      item.reorder_point && item.current_stock <= item.reorder_point
    );
    const totalValue = activeItems.reduce((sum, item) => {
      const cost = parseFloat(item.unit_cost || 0);
      const stock = parseInt(item.current_stock || 0);
      return sum + (cost * stock);
    }, 0);

    setStats({
      totalProducts: activeItems.length,
      lowStockItems: lowStock.length,
      inventoryValue: totalValue,
      expiringSoon: 0
    });
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item);
  };

  const handleAdjustStock = (item: any) => {
    setAdjustingItem(item);
    setAdjustmentType('add');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setLotNumber('');
    setExpirationDate('');
    setShowAdjustModal(true);
  };

  const handleSuccess = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setRefreshKey(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      await apiCall('delete_aesthetic_inventory', 'POST', { id: deletingItem.id });
      showSuccess('Inventory item deleted successfully');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError(error.message || 'Failed to delete inventory item');
    } finally {
      setDeletingItem(null);
    }
  };

  const processStockAdjustment = async () => {
    if (!adjustingItem || !adjustmentQuantity) {
      showError('Please enter adjustment quantity');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (quantity <= 0) {
      showError('Quantity must be positive');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        clinic_id: globals.clinic_id,
        inventory_id: adjustingItem.id,
        transaction_type: adjustmentType === 'add' ? 'purchase' : 'adjustment',
        quantity: adjustmentType === 'add' ? quantity : -quantity,
        lot_number: lotNumber || null,
        expiration_date: expirationDate || null,
        reason: adjustmentReason,
        performed_by: globals.user_id
      };

      await apiCall('create_inventory_transaction', 'POST', transactionData);

      const newStock = adjustmentType === 'add'
        ? adjustingItem.current_stock + quantity
        : adjustingItem.current_stock - quantity;

      await apiCall('update_aesthetic_inventory', 'POST', {
        id: adjustingItem.id,
        current_stock: Math.max(0, newStock)
      });

      showSuccess('Stock adjusted successfully');
      setShowAdjustModal(false);
      setAdjustingItem(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showError(error.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (item: any) => {
    if (item.current_stock === 0) return 'text-red-600 bg-red-50';
    if (item.reorder_point && item.current_stock <= item.reorder_point) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusLabel = (item: any) => {
    if (item.current_stock === 0) return 'Out of Stock';
    if (item.reorder_point && item.current_stock <= item.reorder_point) return 'Low Stock';
    return 'In Stock';
  };

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Inventory Value',
      value: `$${stats.inventoryValue.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
  ];

  return (
    <Layout>
      <Sidebar currentPage="AestheticInventory" onPageChange={onNavigate} />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Package className="w-8 h-8 mr-3 text-blue-600" />
              Inventory Management
            </h1>
            <p className="text-gray-600">Track injectables, fillers, and supplies</p>
          </div>
          <Button onClick={handleAddItem} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`${stat.bgColor} rounded-lg shadow-md p-6 border-l-4 border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-12 h-12 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {inventory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h2>
            <p className="text-gray-600 mb-6">Add products to start tracking your inventory</p>
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <DataTable
              data={inventory}
              columns={[
                {
                  key: 'product_name',
                  label: 'Product',
                  render: (row: any) => (
                    <div>
                      <div className="font-medium text-gray-900">{row.product_name}</div>
                      {row.product_brand && (
                        <div className="text-xs text-gray-500">{row.product_brand}</div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'product_category',
                  label: 'Category',
                  render: (row: any) => (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {row.product_category}
                    </span>
                  )
                },
                {
                  key: 'current_stock',
                  label: 'Stock',
                  render: (row: any) => (
                    <div>
                      <div className="font-medium">{row.current_stock}</div>
                      {row.unit_size && (
                        <div className="text-xs text-gray-500">{row.unit_size}</div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row: any) => (
                    <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusColor(row)}`}>
                      {getStockStatusLabel(row)}
                    </span>
                  )
                },
                {
                  key: 'unit_cost',
                  label: 'Unit Cost',
                  render: (row: any) => row.unit_cost ? `$${parseFloat(row.unit_cost).toFixed(2)}` : '-'
                },
                {
                  key: 'retail_price',
                  label: 'Retail Price',
                  render: (row: any) => row.retail_price ? `$${parseFloat(row.retail_price).toFixed(2)}` : '-'
                },
                {
                  key: 'supplier_name',
                  label: 'Supplier',
                  render: (row: any) => row.supplier_name || '-'
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (row: any) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjustStock(row)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Adjust Stock"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditItem(row)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(row)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                }
              ]}
              searchPlaceholder="Search inventory..."
            />
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingItem ? 'Edit Product' : 'Add New Product'}
          maxWidth="4xl"
        >
          <AestheticInventoryForm
            item={editingItem}
            onSuccess={handleSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>

        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title={`Adjust Stock - ${adjustingItem?.product_name}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{adjustingItem?.current_stock} {adjustingItem?.unit_size}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setAdjustmentType('add')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'add'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <PlusCircle className={`w-6 h-6 mx-auto mb-2 ${adjustmentType === 'add' ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Add Stock</p>
              </button>
              <button
                onClick={() => setAdjustmentType('remove')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'remove'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MinusCircle className={`w-6 h-6 mx-auto mb-2 ${adjustmentType === 'remove' ? 'text-red-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Remove Stock</p>
              </button>
            </div>

            <FormField label="Quantity" required>
              <input
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            {adjustingItem?.requires_lot_tracking && (
              <FormField label="Lot/Batch Number">
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Enter lot number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            )}

            {adjustingItem?.requires_expiration_tracking && (
              <FormField label="Expiration Date">
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            )}

            <FormField label="Reason">
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                placeholder="Describe the reason for this adjustment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAdjustModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={processStockAdjustment}
                disabled={loading || !adjustmentQuantity}
              >
                {loading ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`}
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={confirmDelete}
          title="Delete Product"
          message={`Are you sure you want to delete ${deletingItem?.product_name}? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
        />
      </div>
    </Layout>
  );
};

export default AestheticInventory;
