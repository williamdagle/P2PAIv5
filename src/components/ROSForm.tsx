import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import FormField from './FormField';
import Button from './Button';

interface ROSFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const ROSForm: React.FC<ROSFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { globals } = useGlobal();
  const [formData, setFormData] = useState({
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    all_systems_negative: initialData?.all_systems_negative || false,

    constitutional_fever: initialData?.constitutional_fever || false,
    constitutional_chills: initialData?.constitutional_chills || false,
    constitutional_weight_loss: initialData?.constitutional_weight_loss || false,
    constitutional_weight_gain: initialData?.constitutional_weight_gain || false,
    constitutional_fatigue: initialData?.constitutional_fatigue || false,
    constitutional_notes: initialData?.constitutional_notes || '',

    eyes_vision_changes: initialData?.eyes_vision_changes || false,
    eyes_pain: initialData?.eyes_pain || false,
    eyes_redness: initialData?.eyes_redness || false,
    eyes_discharge: initialData?.eyes_discharge || false,
    eyes_notes: initialData?.eyes_notes || '',

    ent_hearing_loss: initialData?.ent_hearing_loss || false,
    ent_ear_pain: initialData?.ent_ear_pain || false,
    ent_nasal_congestion: initialData?.ent_nasal_congestion || false,
    ent_sore_throat: initialData?.ent_sore_throat || false,
    ent_sinus_pain: initialData?.ent_sinus_pain || false,
    ent_notes: initialData?.ent_notes || '',

    cardiovascular_chest_pain: initialData?.cardiovascular_chest_pain || false,
    cardiovascular_palpitations: initialData?.cardiovascular_palpitations || false,
    cardiovascular_edema: initialData?.cardiovascular_edema || false,
    cardiovascular_orthopnea: initialData?.cardiovascular_orthopnea || false,
    cardiovascular_notes: initialData?.cardiovascular_notes || '',

    respiratory_shortness_of_breath: initialData?.respiratory_shortness_of_breath || false,
    respiratory_cough: initialData?.respiratory_cough || false,
    respiratory_wheezing: initialData?.respiratory_wheezing || false,
    respiratory_sputum: initialData?.respiratory_sputum || false,
    respiratory_notes: initialData?.respiratory_notes || '',

    gi_nausea: initialData?.gi_nausea || false,
    gi_vomiting: initialData?.gi_vomiting || false,
    gi_diarrhea: initialData?.gi_diarrhea || false,
    gi_constipation: initialData?.gi_constipation || false,
    gi_abdominal_pain: initialData?.gi_abdominal_pain || false,
    gi_blood_in_stool: initialData?.gi_blood_in_stool || false,
    gi_notes: initialData?.gi_notes || '',

    gu_dysuria: initialData?.gu_dysuria || false,
    gu_frequency: initialData?.gu_frequency || false,
    gu_urgency: initialData?.gu_urgency || false,
    gu_hematuria: initialData?.gu_hematuria || false,
    gu_incontinence: initialData?.gu_incontinence || false,
    gu_notes: initialData?.gu_notes || '',

    musculoskeletal_joint_pain: initialData?.musculoskeletal_joint_pain || false,
    musculoskeletal_muscle_pain: initialData?.musculoskeletal_muscle_pain || false,
    musculoskeletal_stiffness: initialData?.musculoskeletal_stiffness || false,
    musculoskeletal_swelling: initialData?.musculoskeletal_swelling || false,
    musculoskeletal_notes: initialData?.musculoskeletal_notes || '',

    skin_rash: initialData?.skin_rash || false,
    skin_itching: initialData?.skin_itching || false,
    skin_lesions: initialData?.skin_lesions || false,
    skin_bruising: initialData?.skin_bruising || false,
    skin_notes: initialData?.skin_notes || '',

    neurological_headache: initialData?.neurological_headache || false,
    neurological_dizziness: initialData?.neurological_dizziness || false,
    neurological_numbness: initialData?.neurological_numbness || false,
    neurological_weakness: initialData?.neurological_weakness || false,
    neurological_seizures: initialData?.neurological_seizures || false,
    neurological_notes: initialData?.neurological_notes || '',

    psychiatric_depression: initialData?.psychiatric_depression || false,
    psychiatric_anxiety: initialData?.psychiatric_anxiety || false,
    psychiatric_sleep_disturbance: initialData?.psychiatric_sleep_disturbance || false,
    psychiatric_mood_changes: initialData?.psychiatric_mood_changes || false,
    psychiatric_notes: initialData?.psychiatric_notes || '',

    endocrine_heat_intolerance: initialData?.endocrine_heat_intolerance || false,
    endocrine_cold_intolerance: initialData?.endocrine_cold_intolerance || false,
    endocrine_excessive_thirst: initialData?.endocrine_excessive_thirst || false,
    endocrine_excessive_urination: initialData?.endocrine_excessive_urination || false,
    endocrine_notes: initialData?.endocrine_notes || '',

    hematologic_easy_bruising: initialData?.hematologic_easy_bruising || false,
    hematologic_easy_bleeding: initialData?.hematologic_easy_bleeding || false,
    hematologic_lymph_node_swelling: initialData?.hematologic_lymph_node_swelling || false,
    hematologic_notes: initialData?.hematologic_notes || '',

    allergic_seasonal_allergies: initialData?.allergic_seasonal_allergies || false,
    allergic_frequent_infections: initialData?.allergic_frequent_infections || false,
    allergic_notes: initialData?.allergic_notes || '',

    general_notes: initialData?.general_notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = initialData
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_ros`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_ros`;

      const payload = {
        patient_id: patientId,
        ...formData,
        ...(initialData && { id: initialData.id })
      };

      const response = await fetch(endpoint, {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globals.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save ROS');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CheckboxGroup = ({ title, fields, prefix }: { title: string; fields: Array<{ key: string; label: string }>; prefix: string }) => (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {fields.map(field => (
          <label key={field.key} className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={formData[`${prefix}_${field.key}` as keyof typeof formData] as boolean}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_${field.key}`]: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              disabled={formData.all_systems_negative}
            />
            <span className={formData.all_systems_negative ? 'text-gray-400' : 'text-gray-700'}>
              {field.label}
            </span>
          </label>
        ))}
        <FormField
          label="Notes"
          type="textarea"
          rows={2}
          value={formData[`${prefix}_notes` as keyof typeof formData] as string}
          onChange={(e) => setFormData({ ...formData, [`${prefix}_notes`]: e.target.value })}
          disabled={formData.all_systems_negative}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <FormField
        label="Visit Date"
        type="date"
        required
        value={formData.visit_date}
        onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
      />

      <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
        <input
          type="checkbox"
          id="all_negative"
          checked={formData.all_systems_negative}
          onChange={(e) => setFormData({ ...formData, all_systems_negative: e.target.checked })}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-3"
        />
        <label htmlFor="all_negative" className="font-medium text-gray-900">
          All Systems Reviewed - All Negative
        </label>
      </div>

      {!formData.all_systems_negative && (
        <div className="space-y-4">
          <CheckboxGroup
            title="Constitutional"
            prefix="constitutional"
            fields={[
              { key: 'fever', label: 'Fever' },
              { key: 'chills', label: 'Chills' },
              { key: 'weight_loss', label: 'Weight Loss' },
              { key: 'weight_gain', label: 'Weight Gain' },
              { key: 'fatigue', label: 'Fatigue' }
            ]}
          />

          <CheckboxGroup
            title="Eyes"
            prefix="eyes"
            fields={[
              { key: 'vision_changes', label: 'Vision Changes' },
              { key: 'pain', label: 'Pain' },
              { key: 'redness', label: 'Redness' },
              { key: 'discharge', label: 'Discharge' }
            ]}
          />

          <CheckboxGroup
            title="ENT (Ears, Nose, Throat)"
            prefix="ent"
            fields={[
              { key: 'hearing_loss', label: 'Hearing Loss' },
              { key: 'ear_pain', label: 'Ear Pain' },
              { key: 'nasal_congestion', label: 'Nasal Congestion' },
              { key: 'sore_throat', label: 'Sore Throat' },
              { key: 'sinus_pain', label: 'Sinus Pain' }
            ]}
          />

          <CheckboxGroup
            title="Cardiovascular"
            prefix="cardiovascular"
            fields={[
              { key: 'chest_pain', label: 'Chest Pain' },
              { key: 'palpitations', label: 'Palpitations' },
              { key: 'edema', label: 'Edema' },
              { key: 'orthopnea', label: 'Orthopnea' }
            ]}
          />

          <CheckboxGroup
            title="Respiratory"
            prefix="respiratory"
            fields={[
              { key: 'shortness_of_breath', label: 'Shortness of Breath' },
              { key: 'cough', label: 'Cough' },
              { key: 'wheezing', label: 'Wheezing' },
              { key: 'sputum', label: 'Sputum Production' }
            ]}
          />

          <CheckboxGroup
            title="Gastrointestinal"
            prefix="gi"
            fields={[
              { key: 'nausea', label: 'Nausea' },
              { key: 'vomiting', label: 'Vomiting' },
              { key: 'diarrhea', label: 'Diarrhea' },
              { key: 'constipation', label: 'Constipation' },
              { key: 'abdominal_pain', label: 'Abdominal Pain' },
              { key: 'blood_in_stool', label: 'Blood in Stool' }
            ]}
          />

          <CheckboxGroup
            title="Genitourinary"
            prefix="gu"
            fields={[
              { key: 'dysuria', label: 'Dysuria' },
              { key: 'frequency', label: 'Frequency' },
              { key: 'urgency', label: 'Urgency' },
              { key: 'hematuria', label: 'Hematuria' },
              { key: 'incontinence', label: 'Incontinence' }
            ]}
          />

          <CheckboxGroup
            title="Musculoskeletal"
            prefix="musculoskeletal"
            fields={[
              { key: 'joint_pain', label: 'Joint Pain' },
              { key: 'muscle_pain', label: 'Muscle Pain' },
              { key: 'stiffness', label: 'Stiffness' },
              { key: 'swelling', label: 'Swelling' }
            ]}
          />

          <CheckboxGroup
            title="Skin"
            prefix="skin"
            fields={[
              { key: 'rash', label: 'Rash' },
              { key: 'itching', label: 'Itching' },
              { key: 'lesions', label: 'Lesions' },
              { key: 'bruising', label: 'Easy Bruising' }
            ]}
          />

          <CheckboxGroup
            title="Neurological"
            prefix="neurological"
            fields={[
              { key: 'headache', label: 'Headache' },
              { key: 'dizziness', label: 'Dizziness' },
              { key: 'numbness', label: 'Numbness' },
              { key: 'weakness', label: 'Weakness' },
              { key: 'seizures', label: 'Seizures' }
            ]}
          />

          <CheckboxGroup
            title="Psychiatric"
            prefix="psychiatric"
            fields={[
              { key: 'depression', label: 'Depression' },
              { key: 'anxiety', label: 'Anxiety' },
              { key: 'sleep_disturbance', label: 'Sleep Disturbance' },
              { key: 'mood_changes', label: 'Mood Changes' }
            ]}
          />

          <CheckboxGroup
            title="Endocrine"
            prefix="endocrine"
            fields={[
              { key: 'heat_intolerance', label: 'Heat Intolerance' },
              { key: 'cold_intolerance', label: 'Cold Intolerance' },
              { key: 'excessive_thirst', label: 'Excessive Thirst' },
              { key: 'excessive_urination', label: 'Excessive Urination' }
            ]}
          />

          <CheckboxGroup
            title="Hematologic/Lymphatic"
            prefix="hematologic"
            fields={[
              { key: 'easy_bruising', label: 'Easy Bruising' },
              { key: 'easy_bleeding', label: 'Easy Bleeding' },
              { key: 'lymph_node_swelling', label: 'Lymph Node Swelling' }
            ]}
          />

          <CheckboxGroup
            title="Allergic/Immunologic"
            prefix="allergic"
            fields={[
              { key: 'seasonal_allergies', label: 'Seasonal Allergies' },
              { key: 'frequent_infections', label: 'Frequent Infections' }
            ]}
          />
        </div>
      )}

      <FormField
        label="General Notes"
        type="textarea"
        rows={3}
        value={formData.general_notes}
        onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })}
        placeholder="Additional observations or comments"
      />

      <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default ROSForm;
