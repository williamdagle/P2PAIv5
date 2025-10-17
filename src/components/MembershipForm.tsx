import React, { useState } from 'react';
import FormField from './FormField';
import Button from './Button';
import { TrendingUp, Star, Check } from 'lucide-react';

interface MembershipFormProps {
  clinicId: string;
  patientId: string;
  patientName: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface MembershipTier {
  id: string;
  name: string;
  tier: string;
  monthlyFee: number;
  discount: number;
  credits: number;
  benefits: string[];
  popular?: boolean;
}

const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Member',
    tier: 'bronze',
    monthlyFee: 99,
    discount: 5,
    credits: 0,
    benefits: [
      '5% discount on all services',
      'Priority booking',
      'Exclusive member events',
      'Birthday bonus points',
    ],
  },
  {
    id: 'silver',
    name: 'Silver Member',
    tier: 'silver',
    monthlyFee: 199,
    discount: 10,
    credits: 50,
    benefits: [
      '10% discount on all services',
      'Priority booking',
      '$50 monthly service credit',
      'Complimentary consultations',
      'Birthday bonus treatment',
      'Member-only promotions',
    ],
    popular: true,
  },
  {
    id: 'gold',
    name: 'Gold Member',
    tier: 'gold',
    monthlyFee: 299,
    discount: 15,
    credits: 100,
    benefits: [
      '15% discount on all services',
      'VIP priority booking',
      '$100 monthly service credit',
      'Free monthly skincare products',
      'Quarterly complimentary treatments',
      'Exclusive VIP events',
      'Personal aesthetic consultant',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum VIP',
    tier: 'platinum',
    monthlyFee: 499,
    discount: 20,
    credits: 200,
    benefits: [
      '20% discount on all services',
      'Ultimate VIP priority',
      '$200 monthly service credit',
      'Monthly complimentary treatments',
      'Premium skincare product suite',
      'Private VIP lounge access',
      'Dedicated aesthetic concierge',
      'Exclusive partnership discounts',
    ],
  },
];

const MembershipForm: React.FC<MembershipFormProps> = ({
  clinicId,
  patientId,
  patientName,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [autoRenew, setAutoRenew] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const calculateFee = () => {
    if (!selectedTier) return 0;

    switch (billingCycle) {
      case 'quarterly':
        return selectedTier.monthlyFee * 3 * 0.95;
      case 'annual':
        return selectedTier.monthlyFee * 12 * 0.90;
      default:
        return selectedTier.monthlyFee;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) return;

    const data = {
      clinic_id: clinicId,
      patient_id: patientId,
      membership_tier: selectedTier.tier,
      membership_name: selectedTier.name,
      monthly_fee: selectedTier.monthlyFee,
      billing_cycle: billingCycle,
      start_date: startDate,
      auto_renew: autoRenew,
      discount_percentage: selectedTier.discount,
      credits_balance: selectedTier.credits,
      benefits: {
        discount: selectedTier.discount,
        monthly_credits: selectedTier.credits,
        benefits: selectedTier.benefits,
      },
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Enroll in Membership</h3>
        </div>
        <p className="text-sm text-gray-600">
          Enrolling: <span className="font-semibold text-gray-900">{patientName}</span>
        </p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Membership Tier</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MEMBERSHIP_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`relative p-6 border-2 rounded-xl transition-all text-left ${
                selectedTier?.id === tier.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-105'
                  : 'border-gray-300 hover:border-purple-300 hover:shadow-md'
              } ${tier.popular ? 'ring-2 ring-purple-300' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h5 className="text-lg font-bold text-gray-900 mb-1">{tier.name}</h5>
                <div className="text-3xl font-bold text-purple-600">
                  ${tier.monthlyFee}
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="font-semibold">{tier.discount}% discount</span>
                </div>
                {tier.credits > 0 && (
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="font-semibold">${tier.credits} monthly credit</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {tier.benefits.slice(0, 3).map((benefit, idx) => (
                  <div key={idx} className="flex items-start text-xs text-gray-600">
                    <Check className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
                {tier.benefits.length > 3 && (
                  <div className="text-xs text-purple-600 font-medium">
                    +{tier.benefits.length - 3} more benefits
                  </div>
                )}
              </div>

              {selectedTier?.id === tier.id && (
                <div className="absolute top-4 right-4">
                  <div className="bg-purple-500 text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedTier && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">All Benefits Included</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTier.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Billing Cycle" required>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="monthly">Monthly (standard rate)</option>
                <option value="quarterly">Quarterly (5% discount)</option>
                <option value="annual">Annual (10% discount)</option>
              </select>
              <div className="mt-2 bg-purple-50 p-3 rounded text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Billing amount:</span>
                  <span className="font-bold text-purple-600 text-lg">
                    ${calculateFee().toFixed(2)}
                  </span>
                </div>
                {billingCycle !== 'monthly' && (
                  <p className="text-xs text-purple-600 mt-1">
                    Save ${(selectedTier.monthlyFee * (billingCycle === 'quarterly' ? 3 : 12) - calculateFee()).toFixed(2)}!
                  </p>
                )}
              </div>
            </FormField>

            <FormField label="Start Date" required>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <FormField label="Auto-Renewal">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                Automatically renew membership at the end of each billing cycle
              </span>
            </label>
            {!autoRenew && (
              <p className="mt-2 text-sm text-amber-600">
                Without auto-renewal, membership will expire at the end of the billing period
              </p>
            )}
          </FormField>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !selectedTier}>
          <TrendingUp className="w-4 h-4 mr-2" />
          {loading ? 'Enrolling...' : 'Enroll in Membership'}
        </Button>
      </div>
    </form>
  );
};

export default MembershipForm;
