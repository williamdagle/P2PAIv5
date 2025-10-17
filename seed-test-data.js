import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ========================================
// PATIENT DATA TEMPLATES
// ========================================

const FIRST_NAMES = {
  male: ['James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel'],
  female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
  neutral: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Sage', 'River']
};

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const MEDICAL_CONDITIONS = [
  { name: 'Chronic Fatigue Syndrome', icd10: 'G93.3', severity: 'moderate' },
  { name: 'Hypothyroidism', icd10: 'E03.9', severity: 'mild' },
  { name: 'Irritable Bowel Syndrome', icd10: 'K58.9', severity: 'moderate' },
  { name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', severity: 'moderate' },
  { name: 'Essential Hypertension', icd10: 'I10', severity: 'moderate' },
  { name: 'Generalized Anxiety Disorder', icd10: 'F41.1', severity: 'moderate' },
  { name: 'Major Depressive Disorder', icd10: 'F32.9', severity: 'moderate' },
  { name: 'Rheumatoid Arthritis', icd10: 'M06.9', severity: 'severe' },
  { name: 'Small Intestinal Bacterial Overgrowth', icd10: 'K90.89', severity: 'moderate' },
  { name: 'Adrenal Insufficiency', icd10: 'E27.40', severity: 'moderate' }
];

const ALLERGIES = [
  { allergen: 'Penicillin', type: 'medication', reaction: 'Hives and itching', severity: 'moderate' },
  { allergen: 'Peanuts', type: 'food', reaction: 'Anaphylaxis', severity: 'severe' },
  { allergen: 'Shellfish', type: 'food', reaction: 'Swelling and difficulty breathing', severity: 'severe' },
  { allergen: 'Gluten', type: 'food', reaction: 'Bloating and digestive distress', severity: 'mild' },
  { allergen: 'Dairy', type: 'food', reaction: 'Congestion and skin breakouts', severity: 'mild' },
  { allergen: 'Pollen', type: 'environmental', reaction: 'Sneezing and watery eyes', severity: 'mild' },
  { allergen: 'Dust Mites', type: 'environmental', reaction: 'Respiratory symptoms', severity: 'mild' },
  { allergen: 'Sulfa drugs', type: 'medication', reaction: 'Rash', severity: 'moderate' }
];

const SUPPLEMENTS = [
  { name: 'Vitamin D3', dosage: '5000 IU', frequency: 'once daily' },
  { name: 'Omega-3 Fish Oil', dosage: '2000 mg', frequency: 'twice daily' },
  { name: 'Magnesium Glycinate', dosage: '400 mg', frequency: 'before bed' },
  { name: 'Probiotics', dosage: '50 billion CFU', frequency: 'once daily' },
  { name: 'B-Complex', dosage: '1 capsule', frequency: 'once daily' },
  { name: 'CoQ10', dosage: '200 mg', frequency: 'once daily' },
  { name: 'Curcumin', dosage: '1000 mg', frequency: 'twice daily' },
  { name: 'Ashwagandha', dosage: '600 mg', frequency: 'twice daily' },
  { name: 'L-Glutamine', dosage: '5 g', frequency: 'twice daily' },
  { name: 'Zinc', dosage: '30 mg', frequency: 'once daily' }
];

const MEDICATIONS = [
  { name: 'Levothyroxine', dosage: '75 mcg', frequency: 'once daily', route: 'oral' },
  { name: 'Metformin', dosage: '500 mg', frequency: 'twice daily', route: 'oral' },
  { name: 'Lisinopril', dosage: '10 mg', frequency: 'once daily', route: 'oral' },
  { name: 'Sertraline', dosage: '50 mg', frequency: 'once daily', route: 'oral' },
  { name: 'Omeprazole', dosage: '20 mg', frequency: 'once daily', route: 'oral' }
];

const LAB_TESTS = [
  { name: 'Vitamin D, 25-OH', unit: 'ng/mL', convLow: 20, convHigh: 100, funcLow: 50, funcHigh: 80, category: 'Nutritional' },
  { name: 'TSH', unit: 'mIU/L', convLow: 0.4, convHigh: 4.0, funcLow: 1.0, funcHigh: 2.0, category: 'Thyroid' },
  { name: 'Free T4', unit: 'ng/dL', convLow: 0.8, convHigh: 1.8, funcLow: 1.1, funcHigh: 1.5, category: 'Thyroid' },
  { name: 'Free T3', unit: 'pg/mL', convLow: 2.3, convHigh: 4.2, funcLow: 3.0, funcHigh: 3.8, category: 'Thyroid' },
  { name: 'Fasting Glucose', unit: 'mg/dL', convLow: 70, convHigh: 99, funcLow: 75, funcHigh: 85, category: 'Metabolic' },
  { name: 'HbA1c', unit: '%', convLow: 4.0, convHigh: 5.6, funcLow: 4.5, funcHigh: 5.3, category: 'Metabolic' },
  { name: 'Ferritin', unit: 'ng/mL', convLow: 15, convHigh: 150, funcLow: 50, funcHigh: 100, category: 'Hematology' },
  { name: 'hs-CRP', unit: 'mg/L', convLow: 0, convHigh: 3.0, funcLow: 0, funcHigh: 1.0, category: 'Inflammation' },
  { name: 'Homocysteine', unit: 'umol/L', convLow: 5, convHigh: 15, funcLow: 6, funcHigh: 9, category: 'Cardiovascular' },
  { name: 'Total Cholesterol', unit: 'mg/dL', convLow: 125, convHigh: 200, funcLow: 150, funcHigh: 220, category: 'Lipids' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', convLow: 40, convHigh: 100, funcLow: 55, funcHigh: 90, category: 'Lipids' },
  { name: 'LDL Cholesterol', unit: 'mg/dL', convLow: 0, convHigh: 100, funcLow: 70, funcHigh: 100, category: 'Lipids' },
  { name: 'Triglycerides', unit: 'mg/dL', convLow: 0, convHigh: 150, funcLow: 50, funcHigh: 100, category: 'Lipids' },
  { name: 'Cortisol (AM)', unit: 'ug/dL', convLow: 6.0, convHigh: 23.0, funcLow: 12.0, funcHigh: 18.0, category: 'Adrenal' },
  { name: 'DHEA-S', unit: 'ug/dL', convLow: 80, convHigh: 560, funcLow: 200, funcHigh: 400, category: 'Adrenal' }
];

const FM_TIMELINE_EVENTS = [
  { type: 'trauma', category: 'physical', title: 'Motor Vehicle Accident', severity: 'severe' },
  { type: 'illness', category: 'physical', title: 'Severe Viral Infection', severity: 'moderate' },
  { type: 'stress', category: 'emotional', title: 'Job Loss', severity: 'high' },
  { type: 'life_event', category: 'emotional', title: 'Divorce', severity: 'high' },
  { type: 'exposure', category: 'environmental', title: 'Mold Exposure in Home', severity: 'moderate' },
  { type: 'symptom_onset', category: 'physical', title: 'Chronic Fatigue Began', severity: 'moderate' },
  { type: 'treatment', category: 'physical', title: 'Started Elimination Diet', severity: 'low' }
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function dateMonthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function yearsAgo(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

// ========================================
// PATIENT GENERATION
// ========================================

function generatePatient(clinicId, providerId) {
  const genderChoice = randomItem(['male', 'female', 'neutral']);
  const firstName = randomItem(FIRST_NAMES[genderChoice]);
  const lastName = randomItem(LAST_NAMES);
  const age = randomInt(25, 75);
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - age);

  return {
    clinic_id: clinicId,
    first_name: firstName,
    last_name: lastName,
    dob: birthDate.toISOString().split('T')[0],
    gender: genderChoice === 'neutral' ? randomItem(['male', 'female']) : genderChoice,
    patient_id: `PT${randomInt(10000, 99999)}`,
    created_by: providerId,
    is_deleted: false
  };
}

// ========================================
// MAIN SEEDING FUNCTION
// ========================================

async function seedTestData() {
  console.log('🌱 Starting test data generation...\n');

  try {
    // Fetch all clinics
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name');

    if (clinicsError) {
      console.error('❌ Error fetching clinics:', clinicsError);
      return;
    }

    if (!clinics || clinics.length === 0) {
      console.error('❌ No clinics found in database');
      return;
    }

    console.log(`📋 Found ${clinics.length} clinic(s)\n`);

    const results = {
      clinics: clinics.length,
      patients: 0,
      vitalSigns: 0,
      allergies: 0,
      immunizations: 0,
      labs: 0,
      supplements: 0,
      medications: 0,
      clinicalAssessments: 0,
      problems: 0,
      treatmentPlans: 0,
      timelineEvents: 0,
      fmTimelineEvents: 0,
      ifmAssessments: 0,
      lifestyleAssessments: 0,
      healthGoals: 0,
      foodSensitivities: 0,
      errors: []
    };

    // Process each clinic
    for (const clinic of clinics) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏥 Processing: ${clinic.name}`);
      console.log(`${'='.repeat(60)}\n`);

      // Get a user from this clinic for data attribution
      const { data: clinicUsers } = await supabase
        .from('users')
        .select('id')
        .eq('clinic_id', clinic.id)
        .limit(1);

      if (!clinicUsers || clinicUsers.length === 0) {
        console.log(`⚠️  No users found for clinic ${clinic.name}, skipping...`);
        continue;
      }

      const providerId = clinicUsers[0].id;

      // Check if patients already exist for this clinic
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('is_deleted', false);

      let patientsToProcess = [];

      if (existingPatients && existingPatients.length > 0) {
        console.log(`📋 Found ${existingPatients.length} existing patients for this clinic`);
        console.log(`🔄 Generating missing data for existing patients...\n`);
        patientsToProcess = existingPatients;
      } else {
        console.log(`➕ Creating 10 new patients for this clinic...\n`);
        // Generate 10 patients for this clinic
        for (let i = 0; i < 10; i++) {
          try {
            const patientData = generatePatient(clinic.id, providerId);
            console.log(`\n👤 Creating patient ${i + 1}/10: ${patientData.first_name} ${patientData.last_name}`);

            // Create patient
            const { data: patient, error: patientError } = await supabase
              .from('patients')
              .insert(patientData)
              .select()
              .single();

            if (patientError) {
              console.error(`  ❌ Failed to create patient:`, patientError.message);
              results.errors.push(`Patient creation: ${patientError.message}`);
              continue;
            }

            results.patients++;
            console.log(`  ✅ Patient created (ID: ${patient.id.substring(0, 8)}...)`);
            patientsToProcess.push(patient);

          } catch (error) {
            console.error(`  ❌ Error generating patient ${i + 1}:`, error.message);
            results.errors.push(`Patient ${i + 1}: ${error.message}`);
          }
        }
      }

      // Generate data for all patients
      for (let i = 0; i < patientsToProcess.length; i++) {
        const patient = patientsToProcess[i];
        console.log(`\n👤 Processing patient ${i + 1}/${patientsToProcess.length}: ${patient.first_name} ${patient.last_name}`);

        try {
          await generatePatientData(patient, clinic.id, providerId, results);
        } catch (error) {
          console.error(`  ❌ Error generating data for patient:`, error.message);
          results.errors.push(`Patient data: ${error.message}`);
        }
      }
    }

    // Print summary
    console.log('\n\n');
    console.log('='.repeat(60));
    console.log('📊 TEST DATA GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Clinics processed:          ${results.clinics}`);
    console.log(`Patients created:           ${results.patients}`);
    console.log(`Vital signs:                ${results.vitalSigns}`);
    console.log(`Allergies:                  ${results.allergies}`);
    console.log(`Immunizations:              ${results.immunizations}`);
    console.log(`Lab results:                ${results.labs}`);
    console.log(`Supplements:                ${results.supplements}`);
    console.log(`Medications:                ${results.medications}`);
    console.log(`Clinical assessments:       ${results.clinicalAssessments}`);
    console.log(`Problem list items:         ${results.problems}`);
    console.log(`Treatment plan items:       ${results.treatmentPlans}`);
    console.log(`Timeline events:            ${results.timelineEvents}`);
    console.log(`FM Timeline events:         ${results.fmTimelineEvents}`);
    console.log(`IFM Matrix assessments:     ${results.ifmAssessments}`);
    console.log(`Lifestyle assessments:      ${results.lifestyleAssessments}`);
    console.log(`Health goals:               ${results.healthGoals}`);
    console.log(`Food sensitivities:         ${results.foodSensitivities}`);
    console.log('='.repeat(60));

    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more`);
      }
    }

    console.log('\n✅ Test data generation complete!\n');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// ========================================
// GENERATE ALL DATA FOR ONE PATIENT
// ========================================

async function generatePatientData(patient, clinicId, providerId, results) {
  const patientId = patient.id;

  // 1. Vital Signs (3-7 entries over time)
  await generateVitalSigns(patientId, clinicId, providerId, results);

  // 2. Allergies (0-3 per patient)
  await generateAllergies(patientId, clinicId, providerId, results);

  // 3. Immunizations (2-5 per patient)
  await generateImmunizations(patientId, clinicId, providerId, results);

  // 4. Labs (5-15 results with trends)
  await generateLabs(patientId, clinicId, providerId, results);

  // 5. Supplements (2-6 per patient)
  await generateSupplements(patientId, clinicId, providerId, results);

  // 6. Medications (1-5 per patient)
  await generateMedications(patientId, clinicId, providerId, results);

  // 7. Clinical Assessment (1-2 per patient)
  await generateClinicalAssessments(patientId, clinicId, providerId, results);

  // 8. Problem List (3-7 problems)
  await generateProblemList(patientId, clinicId, providerId, results);

  // 9. Treatment Plans (linked to assessments)
  await generateTreatmentPlans(patientId, clinicId, providerId, results);

  // 10. FM Timeline Events (5-12 events)
  await generateFMTimelineEvents(patientId, clinicId, providerId, results);

  // 11. IFM Matrix Assessment (1 assessment)
  await generateIFMAssessment(patientId, clinicId, providerId, results);

  // 12. Lifestyle Assessment (1 assessment)
  await generateLifestyleAssessment(patientId, clinicId, providerId, results);

  // 13. Health Goals (2-5 goals)
  await generateHealthGoals(patientId, clinicId, providerId, results);

  // 14. Food Sensitivities (0-5 items)
  await generateFoodSensitivities(patientId, clinicId, providerId, results);

  console.log(`  ✅ All data generated for patient`);
}

// ========================================
// DATA GENERATION FUNCTIONS
// ========================================

async function generateVitalSigns(patientId, clinicId, providerId, results) {
  const count = randomInt(3, 7);

  for (let i = 0; i < count; i++) {
    const monthsBack = count - i;
    const weight = randomFloat(60, 100, 1);
    const height = randomFloat(160, 185, 1);
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

    const vitalData = {
      patient_id: patientId,
      clinic_id: clinicId,
      recorded_by: providerId,
      recorded_at: dateMonthsAgo(monthsBack),
      height_cm: height,
      weight_kg: weight,
      bmi: parseFloat(bmi),
      temperature_c: randomFloat(36.2, 37.2, 1),
      heart_rate_bpm: randomInt(60, 90),
      blood_pressure_systolic: randomInt(110, 140),
      blood_pressure_diastolic: randomInt(70, 90),
      respiratory_rate: randomInt(12, 18),
      oxygen_saturation: randomInt(95, 100),
      pain_scale: randomInt(0, 3)
    };

    const { error } = await supabase.from('vital_signs').insert(vitalData);

    if (error) {
      console.error(`    ❌ Vital signs error:`, error.message);
      results.errors.push(`Vital signs: ${error.message}`);
    } else {
      results.vitalSigns++;
    }
  }
}

async function generateAllergies(patientId, clinicId, providerId, results) {
  const count = randomInt(0, 3);
  const selectedAllergies = randomItems(ALLERGIES, count);

  for (const allergy of selectedAllergies) {
    const allergyData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      allergen: allergy.allergen,
      allergen_type: allergy.type,
      reaction: allergy.reaction,
      severity: allergy.severity,
      onset_date: yearsAgo(randomInt(1, 20)),
      status: 'active',
      verified: true
    };

    const { error } = await supabase.from('patient_allergies').insert(allergyData);

    if (error) {
      console.error(`    ❌ Allergy error:`, error.message);
      results.errors.push(`Allergy: ${error.message}`);
    } else {
      results.allergies++;
    }
  }
}

async function generateImmunizations(patientId, clinicId, providerId, results) {
  const vaccines = [
    'Influenza', 'Tdap', 'MMR', 'Hepatitis B', 'Pneumococcal',
    'Varicella', 'HPV', 'Meningococcal'
  ];

  const count = randomInt(2, 5);
  const selectedVaccines = randomItems(vaccines, count);

  for (const vaccine of selectedVaccines) {
    const immunizationData = {
      patient_id: patientId,
      clinic_id: clinicId,
      administered_by: providerId,
      vaccine_name: vaccine,
      administration_date: yearsAgo(randomInt(1, 10)),
      administration_site: randomItem(['Left arm', 'Right arm', 'Left thigh']),
      lot_number: `LOT${randomInt(10000, 99999)}`,
      manufacturer: randomItem(['Pfizer', 'Moderna', 'GSK', 'Merck']),
      route: 'IM',
      dose_amount: '0.5 mL'
    };

    const { error } = await supabase.from('patient_immunizations').insert(immunizationData);

    if (error) {
      console.error(`    ❌ Immunization error:`, error.message);
      results.errors.push(`Immunization: ${error.message}`);
    } else {
      results.immunizations++;
    }
  }
}

async function generateLabs(patientId, clinicId, providerId, results) {
  const count = randomInt(5, 15);
  const selectedTests = randomItems(LAB_TESTS, count);

  for (const test of selectedTests) {
    // Generate 1-3 results over time for trending
    const resultCount = randomInt(1, 3);

    for (let i = 0; i < resultCount; i++) {
      const monthsBack = resultCount === 1 ? 1 : (resultCount - i) * 3;

      // Generate result value based on functional range
      const rangeMid = (test.funcLow + test.funcHigh) / 2;
      const rangeSpread = test.funcHigh - test.funcLow;
      const variance = rangeSpread * 0.5; // Allow some variance
      const resultValue = randomFloat(rangeMid - variance, rangeMid + variance, 1);

      const labData = {
        patient_id: patientId,
        clinic_id: clinicId,
        ordered_by: providerId,
        created_by: providerId,
        updated_by: providerId,
        lab_name: test.name,
        test_type: test.name,
        result: resultValue.toString(),
        result_value: resultValue,
        unit: test.unit,
        conventional_range_low: test.convLow,
        conventional_range_high: test.convHigh,
        functional_range_low: test.funcLow,
        functional_range_high: test.funcHigh,
        result_date: dateMonthsAgo(monthsBack),
        is_deleted: false
      };

      const { error } = await supabase.from('labs').insert(labData);

      if (error) {
        console.error(`    ❌ Lab error:`, error.message);
        results.errors.push(`Lab: ${error.message}`);
      } else {
        results.labs++;
      }
    }
  }
}

async function generateSupplements(patientId, clinicId, providerId, results) {
  const count = randomInt(2, 6);
  const selectedSupplements = randomItems(SUPPLEMENTS, count);

  for (const supplement of selectedSupplements) {
    const supplementData = {
      patient_id: patientId,
      clinic_id: clinicId,
      recommended_by: providerId,
      created_by: providerId,
      updated_by: providerId,
      name: supplement.name,
      dosage: supplement.dosage,
      frequency: supplement.frequency,
      start_date: dateMonthsAgo(randomInt(1, 12)),
      is_deleted: false
    };

    const { error } = await supabase.from('supplements').insert(supplementData);

    if (error) {
      console.error(`    ❌ Supplement error:`, error.message);
      results.errors.push(`Supplement: ${error.message}`);
    } else {
      results.supplements++;
    }
  }
}

async function generateMedications(patientId, clinicId, providerId, results) {
  const count = randomInt(1, 5);
  const selectedMeds = randomItems(MEDICATIONS, count);

  for (const med of selectedMeds) {
    const medicationData = {
      patient_id: patientId,
      clinic_id: clinicId,
      prescribed_by: providerId,
      created_by: providerId,
      updated_by: providerId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: dateMonthsAgo(randomInt(1, 24)),
      is_deleted: false
    };

    const { error } = await supabase.from('medications').insert(medicationData);

    if (error) {
      console.error(`    ❌ Medication error:`, error.message);
      results.errors.push(`Medication: ${error.message}`);
    } else {
      results.medications++;
    }
  }
}

async function generateClinicalAssessments(patientId, clinicId, providerId, results) {
  const count = randomInt(1, 2);

  for (let i = 0; i < count; i++) {
    const condition = randomItem(MEDICAL_CONDITIONS);
    const assessmentData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      visit_date: dateMonthsAgo(i === 0 ? 1 : 6),
      primary_diagnosis: condition.name,
      primary_diagnosis_icd10: condition.icd10,
      clinical_impression: `Patient presents with symptoms consistent with ${condition.name}. Comprehensive evaluation completed.`,
      assessment_summary: 'Will monitor closely and adjust treatment as needed.',
      risk_stratification: randomItem(['low', 'moderate']),
      prognosis: 'Good with proper management'
    };

    const { error } = await supabase.from('clinical_assessments').insert(assessmentData);

    if (error) {
      console.error(`    ❌ Clinical assessment error:`, error.message);
      results.errors.push(`Clinical assessment: ${error.message}`);
    } else {
      results.clinicalAssessments++;
    }
  }
}

async function generateProblemList(patientId, clinicId, providerId, results) {
  const count = randomInt(3, 7);
  const selectedConditions = randomItems(MEDICAL_CONDITIONS, count);

  for (let idx = 0; idx < selectedConditions.length; idx++) {
    const condition = selectedConditions[idx];
    const problemData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      problem: condition.name,
      icd10_code: condition.icd10,
      onset_date: yearsAgo(randomInt(1, 10)),
      status: idx < 3 ? 'active' : randomItem(['active', 'chronic', 'resolved']),
      severity: condition.severity,
      priority: randomInt(2, 5)
    };

    const { error } = await supabase.from('problem_list').insert(problemData);

    if (error) {
      console.error(`    ❌ Problem list error:`, error.message);
      results.errors.push(`Problem list: ${error.message}`);
    } else {
      results.problems++;
    }
  }
}

async function generateTreatmentPlans(patientId, clinicId, providerId, results) {
  const count = randomInt(4, 8);
  const interventionTypes = ['medication', 'therapy', 'lifestyle', 'referral', 'monitoring'];

  for (let i = 0; i < count; i++) {
    const treatmentData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      intervention_type: randomItem(interventionTypes),
      intervention: `Treatment intervention ${i + 1} - detailed plan`,
      rationale: 'Based on clinical assessment and patient goals',
      start_date: dateMonthsAgo(randomInt(1, 6)),
      frequency: randomItem(['daily', 'weekly', 'as needed']),
      status: randomItem(['active', 'active', 'completed'])
    };

    const { error } = await supabase.from('treatment_plan_items').insert(treatmentData);

    if (error) {
      console.error(`    ❌ Treatment plan error:`, error.message);
      results.errors.push(`Treatment plan: ${error.message}`);
    } else {
      results.treatmentPlans++;
    }
  }
}

async function generateFMTimelineEvents(patientId, clinicId, providerId, results) {
  const count = randomInt(5, 12);
  const selectedEvents = randomItems(FM_TIMELINE_EVENTS, count);

  for (let i = 0; i < selectedEvents.length; i++) {
    const event = selectedEvents[i];
    const yearsBack = randomInt(1, 20);

    const eventData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      event_date: yearsAgo(yearsBack),
      event_type: event.type,
      category: event.category,
      title: event.title,
      description: `Significant ${event.type} event that may have contributed to current health status`,
      severity: event.severity,
      impact_on_health: 'Notable impact on patient wellbeing',
      related_symptoms: ['fatigue', 'pain', 'inflammation'].slice(0, randomInt(1, 3)),
      triggers_identified: ['stress', 'dietary factors'].slice(0, randomInt(0, 2)),
      source_table: 'timeline_events'
    };

    const { error } = await supabase.from('timeline_events').insert(eventData);

    if (error) {
      console.error(`    ❌ FM Timeline error:`, error.message);
      results.errors.push(`FM Timeline: ${error.message}`);
    } else {
      results.fmTimelineEvents++;
    }
  }

  // Also create regular timeline events for labs, meds, supplements
  const timelineData = [
    {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      event_date: dateMonthsAgo(3),
      event_type: 'Lab Work',
      title: 'Comprehensive Metabolic Panel',
      description: 'Routine lab work completed',
      severity: 'low',
      provider_id: providerId,
      is_deleted: false
    },
    {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      event_date: dateMonthsAgo(6),
      event_type: 'Treatment',
      title: 'Started Functional Medicine Protocol',
      description: 'Initiated comprehensive treatment approach',
      severity: 'medium',
      provider_id: providerId,
      is_deleted: false
    }
  ];

  for (const event of timelineData) {
    const { error } = await supabase.from('timeline_events').insert(event);
    if (error) {
      console.error(`    ❌ Timeline error:`, error.message);
      results.errors.push(`Timeline: ${error.message}`);
    } else {
      results.timelineEvents++;
    }
  }
}

async function generateIFMAssessment(patientId, clinicId, providerId, results) {
  const assessmentData = {
    patient_id: patientId,
    clinic_id: clinicId,
    created_by: providerId,
    assessment_date: dateMonthsAgo(1),
    assessment_name: 'Initial IFM Matrix Assessment',
    assimilation_status: randomItem(['optimal', 'suboptimal', 'impaired']),
    assimilation_findings: 'Digestive function evaluation completed',
    assimilation_interventions: 'Probiotics and digestive enzymes recommended',
    defense_repair_status: randomItem(['optimal', 'suboptimal']),
    defense_repair_findings: 'Immune function within normal limits',
    defense_repair_interventions: 'Vitamin D and zinc supplementation',
    energy_status: randomItem(['suboptimal', 'impaired']),
    energy_findings: 'Mitochondrial support indicated',
    energy_interventions: 'CoQ10 and B-vitamins',
    biotransformation_status: randomItem(['optimal', 'suboptimal']),
    biotransformation_findings: 'Detoxification pathways assessed',
    biotransformation_interventions: 'Liver support protocol',
    transport_status: 'optimal',
    transport_findings: 'Cardiovascular markers normal',
    communication_status: randomItem(['suboptimal', 'impaired']),
    communication_findings: 'Hormonal imbalances noted',
    communication_interventions: 'Hormone optimization protocol',
    structural_status: 'optimal',
    structural_findings: 'Musculoskeletal system intact',
    overall_summary: 'Comprehensive functional medicine assessment completed',
    priority_systems: ['Energy', 'Communication']
  };

  const { error } = await supabase.from('ifm_matrix_assessments').insert(assessmentData);

  if (error) {
    console.error(`    ❌ IFM assessment error:`, error.message);
    results.errors.push(`IFM assessment: ${error.message}`);
  } else {
    results.ifmAssessments++;
  }
}

async function generateLifestyleAssessment(patientId, clinicId, providerId, results) {
  const assessmentData = {
    patient_id: patientId,
    clinic_id: clinicId,
    created_by: providerId,
    assessment_date: dateMonthsAgo(1),
    sleep_hours_average: randomFloat(6, 8, 1),
    sleep_quality: randomItem(['poor', 'fair', 'good']),
    sleep_issues: ['insomnia', 'restless sleep'].slice(0, randomInt(0, 2)),
    exercise_frequency: randomItem(['1-2x/week', '3-5x/week', 'daily']),
    exercise_types: ['walking', 'yoga', 'strength training'].slice(0, randomInt(1, 3)),
    exercise_duration_minutes: randomInt(20, 60),
    movement_throughout_day: randomItem(['sedentary', 'light', 'moderate']),
    diet_type: randomItem(['standard', 'mediterranean', 'paleo', 'whole foods']),
    meals_per_day: randomInt(2, 4),
    water_intake_oz: randomInt(40, 80),
    stress_level: randomItem(['moderate', 'high']),
    stress_sources: ['work', 'family', 'health'].slice(0, randomInt(1, 3)),
    coping_mechanisms: ['exercise', 'meditation'].slice(0, randomInt(0, 2)),
    resilience_score: randomInt(5, 8),
    mindfulness_practice: randomItem([true, false]),
    social_support_level: randomItem(['moderate', 'strong']),
    home_environment_quality: 'Good',
    mold_exposure: randomItem([true, false])
  };

  const { error } = await supabase.from('lifestyle_assessments').insert(assessmentData);

  if (error) {
    console.error(`    ❌ Lifestyle assessment error:`, error.message);
    results.errors.push(`Lifestyle assessment: ${error.message}`);
  } else {
    results.lifestyleAssessments++;
  }
}

async function generateHealthGoals(patientId, clinicId, providerId, results) {
  const count = randomInt(2, 5);
  const goalTypes = ['symptom_reduction', 'lifestyle_change', 'lab_improvement', 'wellness'];

  for (let i = 0; i < count; i++) {
    const goalData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      goal_type: randomItem(goalTypes),
      priority: randomItem(['high', 'medium', 'low']),
      status: randomItem(['active', 'in_progress', 'achieved']),
      specific_goal: `Patient goal ${i + 1} - improve specific health outcome`,
      measurable_criteria: 'Tracked via symptoms and lab values',
      achievable_plan: 'Step-by-step protocol outlined',
      relevant_reason: 'Important for overall health improvement',
      time_bound_deadline: dateMonthsAgo(-3), // 3 months in future
      baseline_value: '5/10',
      target_value: '8/10',
      current_value: '6/10',
      progress_percentage: randomInt(20, 80)
    };

    const { error } = await supabase.from('health_goals').insert(goalData);

    if (error) {
      console.error(`    ❌ Health goal error:`, error.message);
      results.errors.push(`Health goal: ${error.message}`);
    } else {
      results.healthGoals++;
    }
  }
}

async function generateFoodSensitivities(patientId, clinicId, providerId, results) {
  const count = randomInt(0, 5);
  const foods = ['Gluten', 'Dairy', 'Eggs', 'Soy', 'Corn', 'Nightshades', 'Citrus', 'Nuts'];
  const selectedFoods = randomItems(foods, count);

  for (const food of selectedFoods) {
    const sensitivityData = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: providerId,
      food_item: food,
      sensitivity_type: randomItem(['intolerance', 'sensitivity', 'suspected']),
      reaction_symptoms: ['bloating', 'fatigue', 'skin issues'].slice(0, randomInt(1, 3)),
      reaction_severity: randomItem(['mild', 'moderate']),
      reaction_onset_time: randomItem(['immediate', '30min', 'hours']),
      testing_method: randomItem(['elimination_diet', 'IgG', 'clinical_observation']),
      test_date: dateMonthsAgo(randomInt(1, 6)),
      status: randomItem(['active', 'monitoring', 'eliminated'])
    };

    const { error } = await supabase.from('food_sensitivities').insert(sensitivityData);

    if (error) {
      console.error(`    ❌ Food sensitivity error:`, error.message);
      results.errors.push(`Food sensitivity: ${error.message}`);
    } else {
      results.foodSensitivities++;
    }
  }
}

// ========================================
// RUN THE SCRIPT
// ========================================

seedTestData().catch(console.error);
