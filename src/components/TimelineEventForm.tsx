import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface TimelineEventFormProps {
  timelineEvent?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TimelineEventForm: React.FC<TimelineEventFormProps> = ({
  timelineEvent,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    event_date: '',
    event_type: 'Symptom',
    title: '',
    description: '',
    severity: 'medium',
    outcome: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userLoading, setUserLoading] = useState(true);
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  // Get current user's internal ID
  useEffect(() => {
    if (currentUserId || !globals.user_id) {
      return;
    }
    
    const getCurrentUser = async () => {
      setUserLoading(true);
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );
        
        if (response.users) {
          const currentUser = response.users.find((user: any) => 
            user.auth_user_id === globals.user_id
          );
          
          if (currentUser) {
            setCurrentUserId(currentUser.id);
          } else {
            setErrors({ submit: 'Unable to find your user profile. Please contact support.' });
          }
        } else {
          setErrors({ submit: 'Unable to load user data. Please try again.' });
        }
      } catch (err) {
        setErrors({ submit: 'Unable to load user data. Please refresh and try again.' });
      } finally {
        setUserLoading(false);
      }
    };

    getCurrentUser();
  }, [globals.user_id, currentUserId, apiCall]);

  useEffect(() => {
    if (timelineEvent) {
      setFormData({
        event_date: timelineEvent.event_date || '',
        event_type: timelineEvent.event_type || 'Symptom',
        title: timelineEvent.title || '',
        description: timelineEvent.description || '',
        severity: timelineEvent.severity || 'medium',
        outcome: timelineEvent.outcome || ''
      });
    }
  }, [timelineEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!currentUserId) newErrors.submit = 'Unable to identify current user. Please refresh and try again.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const eventData = {
        ...formData,
        patient_id: globals.selected_patient_id,
        provider_id: currentUserId
      };

      if (timelineEvent) {
        // Update existing timeline event
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_timeline_events`,
          {
            method: 'PUT',
            body: {
              ...eventData,
              id: timelineEvent.id
            }
          }
        );
      } else {
        // Create new timeline event
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_timeline_events`,
          {
            method: 'POST',
            body: eventData
          }
        );
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save timeline event. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading user information...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Event Date" error={errors.event_date} required>
        <input
          type="date"
          value={formData.event_date}
          onChange={(e) => handleChange('event_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Event Type" error={errors.event_type} required>
        <select
          value={formData.event_type}
          onChange={(e) => handleChange('event_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="Symptom">Symptom</option>
          <option value="Treatment">Treatment</option>
          <option value="Lab Work">Lab Work</option>
          <option value="Appointment">Appointment</option>
          <option value="Lifestyle Change">Lifestyle Change</option>
          <option value="Supplement">Supplement</option>
          <option value="Other">Other</option>
        </select>
      </FormField>

      <FormField label="Title" error={errors.title} required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter event title"
        />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter event description"
        />
      </FormField>

      <FormField label="Severity" error={errors.severity}>
        <select
          value={formData.severity}
          onChange={(e) => handleChange('severity', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </FormField>

      <FormField label="Outcome" error={errors.outcome}>
        <textarea
          value={formData.outcome}
          onChange={(e) => handleChange('outcome', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter outcome or result"
        />
      </FormField>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!currentUserId}
        >
          {timelineEvent ? 'Update Timeline Event' : 'Create Timeline Event'}
        </Button>
      </div>
    </form>
  );
};

export default TimelineEventForm;