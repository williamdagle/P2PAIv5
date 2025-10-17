import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGlobal } from '../context/GlobalContext';
import Button from './Button';
import FormField from './FormField';

interface UserFormProps {
  user?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: '',
    clinic_id: '',
    password: ''
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiCall, loading, error } = useApi();
  const { globals } = useGlobal();

  useEffect(() => {
    const fetchRolesAndClinics = async () => {
      try {
        const [rolesResponse, clinicsResponse] = await Promise.all([
          apiCall<any>(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_roles`,
            { method: 'GET' }
          ),
          apiCall<any>(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_clinics`,
            { method: 'GET' }
          )
        ]);

        if (rolesResponse?.roles) {
          setRoles(rolesResponse.roles);
        }

        if (Array.isArray(clinicsResponse)) {
          setClinics(clinicsResponse);
        }
      } catch (err) {
        console.error('Failed to fetch roles and clinics:', err);
      }
    };

    fetchRolesAndClinics();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role_id: user.role_id || '',
        clinic_id: user.clinic_id || '',
        password: ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        clinic_id: globals.clinic_id
      }));
    }
  }, [user, globals.clinic_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.role_id) newErrors.role_id = 'Role is required';
    if (!formData.clinic_id) newErrors.clinic_id = 'Clinic is required';
    if (!user && !formData.password) newErrors.password = 'Password is required for new users';
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const userData: any = {
        email: formData.email,
        full_name: formData.full_name,
        role_id: formData.role_id,
        clinic_id: formData.clinic_id
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (user) {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_users?id=${user.id}`,
          {
            method: 'PUT',
            body: userData
          }
        );
      } else {
        await apiCall(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_users`,
          {
            method: 'POST',
            body: userData
          }
        );
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: 'Failed to save user. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Email" error={errors.email} required>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="user@example.com"
          disabled={!!user}
        />
        {user && (
          <p className="text-sm text-gray-500 mt-1">Email cannot be changed for existing users</p>
        )}
      </FormField>

      <FormField label="Full Name" error={errors.full_name} required>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Doe"
        />
      </FormField>

      <FormField label="Role" error={errors.role_id} required>
        <select
          value={formData.role_id}
          onChange={(e) => handleChange('role_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Clinic" error={errors.clinic_id} required>
        <select
          value={formData.clinic_id}
          onChange={(e) => handleChange('clinic_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a clinic</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={user ? "New Password (leave blank to keep current)" : "Password"}
        error={errors.password}
        required={!user}
      >
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={user ? "Enter new password to change" : "Enter password"}
          minLength={6}
        />
        <p className="text-sm text-gray-500 mt-1">Minimum 6 characters</p>
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
        <Button type="submit" loading={loading}>
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
