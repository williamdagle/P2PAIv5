# Test Data Seeding Guide

This document explains how to generate comprehensive test data for the Functional Medicine EMR system.

## Overview

The `seed-test-data.js` script generates rich, varied test data for all aspects of the EMR system, including:

- **10 fictional patients per clinic** with diverse demographics
- **Core medical data**: vital signs, allergies, immunizations, physical exams
- **Laboratory results**: 5-15 lab tests per patient with trending data and functional medicine ranges
- **Supplements & Medications**: realistic dosing and frequencies
- **Clinical documentation**: assessments, problem lists, treatment plans
- **Functional Medicine features**:
  - FM Timeline events (life events, traumas, symptom onset)
  - IFM Matrix assessments (7 functional body systems)
  - Lifestyle assessments (sleep, exercise, nutrition, stress, environment)
  - Health goals with SMART criteria
  - Food sensitivities and elimination protocols

## Prerequisites

### 1. Get Your Service Role Key

The script requires a Supabase service role key to bypass Row Level Security (RLS) policies.

**To obtain your service role key:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key in the **Project API keys** section
4. Copy the key (it starts with `eyJ...`)

⚠️ **IMPORTANT**: The service role key has full database access. Never commit it to version control or expose it in client-side code.

### 2. Add to Environment Variables

Add the service role key to your `.env` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Your `.env` file should now have:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Running the Script

### Generate Test Data

```bash
npm run seed-test-data
```

This will:
1. Connect to your Supabase database using the service role
2. Find all existing clinics
3. Generate 10 patients per clinic
4. Populate each patient with comprehensive medical data
5. Display a detailed summary of created records

### Expected Output

```
🌱 Starting test data generation...

📋 Found 3 clinic(s)

============================================================
🏥 Processing: Main Street Clinic
============================================================

👤 Creating patient 1/10: James Smith
  ✅ Patient created (ID: 12345678...)
  ✅ All data generated for patient

[... continues for all patients ...]

============================================================
📊 TEST DATA GENERATION SUMMARY
============================================================
Clinics processed:          3
Patients created:           30
Vital signs:                150
Allergies:                  45
Immunizations:              90
Lab results:                450
Supplements:                180
Medications:                120
Clinical assessments:       45
Problem list items:         165
Treatment plan items:       210
Timeline events:            60
FM Timeline events:         270
IFM Matrix assessments:     30
Lifestyle assessments:      30
Health goals:               105
Food sensitivities:         75
============================================================

✅ Test data generation complete!
```

## What Gets Created

### For Each Patient:

1. **Demographics**: Name, date of birth, gender, contact information, address
2. **Vital Signs**: 3-7 entries over time showing height, weight, BMI, blood pressure, heart rate, temperature, O2 saturation
3. **Allergies**: 0-3 allergies (medications, foods, environmental) with severity and reactions
4. **Immunizations**: 2-5 vaccine records with dates, lot numbers, and manufacturers
5. **Lab Results**: 5-15 tests with trending data over time, including:
   - Vitamin D, thyroid panel (TSH, Free T4, Free T3)
   - Metabolic markers (glucose, HbA1c)
   - Lipid panel (cholesterol, HDL, LDL, triglycerides)
   - Inflammatory markers (hs-CRP, homocysteine)
   - Nutritional markers (ferritin, B12)
   - Adrenal markers (cortisol, DHEA-S)
   - Each result includes conventional AND functional reference ranges
6. **Supplements**: 2-6 active supplements with dosages and frequencies
7. **Medications**: 1-5 medications with proper prescribing information
8. **Clinical Assessments**: 1-2 assessments with diagnoses, ICD-10 codes, and clinical impressions
9. **Problem List**: 3-7 active or chronic problems with ICD-10 codes
10. **Treatment Plans**: 4-8 treatment interventions linked to assessments
11. **Timeline Events**: Regular timeline entries for labs, treatments, appointments
12. **FM Timeline Events**: 5-12 significant life events (traumas, illnesses, stressors, exposures)
13. **IFM Matrix Assessment**: Complete evaluation of all 7 functional medicine systems
14. **Lifestyle Assessment**: Comprehensive evaluation of sleep, exercise, nutrition, stress, environment
15. **Health Goals**: 2-5 SMART goals with progress tracking
16. **Food Sensitivities**: 0-5 food intolerances with testing methods and reactions

## Data Variety

The script ensures variety in test data:

- **Patient archetypes**: Chronic fatigue, gut health issues, hormonal imbalances, autoimmune conditions, metabolic syndrome
- **Lab trends**: Some improving, some stable, some declining
- **Result zones**: Mix of optimal, functional deviation, and abnormal values
- **Status variety**: Active, inactive, discontinued, resolved
- **Temporal distribution**: Events spread across realistic timeframes
- **Severity levels**: Mild, moderate, severe conditions
- **Treatment responses**: Successes and ongoing challenges

## Data Safety

- **Service role bypasses RLS**: The script uses the service role key which bypasses all Row Level Security policies
- **Foreign key constraints respected**: All data maintains referential integrity
- **No data deletion**: The script only creates new records, never modifies or deletes existing data
- **Idempotent design**: Can be run multiple times (will create additional patients each time)
- **Clinic scoping**: All data is properly scoped to clinics and attributed to real users

## Troubleshooting

### "Missing required environment variables"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env` file
- Check that `.env` file is in the project root directory

### "No clinics found in database"
- Run migrations first: `supabase db push` or apply migrations manually
- Ensure clinics table has at least one record

### "No users found for clinic"
- Run `npm run seed-admins` first to create admin users
- Each clinic needs at least one user for data attribution

### RLS Policy Errors
- This should NOT happen with service role key
- If it does, verify you're using `SUPABASE_SERVICE_ROLE_KEY` and not `VITE_SUPABASE_ANON_KEY`

## Cleanup (Optional)

To remove test data, you can:

1. Delete specific patients through the UI
2. Use SQL to delete patients created after a certain date:
   ```sql
   DELETE FROM patients WHERE created_at > '2025-10-09';
   ```
3. Reset the database (⚠️ destroys ALL data):
   ```bash
   supabase db reset
   ```

## Testing Features

With seeded test data, you can now fully test:

- ✅ Patient chart views with complete medical histories
- ✅ Lab trending and visualization with multiple time points
- ✅ Functional medicine ranges and zone calculations
- ✅ FM Timeline with varied life events
- ✅ IFM Matrix assessments across all 7 systems
- ✅ Problem list management
- ✅ Medication reconciliation
- ✅ Treatment plan tracking
- ✅ Health goals progress monitoring
- ✅ Food sensitivity elimination protocols
- ✅ Lifestyle assessment comprehensive views
- ✅ Search and filter functionality
- ✅ Data export features
- ✅ Reporting and analytics

## Next Steps

After seeding data:

1. Log in to the application
2. Navigate to the Patients page
3. Select any patient to view their complete chart
4. Explore the Functional Medicine screen to see FM Timeline populated
5. View Lab Trends to see graphical representations
6. Test filtering and searching capabilities
7. Verify all data displays correctly across different views

## Support

For issues or questions:
- Check the console output for error messages
- Review the migration files in `supabase/migrations/`
- Verify database schema matches expected structure
- Ensure all edge functions are deployed
