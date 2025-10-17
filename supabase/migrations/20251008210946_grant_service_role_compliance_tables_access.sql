/*
  # Grant service_role access to compliance tables

  1. Changes
    - Grant ALL privileges to service_role on all compliance-related tables
    - This allows edge functions using service_role key to bypass RLS
    
  2. Security
    - Service role is only used by backend edge functions
    - RLS policies still protect frontend access via authenticated role
*/

-- Grant service_role full access to compliance tables
GRANT ALL ON compliance_reports TO service_role;
GRANT ALL ON compliance_monitoring TO service_role;
GRANT ALL ON risk_assessments TO service_role;
GRANT ALL ON risk_mitigation_actions TO service_role;
GRANT ALL ON vulnerability_scans TO service_role;
GRANT ALL ON security_controls TO service_role;

-- Also grant access to other HIPAA compliance tables
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON authentication_events TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON user_training_records TO service_role;
GRANT ALL ON policy_acknowledgments TO service_role;
GRANT ALL ON incident_response_plans TO service_role;
GRANT ALL ON breach_notifications TO service_role;
GRANT ALL ON data_retention_policies TO service_role;