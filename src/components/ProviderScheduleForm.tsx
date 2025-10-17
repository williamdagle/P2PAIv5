import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface ProviderScheduleFormProps {
  providerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ScheduleBlock {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  schedule_type: string;
  notes?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SCHEDULE_TYPES = [
  { value: 'working_hours', label: 'Working Hours' },
  { value: 'break', label: 'Break' },
  { value: 'blocked', label: 'Blocked Time' },
  { value: 'admin_time', label: 'Admin Time' }
];

const ProviderScheduleForm: React.FC<ProviderScheduleFormProps> = ({
  providerId,
  onSuccess,
  onCancel
}) => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiCall } = useApi();
  const { globals } = useGlobal();

  useEffect(() => {
    loadExistingSchedules();
  }, [providerId]);

  const loadExistingSchedules = async () => {
    setLoading(true);
    try {
      const response = await apiCall<ScheduleBlock[]>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage_provider_schedule?provider_id=${providerId}`,
        { method: 'GET' }
      );

      if (response && Array.isArray(response)) {
        setScheduleBlocks(response);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const addScheduleBlock = () => {
    setScheduleBlocks([
      ...scheduleBlocks,
      {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        schedule_type: 'working_hours'
      }
    ]);
  };

  const removeScheduleBlock = async (index: number) => {
    const block = scheduleBlocks[index];

    if (block.id) {
      try {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage_provider_schedule`,
          {
            method: 'DELETE',
            body: { id: block.id }
          }
        );
      } catch (err) {
        console.error('Failed to delete schedule:', err);
        return;
      }
    }

    setScheduleBlocks(scheduleBlocks.filter((_, i) => i !== index));
  };

  const updateScheduleBlock = (index: number, field: keyof ScheduleBlock, value: any) => {
    const updated = [...scheduleBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleBlocks(updated);
  };

  const applyToAllWeekdays = (templateBlock: ScheduleBlock) => {
    const weekdayBlocks: ScheduleBlock[] = [];
    for (let day = 1; day <= 5; day++) {
      weekdayBlocks.push({
        day_of_week: day,
        start_time: templateBlock.start_time,
        end_time: templateBlock.end_time,
        is_available: templateBlock.is_available,
        schedule_type: templateBlock.schedule_type,
        notes: templateBlock.notes
      });
    }
    setScheduleBlocks([...scheduleBlocks, ...weekdayBlocks]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      for (const block of scheduleBlocks) {
        if (block.id) {
          await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage_provider_schedule`,
            {
              method: 'PUT',
              body: block
            }
          );
        } else {
          await apiCall(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage_provider_schedule`,
            {
              method: 'POST',
              body: {
                ...block,
                provider_id: providerId
              }
            }
          );
        }
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save schedule. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesByDay = () => {
    const byDay: Record<number, ScheduleBlock[]> = {};
    scheduleBlocks.forEach((block, index) => {
      if (!byDay[block.day_of_week]) {
        byDay[block.day_of_week] = [];
      }
      byDay[block.day_of_week].push({ ...block, id: block.id || `temp-${index}` });
    });
    return byDay;
  };

  if (loading && scheduleBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading schedule...</span>
      </div>
    );
  }

  const schedulesByDay = getSchedulesByDay();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-blue-900 mb-2">Quick Setup</h3>
        <p className="text-sm text-blue-800 mb-3">
          Set up a standard Monday-Friday schedule with one click
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => applyToAllWeekdays({
            day_of_week: 1,
            start_time: '09:00',
            end_time: '17:00',
            is_available: true,
            schedule_type: 'working_hours',
            notes: 'Standard business hours'
          })}
          className="text-sm"
        >
          Add Mon-Fri 9 AM - 5 PM
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Blocks</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={addScheduleBlock}
            className="text-sm"
          >
            Add Time Block
          </Button>
        </div>

        {DAYS.map((dayName, dayIndex) => {
          const dayBlocks = schedulesByDay[dayIndex] || [];

          if (dayBlocks.length === 0) return null;

          return (
            <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">{dayName}</h4>
              <div className="space-y-3">
                {dayBlocks.map((block) => {
                  const blockIndex = scheduleBlocks.findIndex(b =>
                    (b.id && b.id === block.id) ||
                    (!b.id && b.day_of_week === block.day_of_week && b.start_time === block.start_time)
                  );

                  return (
                    <div key={block.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded">
                      <div className="col-span-2">
                        <select
                          value={block.schedule_type}
                          onChange={(e) => updateScheduleBlock(blockIndex, 'schedule_type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        >
                          {SCHEDULE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="time"
                          value={block.start_time}
                          onChange={(e) => updateScheduleBlock(blockIndex, 'start_time', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="time"
                          value={block.end_time}
                          onChange={(e) => updateScheduleBlock(blockIndex, 'end_time', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-2 flex items-center">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={block.is_available}
                            onChange={(e) => updateScheduleBlock(blockIndex, 'is_available', e.target.checked)}
                            className="mr-2"
                          />
                          Available
                        </label>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={block.notes || ''}
                          onChange={(e) => updateScheduleBlock(blockIndex, 'notes', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeScheduleBlock(blockIndex)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {scheduleBlocks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No schedule blocks configured yet.</p>
            <p className="text-sm mt-2">Click "Add Time Block" or use Quick Setup to get started.</p>
          </div>
        )}
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
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
        >
          Save Schedule
        </Button>
      </div>
    </form>
  );
};

export default ProviderScheduleForm;
