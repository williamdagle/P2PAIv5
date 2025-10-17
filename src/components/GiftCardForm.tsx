import React, { useState } from 'react';
import FormField from './FormField';
import Button from './Button';
import { Gift, CreditCard } from 'lucide-react';

interface GiftCardFormProps {
  clinicId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const GiftCardForm: React.FC<GiftCardFormProps> = ({
  clinicId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [cardType, setCardType] = useState<'digital' | 'physical'>('digital');
  const [amount, setAmount] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [expirationMonths, setExpirationMonths] = useState('12');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + parseInt(expirationMonths));

    const data = {
      clinic_id: clinicId,
      card_type: cardType,
      original_amount: parseFloat(amount),
      purchaser_name: purchaserName || null,
      purchaser_email: purchaserEmail || null,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      message: message || null,
      expiration_date: expirationDate.toISOString().split('T')[0],
    };

    onSubmit(data);
  };

  const presetAmounts = [25, 50, 100, 150, 200, 250, 500];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-200">
        <div className="flex items-center mb-4">
          <Gift className="w-8 h-8 text-pink-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">New Gift Card</h3>
        </div>
        <p className="text-sm text-gray-600">
          Create a new gift card for purchase or promotional use
        </p>
      </div>

      <FormField label="Card Type" required>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setCardType('digital')}
            className={`p-4 border-2 rounded-lg transition-all ${
              cardType === 'digital'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-pink-600" />
            <div className="font-medium">Digital</div>
            <div className="text-xs text-gray-500">Email delivery</div>
          </button>
          <button
            type="button"
            onClick={() => setCardType('physical')}
            className={`p-4 border-2 rounded-lg transition-all ${
              cardType === 'physical'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Gift className="w-6 h-6 mx-auto mb-2 text-pink-600" />
            <div className="font-medium">Physical</div>
            <div className="text-xs text-gray-500">Printed card</div>
          </button>
        </div>
      </FormField>

      <FormField label="Gift Card Amount" required>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className={`py-2 px-3 border rounded-lg font-medium transition-all ${
                  amount === preset.toString()
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'border-gray-300 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
              $
            </span>
            <input
              type="number"
              min="10"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Custom amount"
              required
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Purchaser Name">
          <input
            type="text"
            value={purchaserName}
            onChange={(e) => setPurchaserName(e.target.value)}
            placeholder="Who is buying this?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Purchaser Email">
          <input
            type="email"
            value={purchaserEmail}
            onChange={(e) => setPurchaserEmail(e.target.value)}
            placeholder="purchaser@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Recipient Name">
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Who will receive this?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Recipient Email">
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <FormField label="Personal Message (Optional)">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Add a personal message for the recipient..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Expiration Period">
        <select
          value={expirationMonths}
          onChange={(e) => setExpirationMonths(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="6">6 months</option>
          <option value="12">12 months</option>
          <option value="24">24 months</option>
          <option value="36">36 months</option>
          <option value="60">No expiration (5 years)</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !amount || parseFloat(amount) < 10}>
          <Gift className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Gift Card'}
        </Button>
      </div>
    </form>
  );
};

export default GiftCardForm;
