# Edge Function Debugging Guide

## Debug Logging Added ✅

Both edge functions now have comprehensive debug logging with `[AVAILABILITY]` and `[RECOMMEND]` prefixes to help identify exactly where the error is occurring.

## How to View Edge Function Logs

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in the left sidebar
   - You'll see a list of all your functions

3. **View Logs for a Specific Function**
   - Click on either `recommend_appointment_slots` or `get_provider_availability`
   - Click the "Logs" tab
   - Logs will show in real-time

4. **Trigger the Error Again**
   - In your browser, trigger the appointment scheduling request
   - Watch the logs appear in real-time
   - Look for `[RECOMMEND]` and `[AVAILABILITY]` prefixed messages

### Method 2: Supabase CLI (If Available)

```bash
# View logs for recommend_appointment_slots
supabase functions logs recommend_appointment_slots

# View logs for get_provider_availability
supabase functions logs get_provider_availability

# Follow logs in real-time
supabase functions logs recommend_appointment_slots --follow
```

## What to Look For in the Logs

### Step 1: Check `recommend_appointment_slots` logs

Look for these log messages in order:

```
[RECOMMEND] Starting request...
[RECOMMEND] Verifying user...
[RECOMMEND] User verified: <user-id>
[RECOMMEND] User clinic_id: <clinic-id>
[RECOMMEND] Parameters: {...}
[RECOMMEND] Fetching appointment type info...
[RECOMMEND] Calling availability function: <url>
[RECOMMEND] Availability response status: <status-code>
```

**If you see status 400**, the error is in `get_provider_availability`. Continue to Step 2.

### Step 2: Check `get_provider_availability` logs

Look for these log messages:

```
[AVAILABILITY] Starting request...
[AVAILABILITY] Verifying user...
[AVAILABILITY] User verified: <user-id>
[AVAILABILITY] User clinic_id: <clinic-id>
[AVAILABILITY] Parameters: {...}
[AVAILABILITY] Fetching buffer configuration...
[AVAILABILITY] Buffer data: {...}
[AVAILABILITY] Buffers - pre: X post: Y
[AVAILABILITY] Fetching provider schedules...
[AVAILABILITY] Found schedules: X
[AVAILABILITY] Fetching schedule exceptions...
[AVAILABILITY] Found exceptions: X
[AVAILABILITY] Fetching existing appointments...
[AVAILABILITY] Found appointments: X
[AVAILABILITY] Fetching breaks and blocked time...
[AVAILABILITY] Found breaks: X
[AVAILABILITY] Processing date range...
[AVAILABILITY] Processed X days
[AVAILABILITY] Found X available blocks
```

### Common Error Patterns

#### Error 1: RLS Permission Denied
```
[AVAILABILITY] Schedule error: {
  "code": "42501",
  "message": "permission denied for table provider_schedules"
}
```

**Solution**: RLS policy blocking service role. Check policies.

#### Error 2: Provider Has No Schedule
```
[AVAILABILITY] Found schedules: 0
[AVAILABILITY] Processed 31 days
[AVAILABILITY] Found 0 available blocks
```

**Solution**: Provider needs a schedule. Add one via SQL or UI.

#### Error 3: Invalid User Profile
```
[AVAILABILITY] User profile error: {
  "code": "PGRST116",
  "message": "Multiple rows found"
}
```

**Solution**: User has multiple profiles or invalid auth_user_id.

#### Error 4: Missing Buffer Function
```
[AVAILABILITY] Buffer RPC error: {
  "code": "42883",
  "message": "function get_appointment_buffer does not exist"
}
```

**Solution**: RPC function not created or not granted to service role.

## Test Directly in Browser Console

Open your browser console and run:

```javascript
// Test get_provider_availability directly
const testAvailability = async () => {
  const providerId = '8b20d8b9-f390-44cc-a587-53dfe7a48a22';

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_provider_availability?` +
    `provider_id=${providerId}&` +
    `start_date=2025-10-20&` +
    `end_date=2025-10-24&` +
    `duration_minutes=30`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
  return data;
};

testAvailability();
```

## SQL Queries to Check Data

### Check if provider has schedules
```sql
SELECT
  ps.day_of_week,
  ps.start_time,
  ps.end_time,
  ps.is_available,
  ps.schedule_type
FROM provider_schedules ps
WHERE ps.provider_id = '8b20d8b9-f390-44cc-a587-53dfe7a48a22'
AND ps.is_deleted = false
ORDER BY ps.day_of_week, ps.start_time;
```

### Check if buffer function exists
```sql
SELECT proname, proargnames, proargtypes
FROM pg_proc
WHERE proname = 'get_appointment_buffer';
```

### Check if service role can access tables
```sql
-- This should return data (run as service role)
SELECT COUNT(*) FROM provider_schedules;
SELECT COUNT(*) FROM provider_schedule_exceptions;
SELECT COUNT(*) FROM appointment_buffers;
```

### Check RLS policies
```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN (
  'provider_schedules',
  'provider_schedule_exceptions',
  'appointment_buffers'
)
ORDER BY tablename, policyname;
```

## Expected Debug Output (Success Case)

When everything works correctly, you should see:

```
[RECOMMEND] Starting request...
[RECOMMEND] Verifying user...
[RECOMMEND] User verified: abc-123...
[RECOMMEND] User clinic_id: xyz-789...
[RECOMMEND] Parameters: {
  providerId: "8b20d8b9-f390-44cc-a587-53dfe7a48a22",
  startDateStr: "2025-10-17",
  endDateStr: "2025-11-16",
  ...
}
[RECOMMEND] Calling availability function: https://...
[RECOMMEND] Availability response status: 200
[RECOMMEND] Availability data received: {
  totalBlocks: 95,
  buffers: { pre: 5, post: 10 }
}
[RECOMMEND] Scoring 95 available blocks...
[RECOMMEND] Returning 10 recommendations
```

And in the get_provider_availability logs:

```
[AVAILABILITY] Starting request...
[AVAILABILITY] User verified: abc-123...
[AVAILABILITY] Parameters: { providerId: "...", ... }
[AVAILABILITY] Fetching buffer configuration...
[AVAILABILITY] Buffer data: [{ pre_minutes: 5, post_minutes: 10 }]
[AVAILABILITY] Buffers - pre: 5 post: 10
[AVAILABILITY] Fetching provider schedules...
[AVAILABILITY] Found schedules: 5
[AVAILABILITY] Fetching schedule exceptions...
[AVAILABILITY] Found exceptions: 0
[AVAILABILITY] Fetching existing appointments...
[AVAILABILITY] Found appointments: 0
[AVAILABILITY] Fetching breaks and blocked time...
[AVAILABILITY] Found breaks: 5
[AVAILABILITY] Processing date range...
[AVAILABILITY] 2025-10-20 (day 1): 1 schedule blocks
[AVAILABILITY] 2025-10-21 (day 2): 1 schedule blocks
... (more days)
[AVAILABILITY] Processed 31 days
[AVAILABILITY] Found 95 available blocks
```

## Next Steps After Checking Logs

1. **Copy the error message** from the logs
2. **Note which function** failed (`[RECOMMEND]` or `[AVAILABILITY]`)
3. **Note which step** failed (look at the last successful log message)
4. **Check the corresponding table/query** using SQL
5. **Report back** with the specific error message and step

## Quick Diagnostic Checklist

- [ ] Provider exists in database
- [ ] Provider has schedules (at least 1 row in provider_schedules)
- [ ] User is logged in and has valid auth token
- [ ] User profile exists with valid clinic_id
- [ ] Buffer function exists and is callable
- [ ] RLS policies allow service role access
- [ ] All required tables exist

## Test with Known Good Provider

Use this SQL to find a provider that definitely has a schedule:

```sql
SELECT
  u.id as provider_id,
  u.full_name,
  u.clinic_id,
  COUNT(ps.id) as schedule_count
FROM users u
INNER JOIN roles r ON u.role_id = r.id
INNER JOIN provider_schedules ps ON ps.provider_id = u.id AND ps.is_deleted = false
WHERE r.name = 'Provider'
GROUP BY u.id, u.full_name, u.clinic_id
HAVING COUNT(ps.id) > 0
ORDER BY schedule_count DESC
LIMIT 1;
```

Use the `provider_id` from this query in your test.

---

**Now try the request again and check the Supabase Dashboard logs!**

The logs will show exactly where the error is occurring and what the actual error message is.
