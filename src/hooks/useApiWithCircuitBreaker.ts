import { useState, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';
import { auditLogger } from '../utils/auditLogger';

interface CircuitBreakerState {
  [key: string]: {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  };
}

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT = 30000; // 30 seconds

export function useApiWithCircuitBreaker() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState>({});
  const { globals, clearGlobals } = useGlobal();

  const isCircuitOpen = useCallback((endpoint: string): boolean => {
    const breaker = circuitBreakers[endpoint];
    if (!breaker) return false;
    
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure > RESET_TIMEOUT) {
        // Reset circuit breaker
        setCircuitBreakers(prev => ({
          ...prev,
          [endpoint]: { ...breaker, isOpen: false, failures: 0 }
        }));
        return false;
      }
      return true;
    }
    
    return false;
  }, [circuitBreakers]);

  const recordFailure = useCallback((endpoint: string) => {
    setCircuitBreakers(prev => {
      const current = prev[endpoint] || { failures: 0, lastFailure: 0, isOpen: false };
      const newFailures = current.failures + 1;
      const shouldOpen = newFailures >= FAILURE_THRESHOLD;
      
      return {
        ...prev,
        [endpoint]: {
          failures: newFailures,
          lastFailure: Date.now(),
          isOpen: shouldOpen
        }
      };
    });
  }, []);

  const recordSuccess = useCallback((endpoint: string) => {
    setCircuitBreakers(prev => ({
      ...prev,
      [endpoint]: { failures: 0, lastFailure: 0, isOpen: false }
    }));
  }, []);

  const apiCall = async <T>(
    url: string,
    options: RequestInit & { body?: any } = {}
  ): Promise<T> => {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid API URL provided');
    }

    const endpoint = url.split('/functions/v1/')[1]?.split('?')[0] || url;

    console.log('🌐 Making API call to:', url);
    console.log('🔧 Request options:', {
      method: options.method || 'GET',
      hasAuth: !!globals.access_token,
      hasBody: !!options.body
    });
    
    // Check circuit breaker
    if (isCircuitOpen(endpoint)) {
      console.log('⚡ Circuit breaker is open for:', endpoint);
      throw new Error(`Service temporarily unavailable. Please try again in 30 seconds.`);
    }

    setLoading(true);
    setError(null);
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      if (globals.access_token) {
        headers['Authorization'] = `Bearer ${globals.access_token}`;
        console.log('🔑 Added auth header with token:', globals.access_token.substring(0, 20) + '...');
      }
      
      // For migration endpoints
      if (url.includes('/migrate_users') || url.includes('/reset_user_password')) {
        headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
        console.log('🔧 Using migration endpoint auth');
      }
      
      console.log('📡 Making fetch request...');
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      
      console.log('📨 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.status === 401) {
        console.log('🚫 Unauthorized response - signing out');
        if (!url.includes('/migrate_users') && !url.includes('/reset_user_password')) {
          await supabase.auth.signOut();
          clearGlobals();
          window.location.reload();
          throw new Error('Authentication expired. Please sign in again.');
        } else {
          const errorText = await response.text();
          console.log('❌ Migration auth error:', errorText);
          throw new Error(`Migration failed: ${errorText || 'Unauthorized'}`);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ HTTP error response:', errorText);
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let jsonResponse;
      try {
        console.log('📋 Parsing JSON response...');
        jsonResponse = await response.json();
        console.log('✅ JSON parsed successfully:', typeof jsonResponse);
        console.log('📊 Response preview:', JSON.stringify(jsonResponse).substring(0, 200) + '...');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate that we got a proper response
      if (jsonResponse === null || jsonResponse === undefined) {
        console.log('❌ Empty response received');
        throw new Error('Empty response from server');
      }
      
      console.log('✅ API call successful for:', endpoint);
      recordSuccess(endpoint);

      // Log audit event for data operations
      await logAuditForOperation(url, options.method || 'GET', jsonResponse);

      return jsonResponse as T;
      
    } catch (err: any) {
      console.error(`API call failed for ${endpoint}:`, err);
      console.log('🔍 Error type:', err.constructor.name);
      console.log('🔍 Error message:', err.message);
      recordFailure(endpoint);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreaker = useCallback((endpoint: string) => {
    setCircuitBreakers(prev => ({
      ...prev,
      [endpoint]: { failures: 0, lastFailure: 0, isOpen: false }
    }));
  }, []);

  const getCircuitBreakerStatus = useCallback((endpoint: string) => {
    return circuitBreakers[endpoint] || { failures: 0, lastFailure: 0, isOpen: false };
  }, [circuitBreakers]);

  const logAuditForOperation = async (url: string, method: string, response: any) => {
    try {
      const endpoint = url.split('/functions/v1/')[1]?.split('?')[0] || '';

      // Skip audit logging endpoints to avoid infinite loops
      if (endpoint.includes('log_audit') || endpoint.includes('log_authentication') || endpoint.includes('log_user_session')) {
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
        return; // Skip non-PHI endpoints
      }

      // Determine if PHI was accessed (all patient-related data is PHI)
      const phiResources = ['patients', 'clinical_notes', 'labs', 'medications', 'supplements', 'treatment_plans', 'timeline_events', 'appointments'];
      const phiAccessed = phiResources.includes(resourceType);

      // Determine action and event type
      let eventType: 'data_access' | 'data_modification' = 'data_access';
      let action = 'view';

      if (method === 'POST') {
        eventType = 'data_modification';
        action = 'create';
      } else if (method === 'PUT' || method === 'PATCH') {
        eventType = 'data_modification';
        action = 'update';
      } else if (method === 'DELETE') {
        eventType = 'data_modification';
        action = 'delete';
      }

      // Extract resource ID from response if available
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

      // Log the audit event
      if (eventType === 'data_modification') {
        await auditLogger.logDataModification(
          resourceType,
          resourceId || 'unknown',
          action as 'create' | 'update' | 'delete',
          phiAccessed
        );
      } else {
        await auditLogger.logDataAccess(
          resourceType,
          resourceId || 'batch',
          action,
          phiAccessed
        );
      }
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  };

  return { 
    apiCall, 
    loading, 
    error, 
    resetCircuitBreaker, 
    getCircuitBreakerStatus,
    isCircuitOpen: (endpoint: string) => isCircuitOpen(endpoint)
  };
}