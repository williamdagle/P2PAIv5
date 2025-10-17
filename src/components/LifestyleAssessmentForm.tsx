import React, { useState, useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useApi } from '../hooks/useApi';
import Button from './Button';
import FormField from './FormField';

interface LifestyleAssessmentFormProps {
  patientId: string;
  clinicId: string;
  existingData?: any;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const LifestyleAssessmentForm: React.FC<LifestyleAssessmentFormProps> = ({
  patientId,
  clinicId,
  existingData,
  onSuccess,
  onCancel,
}) => {
  const { showError } = useNotification();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    sleep_hours_average: '',
    sleep_quality: 'good',
    sleep_issues: '',
    relaxation_practices: '',
    relaxation_frequency: '',
    sleep_notes: '',
    exercise_frequency: '',
    exercise_types: '',
    exercise_duration_minutes: '',
    movement_throughout_day: 'moderate',
    exercise_barriers: '',
    exercise_notes: '',
    diet_type: '',
    meals_per_day: '',
    water_intake_oz: '',
    caffeine_intake: '',
    alcohol_frequency: '',
    processed_food_frequency: '',
    organic_food_percentage: '',
    nutrition_notes: '',
    stress_level: 'moderate',
    stress_sources: '',
    coping_mechanisms: '',
    resilience_score: '',
    mindfulness_practice: false,
    stress_notes: '',
    social_support_level: 'moderate',
    relationship_satisfaction: '',
    community_involvement: '',
    social_activities_frequency: '',
    relationships_notes: '',
    home_environment_quality: '',
    work_environment_quality: '',
    mold_exposure: false,
    toxin_exposure: '',
    emf_exposure_level: '',
    air_quality: '',
    water_quality: '',
    environmental_notes: '',
    overall_notes: '',
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        ...formData,
        ...existingData,
        assessment_date: existingData.assessment_date || formData.assessment_date,
        sleep_hours_average: existingData.sleep_hours_average?.toString() || '',
        exercise_duration_minutes: existingData.exercise_duration_minutes?.toString() || '',
        meals_per_day: existingData.meals_per_day?.toString() || '',
        water_intake_oz: existingData.water_intake_oz?.toString() || '',
        organic_food_percentage: existingData.organic_food_percentage?.toString() || '',
        resilience_score: existingData.resilience_score?.toString() || '',
        sleep_issues: existingData.sleep_issues?.join(', ') || '',
        relaxation_practices: existingData.relaxation_practices?.join(', ') || '',
        exercise_types: existingData.exercise_types?.join(', ') || '',
        exercise_barriers: existingData.exercise_barriers?.join(', ') || '',
        stress_sources: existingData.stress_sources?.join(', ') || '',
        coping_mechanisms: existingData.coping_mechanisms?.join(', ') || '',
        toxin_exposure: existingData.toxin_exposure?.join(', ') || '',
      });
    }
  }, [existingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = existingData ? 'update_lifestyle_assessments' : 'create_lifestyle_assessments';

      const arrayFields = [
        'sleep_issues',
        'relaxation_practices',
        'exercise_types',
        'exercise_barriers',
        'stress_sources',
        'coping_mechanisms',
        'toxin_exposure',
      ];

      const payload: any = { ...formData };

      arrayFields.forEach((field) => {
        payload[field] = payload[field]
          ? payload[field].split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
      });

      ['sleep_hours_average', 'exercise_duration_minutes', 'meals_per_day', 'water_intake_oz', 'organic_food_percentage', 'resilience_score'].forEach((field) => {
        payload[field] = payload[field] ? parseFloat(payload[field]) : null;
      });

      const finalPayload = existingData
        ? { ...payload, id: existingData.id }
        : { ...payload, patient_id: patientId, clinic_id: clinicId };

      await apiCall(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(finalPayload),
      });

      onSuccess(
        existingData ? 'Lifestyle assessment updated successfully' : 'Lifestyle assessment created successfully'
      );
    } catch (error: any) {
      showError(error.message || 'Failed to save lifestyle assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Assessment Date"
        type="date"
        value={formData.assessment_date}
        onChange={(e) => handleChange('assessment_date', e.target.value)}
        required
      />

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep & Relaxation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Average Sleep Hours"
            type="number"
            step="0.5"
            value={formData.sleep_hours_average}
            onChange={(e) => handleChange('sleep_hours_average', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Quality</label>
            <select
              value={formData.sleep_quality}
              onChange={(e) => handleChange('sleep_quality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
          <FormField
            label="Sleep Issues (comma-separated)"
            value={formData.sleep_issues}
            onChange={(e) => handleChange('sleep_issues', e.target.value)}
            placeholder="insomnia, apnea, restless"
          />
          <FormField
            label="Relaxation Practices (comma-separated)"
            value={formData.relaxation_practices}
            onChange={(e) => handleChange('relaxation_practices', e.target.value)}
            placeholder="meditation, yoga, breathing"
          />
        </div>
        <FormField
          label="Sleep Notes"
          textarea
          rows={2}
          value={formData.sleep_notes}
          onChange={(e) => handleChange('sleep_notes', e.target.value)}
        />
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise & Movement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Exercise Frequency"
            value={formData.exercise_frequency}
            onChange={(e) => handleChange('exercise_frequency', e.target.value)}
            placeholder="e.g., 3-5x per week"
          />
          <FormField
            label="Exercise Duration (minutes)"
            type="number"
            value={formData.exercise_duration_minutes}
            onChange={(e) => handleChange('exercise_duration_minutes', e.target.value)}
          />
          <FormField
            label="Exercise Types (comma-separated)"
            value={formData.exercise_types}
            onChange={(e) => handleChange('exercise_types', e.target.value)}
            placeholder="cardio, strength, yoga, walking"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Movement</label>
            <select
              value={formData.movement_throughout_day}
              onChange={(e) => handleChange('movement_throughout_day', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition & Hydration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Diet Type"
            value={formData.diet_type}
            onChange={(e) => handleChange('diet_type', e.target.value)}
            placeholder="e.g., Mediterranean, Paleo, Vegan"
          />
          <FormField
            label="Meals Per Day"
            type="number"
            value={formData.meals_per_day}
            onChange={(e) => handleChange('meals_per_day', e.target.value)}
          />
          <FormField
            label="Water Intake (oz/day)"
            type="number"
            value={formData.water_intake_oz}
            onChange={(e) => handleChange('water_intake_oz', e.target.value)}
          />
          <FormField
            label="Organic Food %"
            type="number"
            min="0"
            max="100"
            value={formData.organic_food_percentage}
            onChange={(e) => handleChange('organic_food_percentage', e.target.value)}
          />
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress & Resilience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stress Level</label>
            <select
              value={formData.stress_level}
              onChange={(e) => handleChange('stress_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <FormField
            label="Resilience Score (1-10)"
            type="number"
            min="1"
            max="10"
            value={formData.resilience_score}
            onChange={(e) => handleChange('resilience_score', e.target.value)}
          />
          <FormField
            label="Stress Sources (comma-separated)"
            value={formData.stress_sources}
            onChange={(e) => handleChange('stress_sources', e.target.value)}
            placeholder="work, family, financial"
          />
          <FormField
            label="Coping Mechanisms (comma-separated)"
            value={formData.coping_mechanisms}
            onChange={(e) => handleChange('coping_mechanisms', e.target.value)}
            placeholder="exercise, talking, meditation"
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.mindfulness_practice}
              onChange={(e) => handleChange('mindfulness_practice', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Practices Mindfulness</span>
          </label>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Level</label>
            <select
              value={formData.social_support_level}
              onChange={(e) => handleChange('social_support_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="strong">Strong</option>
              <option value="moderate">Moderate</option>
              <option value="limited">Limited</option>
              <option value="isolated">Isolated</option>
            </select>
          </div>
          <FormField
            label="Social Activities Frequency"
            value={formData.social_activities_frequency}
            onChange={(e) => handleChange('social_activities_frequency', e.target.value)}
            placeholder="e.g., Weekly, Monthly"
          />
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Home Environment Quality"
            value={formData.home_environment_quality}
            onChange={(e) => handleChange('home_environment_quality', e.target.value)}
            placeholder="e.g., Good, Concerns with mold"
          />
          <FormField
            label="Work Environment Quality"
            value={formData.work_environment_quality}
            onChange={(e) => handleChange('work_environment_quality', e.target.value)}
            placeholder="e.g., Good, High stress"
          />
          <FormField
            label="Toxin Exposure (comma-separated)"
            value={formData.toxin_exposure}
            onChange={(e) => handleChange('toxin_exposure', e.target.value)}
            placeholder="chemicals, pesticides, heavy metals"
          />
          <FormField
            label="EMF Exposure Level"
            value={formData.emf_exposure_level}
            onChange={(e) => handleChange('emf_exposure_level', e.target.value)}
            placeholder="e.g., Low, Moderate, High"
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.mold_exposure}
              onChange={(e) => handleChange('mold_exposure', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Mold Exposure</span>
          </label>
        </div>
      </div>

      <FormField
        label="Overall Notes"
        textarea
        rows={3}
        value={formData.overall_notes}
        onChange={(e) => handleChange('overall_notes', e.target.value)}
      />

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : existingData ? 'Update Assessment' : 'Create Assessment'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LifestyleAssessmentForm;
