import React, { useState, useEffect } from 'react';
import FormField from './FormField';
import Button from './Button';
import GiftCardRedemptionForm from './GiftCardRedemptionForm';
import { CreditCard, Gift, TrendingUp, DollarSign, AlertCircle, Check } from 'lucide-react';

interface IntegratedPaymentFormProps {
  totalAmount: number;
  patientId?: string;
  onCheckGiftCardBalance: (cardCode: string) => Promise<any>;
  onCheckMembershipBalance: (patientId: string) => Promise<any>;
  onPaymentComplete: (paymentData: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PaymentAllocation {
  method: string;
  amount: number;
  details?: any;
}

const IntegratedPaymentForm: React.FC<IntegratedPaymentFormProps> = ({
  totalAmount,
  patientId,
  onCheckGiftCardBalance,
  onCheckMembershipBalance,
  onPaymentComplete,
  onCancel,
  loading = false,
}) => {
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showGiftCardInput, setShowGiftCardInput] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardInfo, setGiftCardInfo] = useState<any>(null);
  const [membershipInfo, setMembershipInfo] = useState<any>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    if (patientId) {
      loadMembershipInfo();
    }
  }, [patientId]);

  const loadMembershipInfo = async () => {
    if (!patientId) return;

    try {
      const info = await onCheckMembershipBalance(patientId);
      setMembershipInfo(info);
    } catch (error) {
      console.error('Failed to load membership info:', error);
    }
  };

  const handleCheckGiftCard = async () => {
    if (!giftCardCode) return;

    setCheckingBalance(true);
    try {
      const info = await onCheckGiftCardBalance(giftCardCode);
      if (info.valid) {
        setGiftCardInfo(info);
      }
    } catch (error) {
      console.error('Failed to check gift card:', error);
    } finally {
      setCheckingBalance(false);
    }
  };

  const getRemainingBalance = () => {
    const paid = paymentAllocations.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalAmount - paid);
  };

  const handleAddPayment = () => {
    const amount = parseFloat(customAmount) || 0;
    const remaining = getRemainingBalance();

    if (amount <= 0 || amount > remaining) {
      return;
    }

    let allocation: PaymentAllocation = {
      method: selectedMethod,
      amount,
    };

    if (selectedMethod === 'Gift Card' && giftCardInfo) {
      allocation.details = {
        card_code: giftCardInfo.card_code,
      };
    }

    if (selectedMethod === 'Membership Credit' && membershipInfo) {
      allocation.details = {
        membership_id: membershipInfo.membership_id,
      };
    }

    setPaymentAllocations([...paymentAllocations, allocation]);
    setCustomAmount('');
    setSelectedMethod('');
    setGiftCardCode('');
    setGiftCardInfo(null);
    setShowGiftCardInput(false);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentAllocations(paymentAllocations.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const remaining = getRemainingBalance();
    if (remaining > 0.01) {
      return;
    }

    onPaymentComplete({
      allocations: paymentAllocations,
      total_amount: totalAmount,
    });
  };

  const canAddPayment = () => {
    if (!selectedMethod || !customAmount) return false;
    const amount = parseFloat(customAmount);
    if (amount <= 0) return false;

    if (selectedMethod === 'Gift Card' && !giftCardInfo) return false;
    if (selectedMethod === 'Membership Credit') {
      if (!membershipInfo?.has_active_membership) return false;
      if (amount > membershipInfo.credits_balance) return false;
    }

    return amount <= getRemainingBalance();
  };

  const remaining = getRemainingBalance();
  const isFullyPaid = remaining < 0.01;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Payment Processing</h3>
            <p className="text-sm text-gray-600 mt-1">Split payment across multiple methods</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {membershipInfo?.has_active_membership && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">{membershipInfo.membership_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Available Credits</p>
              <p className="font-semibold text-lg text-purple-700">
                ${membershipInfo.credits_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Member Discount</p>
              <p className="font-semibold text-lg text-purple-700">
                {membershipInfo.discount_percentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentAllocations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Applied Payments</h4>
          {paymentAllocations.map((payment, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  {payment.method === 'Gift Card' ? (
                    <Gift className="w-5 h-5 text-green-600" />
                  ) : payment.method === 'Membership Credit' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payment.method}</p>
                  {payment.details?.card_code && (
                    <p className="text-xs text-gray-500 font-mono">{payment.details.card_code}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                <button
                  onClick={() => handleRemovePayment(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFullyPaid && (
        <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Add Payment Method</h4>
            <div className="text-right">
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">${remaining.toFixed(2)}</p>
            </div>
          </div>

          <FormField label="Payment Method" required>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setShowGiftCardInput(e.target.value === 'Gift Card');
                setGiftCardInfo(null);
                setGiftCardCode('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select method...</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Check">Check</option>
              <option value="Gift Card">Gift Card</option>
              {membershipInfo?.has_active_membership && (
                <option value="Membership Credit">Membership Credit</option>
              )}
              <option value="Other">Other</option>
            </select>
          </FormField>

          {showGiftCardInput && !giftCardInfo && (
            <div>
              <FormField label="Gift Card Code">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleCheckGiftCard}
                    disabled={checkingBalance || !giftCardCode}
                  >
                    {checkingBalance ? 'Checking...' : 'Verify'}
                  </Button>
                </div>
              </FormField>
            </div>
          )}

          {giftCardInfo && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Valid Gift Card</span>
              </div>
              <p className="text-sm text-gray-700">
                Balance: <span className="font-bold">${giftCardInfo.current_balance.toFixed(2)}</span>
              </p>
            </div>
          )}

          {selectedMethod && (
            <FormField label="Amount" required>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={remaining}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    let maxAmount = remaining;
                    if (selectedMethod === 'Gift Card' && giftCardInfo) {
                      maxAmount = Math.min(remaining, giftCardInfo.current_balance);
                    } else if (selectedMethod === 'Membership Credit' && membershipInfo) {
                      maxAmount = Math.min(remaining, membershipInfo.credits_balance);
                    }
                    setCustomAmount(maxAmount.toFixed(2));
                  }}
                  variant="secondary"
                >
                  Max
                </Button>
              </div>
            </FormField>
          )}

          <Button
            type="button"
            onClick={handleAddPayment}
            disabled={!canAddPayment()}
            className="w-full"
          >
            Add Payment
          </Button>
        </div>
      )}

      {isFullyPaid && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
            <Check className="w-8 h-8" />
            <span className="text-xl font-bold">Payment Complete</span>
          </div>
          <p className="text-gray-600">All payments have been applied</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !isFullyPaid}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Complete Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default IntegratedPaymentForm;
