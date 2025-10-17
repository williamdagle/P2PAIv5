interface AuditLogParams {
  event_type: 'authentication' | 'data_access' | 'data_modification' | 'security' | 'system';
  event_action: string;
  resource_type?: string;
  resource_id?: string;
  phi_accessed?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  request_metadata?: Record<string, any>;
  user_id?: string;
  clinic_id?: string;
  session_id?: string;
}

interface SessionActivityParams {
  session_id: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private accessToken: string | null = null;
  private clinicId: string | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  setCredentials(accessToken: string, clinicId: string, userId: string, sessionId: string) {
    this.accessToken = accessToken;
    this.clinicId = clinicId;
    this.userId = userId;
    this.sessionId = sessionId;
  }

  clearCredentials() {
    this.accessToken = null;
    this.clinicId = null;
    this.userId = null;
    this.sessionId = null;
  }

  async logAuditEvent(params: AuditLogParams): Promise<void> {
    if (!this.accessToken) {
      console.debug('Cannot log audit event: no access token');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_audit_event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            user_id: params.user_id || this.userId,
            clinic_id: params.clinic_id || this.clinicId,
            session_id: params.session_id || this.sessionId,
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
      // Audit logging failures are non-blocking - log silently and continue
      console.debug('Failed to log audit event (non-critical):', error);
    }
  }

  async logDataAccess(
    resourceType: string,
    resourceId: string | undefined,
    action: string = 'view',
    phiAccessed: boolean = true
  ): Promise<void> {
    await this.logAuditEvent({
      event_type: 'data_access',
      event_action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      phi_accessed: phiAccessed,
      severity: phiAccessed ? 'medium' : 'low'
    });
  }

  async logDataModification(
    resourceType: string,
    resourceId: string | undefined,
    action: 'create' | 'update' | 'delete',
    phiAccessed: boolean = true
  ): Promise<void> {
    await this.logAuditEvent({
      event_type: 'data_modification',
      event_action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      phi_accessed: phiAccessed,
      severity: phiAccessed ? 'medium' : 'low'
    });
  }

  async logSessionActivity(): Promise<void> {
    if (!this.accessToken || !this.sessionId) {
      return;
    }

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            action: 'activity',
            session_id: this.sessionId
          })
        }
      );
    } catch (error) {
      console.debug('Failed to log session activity (non-critical):', error);
    }
  }

  async endSession(logoutReason: 'user_initiated' | 'timeout' | 'forced' | 'concurrent_session' | 'security_policy' | 'system' = 'user_initiated'): Promise<void> {
    if (!this.accessToken || !this.sessionId) {
      return;
    }

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log_user_session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            action: 'end',
            session_id: this.sessionId,
            logout_reason: logoutReason
          })
        }
      );
    } catch (error) {
      console.debug('Failed to end session (non-critical):', error);
    }
  }
}

export const auditLogger = AuditLogger.getInstance();
