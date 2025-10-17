# Dashboard Deployment Guide

## 🚀 **Efficient Dashboard Deployment Strategy**

### **Step 1: Organize Functions by Priority**

#### **Phase 1: Core Functions (Deploy First - 4 functions)**
```
✅ get_patients
✅ create_patients  
✅ get_users
✅ get_clinics
```

#### **Phase 2: Patient Data (6 functions)**
```
✅ get_appointments + create_appointments
✅ get_treatment_plans + create_treatment_plans
✅ get_clinical_notes + create_clinical_notes
```

#### **Phase 3: Supporting Functions (20+ functions)**
```
✅ All remaining get_* functions
✅ All remaining create_* functions
✅ All update_* functions
✅ All delete_* functions
```

#### **Phase 4: Migration Tools (2 functions)**
```
✅ migrate_users
✅ reset_user_password
```

---

## 📋 **Dashboard Deployment Checklist**

### **Before You Start:**
- [ ] Open [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Navigate to your project → **Edge Functions**
- [ ] Have this guide and your code files ready
- [ ] Test each function after deployment

### **For Each Function:**

1. **Click "New Function"** or select existing function
2. **Copy entire function code** from your local file
3. **Paste into dashboard editor**
4. **Click "Deploy"**
5. **Test the function** (see testing section below)
6. **✅ Mark as complete** in checklist

---

## 🧪 **Quick Testing Commands**

### **Test Authentication:**
```bash
# Test login first
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password"}'
```

### **Test Core Functions:**
```bash
# Test get_patients (replace with your actual URL and token)
curl 'YOUR_SUPABASE_URL/functions/v1/get_patients' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# Test create_patients
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/create_patients' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Test","last_name":"Patient","dob":"1990-01-01","gender":"Male"}'
```

---

## 📁 **Function File Locations**

All functions are in: `supabase/functions/FUNCTION_NAME/index.ts`

### **Phase 1 Files:**
- `supabase/functions/get_patients/index.ts`
- `supabase/functions/create_patients/index.ts`
- `supabase/functions/get_users/index.ts`
- `supabase/functions/get_clinics/index.ts`

### **Phase 2 Files:**
- `supabase/functions/get_appointments/index.ts`
- `supabase/functions/create_appointments/index.ts`
- `supabase/functions/get_treatment_plans/index.ts`
- `supabase/functions/create_treatment_plans/index.ts`
- `supabase/functions/get_clinical_notes/index.ts`
- `supabase/functions/create_clinical_notes/index.ts`

*(Continue with remaining functions...)*

---

## ⚡ **Pro Tips for Dashboard Deployment:**

1. **Open Multiple Tabs**: Open dashboard in multiple browser tabs for faster switching
2. **Copy-Paste Ready**: Have all function files open in your code editor
3. **Deploy in Order**: Follow the phase order for dependencies
4. **Test Immediately**: Test each function right after deployment
5. **Keep Notes**: Mark completed functions to track progress

---

## 🚨 **Common Issues & Solutions:**

### **Issue: Function Won't Deploy**
- **Check**: Syntax errors in code
- **Fix**: Verify all brackets and parentheses match

### **Issue: Authentication Errors**
- **Check**: Environment variables are set in Supabase
- **Fix**: Verify SUPABASE_URL and keys are correct

### **Issue: RLS Errors**
- **Check**: Database policies are enabled
- **Fix**: Ensure user has proper clinic_id in profile

---

## 📊 **Deployment Progress Tracker**

### **Phase 1: Core Functions**
- [ ] get_patients
- [ ] create_patients
- [ ] get_users  
- [ ] get_clinics

### **Phase 2: Patient Data**
- [ ] get_appointments
- [ ] create_appointments
- [ ] get_treatment_plans
- [ ] create_treatment_plans
- [ ] get_clinical_notes
- [ ] create_clinical_notes

### **Phase 3: Supporting Functions**
- [ ] get_labs
- [ ] create_labs
- [ ] get_medications
- [ ] create_medications
- [ ] get_supplements
- [ ] create_supplements
- [ ] get_timeline_events
- [ ] create_timeline_events
- [ ] get_organizations
- [ ] create_organizations
- [ ] get_treatment_protocols
- [ ] create_treatment_protocols
- [ ] get_treatment_goals
- [ ] create_treatment_goals
- [ ] All update_* functions (12 functions)
- [ ] All delete_* functions (13 functions)

### **Phase 4: Migration Tools**
- [ ] migrate_users
- [ ] reset_user_password

**Total Functions: 48**