import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import GiftCardForm from '../components/GiftCardForm';
import GiftCardRedemptionForm from '../components/GiftCardRedemptionForm';
import { CreditCard, Plus, Gift, Search, DollarSign } from 'lucide-react';

const AestheticGiftCards: React.FC = () => {
  const { globals } = useGlobal();
  const { showSuccess, showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeCards: 0,
    totalValue: 0,
    redeemedThisMonth: 0,
  });

  useEffect(() => {
    loadGiftCards();
  }, [globals.clinic_id]);

  const loadGiftCards = async () => {
    if (!globals.clinic_id) return;

    try {
      const data = await apiCall('get_gift_cards', 'GET', null, {
        clinic_id: globals.clinic_id,
      });
      setGiftCards(data || []);

      const active = data?.filter((card: any) => card.is_active && card.current_balance > 0) || [];
      const totalValue = active.reduce((sum: number, card: any) => sum + parseFloat(card.current_balance || 0), 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const redeemedThisMonth = data?.filter((card: any) => {
        if (!card.last_used_date) return false;
        return new Date(card.last_used_date) >= thisMonth;
      }).length || 0;

      setStats({
        activeCards: active.length,
        totalValue,
        redeemedThisMonth,
      });
    } catch (error: any) {
      showError(error.message || 'Failed to load gift cards');
    }
  };

  const handleCreateGiftCard = async (data: any) => {
    setLoading(true);
    try {
      await apiCall('create_gift_card', 'POST', data);
      showSuccess('Gift card created successfully!');
      setShowNewCardModal(false);
      loadGiftCards();
    } catch (error: any) {
      showError(error.message || 'Failed to create gift card');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async (cardCode: string) => {
    const data = await apiCall('check_gift_card_balance', 'GET', null, { card_code: cardCode });
    return data;
  };

  const handleRedeem = async (cardCode: string, amount: number) => {
    setLoading(true);
    try {
      await apiCall('redeem_gift_card', 'POST', {
        card_code: cardCode,
        redemption_amount: amount,
      });
      showSuccess(`Gift card redeemed: $${amount.toFixed(2)}`);
      setShowRedeemModal(false);
      loadGiftCards();
    } catch (error: any) {
      showError(error.message || 'Failed to redeem gift card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gift Cards
            </h1>
            <p className="text-gray-600">Manage gift card sales and redemptions</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowRedeemModal(true)}
              className="flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Redeem Card
            </Button>
            <Button onClick={() => setShowNewCardModal(true)} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Sell Gift Card
            </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Gift Cards</p>
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeCards}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Redeemed This Month</p>
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.redeemedThisMonth}</p>
          </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataTable
            data={giftCards}
            columns={[
              {
                key: 'card_code',
                label: 'Card Code',
                render: (row: any) => (
                  <span className="font-mono text-sm font-semibold">{row.card_code}</span>
                ),
              },
              {
                key: 'card_type',
                label: 'Type',
                render: (row: any) => (
                  <span className="capitalize">{row.card_type}</span>
                ),
              },
              {
                key: 'recipient_name',
                label: 'Recipient',
                render: (row: any) => row.recipient_name || 'N/A',
              },
              {
                key: 'original_amount',
                label: 'Original',
                render: (row: any) => `$${parseFloat(row.original_amount).toFixed(2)}`,
              },
              {
                key: 'current_balance',
                label: 'Balance',
                render: (row: any) => (
                  <span className="font-semibold text-green-600">
                    ${parseFloat(row.current_balance).toFixed(2)}
                  </span>
                ),
              },
              {
                key: 'is_active',
                label: 'Status',
                render: (row: any) => {
                  const isExpired = row.expiration_date && new Date(row.expiration_date) < new Date();
                  const status = isExpired
                    ? 'expired'
                    : row.current_balance <= 0
                    ? 'used'
                    : row.is_active
                    ? 'active'
                    : 'inactive';

                  const colors: any = {
                    active: 'bg-green-100 text-green-800',
                    inactive: 'bg-gray-100 text-gray-800',
                    used: 'bg-blue-100 text-blue-800',
                    expired: 'bg-red-100 text-red-800',
                  };

                  return (
                    <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
                      {status.toUpperCase()}
                    </span>
                  );
                },
              },
              {
                key: 'purchase_date',
                label: 'Purchased',
                render: (row: any) => new Date(row.purchase_date).toLocaleDateString(),
              },
            ]}
            searchPlaceholder="Search gift cards..."
          />
        </div>

        <Modal
          isOpen={showNewCardModal}
          onClose={() => setShowNewCardModal(false)}
          title="Sell Gift Card"
          maxWidth="3xl"
        >
          <GiftCardForm
            clinicId={globals.clinic_id}
            onSubmit={handleCreateGiftCard}
            onCancel={() => setShowNewCardModal(false)}
            loading={loading}
          />
        </Modal>

        <Modal
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          title="Redeem Gift Card"
          maxWidth="2xl"
        >
          <GiftCardRedemptionForm
            onRedeem={handleRedeem}
            onCheckBalance={handleCheckBalance}
            onCancel={() => setShowRedeemModal(false)}
            loading={loading}
          />
        </Modal>
      </div>
    
  );
};

export default AestheticGiftCards;
