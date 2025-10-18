import { supabase } from '../lib/supabase';

interface AuditLogParams {
  event_type: 'authentication' | 'data_access' | 'data_modification' | 'security' | 'system';
  event_action: string;
  resource_type?: string;
  resource_id?: string;
  phi_accessed?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  request_metadata?: Record<string, unknown>;
  user_id: string;
  clinic_id: string;
  session_id: string;
}

async function getSessionCredentials() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    accessToken: session?.access_token || null,
    sessionId: session?.user?.id || null,
  };
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const { accessToken } = await getSessionCredentials();

    if (!accessToken) {
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_audit_event`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          user_id: params.user_id,
          clinic_id: params.clinic_id,
          session_id: params.session_id,
          event_type: params.event_type,
          event_action: params.event_action,
          resource_type: params.resource_type,
          resource_id: params.resource_id,
          phi_accessed: params.phi_accessed || false,
          severity: params.severity || 'low',
          ip_address: null,
          user_agent: navigator.userAgent,
          request_metadata: params.request_metadata || {}
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.debug('Audit logging failed (non-critical):', errorData);
    }
  } catch (error) {
    console.debug('Failed to log audit event (non-critical):', error);
  }
}

export async function logDataAccess(
  resourceType: string,
  resourceId: string | undefined,
  userId: string,
  clinicId: string,
  sessionId: string,
  action: string = 'view',
  phiAccessed: boolean = true
): Promise<void> {
  await logAuditEvent({
    event_type: 'data_access',
    event_action: action,
    resource_type: resourceType,
    resource_id: resourceId,
    phi_accessed: phiAccessed,
    severity: phiAccessed ? 'medium' : 'low',
    user_id: userId,
    clinic_id: clinicId,
    session_id: sessionId
  });
}

export async function logDataModification(
  resourceType: string,
  resourceId: string | undefined,
  userId: string,
  clinicId: string,
  sessionId: string,
  action: 'create' | 'update' | 'delete',
  phiAccessed: boolean = true
): Promise<void> {
  await logAuditEvent({
    event_type: 'data_modification',
    event_action: action,
    resource_type: resourceType,
    resource_id: resourceId,
    phi_accessed: phiAccessed,
    severity: phiAccessed ? 'medium' : 'low',
    user_id: userId,
    clinic_id: clinicId,
    session_id: sessionId
  });
}

export async function logSessionActivity(
  sessionId: string,
  userId: string,
  clinicId: string
): Promise<void> {
  try {
    const { accessToken } = await getSessionCredentials();

    if (!accessToken) {
      return;
    }

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'activity',
          session_id: sessionId,
          user_id: userId,
          clinic_id: clinicId
        })
      }
    );
  } catch (error) {
    console.debug('Failed to log session activity (non-critical):', error);
  }
}

export async function endSession(
  sessionId: string,
  userId: string,
  clinicId: string,
  logoutReason: 'user_initiated' | 'timeout' | 'forced' | 'concurrent_session' | 'security_policy' | 'system' = 'user_initiated'
): Promise<void> {
  try {
    const { accessToken } = await getSessionCredentials();

    if (!accessToken) {
      return;
    }

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'end',
          session_id: sessionId,
          user_id: userId,
          clinic_id: clinicId,
          logout_reason: logoutReason
        })
      }
    );
  } catch (error) {
    console.debug('Failed to end session (non-critical):', error);
  }
}
