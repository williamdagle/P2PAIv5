import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

// Legacy hook - use useApiWithCircuitBreaker for new components
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { globals, clearGlobals } = useGlobal();

  const apiCall = async <T>(
    url: string,
    options: RequestInit & { body?: any } = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(options.headers || {}),
      };

      // For migration endpoints, we need to use service role or handle auth differently
      if (globals.access_token) {
        headers['Authorization'] = `Bearer ${globals.access_token}`;
      }

      // For migration endpoints, always add the anon key
      if (url.includes('/migrate_users') || url.includes('/reset_user_password')) {
        // Add Authorization header with anon key for migration endpoints
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      
      if (response.status === 401) {
        // Don't auto-logout for migration endpoints
        if (!url.includes('/migrate_users') && !url.includes('/reset_user_password')) {
          await supabase.auth.signOut();
          clearGlobals();
          window.location.reload();
          throw new Error('Authentication expired. Please sign in again.');
        } else {
          const errorText = await response.text();
          throw new Error(`Migration failed: ${errorText || 'Unauthorized'}`);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const jsonResponse = await response.json();

      // Log audit event for data operations (non-blocking)
      logAuditForOperation(url, options.method || 'GET', jsonResponse).catch(err => {
        console.debug('Audit logging failed (non-critical):', err);
      });

      return jsonResponse as T;
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logAuditForOperation = async (url: string, method: string, response: any) => {
    try {
      const endpoint = url.split('/functions/v1/')[1]?.split('?')[0] || '';

      // Skip audit logging endpoints and migration endpoints
      if (endpoint.includes('log_audit') || endpoint.includes('log_authentication') ||
          endpoint.includes('log_user_session') || endpoint.includes('migrate_users') ||
          endpoint.includes('reset_user_password')) {
        return;
      }

      // Determine resource type from endpoint
      const resourceTypeMap: Record<string, string> = {
        'get_patients': 'patients',
        'create_patients': 'patients',
        'update_patients': 'patients',
        'get_clinical_notes': 'clinical_notes',
        'create_clinical_notes': 'clinical_notes',
        'update_clinical_notes': 'clinical_notes',
        'delete_clinical_notes': 'clinical_notes',
        'get_labs': 'labs',
        'create_labs': 'labs',
        'delete_labs': 'labs',
        'get_medications': 'medications',
        'create_medications': 'medications',
        'delete_medications': 'medications',
        'get_supplements': 'supplements',
        'create_supplements': 'supplements',
        'delete_supplements': 'supplements',
        'get_treatment_plans': 'treatment_plans',
        'create_treatment_plans': 'treatment_plans',
        'get_timeline_events': 'timeline_events',
        'create_timeline_events': 'timeline_events',
        'update_timeline_events': 'timeline_events',
        'delete_timeline_events': 'timeline_events',
        'get_appointments': 'appointments',
        'create_appointments': 'appointments',
        'update_appointments': 'appointments',
        'delete_appointments': 'appointments'
      };

      const resourceType = resourceTypeMap[endpoint];
      if (!resourceType) {
        return;
      }

      const phiResources = ['patients', 'clinical_notes', 'labs', 'medications', 'supplements', 'treatment_plans', 'timeline_events', 'appointments'];
      const phiAccessed = phiResources.includes(resourceType);

      let action = 'view';
      if (method === 'POST') {
        action = 'create';
      } else if (method === 'PUT' || method === 'PATCH') {
        action = 'update';
      } else if (method === 'DELETE') {
        action = 'delete';
      }

      let resourceId: string | undefined;
      if (response && typeof response === 'object') {
        if (Array.isArray(response) && response.length > 0 && response[0].id) {
          resourceId = response[0].id;
        } else if (response.id) {
          resourceId = response.id;
        } else if (response.data && response.data.id) {
          resourceId = response.data.id;
        }
      }

      if (action === 'create' || action === 'update' || action === 'delete') {
        await auditLogger.logDataModification(
          resourceType,
          resourceId,
          action as 'create' | 'update' | 'delete',
          phiAccessed
        );
      } else {
        await auditLogger.logDataAccess(
          resourceType,
          resourceId,
          action,
          phiAccessed
        );
      }
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  };

  const apiCallLegacy = async <T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/${endpoint}`;

    const options: RequestInit & { body?: any } = {
      method,
      body: body || undefined
    };

    return apiCall<T>(url, options);
  };

  return { apiCall, apiCallLegacy, loading, error };
}