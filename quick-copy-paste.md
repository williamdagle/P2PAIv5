# Quick Copy-Paste Reference

## 🚀 **Function Code Quick Access**

### **Phase 1: Core Functions**

#### **get_patients** (`supabase/functions/get_patients/index.ts`)
```typescript
// Copy the entire content from: src/supabase/functions/get_patients/index.ts
// This is your main patient listing function
```

#### **create_patients** (`supabase/functions/create_patients/index.ts`)
```typescript
// Copy the entire content from: src/supabase/functions/create_patients/index.ts
// This handles new patient creation
```

#### **get_users** (`supabase/functions/get_users/index.ts`)
```typescript
// Copy the entire content from: src/supabase/functions/get_users/index.ts
// This handles user management
```

#### **get_clinics** (`supabase/functions/get_clinics/index.ts`)
```typescript
// Copy the entire content from: src/supabase/functions/get_clinics/index.ts
// This handles clinic information
```

---

## 📋 **Dashboard Deployment Steps**

### **For Each Function:**

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Edge Functions**

2. **Click**: "New Function" or select existing function name

3. **Copy**: Entire function code from your local file

4. **Paste**: Into the dashboard code editor

5. **Deploy**: Click the "Deploy" button

6. **Test**: Use the testing URLs below

---

## 🧪 **Quick Test URLs**

Replace `YOUR_SUPABASE_URL` and `YOUR_ACCESS_TOKEN` with your actual values:

### **Test get_patients:**
```
GET YOUR_SUPABASE_URL/functions/v1/get_patients
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **Test create_patients:**
```
POST YOUR_SUPABASE_URL/functions/v1/create_patients
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

Body:
{
  "first_name": "Test",
  "last_name": "Patient", 
  "dob": "1990-01-01",
  "gender": "Male"
}
```

### **Test get_users:**
```
GET YOUR_SUPABASE_URL/functions/v1/get_users
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **Test get_clinics:**
```
GET YOUR_SUPABASE_URL/functions/v1/get_clinics
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## ⚡ **Efficiency Tips**

1. **Multiple Browser Tabs**: Open dashboard in multiple tabs
2. **Code Editor Split**: Have function files open side-by-side
3. **Copy All at Once**: Select all code with Ctrl+A, then Ctrl+C
4. **Deploy in Order**: Follow Phase 1 → 2 → 3 → 4
5. **Test Immediately**: Verify each function works before moving to next

---

## 🎯 **Success Indicators**

### **Function Deployed Successfully:**
- ✅ Green "Deployed" status in dashboard
- ✅ No error messages in deployment log
- ✅ Function appears in functions list

### **Function Working Correctly:**
- ✅ Test API call returns data (not error)
- ✅ Authentication is working
- ✅ RLS is filtering data correctly
- ✅ No console errors in browser

---

## 🚨 **If Something Goes Wrong**

### **Deployment Fails:**
1. Check for syntax errors in code
2. Verify all brackets/parentheses match
3. Ensure imports are correct
4. Try deploying again

### **Function Returns Errors:**
1. Check Supabase logs in dashboard
2. Verify environment variables are set
3. Test authentication token is valid
4. Check database permissions/RLS policies

### **Need Help:**
1. Check Supabase function logs
2. Test with Postman/curl first
3. Verify database schema matches function code
4. Check that user has proper clinic_id