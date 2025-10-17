export interface GlobalState {
  access_token: string;
  user_id: string;
  clinic_id: string;
  selected_patient_id: string;
  selected_patient_name: string;
  pending_appointment_edit?: Appointment;
  aesthetics_module_enabled?: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  appointment_time?: string;
  duration?: number;
  reason: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  patient_name?: string;
  provider_name?: string;
}

export interface TreatmentPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  title: string;
  description: string;
  status: string;
  start_date?: string;
  end_date?: string;
  goals?: string;
  interventions?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: string;
  clinic_id: string;
  patient_id: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  severity: string;
  created_at?: string;
  updated_at?: string;
}

export interface Lab {
  id: string;
  clinic_id: string;
  patient_id: string;
  lab_name: string;
  test_type: string;
  result: string;
  result_date: string;
  ordered_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Medication {
  id: string;
  clinic_id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescriber?: string;
  pharmacy?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Supplement {
  id: string;
  clinic_id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  brand?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'system_admin' | 'clinic_admin' | 'provider' | 'staff' | 'admissions_advisor';

export interface User {
  id: string;
  clinic_id: string;
  auth_user_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  specialty?: string;
  license_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Clinic {
  id: string;
  organization_id?: string;
  name: string;
  clinic_type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  aesthetics_module_enabled?: boolean;
  aesthetics_features?: {
    pos?: boolean;
    memberships?: boolean;
    inventory?: boolean;
    ai_photo_analysis?: boolean;
    gift_cards?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface NoteCategory {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  category_name: string;
  description?: string;
  is_system_category?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NoteTemplate {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  user_id?: string;
  category_id?: string;
  template_name: string;
  template_content: string;
  is_personal?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicalNote {
  id: string;
  clinic_id: string;
  patient_id: string;
  provider_id: string;
  note_type: string;
  note_content: string;
  note_date: string;
  is_signed?: boolean;
  signed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'deferred' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  clinic_id: string;
  patient_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  assigned_to_role?: string;
  created_by: string;
  completed_at?: string;
  completed_by?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  assignee_name?: string;
  creator_name?: string;
}

export interface TaskComment {
  id: string;
  clinic_id: string;
  task_id: string;
  user_id: string;
  comment_text: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface TaskAttachment {
  id: string;
  clinic_id: string;
  task_id: string;
  attachment_type: 'lab_result' | 'medication' | 'supplement' | 'appointment' | 'clinical_note' | 'treatment_plan' | 'timeline_event' | 'document';
  reference_id: string;
  reference_table: string;
  reference_name?: string;
  created_by: string;
  created_at: string;
}

export interface TaskDependency {
  id: string;
  clinic_id: string;
  parent_task_id: string;
  dependent_task_id: string;
  dependency_type: 'blocks' | 'relates_to';
  created_at: string;
}

export interface TaskTemplateStructure {
  steps?: Array<{
    title: string;
    description?: string;
    required?: boolean;
  }>;
  checklist?: string[];
  default_description?: string;
}

export interface TaskTemplate {
  id: string;
  clinic_id: string;
  organization_id?: string;
  template_name: string;
  template_type: 'lab_review' | 'follow_up' | 'medication_refill' | 'documentation' | 'billing' | 'pre_op_checklist' | 'chronic_care' | 'discharge' | 'other';
  description?: string;
  structure: TaskTemplateStructure;
  default_priority: TaskPriority;
  default_assigned_role?: string;
  is_active: boolean;
  is_shared: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAuditValues {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  title?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface TaskAuditEntry {
  id: string;
  clinic_id: string;
  task_id: string;
  action_type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'reassigned' | 'completed' | 'deferred' | 'cancelled' | 'deleted' | 'comment_added' | 'attachment_added' | 'dependency_added';
  changed_by: string;
  old_values?: TaskAuditValues;
  new_values?: TaskAuditValues;
  change_reason?: string;
  created_at: string;
  user_name?: string;
}

export interface FormData {
  [key: string]: string | number | boolean | undefined | null;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface AestheticTreatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  provider_id: string;
  treatment_date: string;
  treatment_type: string;
  treatment_name: string;
  areas_treated: string[];
  products_used: Array<{
    product_name: string;
    quantity: number;
    batch_number?: string;
  }>;
  units_used?: number;
  volume_ml?: number;
  batch_numbers?: string[];
  technique_notes?: string;
  patient_tolerance?: string;
  immediate_response?: string;
  adverse_events?: string;
  follow_up_date?: string;
  treatment_outcome?: string;
  outcome_rating?: number;
  clinical_notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticPhoto {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_id?: string;
  photo_type: 'before' | 'after' | 'during' | 'consultation';
  photo_url: string;
  thumbnail_url?: string;
  view_angle?: string;
  body_area?: string;
  facial_grid_data?: Record<string, unknown>;
  annotations?: Array<{
    type: string;
    content: string;
    position: { x: number; y: number };
  }>;
  lighting_notes?: string;
  camera_settings?: Record<string, unknown>;
  consent_obtained: boolean;
  consent_date?: string;
  upload_date: string;
  uploaded_by?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface AestheticPhotoAIAnalysis {
  id: string;
  photo_id: string;
  analysis_version: string;
  facial_landmarks?: Record<string, { x: number; y: number }>;
  symmetry_score?: number;
  skin_texture_score?: number;
  skin_tone_analysis?: Record<string, unknown>;
  volume_assessment?: Record<string, string>;
  wrinkle_mapping?: Record<string, { severity: string; depth_mm: number }>;
  age_estimation?: number;
  skin_quality_score?: number;
  detected_concerns?: string[];
  treatment_recommendations?: string[];
  analysis_metadata?: Record<string, unknown>;
  processed_at: string;
  processing_duration_ms?: number;
  created_at?: string;
}

export interface AestheticConsentForm {
  id: string;
  clinic_id: string;
  patient_id: string;
  treatment_id?: string;
  form_type: string;
  form_title: string;
  form_content: Record<string, unknown>;
  consent_text: string;
  patient_signature_data: string;
  patient_signature_date: string;
  witness_signature_data?: string;
  witness_name?: string;
  witness_signature_date?: string;
  ip_address?: string;
  device_info?: string;
  consent_version: string;
  is_expired: boolean;
  expiration_date?: string;
  signed_pdf_url?: string;
  created_by?: string;
  created_at?: string;
}

export interface AestheticPackage {
  id: string;
  clinic_id: string;
  package_name: string;
  package_description?: string;
  treatment_types: string[];
  number_of_treatments: number;
  regular_price: number;
  package_price: number;
  savings_amount?: number;
  validity_days: number;
  is_active: boolean;
  terms_conditions?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticPackageRedemption {
  id: string;
  clinic_id: string;
  patient_id: string;
  package_id: string;
  purchase_date: string;
  expiration_date: string;
  total_treatments: number;
  treatments_remaining: number;
  treatments_used?: number;
  purchase_price: number;
  is_active: boolean;
  purchase_transaction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticInventory {
  id: string;
  clinic_id: string;
  product_category: 'injectable' | 'filler' | 'toxin' | 'skincare' | 'device_consumable' | 'retail' | 'other';
  product_name: string;
  product_brand?: string;
  sku?: string;
  description?: string;
  unit_size?: string;
  current_stock: number;
  reorder_point: number;
  unit_cost?: number;
  retail_price?: number;
  requires_lot_tracking: boolean;
  requires_expiration_tracking: boolean;
  is_active: boolean;
  supplier_name?: string;
  supplier_contact?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticInventoryTransaction {
  id: string;
  clinic_id: string;
  inventory_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'waste' | 'transfer' | 'return';
  quantity: number;
  lot_number?: string;
  expiration_date?: string;
  unit_cost?: number;
  total_cost?: number;
  related_treatment_id?: string;
  related_transaction_id?: string;
  reason?: string;
  notes?: string;
  performed_by?: string;
  transaction_date: string;
  created_at?: string;
}

export interface AestheticMembership {
  id: string;
  clinic_id: string;
  patient_id: string;
  membership_tier: string;
  membership_name: string;
  monthly_fee: number;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  discount_percentage: number;
  benefits?: Record<string, unknown>;
  credits_balance: number;
  stripe_subscription_id?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  cancellation_date?: string;
  cancellation_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticGiftCard {
  id: string;
  clinic_id: string;
  card_code: string;
  card_type: 'digital' | 'physical';
  original_amount: number;
  current_balance: number;
  amount_used?: number;
  purchaser_name?: string;
  purchaser_email?: string;
  recipient_name?: string;
  recipient_email?: string;
  patient_id?: string;
  purchase_date: string;
  expiration_date?: string;
  is_active: boolean;
  activation_date?: string;
  last_used_date?: string;
  purchase_transaction_id?: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticPOSTransaction {
  id: string;
  clinic_id: string;
  patient_id?: string;
  transaction_date: string;
  transaction_type: 'sale' | 'refund' | 'void';
  line_items: Array<{
    item_type: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_refund_id?: string;
  receipt_number: string;
  receipt_url?: string;
  notes?: string;
  processed_by?: string;
  refund_reason?: string;
  refunded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AestheticTreatmentTemplate {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  template_name: string;
  treatment_category: 'botox' | 'filler' | 'prp' | 'laser' | 'chemical_peel' | 'microneedling' | 'threads' | 'sclerotherapy' | 'other';
  template_description?: string;
  field_definitions: Record<string, unknown>;
  default_duration_minutes: number;
  requires_consent: boolean;
  requires_photos: boolean;
  post_treatment_instructions?: string;
  contraindications?: string[];
  is_active: boolean;
  is_system_template: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceType {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  name: string;
  description?: string;
  capacity_type: 'single' | 'multi';
  default_capacity: number;
  default_duration_minutes: number;
  default_buffer_minutes: number;
  booking_window_days: number;
  requires_approval: boolean;
  approval_roles?: string[];
  portal_visible: boolean;
  portal_bookable: boolean;
  attributes?: Record<string, unknown>;
  color_code?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Resource {
  id: string;
  clinic_id: string;
  resource_type_id: string;
  name: string;
  description?: string;
  location?: string;
  capacity_override?: number;
  booking_instructions?: string;
  internal_notes?: string;
  availability_schedule?: Record<string, unknown>;
  booking_rules?: Record<string, unknown>;
  provider_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceBooking {
  id: string;
  clinic_id: string;
  resource_id: string;
  patient_id?: string;
  booked_by_user_id?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  booking_source: 'staff' | 'patient_portal' | 'api';
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientGroup {
  id: string;
  clinic_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  group_type: 'support' | 'therapy' | 'education' | 'wellness' | 'other';
  state_restrictions?: string[];
  eligibility_criteria?: Record<string, unknown>;
  session_frequency?: string;
  session_duration_minutes?: number;
  resource_id?: string;
  provider_id?: string;
  max_members?: number;
  current_member_count?: number;
  status: 'forming' | 'active' | 'completed' | 'archived';
  start_date?: string;
  end_date?: string;
  portal_visible: boolean;
  allow_self_enrollment: boolean;
  requires_individual_session: boolean;
  group_materials?: unknown[];
  communication_settings?: Record<string, unknown>;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientGroupAssignment {
  id: string;
  clinic_id: string;
  patient_id: string;
  group_id: string;
  assignment_date: string;
  assigned_by?: string;
  status: 'active' | 'completed' | 'withdrawn' | 'removed';
  withdrawal_date?: string;
  withdrawal_reason?: string;
  individual_session_completed: boolean;
  individual_session_date?: string;
  sessions_attended?: number;
  last_attendance_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormDefinition {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  form_name: string;
  form_code: string;
  category: 'intake' | 'consent' | 'assessment' | 'survey' | 'other';
  description?: string;
  is_active: boolean;
  is_published: boolean;
  current_version_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormVersion {
  id: string;
  form_definition_id: string;
  version_number: number;
  version_name?: string;
  form_schema: Record<string, unknown>;
  state_codes?: string[];
  effective_date: string;
  expiration_date?: string;
  change_summary?: string;
  is_current: boolean;
  created_by?: string;
  created_at?: string;
}

export interface FormField {
  field_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'email' | 'phone' | 'date' | 'dropdown' | 'checkbox' | 'radio' | 'signature' | 'file_upload' | 'textarea' | 'number' | 'time';
  required: boolean;
  validation?: Record<string, unknown>;
  options?: Array<{ value: string; label: string }>;
  default_value?: unknown;
  placeholder?: string;
  help_text?: string;
  conditional_logic?: Record<string, unknown>;
}

export interface PatientFormAssignment {
  id: string;
  clinic_id: string;
  patient_id: string;
  form_definition_id: string;
  form_version_id: string;
  assigned_by?: string;
  assigned_date: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'expired' | 'waived';
  assignment_reason?: string;
  reminder_sent_count?: number;
  last_reminder_sent?: string;
  completed_at?: string;
  waived_by?: string;
  waived_reason?: string;
  created_at?: string;
}

export interface PatientFormSubmission {
  id: string;
  clinic_id: string;
  patient_id: string;
  form_assignment_id?: string;
  form_definition_id: string;
  form_version_id: string;
  form_responses: Record<string, unknown>;
  submission_source: 'patient_portal' | 'staff_assisted' | 'api';
  is_complete: boolean;
  is_partial_save: boolean;
  ip_address?: string;
  user_agent?: string;
  signature_data?: Record<string, unknown>;
  submitted_by_user_id?: string;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StateConfiguration {
  id: string;
  state_code: string;
  state_name: string;
  clinic_id?: string;
  organization_id?: string;
  legal_requirements?: unknown[];
  required_forms?: string[];
  validation_rules?: Record<string, unknown>;
  data_retention_days?: number;
  compliance_notes?: string;
  last_review_date?: string;
  next_review_date?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientStateHistory {
  id: string;
  clinic_id: string;
  patient_id: string;
  state_code: string;
  is_primary_state: boolean;
  effective_date: string;
  end_date?: string;
  change_reason?: string;
  detected_from: 'registration' | 'address_update' | 'manual';
  forms_triggered?: string[];
  recorded_by?: string;
  created_at?: string;
}

export interface ComplianceTracking {
  id: string;
  clinic_id: string;
  patient_id: string;
  compliance_type: 'form_completion' | 'consent' | 'documentation' | 'state_requirement';
  requirement_name: string;
  required_by_state?: string;
  status: 'compliant' | 'pending' | 'overdue' | 'non_compliant' | 'waived';
  due_date?: string;
  completed_date?: string;
  waived_by?: string;
  waived_reason?: string;
  related_form_assignment_id?: string;
  related_document_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PortalConfiguration {
  id: string;
  clinic_id?: string;
  organization_id?: string;
  config_key: string;
  config_category: 'forms' | 'resources' | 'groups' | 'notifications' | 'general';
  config_value: Record<string, unknown>;
  description?: string;
  is_active: boolean;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}