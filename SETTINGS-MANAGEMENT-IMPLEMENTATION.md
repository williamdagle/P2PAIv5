# Settings Management System Implementation

## Overview
Implemented a comprehensive settings management system with three levels of configuration: system-wide, clinic-specific, and module/feature toggles.

## What Was Implemented

### 1. Database Schema
**Migration File**: `supabase/migrations/create_comprehensive_settings_system.sql`

#### System Settings Table (Singleton)
A new `system_settings` table containing system-wide defaults:
- **Appointment Settings**: Default duration, buffer time, advance booking limits, double booking
- **Business Hours**: Default weekly schedule for new clinics
- **Security**: Session timeouts, password requirements, login attempt limits
- **Notifications**: Email/SMS settings, reminder timing, confirmation settings
- **Data Retention**: Audit log and patient record retention policies (HIPAA compliant)
- **System Features**: Patient portal, telemedicine, lab integrations, billing

#### Clinic Settings (JSONB Columns on Clinics Table)
Extended the existing `clinics` table with two new JSONB columns:

**clinic_settings**: Clinic-specific configuration
- Business hours (overrides system defaults)
- Holiday calendar
- Timezone settings
- Fee schedule (currency, tax rate)
- Appointment preferences
- Notification preferences
- Billing settings

**feature_flags**: Per-clinic module toggles
- Patient portal
- Telemedicine
- Lab integration
- E-prescribing
- Secure messaging
- Document management
- Billing module
- Functional medicine
- Aesthetics
- Inventory management

### 2. User Interface

#### SystemSettings Page (`src/pages/SystemSettings.tsx`)
Comprehensive admin interface with 5 tabs:
1. **Appointments**: Default durations, buffers, booking limits
2. **Security**: Password policies, session management, login controls
3. **Notifications**: Email/SMS settings, reminder configuration
4. **Data Retention**: HIPAA-compliant retention policies
5. **Features**: System-wide feature toggles

**Access Control**: System Admin only

#### ClinicSettings Page (`src/pages/ClinicSettings.tsx`)
Clinic-specific configuration interface with 4 tabs:
1. **Business Hours**: Weekly schedule with timezone selection
2. **Appointments**: Insurance verification, online booking, auto-confirmation
3. **Billing**: Currency, tax rates, payment terms, payment methods
4. **Features**: Per-clinic module toggles

**Access Control**: System Admin and Clinic Admin

### 3. Navigation
Updated `src/components/Sidebar.tsx` to add:
- System Settings (Administration section)
- Clinic Settings (Administration section)
- Provider Schedules (moved to Administration for consistency)

### 4. Routing
Updated `src/App.tsx` to add routes for:
- SystemSettings
- ClinicSettings
- ProviderScheduleManagement

### 5. Edge Functions

#### get_system_settings
- **Path**: `supabase/functions/get_system_settings/index.ts`
- **Method**: GET
- **Access**: System Admin only
- **Returns**: Singleton system settings row

#### update_system_settings
- **Path**: `supabase/functions/update_system_settings/index.ts`
- **Method**: PUT
- **Access**: System Admin only
- **Features**:
  - Role verification
  - Audit trail (updated_by, updated_at)
  - Comprehensive error handling

#### Existing Functions Used
- `get_clinics`: Used to fetch clinic settings
- `update_clinics`: Extended to support updating clinic_settings and feature_flags

### 6. Helper Functions
Created two database functions:
- `get_clinic_business_hours(clinic_id)`: Returns effective hours with system defaults fallback
- `is_feature_enabled(clinic_id, feature_name)`: Checks if a feature is enabled for a clinic

### 7. Security & Compliance

#### Row Level Security (RLS)
- System settings: System Admin read/update only
- Clinic settings: Inherited from existing clinics RLS policies

#### Audit Trail
- Automatic logging of system settings changes
- Tracks user, timestamp, and change details
- Stored in existing audit_logs table

#### HIPAA Compliance
- Minimum retention periods enforced via database constraints
- Audit log: 365 days minimum
- Patient records: 7 years minimum

### 8. Data Migration
- Migrated existing `aesthetics_module_enabled` values to new `feature_flags.aesthetics`
- Initialized all clinics with default settings and feature flags
- Created singleton system settings row with sensible defaults

## Usage

### For System Administrators
1. Navigate to **Administration** → **System Settings**
2. Configure system-wide defaults across 5 categories
3. Changes apply immediately to all new clinics and as defaults

### For Clinic Administrators
1. Navigate to **Administration** → **Clinic Settings**
2. Override system defaults for your specific clinic
3. Enable/disable features specific to your clinic's needs
4. Configure business hours, billing, and appointment preferences

### For Developers
Access settings programmatically:
```typescript
// Get effective business hours (with fallback to system defaults)
const hours = await supabase.rpc('get_clinic_business_hours', {
  p_clinic_id: clinicId
});

// Check if feature is enabled
const enabled = await supabase.rpc('is_feature_enabled', {
  p_clinic_id: clinicId,
  p_feature_name: 'telemedicine'
});
```

## Configuration Options

### System Settings
| Category | Setting | Default | Range/Options |
|----------|---------|---------|---------------|
| Appointments | Default Duration | 60 min | 5-480 min |
| Appointments | Buffer Time | 0 min | 0-60 min |
| Appointments | Max Advance Booking | 90 days | 1-365 days |
| Security | Session Timeout | 480 min | 15-1440 min |
| Security | Password Min Length | 8 chars | 8-32 chars |
| Security | Max Login Attempts | 5 | 3-10 |
| Notifications | Reminder Hours Before | 24 | 1-168 |
| Data | Audit Log Retention | 2555 days | ≥365 days |
| Data | Patient Record Retention | 7 years | ≥7 years |

### Clinic Feature Flags
- Patient Portal
- Telemedicine
- Lab Integration
- E-Prescribing
- Secure Messaging
- Document Management
- Billing Module
- Functional Medicine
- Aesthetics
- Inventory Management

## Technical Details

### Database Schema
```sql
-- System Settings (Singleton)
CREATE TABLE system_settings (
    id uuid PRIMARY KEY CHECK (id = '00000000-0000-0000-0000-000000000000'),
    default_appointment_duration_minutes integer DEFAULT 60,
    -- ... (30+ configuration fields)
);

-- Clinic Settings (JSONB on existing clinics table)
ALTER TABLE clinics
ADD COLUMN clinic_settings jsonb,
ADD COLUMN feature_flags jsonb;
```

### Performance
- GIN indexes on JSONB columns for fast querying
- Singleton pattern for system settings (no joins needed)
- Helper functions use SECURITY DEFINER for efficient RLS

### Error Handling
- Comprehensive validation via database constraints
- User-friendly error messages in UI
- Graceful fallbacks to system defaults

## Future Enhancements
Potential additions:
1. User-level personal preferences (theme, dashboard layout)
2. Email template customization
3. Custom field definitions per clinic
4. Advanced scheduling rules
5. Multi-language support configuration
6. Integration settings for third-party services
7. Automated backup configuration
8. Custom report templates

## Testing Checklist
- [ ] System Admin can access System Settings
- [ ] Non-admins cannot access System Settings
- [ ] System Admin and Clinic Admin can access Clinic Settings
- [ ] Regular users cannot access Clinic Settings
- [ ] Settings save successfully
- [ ] Settings persist after page refresh
- [ ] Validation works for all numeric fields
- [ ] Feature toggles update immediately
- [ ] Audit trail captures all changes
- [ ] Helper functions return correct values
- [ ] Business hours display correctly by day
- [ ] Edge functions deploy successfully
- [ ] RLS policies enforce correct access

## Deployment Notes
1. Run the migration to create new tables and columns
2. Deploy the two new edge functions:
   - get_system_settings
   - update_system_settings
3. Existing edge functions (get_clinics, update_clinics) work with new JSONB columns
4. No downtime required - additive changes only
5. Existing data preserved and migrated

## Files Created/Modified

### New Files
- `src/pages/SystemSettings.tsx`
- `src/pages/ClinicSettings.tsx`
- `supabase/migrations/create_comprehensive_settings_system.sql`
- `supabase/functions/get_system_settings/index.ts`
- `supabase/functions/update_system_settings/index.ts`
- `SETTINGS-MANAGEMENT-IMPLEMENTATION.md`

### Modified Files
- `src/components/Sidebar.tsx` (added navigation items)
- `src/App.tsx` (added routes)

## Success Criteria
✅ System-wide configuration management
✅ Clinic-specific settings with overrides
✅ Module/feature toggle system
✅ Role-based access control
✅ Audit trail for changes
✅ HIPAA-compliant retention policies
✅ User-friendly interface
✅ Comprehensive validation
✅ Helper functions for programmatic access
✅ Build succeeds without errors
