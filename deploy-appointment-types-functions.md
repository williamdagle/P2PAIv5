# Deploy Appointment Types Edge Functions

## Quick Deployment Commands

Run these commands to deploy all four appointment types edge functions:

```bash
supabase functions deploy get_appointment_types
supabase functions deploy create_appointment_types
supabase functions deploy update_appointment_types
supabase functions deploy delete_appointment_types
```

## Verify Deployment

After deployment, verify the functions are working:

```bash
# Test GET (list appointment types)
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/get_appointment_types" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY"

# Test POST (create appointment type) - System Admin only
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create_appointment_types" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Appointment",
    "description": "Test description",
    "color_code": "#3B82F6",
    "default_duration_minutes": 60,
    "is_billable": true,
    "requires_approval": false,
    "max_free_sessions": 0,
    "approval_roles": []
  }'
```

## Function Details

### get_appointment_types
- **Method**: GET
- **Auth**: Required (JWT)
- **Access**: All authenticated users (read-only)
- **Returns**: Array of appointment types for user's clinic

### create_appointment_types
- **Method**: POST
- **Auth**: Required (JWT + System Admin role)
- **Body**: Appointment type object
- **Returns**: Created appointment type

### update_appointment_types
- **Method**: PUT
- **Auth**: Required (JWT + System Admin role)
- **Body**: `{ id: string, ...fields to update }`
- **Returns**: Updated appointment type

### delete_appointment_types
- **Method**: DELETE
- **Auth**: Required (JWT + System Admin role)
- **Query Param**: `id` (appointment type ID)
- **Returns**: Success message

## Troubleshooting

### Function Not Found
- Verify function deployed successfully
- Check function name matches exactly
- Ensure project reference is correct

### Authentication Errors
- Verify access token is valid and not expired
- Check user is authenticated
- Confirm API key is correct

### Permission Denied
- Verify user has System Admin role for create/update/delete
- Check user's clinic_id matches appointment type's clinic_id
- Ensure RLS policies are enabled on appointment_types table

### CORS Errors
- All functions include proper CORS headers
- If issues persist, verify OPTIONS method handling
- Check browser console for specific CORS error messages

## Post-Deployment Checklist

- [ ] All four functions deployed successfully
- [ ] GET endpoint returns appointment types
- [ ] System Admin can create appointment types
- [ ] System Admin can update appointment types
- [ ] System Admin can delete appointment types
- [ ] Non-admin users cannot modify appointment types
- [ ] Clinic-based isolation is working correctly
- [ ] UI reflects changes immediately after operations
