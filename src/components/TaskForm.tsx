import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import Button from './Button';
import FormField from './FormField';

interface TaskFormProps {
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'new' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: '',
    patient_id: '',
    assigned_to: '',
    assigned_to_role: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const { apiCall, loading } = useApi();
  const { globals } = useGlobal();

  useEffect(() => {
    const loadPatients = async () => {
      setPatientsLoading(true);
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_patients`,
          { method: 'GET' }
        );
        if (response.patients) {
          setPatients(response.patients);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setPatientsLoading(false);
      }
    };

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await apiCall<any>(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_users`,
          { method: 'GET' }
        );
        if (response.users) {
          setUsers(response.users);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    loadPatients();
    loadUsers();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'new',
        priority: task.priority || 'medium',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        patient_id: task.patient_id || '',
        assigned_to: task.assigned_to || '',
        assigned_to_role: task.assigned_to_role || ''
      });
    } else if (globals.selected_patient_id && !formData.patient_id) {
      setFormData(prev => ({ ...prev, patient_id: globals.selected_patient_id }));
    }
  }, [task, globals.selected_patient_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.status) newErrors.status = 'Status is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const taskData = {
        ...formData,
        patient_id: formData.patient_id || null,
        assigned_to: formData.assigned_to || null,
        assigned_to_role: formData.assigned_to_role || null,
        due_date: formData.due_date || null
      };

      if (task) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_tasks`,
          {
            method: 'PUT',
            body: {
              ...taskData,
              id: task.id
            }
          }
        );
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_tasks`,
          {
            method: 'POST',
            body: taskData
          }
        );
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save task. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (patientsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Title" error={errors.title} required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter task title"
        />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter task description"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Priority" error={errors.priority} required>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </FormField>

        <FormField label="Status" error={errors.status} required>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="deferred">Deferred</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </FormField>
      </div>

      <FormField label="Due Date" error={errors.due_date}>
        <input
          type="datetime-local"
          value={formData.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Patient" error={errors.patient_id}>
        <select
          value={formData.patient_id}
          onChange={(e) => handleChange('patient_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No patient (clinic-wide task)</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.first_name} {patient.last_name} - DOB: {new Date(patient.dob).toLocaleDateString()}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Assign To" error={errors.assigned_to}>
        <select
          value={formData.assigned_to}
          onChange={(e) => handleChange('assigned_to', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.role})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Assign To Role (Optional)" error={errors.assigned_to_role}>
        <input
          type="text"
          value={formData.assigned_to_role}
          onChange={(e) => handleChange('assigned_to_role', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Provider, Admin, Nurse"
        />
      </FormField>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
