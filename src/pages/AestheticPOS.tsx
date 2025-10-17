import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import {
  DollarSign,
  Plus,
  Receipt,
  CreditCard,
  ShoppingCart,
  Calendar,
  TrendingUp,
  User,
  Trash2
} from 'lucide-react';

interface AestheticPOSProps {
  onNavigate: (page: string) => void;
}

interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Gift Card', 'Membership Credit', 'Other'];

const AestheticPOS: React.FC<AestheticPOSProps> = ({ onNavigate }) => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    transactions: 0,
    averageTicket: 0
  });

  const [cart, setCart] = useState<LineItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [tipAmount, setTipAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await apiCall('get_pos_transactions', 'POST', {
        start_date: today,
        end_date: today
      });

      if (data && Array.isArray(data)) {
        const completedTransactions = data.filter((t: any) => t.payment_status === 'completed');
        const revenue = completedTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
        const avgTicket = completedTransactions.length > 0 ? revenue / completedTransactions.length : 0;

        setTodayStats({
          revenue,
          transactions: completedTransactions.length,
          averageTicket: avgTicket
        });
      }
    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await apiCall('get_pos_transactions', 'POST', {});
      setTransactions(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load transactions');
    }
  };

  const addToCart = () => {
    if (!itemName || !itemPrice || !itemQuantity) {
      showError('Please fill in item name, price, and quantity');
      return;
    }

    const quantity = parseFloat(itemQuantity);
    const price = parseFloat(itemPrice);

    if (quantity <= 0 || price < 0) {
      showError('Quantity must be positive and price cannot be negative');
      return;
    }

    const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: itemName,
      description: itemDescription,
      quantity,
      unit_price: price,
      subtotal: quantity * price
    };

    setCart([...cart, newItem]);
    setItemName('');
    setItemDescription('');
    setItemQuantity('1');
    setItemPrice('');
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * (parseFloat(taxRate) / 100);
    const discount = parseFloat(discountAmount) || 0;
    const tip = parseFloat(tipAmount) || 0;
    const total = subtotal + tax + tip - discount;

    return {
      subtotal,
      tax,
      discount,
      tip,
      total: Math.max(0, total)
    };
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();

      const transactionData = {
        clinic_id: globals.clinic_id,
        patient_id: globals.selected_patient_id || null,
        transaction_type: 'sale',
        line_items: cart,
        subtotal: totals.subtotal.toFixed(2),
        tax_amount: totals.tax.toFixed(2),
        tip_amount: totals.tip.toFixed(2),
        discount_amount: totals.discount.toFixed(2),
        total_amount: totals.total.toFixed(2),
        payment_method: paymentMethod,
        payment_status: 'completed',
        notes: notes,
        processed_by: globals.user_id
      };

      await apiCall('create_pos_transaction', 'POST', transactionData);

      showSuccess('Transaction processed successfully');
      setCart([]);
      setTaxRate('0');
      setDiscountAmount('0');
      setTipAmount('0');
      setNotes('');
      setShowNewTransaction(false);
      loadTodayStats();
    } catch (error: any) {
      showError(error.message || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const statCards = [
    {
      label: "Today's Revenue",
      value: `$${todayStats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Transactions Today',
      value: todayStats.transactions,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Average Ticket',
      value: `$${todayStats.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  return (
    <Layout>
      <Sidebar currentPage="AestheticPOS" onPageChange={onNavigate} />

      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-green-600" />
            Point of Sale & Billing
          </h1>
          <p className="text-gray-600">Process payments and manage transactions</p>
        </div>

        {globals.selected_patient_id && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Transaction for Patient</p>
                <p className="text-sm text-blue-700">{globals.selected_patient_name}</p>
              </div>
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            onClick={() => setShowNewTransaction(true)}
            className="flex items-center justify-center py-12 text-lg"
          >
            <ShoppingCart className="w-6 h-6 mr-3" />
            New Transaction
          </Button>

          <Button
            onClick={() => {
              loadTransactions();
              setShowHistory(true);
            }}
            variant="secondary"
            className="flex items-center justify-center py-12 text-lg"
          >
            <Calendar className="w-6 h-6 mr-3" />
            View Transaction History
          </Button>
        </div>

        <Modal
          isOpen={showNewTransaction}
          onClose={() => setShowNewTransaction(false)}
          title="New Transaction"
          maxWidth="4xl"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Item to Cart</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Item Name" required>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Botox Treatment, Facial Serum"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                </div>
                <FormField label="Quantity" required>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
                <FormField label="Unit Price" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Description (Optional)">
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Additional details"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>
              <div className="mt-4">
                <Button onClick={addToCart} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>

            {cart.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">${item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${item.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField label="Tax Rate (%)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                  <FormField label="Discount Amount">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                  <FormField label="Tip Amount">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                </div>

                <FormField label="Payment Method" required>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </FormField>

                <div className="mt-4">
                  <FormField label="Notes (Optional)">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Additional transaction notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${totals.tax.toFixed(2)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">-${totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.tip > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tip:</span>
                        <span className="font-medium">${totals.tip.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                      <span>Total:</span>
                      <span className="text-green-600">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowNewTransaction(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={processTransaction}
                disabled={loading || cart.length === 0}
                className="flex items-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : `Process Payment ($${totals.total.toFixed(2)})`}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          title="Transaction History"
          maxWidth="6xl"
        >
          <DataTable
            data={transactions}
            columns={[
              {
                key: 'transaction_date',
                label: 'Date',
                render: (row: any) => new Date(row.transaction_date).toLocaleString()
              },
              {
                key: 'receipt_number',
                label: 'Receipt #'
              },
              {
                key: 'patient_id',
                label: 'Patient',
                render: (row: any) => row.patient_id ? 'Yes' : 'Walk-in'
              },
              {
                key: 'payment_method',
                label: 'Payment Method'
              },
              {
                key: 'total_amount',
                label: 'Total',
                render: (row: any) => `$${parseFloat(row.total_amount).toFixed(2)}`
              },
              {
                key: 'payment_status',
                label: 'Status',
                render: (row: any) => (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    row.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                    row.payment_status === 'refunded' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {row.payment_status}
                  </span>
                )
              }
            ]}
            searchPlaceholder="Search transactions..."
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default AestheticPOS;
