# Deploy Settings Management Edge Functions

## Quick Deployment Commands

Run these commands to deploy the new settings management edge functions:

```bash
# Deploy get_system_settings function
supabase functions deploy get_system_settings

# Deploy update_system_settings function
supabase functions deploy update_system_settings
```

## Functions Overview

### 1. get_system_settings
**Purpose**: Retrieve system-wide configuration settings

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/get_system_settings`

**Method**: GET

**Authentication**: Required (System Admin only)

**Returns**:
```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "default_appointment_duration_minutes": 60,
  "appointment_buffer_minutes": 0,
  "max_advance_booking_days": 90,
  "allow_double_booking": false,
  "session_timeout_minutes": 480,
  "password_min_length": 8,
  "enable_email_notifications": true,
  ...
}
```

### 2. update_system_settings
**Purpose**: Update system-wide configuration settings

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/update_system_settings`

**Method**: PUT

**Authentication**: Required (System Admin only)

**Body**: Any system settings fields to update
```json
{
  "default_appointment_duration_minutes": 45,
  "session_timeout_minutes": 360,
  "enable_email_notifications": true
}
```

**Returns**: Updated settings object

## Testing After Deployment

### Test get_system_settings
```bash
curl -X GET 'https://[PROJECT_ID].supabase.co/functions/v1/get_system_settings' \
  -H 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  -H 'apikey: [YOUR_ANON_KEY]'
```

### Test update_system_settings
```bash
curl -X PUT 'https://[PROJECT_ID].supabase.co/functions/v1/update_system_settings' \
  -H 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  -H 'apikey: [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "default_appointment_duration_minutes": 45
  }'
```

## Verification Steps

1. **Deploy Functions**
   ```bash
   supabase functions deploy get_system_settings
   supabase functions deploy update_system_settings
   ```

2. **Verify Deployment**
   ```bash
   supabase functions list
   ```
   Should show both functions in the list.

3. **Test in Application**
   - Log in as System Admin
   - Navigate to Administration → System Settings
   - Verify settings load
   - Make a change and save
   - Refresh page to verify persistence

4. **Check Logs** (if issues occur)
   ```bash
   supabase functions logs get_system_settings
   supabase functions logs update_system_settings
   ```

## Security Notes

- Both functions check RLS policies automatically
- update_system_settings verifies user has System Admin role
- All changes are audited in the audit_logs table
- Functions use CORS headers for browser compatibility

## Rollback (if needed)

If you need to rollback:
```bash
# Delete the functions
supabase functions delete get_system_settings
supabase functions delete update_system_settings
```

Then use existing get_clinics and update_clinics functions as a temporary workaround.

## Integration with Existing Functions

The settings system integrates with these existing functions:
- `get_clinics` - Returns clinic_settings and feature_flags
- `update_clinics` - Can update clinic_settings and feature_flags
- No changes needed to existing edge functions

## Success Criteria

✅ Functions deploy without errors
✅ Functions appear in Supabase dashboard
✅ GET request returns settings
✅ PUT request updates settings
✅ Non-admin users get permission denied
✅ System Admin can access and modify
✅ Changes persist in database
✅ Audit logs capture updates

## Common Issues & Solutions

### Issue: "Function not found"
**Solution**: Ensure function is deployed and project ID is correct

### Issue: "Unauthorized" error
**Solution**: Verify user has System Admin role and valid access token

### Issue: "RLS policy violation"
**Solution**: Check that RLS policies are created (should be automatic from migration)

### Issue: Settings not persisting
**Solution**: Check browser console for errors and verify update function is being called

## Next Steps After Deployment

1. Test all tabs in System Settings page
2. Test all tabs in Clinic Settings page
3. Verify feature toggles work correctly
4. Test with different user roles (System Admin, Clinic Admin, Provider)
5. Verify audit trail is working
6. Test business hours configuration
7. Test all validation rules
