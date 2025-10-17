import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineEventFormUnifiedProps {
  timelineEvent?: any;
  onSuccess: () => void;
  onCancel: () => void;
  showFMFields?: boolean;
  patientId?: string;
  clinicId?: string;
}

const TimelineEventFormUnified: React.FC<TimelineEventFormUnifiedProps> = ({
  timelineEvent,
  onSuccess,
  onCancel,
  showFMFields = false,
  patientId,
  clinicId
}) => {
  const [formData, setFormData] = useState({
    event_date: '',
    event_type: 'Symptom',
    title: '',
    description: '',
    severity: 'medium',
    outcome: '',
    event_age: '',
    category: '',
    impact_on_health: '',
    related_symptoms: '',
    triggers_identified: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(showFMFields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userLoading, setUserLoading] = useState(true);
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  const effectivePatientId = patientId || globals.selected_patient_id;
  const effectiveClinicId = clinicId || globals.clinic_id;

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
        outcome: timelineEvent.outcome || '',
        event_age: timelineEvent.event_age?.toString() || '',
        category: timelineEvent.category || '',
        impact_on_health: timelineEvent.impact_on_health || '',
        related_symptoms: Array.isArray(timelineEvent.related_symptoms)
          ? timelineEvent.related_symptoms.join(', ')
          : '',
        triggers_identified: Array.isArray(timelineEvent.triggers_identified)
          ? timelineEvent.triggers_identified.join(', ')
          : ''
      });
      if (timelineEvent.event_age || timelineEvent.category || timelineEvent.impact_on_health) {
        setShowAdvanced(true);
      }
    }
  }, [timelineEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!currentUserId) newErrors.submit = 'Unable to identify current user. Please refresh and try again.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const eventData: any = {
        event_date: formData.event_date,
        event_type: formData.event_type,
        title: formData.title,
        description: formData.description || null,
        severity: formData.severity,
        outcome: formData.outcome || null,
        patient_id: effectivePatientId,
        clinic_id: effectiveClinicId,
        provider_id: currentUserId,
      };

      if (showAdvanced || showFMFields) {
        if (formData.event_age) eventData.event_age = parseFloat(formData.event_age);
        if (formData.category) eventData.category = formData.category;
        if (formData.impact_on_health) eventData.impact_on_health = formData.impact_on_health;
        if (formData.related_symptoms) {
          eventData.related_symptoms = formData.related_symptoms
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        }
        if (formData.triggers_identified) {
          eventData.triggers_identified = formData.triggers_identified
            .split(',')
            .map(t => t.trim())
            .filter(t => t);
        }
      }

      if (timelineEvent) {
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

  const simpleEventTypes = [
    'Symptom', 'Treatment', 'Lab Work', 'Appointment',
    'Lifestyle Change', 'Supplement', 'Medication', 'Other'
  ];

  const fmEventTypes = [
    'trauma', 'illness', 'exposure', 'stress',
    'life_event', 'symptom_onset', 'treatment', 'other'
  ];

  const eventTypes = showFMFields ? fmEventTypes : simpleEventTypes;

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
          {eventTypes.map(type => (
            <option key={type} value={type}>
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
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
          <option value="mild">Mild</option>
          <option value="medium">Medium</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="severe">Severe</option>
          <option value="life_threatening">Life Threatening</option>
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

      {!showFMFields && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showAdvanced ? 'Hide' : 'Show'} Functional Medicine Fields
          </button>
        </div>
      )}

      {(showAdvanced || showFMFields) && (
        <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-3">Functional Medicine Details</h3>

          <FormField label="Patient Age at Event" error={errors.event_age}>
            <input
              type="number"
              step="0.1"
              value={formData.event_age}
              onChange={(e) => handleChange('event_age', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 25.5"
            />
          </FormField>

          <FormField label="Category" error={errors.category}>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="physical">Physical</option>
              <option value="emotional">Emotional</option>
              <option value="environmental">Environmental</option>
              <option value="genetic">Genetic</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </FormField>

          <FormField label="Impact on Health" error={errors.impact_on_health}>
            <textarea
              value={formData.impact_on_health}
              onChange={(e) => handleChange('impact_on_health', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe how this event affected the patient's health"
            />
          </FormField>

          <FormField label="Related Symptoms" error={errors.related_symptoms}>
            <input
              type="text"
              value={formData.related_symptoms}
              onChange={(e) => handleChange('related_symptoms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Comma-separated list (e.g., fatigue, headaches, anxiety)"
            />
          </FormField>

          <FormField label="Triggers Identified" error={errors.triggers_identified}>
            <input
              type="text"
              value={formData.triggers_identified}
              onChange={(e) => handleChange('triggers_identified', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Comma-separated list (e.g., stress, diet, environmental)"
            />
          </FormField>
        </div>
      )}

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

export default TimelineEventFormUnified;
