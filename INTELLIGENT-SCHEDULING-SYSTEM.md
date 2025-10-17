# Intelligent Appointment Scheduling System

## Overview

This system provides AI-powered appointment scheduling with intelligent slot recommendations based on provider availability, preferences, patient needs, and appointment type requirements.

## Features

### 1. Provider Schedule Management
- **Recurring Weekly Schedules**: Configure working hours for each day of the week
- **Breaks and Blocked Time**: Define lunch breaks, admin time, and other unavailable periods
- **Schedule Exceptions**: Handle one-time events like vacations, sick days, or special hours
- **Effective Date Ranges**: Schedule changes that become active on specific dates

### 2. Configurable Buffer Times
- **Clinic-Level Defaults**: Set standard buffer times for all appointments
- **Provider-Specific Buffers**: Override defaults for individual providers
- **Appointment-Type Buffers**: Custom buffers for specific types of appointments
- **Priority System**: Higher priority buffers automatically override lower priority ones

### 3. Provider Preferences
- **Time-of-Day Preferences**: Specify preferred times for different appointment types
- **Preference Strength**: Weight preferences on a 1-10 scale
- **Day Avoidance**: Mark certain days to avoid for specific appointment types

### 4. Patient Scheduling Preferences
- **Preferred Days and Times**: Store patient's preferred scheduling windows
- **Provider Preferences**: Track preferred or avoided providers
- **Special Requirements**: Document accessibility needs or other requirements

### 5. Intelligent Slot Recommendations
- **AI-Powered Scoring**: Ranks available slots based on multiple factors
- **Transparency**: Shows why each slot is recommended
- **Confidence Scores**: Indicates match quality from 0-100
- **Top Recommendations**: Highlights the best options first

## Database Schema

### Tables Created

#### provider_schedules
Stores recurring weekly availability schedules.

```sql
- id (uuid, PK)
- clinic_id (uuid, FK → clinics)
- provider_id (uuid, FK → users)
- day_of_week (integer, 0-6)
- start_time (time)
- end_time (time)
- is_available (boolean)
- schedule_type (text: working_hours, break, blocked, admin_time)
- notes (text)
- effective_from (date)
- effective_until (date, nullable)
```

#### provider_schedule_exceptions
One-time schedule modifications.

```sql
- id (uuid, PK)
- clinic_id (uuid, FK → clinics)
- provider_id (uuid, FK → users)
- exception_date (date)
- exception_type (text: time_off, special_hours, holiday, sick_leave)
- is_available (boolean)
- start_time (time, nullable)
- end_time (time, nullable)
- reason (text)
- created_by (uuid, FK → users)
```

#### appointment_buffers
Configurable buffer requirements at multiple levels.

```sql
- id (uuid, PK)
- clinic_id (uuid, FK → clinics)
- buffer_level (text: clinic_default, provider_specific, appointment_type_specific)
- provider_id (uuid, FK → users, nullable)
- appointment_type_id (uuid, FK → appointment_types, nullable)
- pre_appointment_buffer_minutes (integer)
- post_appointment_buffer_minutes (integer)
- applies_to_back_to_back (boolean)
- is_active (boolean)
- priority (integer)
```

#### provider_appointment_preferences
Provider preferences for appointment types and scheduling.

```sql
- id (uuid, PK)
- clinic_id (uuid, FK → clinics)
- provider_id (uuid, FK → users)
- appointment_type_id (uuid, FK → appointment_types, nullable)
- preferred_time_of_day (text: morning, afternoon, evening, any)
- preferred_start_time (time)
- preferred_end_time (time)
- preference_strength (integer, 1-10)
- avoid_days (integer[])
- notes (text)
- is_active (boolean)
```

#### patient_scheduling_preferences
Patient-specific scheduling preferences.

```sql
- id (uuid, PK)
- clinic_id (uuid, FK → clinics)
- patient_id (uuid, FK → patients)
- preferred_days (integer[])
- preferred_time_of_day (text)
- preferred_start_time (time)
- preferred_end_time (time)
- avoid_days (integer[])
- avoid_providers (uuid[])
- preferred_providers (uuid[])
- special_requirements (text)
```

### Enhanced Tables

#### appointment_types
Added fields for scheduling intelligence:
- `required_provider_specialty` (text)
- `required_provider_role` (text)
- `preferred_time_of_day` (text)
- `preferred_start_time` (time)
- `preferred_end_time` (time)
- `can_be_auto_scheduled` (boolean)

## Edge Functions

### 1. get_provider_availability
**Endpoint**: `/functions/v1/get_provider_availability`

**Method**: GET

**Parameters**:
- `provider_id` (required): UUID of the provider
- `start_date` (required): ISO date string (YYYY-MM-DD)
- `end_date` (required): ISO date string (YYYY-MM-DD)
- `duration_minutes` (optional): Appointment duration, defaults to 30
- `appointment_type_id` (optional): UUID for type-specific buffers

**Returns**:
```json
{
  "providerId": "uuid",
  "startDate": "2025-10-17",
  "endDate": "2025-10-31",
  "durationMinutes": 30,
  "buffers": { "pre": 5, "post": 10 },
  "availableBlocks": [
    {
      "startTime": "2025-10-17T09:00:00.000Z",
      "endTime": "2025-10-17T12:00:00.000Z",
      "dayOfWeek": 4,
      "date": "2025-10-17"
    }
  ]
}
```

### 2. recommend_appointment_slots
**Endpoint**: `/functions/v1/recommend_appointment_slots`

**Method**: GET

**Parameters**:
- `provider_id` (required): UUID of the provider
- `start_date` (required): ISO date string
- `end_date` (required): ISO date string
- `appointment_type_id` (optional): UUID for type-specific recommendations
- `patient_id` (optional): UUID for patient preference matching
- `top_n` (optional): Number of recommendations, defaults to 5

**Returns**:
```json
{
  "providerId": "uuid",
  "appointmentTypeId": "uuid",
  "patientId": "uuid",
  "dateRange": { "start": "2025-10-17", "end": "2025-10-31" },
  "totalSlotsAvailable": 45,
  "recommendations": [
    {
      "startTime": "2025-10-18T09:00:00.000Z",
      "endTime": "2025-10-18T09:30:00.000Z",
      "confidenceScore": 95,
      "reasons": [
        "Provider prefers morning appointments",
        "Available within a week",
        "Early morning slot"
      ],
      "date": "2025-10-18",
      "dayOfWeek": 5,
      "timeOfDay": "morning"
    }
  ],
  "metadata": {
    "appointmentType": "Initial Consultation",
    "durationMinutes": 30,
    "providerHasPreferences": true,
    "patientHasPreferences": false
  }
}
```

### 3. get_appointment_type_metadata
**Endpoint**: `/functions/v1/get_appointment_type_metadata`

**Method**: GET

**Parameters**:
- `appointment_type_id` (required): UUID of the appointment type

**Returns**:
```json
{
  "id": "uuid",
  "name": "Initial Consultation",
  "description": "...",
  "durationMinutes": 30,
  "requiredProviderRole": "provider",
  "requiredProviderSpecialty": null,
  "preferredTimeOfDay": "morning",
  "preferredStartTime": "09:00:00",
  "preferredEndTime": "12:00:00",
  "canBeAutoScheduled": true,
  "requiresApproval": false,
  "buffer": {
    "preAppointmentMinutes": 5,
    "postAppointmentMinutes": 10,
    "appliesToBackToBack": true,
    "source": "clinic_default"
  },
  "colorCode": "#3B82F6"
}
```

### 4. manage_provider_schedule
**Endpoint**: `/functions/v1/manage_provider_schedule`

**Methods**: GET, POST, PUT, DELETE

**GET Parameters**:
- `provider_id` (optional): Filter by provider
- `schedule_id` (optional): Get specific schedule

**POST Body**:
```json
{
  "provider_id": "uuid",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "is_available": true,
  "schedule_type": "working_hours",
  "notes": "Monday schedule"
}
```

**PUT Body**:
```json
{
  "id": "uuid",
  "start_time": "08:00",
  "end_time": "16:00"
}
```

**DELETE Body**:
```json
{
  "id": "uuid"
}
```

## Frontend Components

### 1. SmartSchedulingAssistant
**Location**: `src/components/SmartSchedulingAssistant.tsx`

**Props**:
- `providerId`: string (required)
- `appointmentTypeId`: string (optional)
- `patientId`: string (optional)
- `onSelectSlot`: (startTime: string, endTime: string) => void
- `isOpen`: boolean

**Features**:
- Displays top 10 recommended appointment slots
- Shows confidence scores and reasoning
- Allows date range customization
- Highlights top recommendation
- One-click slot selection

### 2. ProviderScheduleForm
**Location**: `src/components/ProviderScheduleForm.tsx`

**Props**:
- `providerId`: string (required)
- `onSuccess`: () => void
- `onCancel`: () => void

**Features**:
- Visual weekly schedule builder
- Quick setup for Mon-Fri 9-5 schedule
- Support for multiple blocks per day
- Schedule type selection (working hours, break, blocked, admin)
- Bulk operations

### 3. ProviderScheduleManagement Page
**Location**: `src/pages/ProviderScheduleManagement.tsx`

**Features**:
- List all providers in clinic
- Access schedule management for each provider
- View provider role and basic info
- Quick access to schedule configuration

## Usage Guide

### Setting Up Provider Schedules

1. **Navigate to Provider Schedule Management**
   - Access via sidebar or admin menu

2. **Select a Provider**
   - Click "Manage Schedule" on any provider card

3. **Configure Working Hours**
   - Use "Quick Setup" for standard Mon-Fri 9-5 schedule
   - Or add individual time blocks manually

4. **Add Breaks**
   - Click "Add Time Block"
   - Set schedule type to "Break"
   - Define break time (e.g., 12:00 PM - 1:00 PM)

5. **Save Changes**
   - Click "Save Schedule"
   - Changes take effect immediately

### Using Smart Scheduling Assistant

1. **Open Appointment Form**
   - Navigate to patient appointments
   - Click "Schedule Appointment"

2. **Select Provider and Appointment Type**
   - Choose the provider
   - Select appointment type (if available)

3. **View Recommendations**
   - Smart recommendations appear automatically
   - See top-ranked slots with reasoning

4. **Select a Slot**
   - Click "Select This Time" on any recommendation
   - Appointment date/time auto-fills

5. **Complete Booking**
   - Add reason for visit
   - Confirm and save

### Configuring Buffer Times

#### Clinic-Level Default
```sql
INSERT INTO appointment_buffers (
  clinic_id,
  buffer_level,
  pre_appointment_buffer_minutes,
  post_appointment_buffer_minutes,
  is_active,
  priority
) VALUES (
  'your-clinic-id',
  'clinic_default',
  5,
  10,
  true,
  1
);
```

#### Provider-Specific
```sql
INSERT INTO appointment_buffers (
  clinic_id,
  buffer_level,
  provider_id,
  pre_appointment_buffer_minutes,
  post_appointment_buffer_minutes,
  is_active,
  priority
) VALUES (
  'your-clinic-id',
  'provider_specific',
  'provider-uuid',
  10,
  15,
  true,
  2
);
```

#### Appointment-Type-Specific
```sql
INSERT INTO appointment_buffers (
  clinic_id,
  buffer_level,
  appointment_type_id,
  pre_appointment_buffer_minutes,
  post_appointment_buffer_minutes,
  is_active,
  priority
) VALUES (
  'your-clinic-id',
  'appointment_type_specific',
  'appointment-type-uuid',
  15,
  20,
  true,
  3
);
```

## Recommendation Algorithm

The system scores each available time slot based on:

1. **Provider Preferences** (up to +25 points)
   - Preferred time of day matching
   - Specific time window preferences
   - Appointment type preferences
   - Day avoidance rules

2. **Appointment Type Preferences** (up to +20 points)
   - Recommended time of day
   - Specific time windows for type

3. **Patient Preferences** (up to +25 points)
   - Preferred time of day
   - Preferred days of week
   - Day/provider avoidance

4. **Proximity Scoring** (up to +20 points)
   - Next day: +5
   - Within 3 days: +20
   - Within week: +15
   - Within 2 weeks: +10
   - Within month: +5
   - Same day: -50 (usually too rushed)

5. **General Preferences** (+5 to -10 points)
   - Early morning bonus: +5
   - Weekend penalty: -5
   - Very early/late penalty: -10

**Final Score**: 0-100 (capped)
- 90+: Excellent Match
- 70-89: Great Match
- 50-69: Good Match
- <50: Available

## Testing

### Test Provider Availability
```bash
curl -X GET \
  "${SUPABASE_URL}/functions/v1/get_provider_availability?provider_id=YOUR_PROVIDER_ID&start_date=2025-10-17&end_date=2025-10-31&duration_minutes=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Recommendations
```bash
curl -X GET \
  "${SUPABASE_URL}/functions/v1/recommend_appointment_slots?provider_id=YOUR_PROVIDER_ID&start_date=2025-10-17&end_date=2025-10-31&top_n=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Schedule Management
```bash
# Get schedules
curl -X GET \
  "${SUPABASE_URL}/functions/v1/manage_provider_schedule?provider_id=YOUR_PROVIDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create schedule
curl -X POST \
  "${SUPABASE_URL}/functions/v1/manage_provider_schedule" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "YOUR_PROVIDER_ID",
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00",
    "is_available": true,
    "schedule_type": "working_hours"
  }'
```

## Default Configuration

The system automatically seeds:

1. **Default Buffer**: 5 min pre, 10 min post for all clinics
2. **Provider Schedules**: Monday-Friday 9 AM - 5 PM for all providers
3. **Lunch Breaks**: 12:00 PM - 1:00 PM for all providers

## Customization

### Adding Custom Scoring Factors

Edit `supabase/functions/recommend_appointment_slots/index.ts` and modify the scoring logic:

```typescript
// Add custom factor
if (customCondition) {
  score += 15;
  reasons.push('Custom reason');
}
```

### Adjusting Buffer Priorities

Higher priority buffers override lower priority ones:
- Priority 1: Clinic default
- Priority 2: Provider-specific
- Priority 3: Appointment-type-specific

Change priorities in the database as needed.

## Troubleshooting

### No Available Slots Found
1. Check provider has schedule configured
2. Verify no schedule exceptions blocking all time
3. Confirm appointment duration fits within working hours
4. Check buffer times aren't too large

### Recommendations Not Appearing
1. Verify provider_id is correct
2. Check date range includes future dates
3. Confirm provider has availability in range
4. Check console for API errors

### Schedule Not Saving
1. Verify user has clinic_admin or provider role
2. Check RLS policies allow access
3. Confirm time ranges are valid (end > start)
4. Check for overlapping schedule conflicts

## Future Enhancements

- **Recurring Appointments**: Book series of appointments
- **Waitlist Management**: Notify patients when slots open
- **Automated Reminders**: Send scheduling suggestions
- **Team Scheduling**: Coordinate multi-provider appointments
- **Resource Booking**: Integrate equipment/room availability
- **ML Optimization**: Learn from booking patterns

## Support

For issues or questions:
1. Check this documentation
2. Review edge function logs in Supabase dashboard
3. Verify RLS policies are correctly configured
4. Contact system administrator
