import React, { useState } from 'react';
import FormField from './FormField';
import Button from './Button';
import { Search, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface GiftCardRedemptionFormProps {
  onRedeem: (cardCode: string, amount: number) => void;
  onCheckBalance: (cardCode: string) => Promise<any>;
  onCancel: () => void;
  maxAmount?: number;
  loading?: boolean;
}

const GiftCardRedemptionForm: React.FC<GiftCardRedemptionFormProps> = ({
  onRedeem,
  onCheckBalance,
  onCancel,
  maxAmount,
  loading = false,
}) => {
  const [cardCode, setCardCode] = useState('');
  const [redemptionAmount, setRedemptionAmount] = useState('');
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [error, setError] = useState('');

  const formatCardCode = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join('-').substring(0, 19);
  };

  const handleCardCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardCode(e.target.value);
    setCardCode(formatted);
    setCardInfo(null);
    setError('');
  };

  const handleCheckBalance = async () => {
    if (cardCode.length < 15) {
      setError('Please enter a valid gift card code');
      return;
    }

    setCheckingBalance(true);
    setError('');

    try {
      const balance = await onCheckBalance(cardCode);
      if (balance.valid) {
        setCardInfo(balance);
        if (maxAmount && balance.current_balance > 0) {
          const suggestedAmount = Math.min(balance.current_balance, maxAmount);
          setRedemptionAmount(suggestedAmount.toFixed(2));
        }
      } else {
        setError(balance.is_expired ? 'This gift card has expired' : 'Invalid or inactive gift card');
        setCardInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check gift card balance');
      setCardInfo(null);
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleRedeem = () => {
    if (!cardInfo) {
      setError('Please check gift card balance first');
      return;
    }

    const amount = parseFloat(redemptionAmount);
    if (amount <= 0 || amount > cardInfo.current_balance) {
      setError(`Amount must be between $0.01 and $${cardInfo.current_balance.toFixed(2)}`);
      return;
    }

    if (maxAmount && amount > maxAmount) {
      setError(`Amount cannot exceed $${maxAmount.toFixed(2)}`);
      return;
    }

    onRedeem(cardCode, amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center mb-4">
          <CreditCard className="w-8 h-8 text-green-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Redeem Gift Card</h3>
        </div>
        <p className="text-sm text-gray-600">
          Enter the gift card code to check balance and apply to transaction
        </p>
      </div>

      <FormField label="Gift Card Code" required>
        <div className="flex gap-2">
          <input
            type="text"
            value={cardCode}
            onChange={handleCardCodeChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={19}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Button
            type="button"
            onClick={handleCheckBalance}
            disabled={checkingBalance || cardCode.length < 15}
            className="whitespace-nowrap"
          >
            <Search className="w-4 h-4 mr-2" />
            {checkingBalance ? 'Checking...' : 'Check Balance'}
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-start gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </FormField>

      {cardInfo && (
        <div className="bg-white border-2 border-green-500 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold text-lg">Valid Gift Card</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${cardInfo.current_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Original Amount</p>
              <p className="text-xl font-semibold text-gray-700">
                ${cardInfo.original_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {cardInfo.recipient_name && (
            <div>
              <p className="text-sm text-gray-600">Recipient</p>
              <p className="font-medium text-gray-900">{cardInfo.recipient_name}</p>
            </div>
          )}

          {cardInfo.expiration_date && (
            <div>
              <p className="text-sm text-gray-600">Expires</p>
              <p className="font-medium text-gray-900">
                {new Date(cardInfo.expiration_date).toLocaleDateString()}
              </p>
            </div>
          )}

          {cardInfo.last_used_date && (
            <div>
              <p className="text-sm text-gray-600">Last Used</p>
              <p className="font-medium text-gray-900">
                {new Date(cardInfo.last_used_date).toLocaleDateString()}
              </p>
            </div>
          )}

          <FormField label="Redemption Amount" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                $
              </span>
              <input
                type="number"
                min="0.01"
                max={Math.min(cardInfo.current_balance, maxAmount || cardInfo.current_balance)}
                step="0.01"
                value={redemptionAmount}
                onChange={(e) => setRedemptionAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRedemptionAmount((cardInfo.current_balance / 2).toFixed(2))}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() =>
                  setRedemptionAmount(
                    Math.min(cardInfo.current_balance, maxAmount || cardInfo.current_balance).toFixed(2)
                  )
                }
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Full Amount
              </button>
            </div>
            {maxAmount && maxAmount < cardInfo.current_balance && (
              <p className="mt-2 text-sm text-amber-600">
                Maximum redemption amount: ${maxAmount.toFixed(2)}
              </p>
            )}
          </FormField>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleRedeem}
          disabled={loading || !cardInfo || !redemptionAmount || parseFloat(redemptionAmount) <= 0}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {loading ? 'Redeeming...' : 'Apply to Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default GiftCardRedemptionForm;
