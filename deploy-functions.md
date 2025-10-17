# Edge Functions Deployment Guide

## 📋 Functions to Deploy (48 total)

### 🔍 GET Functions (10)
- `get_patients` - Retrieve patient records
- `get_appointments` - Get patient appointments  
- `get_treatment_plans` - Get treatment plans
- `get_timeline_events` - Get patient timeline
- `get_labs` - Get lab results
- `get_medications` - Get medications
- `get_supplements` - Get supplements
- `get_users` - Get system users
- `get_clinics` - Get clinic info
- `get_clinical_notes` - Get clinical notes

### ➕ CREATE Functions (11)
- `create_patients` - Create new patients
- `create_appointments` - Schedule appointments
- `create_treatment_plans` - Create treatment plans
- `create_timeline_events` - Add timeline events
- `create_labs` - Add lab results
- `create_medications` - Add medications
- `create_supplements` - Add supplements
- `create_users` - Create system users
- `create_clinics` - Create clinics
- `create_clinical_notes` - Add clinical notes
- `create_organizations` - Create organizations

### ✏️ UPDATE Functions (12)
- `update_patients` - Update patient info
- `update_appointments` - Update appointments
- `update_treatment_plans` - Update treatment plans
- `update_timeline_events` - Update timeline events
- `update_labs` - Update lab results
- `update_medications` - Update medications
- `update_supplements` - Update supplements
- `update_users` - Update user info
- `update_clinics` - Update clinic info
- `update_clinical_notes` - Update clinical notes
- `update_organizations` - Update organizations
- `update_treatment_protocols` - Update protocols
- `update_treatment_goals` - Update goals

### 🗑️ DELETE Functions (13)
- `delete_patients` - Soft delete patients
- `delete_appointments` - Delete appointments
- `delete_treatment_plans` - Delete treatment plans
- `delete_timeline_events` - Delete timeline events
- `delete_labs` - Delete lab results
- `delete_medications` - Delete medications
- `delete_supplements` - Delete supplements
- `delete_users` - Delete users
- `delete_clinics` - Delete clinics
- `delete_clinical_notes` - Delete clinical notes
- `delete_organizations` - Delete organizations
- `delete_treatment_protocols` - Delete protocols
- `delete_treatment_goals` - Delete goals

### 🛠️ UTILITY Functions (2)
- `migrate_users` - Migrate users to Supabase Auth
- `reset_user_password` - Reset user passwords

## 🚀 Deployment Priority Order

### Phase 1: Core Functions (Deploy First)
1. `get_patients` - Essential for patient list
2. `create_patients` - Essential for adding patients
3. `get_users` - Essential for user management
4. `get_clinics` - Essential for clinic info

### Phase 2: Patient Data Functions
5. `get_appointments`
6. `create_appointments`
7. `get_treatment_plans`
8. `create_treatment_plans`
9. `get_clinical_notes`
10. `create_clinical_notes`

### Phase 3: Supporting Functions
11. All remaining `get_*` functions
12. All remaining `create_*` functions
13. All `update_*` functions
14. All `delete_*` functions

### Phase 4: Migration Functions (Last)
15. `migrate_users`
16. `reset_user_password`

## ✅ Deployment Checklist

- [ ] Phase 1: Core functions deployed and tested
- [ ] Phase 2: Patient data functions deployed
- [ ] Phase 3: Supporting functions deployed  
- [ ] Phase 4: Migration functions deployed
- [ ] All functions tested with authentication
- [ ] RLS policies working correctly
- [ ] Error handling verified

## 🧪 Testing After Deployment

1. **Login Test**: Verify Supabase Auth works
2. **Patient List**: Test `get_patients` function
3. **Create Patient**: Test `create_patients` function
4. **Data Access**: Verify RLS is working
5. **Error Handling**: Test with invalid data