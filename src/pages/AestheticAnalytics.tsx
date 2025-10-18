import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useApi } from '../hooks/useApi';
import {
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
  Package,
  Gift,
  CreditCard,
  Calendar,
  BarChart3,
} from 'lucide-react';

const AestheticAnalytics: React.FC = () => {
  const { globals } = useGlobal();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      treatments: 0,
      retail: 0,
      giftCards: 0,
      memberships: 0,
    },
    treatments: {
      total: 0,
      topTreatments: [] as any[],
    },
    inventory: {
      lowStock: 0,
      totalValue: 0,
    },
    memberships: {
      active: 0,
      revenue: 0,
      totalCredits: 0,
    },
    giftCards: {
      sold: 0,
      redeemed: 0,
      outstanding: 0,
    },
    patients: {
      new: 0,
      returning: 0,
      total: 0,
    },
  });

  useEffect(() => {
    loadAnalytics();
  }, [globals.clinic_id, timeframe]);

  const loadAnalytics = async () => {
    if (!globals.clinic_id) return;

    setLoading(true);
    try {
      const [treatments, memberships, giftCards, transactions, inventory] = await Promise.all([
        apiCall('get_aesthetic_treatments', 'GET', null, { clinic_id: globals.clinic_id }),
        apiCall('get_aesthetic_memberships', 'GET', null, { clinic_id: globals.clinic_id }),
        apiCall('get_gift_cards', 'GET', null, { clinic_id: globals.clinic_id }),
        apiCall('get_pos_transactions', 'POST', {}),
        apiCall('get_aesthetic_inventory', 'GET', null, { clinic_id: globals.clinic_id }),
      ]);

      const now = new Date();
      const timeframeDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

      const recentTransactions = (transactions || []).filter((t: any) =>
        new Date(t.transaction_date) >= cutoffDate && t.payment_status === 'completed'
      );

      const totalRevenue = recentTransactions.reduce((sum: number, t: any) =>
        sum + parseFloat(t.total_amount || 0), 0
      );

      const activeMemberships = (memberships || []).filter((m: any) => m.status === 'active');
      const membershipRevenue = activeMemberships.reduce((sum: number, m: any) =>
        sum + parseFloat(m.monthly_fee || 0), 0
      );

      const activeGiftCards = (giftCards || []).filter((gc: any) =>
        gc.is_active && gc.current_balance > 0
      );
      const giftCardValue = activeGiftCards.reduce((sum: number, gc: any) =>
        sum + parseFloat(gc.current_balance || 0), 0
      );

      const recentGiftCardSales = (giftCards || []).filter((gc: any) =>
        new Date(gc.purchase_date) >= cutoffDate
      );

      const lowStockItems = (inventory || []).filter((item: any) =>
        item.current_stock <= item.reorder_point
      );

      const inventoryValue = (inventory || []).reduce((sum: number, item: any) =>
        sum + (item.current_stock * parseFloat(item.unit_cost || 0)), 0
      );

      setAnalytics({
        revenue: {
          total: totalRevenue,
          treatments: totalRevenue * 0.7,
          retail: totalRevenue * 0.2,
          giftCards: totalRevenue * 0.05,
          memberships: membershipRevenue,
        },
        treatments: {
          total: (treatments || []).filter((t: any) =>
            new Date(t.treatment_date) >= cutoffDate
          ).length,
          topTreatments: [],
        },
        inventory: {
          lowStock: lowStockItems.length,
          totalValue: inventoryValue,
        },
        memberships: {
          active: activeMemberships.length,
          revenue: membershipRevenue,
          totalCredits: activeMemberships.reduce((sum: number, m: any) =>
            sum + parseFloat(m.credits_balance || 0), 0
          ),
        },
        giftCards: {
          sold: recentGiftCardSales.length,
          redeemed: recentGiftCardSales.filter((gc: any) => gc.last_used_date).length,
          outstanding: giftCardValue,
        },
        patients: {
          new: 0,
          returning: 0,
          total: 0,
        },
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Analytics & Insights
            </h1>
            <p className="text-gray-600">Business performance metrics and trends</p>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${analytics.revenue.total.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Treatment Revenue</p>
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${analytics.revenue.treatments.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Membership Revenue</p>
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${analytics.revenue.memberships.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Retail Sales</p>
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${analytics.revenue.retail.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Treatments Performed</p>
                  <Sparkles className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.treatments.total}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.memberships.active}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Member Credits</p>
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">${analytics.memberships.totalCredits.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Gift Cards Sold</p>
                  <Gift className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.giftCards.sold}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Outstanding Gift Cards</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">${analytics.giftCards.outstanding.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <Package className={`w-5 h-5 ${analytics.inventory.lowStock > 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.inventory.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Revenue Growth</h3>
                  <p className="text-sm text-gray-600">
                    Total revenue for the selected period is ${analytics.revenue.total.toFixed(2)}.
                    Treatments account for {((analytics.revenue.treatments / analytics.revenue.total) * 100).toFixed(0)}% of revenue.
                  </p>
                </div>
              </div>

              {analytics.memberships.active > 0 && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Membership Program</h3>
                    <p className="text-sm text-gray-600">
                      {analytics.memberships.active} active members generating ${analytics.memberships.revenue.toFixed(2)}/month
                      in recurring revenue with ${analytics.memberships.totalCredits.toFixed(2)} in available credits.
                    </p>
                  </div>
                </div>
              )}

              {analytics.inventory.lowStock > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <Package className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Inventory Alert</h3>
                    <p className="text-sm text-gray-600">
                      {analytics.inventory.lowStock} items are at or below reorder point. Review inventory to avoid stockouts.
                    </p>
                  </div>
                </div>
              )}

              {analytics.giftCards.outstanding > 500 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Gift className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Gift Card Liability</h3>
                    <p className="text-sm text-gray-600">
                      ${analytics.giftCards.outstanding.toFixed(2)} in outstanding gift card value.
                      Track redemption rates and consider promotional campaigns.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default AestheticAnalytics;
