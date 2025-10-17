import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import { Calendar, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface SmartSchedulingAssistantProps {
  providerId: string;
  appointmentTypeId?: string;
  patientId?: string;
  onSelectSlot: (startTime: string, endTime: string) => void;
  isOpen: boolean;
}

interface SlotRecommendation {
  startTime: string;
  endTime: string;
  confidenceScore: number;
  reasons: string[];
  date: string;
  dayOfWeek: number;
  timeOfDay: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SmartSchedulingAssistant: React.FC<SmartSchedulingAssistantProps> = ({
  providerId,
  appointmentTypeId,
  patientId,
  onSelectSlot,
  isOpen
}) => {
  const [recommendations, setRecommendations] = useState<SlotRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const { apiCall } = useApi();

  useEffect(() => {
    if (isOpen && providerId) {
      fetchRecommendations();
    }
  }, [isOpen, providerId, appointmentTypeId, patientId, dateRange]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend_appointment_slots?provider_id=${providerId}&start_date=${dateRange.start}&end_date=${dateRange.end}&top_n=10`;

      if (appointmentTypeId) {
        url += `&appointment_type_id=${appointmentTypeId}`;
      }

      if (patientId) {
        url += `&patient_id=${patientId}`;
      }

      const response = await apiCall<any>(url, { method: 'GET' });

      if (response && response.recommendations) {
        setRecommendations(response.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 70) return 'Great Match';
    if (score >= 50) return 'Good Match';
    return 'Available';
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Smart Scheduling Assistant
          </h3>
        </div>
        <Button
          variant="secondary"
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-sm"
        >
          Refresh
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          AI-powered recommendations based on provider preferences, appointment type, and patient needs
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search From
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Until
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Finding best times...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No available time slots found in the selected date range.</p>
          <p className="text-sm mt-2">Try extending the date range.</p>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((slot, index) => {
            const dayName = DAYS[slot.dayOfWeek];
            const isTopPick = index === 0;

            return (
              <div
                key={`${slot.startTime}-${index}`}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isTopPick ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {isTopPick && (
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      Top Recommendation
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        {dayName}, {formatDateTime(slot.startTime).split(',')[1]}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(slot.confidenceScore)}`}>
                      {getScoreLabel(slot.confidenceScore)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Score: {Math.round(slot.confidenceScore)}
                    </div>
                  </div>
                </div>

                {slot.reasons && slot.reasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Why this time:</p>
                    <ul className="space-y-1">
                      {slot.reasons.slice(0, 3).map((reason, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => onSelectSlot(slot.startTime, slot.endTime)}
                  className="w-full text-sm"
                  variant={isTopPick ? 'primary' : 'secondary'}
                >
                  Select This Time
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <p className="font-medium mb-1">How recommendations work:</p>
        <p>
          Our AI considers provider availability, working hours, existing appointments, breaks,
          buffer times, provider preferences for appointment types, time-of-day preferences,
          and patient scheduling preferences to find the best possible appointment times.
        </p>
      </div>
    </div>
  );
};

export default SmartSchedulingAssistant;
