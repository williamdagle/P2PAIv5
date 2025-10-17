# Edge Function Debugging - Ready for Analysis

## ✅ What I've Done

I've added comprehensive debug logging to both edge functions to help us identify exactly where the error is occurring.

### Files Modified

1. **`supabase/functions/get_provider_availability/index.ts`**
   - Added 20+ debug log statements
   - Logs every step: auth, queries, data processing
   - Prefix: `[AVAILABILITY]`

2. **`supabase/functions/recommend_appointment_slots/index.ts`**
   - Added detailed logging for all operations
   - Shows internal fetch call details
   - Prefix: `[RECOMMEND]`

### Key Debug Points Added

#### In `get_provider_availability`:
- ✅ User authentication verification
- ✅ User profile lookup
- ✅ Parameters received
- ✅ Buffer RPC call result
- ✅ Provider schedules query (with count)
- ✅ Schedule exceptions query (with count)
- ✅ Existing appointments query (with count)
- ✅ Breaks query (with count)
- ✅ Date range processing (day by day)
- ✅ Final available blocks count
- ✅ Detailed error messages with stack traces

#### In `recommend_appointment_slots`:
- ✅ User authentication
- ✅ Parameters received
- ✅ Appointment type lookup
- ✅ Provider preferences lookup
- ✅ Patient preferences lookup
- ✅ Internal availability function call URL
- ✅ Availability response status
- ✅ **Full error response from availability function** (new!)
- ✅ Number of blocks being scored
- ✅ Final recommendations count

## 🔍 How to Check the Logs

### Option 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in the left sidebar
4. Click on `recommend_appointment_slots` or `get_provider_availability`
5. Click the "Logs" tab
6. **Trigger your appointment scheduling request**
7. Watch logs appear in real-time

### Option 2: Browser Console Test

Open your browser console and run this test:

```javascript
const testAvailability = async () => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_provider_availability?` +
    `provider_id=8b20d8b9-f390-44cc-a587-53dfe7a48a22&` +
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
};

testAvailability();
```

Then check the Edge Function logs in the dashboard.

## 🎯 What to Look For

The logs will now show you **exactly** where the error occurs:

### Example Error Scenarios

#### Scenario 1: RLS Policy Blocking Access
```
[AVAILABILITY] Found schedules: 0
[AVAILABILITY] Schedule error: {
  "code": "42501",
  "message": "permission denied for table provider_schedules"
}
```
**This means**: RLS policies are blocking the service role from accessing the table.

#### Scenario 2: Provider Has No Schedule
```
[AVAILABILITY] Found schedules: 0
[AVAILABILITY] Found exceptions: 0
[AVAILABILITY] Processing date range...
[AVAILABILITY] Processed 31 days
[AVAILABILITY] Found 0 available blocks
```
**This means**: Provider exists but has no schedule entries.

#### Scenario 3: Buffer Function Missing
```
[AVAILABILITY] Buffer RPC error: {
  "code": "42883",
  "message": "function get_appointment_buffer does not exist"
}
```
**This means**: The RPC function wasn't created or isn't granted to service role.

#### Scenario 4: Auth Issue
```
[AVAILABILITY] User verification failed: {
  "message": "Invalid JWT"
}
```
**This means**: Authentication token is invalid or expired.

## 📊 Database Verification Queries

Run these to verify your data:

### Check Provider Schedule
```sql
SELECT
  ps.day_of_week,
  ps.start_time,
  ps.end_time,
  ps.is_available,
  ps.schedule_type
FROM provider_schedules ps
WHERE ps.provider_id = '8b20d8b9-f390-44cc-a587-53dfe7a48a22'
AND ps.is_deleted = false;
```

**Expected**: Should return 10 rows (the provider has 10 schedule blocks)

### Check Buffer Function
```sql
SELECT get_appointment_buffer(
  'cbf80f1e-b749-4629-81db-5e08c425d9a0'::uuid,  -- clinic_id
  '8b20d8b9-f390-44cc-a587-53dfe7a48a22'::uuid,  -- provider_id
  NULL  -- appointment_type_id
);
```

**Expected**: Should return `{pre_minutes: 5, post_minutes: 10}`

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'provider_schedules';
```

**Expected**: Should show policies including one for service_role

## 🔧 Most Likely Issues (Based on Your Setup)

Given that:
- ✅ Provider exists (8b20d8b9-f390-44cc-a587-53dfe7a48a22)
- ✅ Provider has 10 schedules
- ✅ All tables created successfully
- ✅ RLS policies applied

The most likely issues are:

### Issue 1: Service Role Can't Access Tables (90% probability)
Even though we added service role policies, there might be a conflict with existing policies.

**Test**: Run this query as service role:
```sql
SELECT COUNT(*) FROM provider_schedules WHERE provider_id = '8b20d8b9-f390-44cc-a587-53dfe7a48a22';
```

If it returns 0 or errors, RLS is blocking it.

### Issue 2: User Authentication Token Invalid (5% probability)
The authorization header might not be getting passed correctly.

**Check**: Look for `[AVAILABILITY] User verified:` in the logs. If you don't see it, auth failed.

### Issue 3: Missing `is_deleted` Column Filter (5% probability)
Some queries filter by `is_deleted = false` but older rows might not have this column populated correctly.

**Test**:
```sql
SELECT COUNT(*), is_deleted
FROM provider_schedules
WHERE provider_id = '8b20d8b9-f390-44cc-a587-53dfe7a48a22'
GROUP BY is_deleted;
```

## 📝 Action Plan

1. **Try the request again** in your app
2. **Immediately check** Supabase Dashboard → Edge Functions → Logs
3. **Copy the FULL log output** (especially errors)
4. **Look for the LAST successful log message** before the error
5. **Share the logs** so we can see exactly what's happening

The logs will tell us:
- Which function failed (recommend or availability)
- Which step failed (auth, query, processing)
- What the exact error message is
- What data was returned (or not returned)

## 🎯 Expected Success Output

When it works correctly, you should see:

```
[RECOMMEND] Starting request...
[RECOMMEND] User verified: <user-id>
[RECOMMEND] User clinic_id: cbf80f1e-b749-4629-81db-5e08c425d9a0
[RECOMMEND] Calling availability function: https://...
[RECOMMEND] Availability response status: 200
[RECOMMEND] Availability data received: { totalBlocks: 95, ... }
[RECOMMEND] Scoring 95 available blocks...
[RECOMMEND] Returning 10 recommendations
```

And:

```
[AVAILABILITY] Starting request...
[AVAILABILITY] User verified: <user-id>
[AVAILABILITY] Found schedules: 5
[AVAILABILITY] Found exceptions: 0
[AVAILABILITY] Found appointments: 0
[AVAILABILITY] Found breaks: 5
[AVAILABILITY] Processed 31 days
[AVAILABILITY] Found 95 available blocks
```

---

## 🚀 Next Step

**Please try your appointment scheduling request again, then check the Supabase Edge Function logs and share what you see.**

The detailed logging will pinpoint exactly where and why it's failing!

**Files to reference:**
- `DEBUG-EDGE-FUNCTIONS.md` - Detailed debugging guide
- `QUICK-FIX-VERIFICATION.md` - Quick verification steps
- `ROLLBACK-INTELLIGENT-SCHEDULING.sql` - Emergency rollback (if needed)
