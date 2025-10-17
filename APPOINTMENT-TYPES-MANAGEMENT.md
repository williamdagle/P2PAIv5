# Appointment Types Management

## Overview
Built out complete UI for System Admin users to manage Appointment Types through the application interface. Previously, the database infrastructure existed but there was no user interface to manage appointment types.

## Features Implemented

### 1. ManageAppointmentTypes Page
**Location:** `src/pages/ManageAppointmentTypes.tsx`

A complete admin page for managing appointment types with:
- **Access Control**: Only System Admin users can access this page
- **Data Table**: Displays all appointment types for the current clinic
- **CRUD Operations**: Create, Read, Update, and Delete appointment types
- **Visual Indicators**: Color-coded badges for billable status and approval requirements
- **Search Functionality**: Search through appointment types by name
- **Responsive Design**: Works across desktop and mobile devices

**Features:**
- Color preview swatches showing the appointment type color
- Duration display in minutes
- Billable/Non-billable status badges
- Approval required indicators
- Edit and delete actions for each type
- Information panel explaining appointment type features

### 2. AppointmentTypeForm Component
**Location:** `src/components/AppointmentTypeForm.tsx`

A comprehensive form component for creating and editing appointment types:

**Form Fields:**
- **Name** (required): The display name of the appointment type
- **Description**: Detailed description of the appointment type
- **Color Code** (required): Visual color with both color picker and hex input
- **Default Duration** (required): Duration in minutes (5-480 minutes)
- **Is Billable**: Checkbox to mark if the appointment is billable
- **Max Free Sessions**: Number of free sessions allowed (0-100)
- **Requires Approval**: Checkbox to enable approval workflow
- **Approval Roles**: Multi-select checkboxes for roles that can approve (only shown if approval is required)

**Available Approval Roles:**
- System Admin
- Clinic Admin
- Provider
- Admissions Advisor

**Validation:**
- Name is required
- Duration must be between 5 and 480 minutes
- Max free sessions must be between 0 and 100
- At least one approval role required when approval is enabled
- Color code must be valid hex format

### 3. Edge Functions
Created four edge functions for appointment types CRUD operations:

#### get_appointment_types
**Location:** `supabase/functions/get_appointment_types/index.ts`
- Retrieves all appointment types for the user's clinic
- Returns sorted by name
- Enforces clinic-based data isolation

#### create_appointment_types
**Location:** `supabase/functions/create_appointment_types/index.ts`
- Creates new appointment types
- Requires System Admin role
- Automatically assigns to user's clinic
- Validates all required fields

#### update_appointment_types
**Location:** `supabase/functions/update_appointment_types/index.ts`
- Updates existing appointment types
- Requires System Admin role
- Only allows updating types within user's clinic
- Partial updates supported

#### delete_appointment_types
**Location:** `supabase/functions/delete_appointment_types/index.ts`
- Deletes appointment types
- Requires System Admin role
- Enforces clinic-based deletion restrictions
- Returns success message

**Common Security Features:**
- JWT authentication on all endpoints
- Role-based access control (System Admin only for modifications)
- Clinic-based data isolation
- Proper CORS headers for all requests
- Error handling with descriptive messages

## Navigation & Access

### Sidebar Menu
**Location:** `src/components/Sidebar.tsx`
- Added "Manage Appointment Types" to Administration section
- Uses CalendarDays icon
- Available in the clinical workflow tab
- Positioned after "Manage Templates"

### App Routing
**Location:** `src/App.tsx`
- Added import for ManageAppointmentTypes component
- Added case 'ManageAppointmentTypes' to route switch
- Integrated with existing navigation system

## Database Structure

The appointment types system uses the `appointment_types` table with the following structure:

```sql
appointment_types
├── id (uuid, primary key)
├── clinic_id (uuid, foreign key to clinics)
├── name (text, required)
├── description (text, optional)
├── color_code (text, default '#3B82F6')
├── default_duration_minutes (integer, default 60)
├── is_billable (boolean, default true)
├── requires_approval (boolean, default false)
├── max_free_sessions (integer, default 0)
├── approval_roles (text[], default system_admin, clinic_admin, provider, admissions_advisor)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Row Level Security (RLS):**
- All appointment types are scoped to clinic_id
- Only System Admins can create, update, or delete
- All authenticated users can view appointment types for their clinic

## User Workflow

### For System Administrators

1. **Access the Page**
   - Navigate to sidebar → Administration → Manage Appointment Types
   - System automatically checks user role

2. **View Appointment Types**
   - See all appointment types for your clinic in a sortable table
   - View color swatches, durations, and status indicators
   - Search for specific types using the search bar

3. **Create New Appointment Type**
   - Click "Add Appointment Type" button
   - Fill in required fields (name, color, duration)
   - Optionally configure:
     - Description
     - Billable status
     - Free session limits
     - Approval requirements
     - Approval roles
   - Click "Create" to save

4. **Edit Existing Type**
   - Click the edit icon on any appointment type row
   - Modify any fields in the form
   - Click "Update" to save changes

5. **Delete Appointment Type**
   - Click the delete icon on any appointment type row
   - Confirm deletion in the dialog
   - Type is permanently removed

### For Non-Admin Users
- Page displays access denied message
- Shows current user role
- Suggests contacting system administrator

## Integration Points

### With Appointments System
Appointment types integrate with:
- `appointments` table (via `appointment_type_id` foreign key)
- `appointment_approval_requests` table (for approval workflows)
- `patient_free_session_tracking` table (for free session limits)

### With Calendar Views
- Appointment colors display in Provider Calendar
- Duration defaults populate new appointments
- Approval workflows trigger based on type settings

### With User Roles
- System Admin: Full CRUD access
- Clinic Admin: View only (managed via RLS)
- Provider: View only (managed via RLS)
- Admissions Advisor: View only (managed via RLS)
- Staff: View only (managed via RLS)

## Technical Implementation

### State Management
- Uses React hooks for local state
- Integrates with GlobalContext for user session
- Leverages useApi hook for API calls
- Uses useNotification for user feedback

### Error Handling
- Form validation with field-level error messages
- API error handling with user-friendly notifications
- Role-based access control with clear messaging
- Network error recovery

### UI/UX Features
- Loading states during API calls
- Success/error notifications
- Confirmation dialogs for destructive actions
- Disabled states for non-admin users
- Responsive design for mobile devices
- Color picker with hex input fallback
- Helpful information panels

## Testing Recommendations

1. **Access Control**
   - Verify only System Admins can access the page
   - Test that non-admin users see proper error message
   - Ensure edge functions reject non-admin requests

2. **CRUD Operations**
   - Create appointment type with all fields
   - Create appointment type with minimal required fields
   - Update appointment type (modify various fields)
   - Delete appointment type
   - Verify changes reflect in database

3. **Validation**
   - Submit form with missing required fields
   - Enter invalid duration values (< 5, > 480)
   - Enter invalid free session values (< 0, > 100)
   - Enable approval without selecting roles
   - Test hex color validation

4. **Data Isolation**
   - Verify users only see their clinic's appointment types
   - Ensure users cannot modify other clinic's types
   - Test with multiple clinics

5. **Integration**
   - Create appointment using new appointment type
   - Verify colors display correctly in calendar
   - Test approval workflow with approval-required type

## File Summary

### New Files Created
1. `src/pages/ManageAppointmentTypes.tsx` - Main page component
2. `src/components/AppointmentTypeForm.tsx` - Form component
3. `supabase/functions/get_appointment_types/index.ts` - GET endpoint
4. `supabase/functions/create_appointment_types/index.ts` - POST endpoint
5. `supabase/functions/update_appointment_types/index.ts` - PUT endpoint
6. `supabase/functions/delete_appointment_types/index.ts` - DELETE endpoint

### Modified Files
1. `src/App.tsx` - Added import and route
2. `src/components/Sidebar.tsx` - Added menu item

## Dependencies
- No new dependencies required
- Uses existing packages:
  - `@supabase/supabase-js` for database operations
  - `lucide-react` for icons
  - React hooks for state management

## Next Steps

To use this feature in production:

1. **Deploy Edge Functions**
   ```bash
   supabase functions deploy get_appointment_types
   supabase functions deploy create_appointment_types
   supabase functions deploy update_appointment_types
   supabase functions deploy delete_appointment_types
   ```

2. **Verify RLS Policies**
   - Ensure appointment_types table has proper RLS enabled
   - Verify policies allow System Admins to modify
   - Confirm clinic-based isolation is working

3. **Seed Initial Data** (if needed)
   - Default appointment types should already exist from migration
   - Create additional types as needed through the UI

4. **Train Users**
   - Show System Admins how to access the page
   - Demonstrate creating and editing appointment types
   - Explain approval workflow configuration

## Benefits

1. **User-Friendly Management**: No need to use Supabase dashboard or SQL
2. **Role-Based Security**: Only authorized admins can modify types
3. **Visual Configuration**: Color pickers and visual indicators
4. **Validation**: Form validation prevents invalid data
5. **Clinic Isolation**: Each clinic manages their own types
6. **Audit Trail**: All changes tracked through database timestamps
7. **Integration Ready**: Works seamlessly with existing appointment system
