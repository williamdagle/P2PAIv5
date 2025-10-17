/*
  # Seed Comprehensive Aesthetic Procedure Protocols

  ## Summary
  Seeds the database with comprehensive procedure protocols for all major non-surgical
  aesthetic procedures including injectables, skin rejuvenation, body contouring,
  hair restoration, and specialty treatments.

  ## Protocol Categories Covered
  
  ### Injectables
  - Botox/Neurotoxins
  - Dermal Fillers (HA-based)
  - Profhilo
  - Skin Boosters
  
  ### Skin Rejuvenation
  - Microneedling
  - Chemical Peels
  - Laser Treatments
  - HydraFacial
  
  ### Body Contouring
  - CoolSculpting
  - RF Skin Tightening
  - EMSCULPT
  
  ### Hair & Scalp
  - PRP Hair Restoration
  - Laser Hair Therapy
  
  ### Specialty Treatments
  - LED Therapy
  - IPL (Intense Pulsed Light)
  - Mesotherapy
  - Non-Surgical Rhinoplasty
  - Lip Augmentation

  ## Notes
  These are system-level protocols that serve as templates.
  Clinics can customize these for their specific needs.
*/

-- =====================================================
-- INJECTABLES: BOTOX/NEUROTOXINS
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  patient_screening_questions,
  required_consent_forms,
  typical_duration_minutes,
  typical_dosage_range,
  typical_areas,
  product_requirements,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  activity_restrictions,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days,
  maximum_interval_days
) VALUES (
  'Injectables - Neurotoxins',
  'Botox Treatment',
  '1.0',
  true,
  '[
    {"item": "Verify patient identity and treatment area", "required": true},
    {"item": "Review medical history and contraindications", "required": true},
    {"item": "Confirm no botox treatments in last 3 months", "required": true},
    {"item": "Photo documentation - before", "required": true},
    {"item": "Mark injection sites", "required": false},
    {"item": "Topical anesthetic if requested", "required": false}
  ]'::jsonb,
  ARRAY[
    'Pregnancy or breastfeeding',
    'Neuromuscular disorders (myasthenia gravis, ALS)',
    'Allergy to botulinum toxin or albumin',
    'Infection at injection site',
    'Taking aminoglycoside antibiotics'
  ],
  '[
    {"question": "Have you had Botox or similar treatments before?", "type": "yes_no"},
    {"question": "Do you have any neuromuscular conditions?", "type": "yes_no"},
    {"question": "Are you currently pregnant or breastfeeding?", "type": "yes_no"},
    {"question": "What are your treatment goals?", "type": "text"}
  ]'::jsonb,
  ARRAY['Botox Consent Form', 'Photo Release'],
  20,
  '20-50 units typical face',
  ARRAY['Forehead', 'Glabella', 'Crow''s Feet', 'Bunny Lines'],
  '[
    {"product": "Botox/Dysport/Xeomin", "typical_amount": "20-50 units"},
    {"product": "Alcohol wipes", "typical_amount": "multiple"},
    {"product": "30G needle", "typical_amount": "1-2"}
  ]'::jsonb,
  ARRAY['Insulin syringes 30G', 'Ice packs', 'Marking pencil'],
  'Reconstitute according to manufacturer guidelines. Use small volumes (0.1ml per site). Inject intramuscularly at appropriate depths. Avoid massaging treated areas.',
  'Remain upright for 4 hours. No exercise, facials, or lying down for 4 hours. Avoid touching/rubbing treated areas. No alcohol for 24 hours.',
  'Results visible in 3-7 days, peak at 2 weeks. Smooth appearance of dynamic wrinkles. Natural facial expressions maintained.',
  ARRAY['Bruising', 'Swelling', 'Headache', 'Temporary weakness', 'Asymmetry', 'Ptosis (rare)'],
  '{
    "no_exercise": "4 hours",
    "no_lying_down": "4 hours",
    "no_facials": "24 hours",
    "no_makeup": "4 hours"
  }'::jsonb,
  '2-week assessment recommended',
  90,
  105,
  180
) ON CONFLICT DO NOTHING;

-- =====================================================
-- INJECTABLES: DERMAL FILLERS
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  patient_screening_questions,
  typical_duration_minutes,
  typical_dosage_range,
  typical_areas,
  product_requirements,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  activity_restrictions,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days,
  maximum_interval_days
) VALUES (
  'Injectables - Dermal Fillers',
  'Hyaluronic Acid Filler Treatment',
  '1.0',
  true,
  '[
    {"item": "Verify patient identity and treatment plan", "required": true},
    {"item": "Review medical history", "required": true},
    {"item": "Photo documentation - multiple angles", "required": true},
    {"item": "Apply topical anesthetic cream", "required": true},
    {"item": "Mark injection sites and volumes", "required": true},
    {"item": "Ice treatment area pre-procedure", "required": false}
  ]'::jsonb,
  ARRAY[
    'Pregnancy or breastfeeding',
    'Active infection or inflammation at site',
    'Allergy to hyaluronic acid or lidocaine',
    'History of severe allergic reactions',
    'Bleeding disorders or anticoagulant therapy'
  ],
  '[
    {"question": "Have you had dermal fillers before?", "type": "yes_no"},
    {"question": "Any history of cold sores in treatment area?", "type": "yes_no"},
    {"question": "Taking blood thinners or aspirin?", "type": "yes_no"}
  ]'::jsonb,
  45,
  '0.5-2ml per area',
  ARRAY['Nasolabial Folds', 'Marionette Lines', 'Lips', 'Cheeks', 'Under Eyes', 'Jawline'],
  '[
    {"product": "HA Filler (e.g., Juvederm, Restylane)", "typical_amount": "1-2 syringes"},
    {"product": "Topical anesthetic cream", "typical_amount": "as needed"},
    {"product": "25-27G needle or cannula", "typical_amount": "1-2"}
  ]'::jsonb,
  'Use appropriate technique for area (serial puncture, linear threading, cross-hatching). Aspirate before injection. Massage gently to shape. Consider cannula for certain areas to minimize bruising.',
  'Apply ice 10-15 minutes every hour for first 4 hours. Avoid strenuous exercise for 24-48 hours. Sleep elevated first night. Avoid dental work for 2 weeks. No alcohol for 24 hours.',
  'Immediate volume enhancement visible. Final results after swelling subsides (3-7 days). Natural-looking volume restoration. Results last 6-18 months depending on product and area.',
  ARRAY['Bruising', 'Swelling', 'Redness', 'Tenderness', 'Lumps/bumps', 'Asymmetry', 'Vascular occlusion (rare)', 'Infection (rare)'],
  '{
    "no_exercise": "24-48 hours",
    "no_dental_work": "2 weeks",
    "avoid_heat": "1 week",
    "sleep_elevated": "first night"
  }'::jsonb,
  '2-week follow-up for assessment, touch-up if needed',
  180,
  270,
  540
) ON CONFLICT DO NOTHING;

-- =====================================================
-- INJECTABLES: PROFHILO
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_dosage_range,
  typical_areas,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days,
  maximum_interval_days
) VALUES (
  'Injectables - Skin Boosters',
  'Profhilo Treatment',
  '1.0',
  true,
  '[
    {"item": "Confirm patient completed first treatment 4 weeks ago (if second session)", "required": true},
    {"item": "Clean and disinfect treatment areas", "required": true},
    {"item": "Mark BAP points (Bio Aesthetic Points)", "required": true},
    {"item": "Photo documentation", "required": true}
  ]'::jsonb,
  ARRAY[
    'Pregnancy or breastfeeding',
    'Active skin infection',
    'Allergy to hyaluronic acid',
    'Keloid scarring tendency'
  ],
  20,
  '1 syringe (2ml) per session',
  ARRAY['Full Face', 'Neck', 'Décolletage', 'Hands'],
  'Use BAP technique: 5 points each side of face. Inject slowly using 29G needle. Do not massage. Allow product to spread naturally via tissue integration.',
  'No massage or manipulation of treated areas. Avoid makeup for 6 hours. No exercise for 6 hours. Gentle skincare only for 48 hours. Stay hydrated.',
  'Two treatments 4 weeks apart recommended. Visible skin tightening and hydration. Improved skin quality and texture. Bio-remodeling effects develop over 4-8 weeks. Results last 6-9 months.',
  ARRAY['Mild swelling', 'Redness at injection points', 'Tenderness', 'Small papules (resolve in 24 hours)'],
  '4 weeks between first and second treatment. Maintenance every 6-9 months.',
  28,
  28,
  42
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SKIN REJUVENATION: MICRONEEDLING
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  activity_restrictions,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days,
  maximum_interval_days
) VALUES (
  'Skin Rejuvenation',
  'Microneedling with RF',
  '1.0',
  true,
  '[
    {"item": "Cleanse face thoroughly", "required": true},
    {"item": "Apply topical anesthetic 30-45 minutes", "required": true},
    {"item": "Photo documentation - multiple angles", "required": true},
    {"item": "Remove anesthetic and cleanse again", "required": true},
    {"item": "Prepare microneedling device", "required": true}
  ]'::jsonb,
  ARRAY[
    'Active acne or infection',
    'Open wounds',
    'Eczema or psoriasis (active)',
    'History of keloids',
    'Blood clotting disorders',
    'Use of isotretinoin in past 6 months',
    'Pregnancy'
  ],
  60,
  ARRAY['Full Face', 'Neck', 'Décolletage', 'Acne Scars'],
  ARRAY['Microneedling device', 'Sterile needles/tips', 'Topical anesthetic', 'Hyaluronic acid serum', 'LED light'],
  'Set appropriate needle depth (0.5-2.5mm based on area and concern). Use systematic pattern. Multiple passes. Apply serums during treatment. Finish with LED therapy if available.',
  'Apply healing serum immediately. Use SPF 50+ daily. Avoid direct sun for 1 week. No makeup for 24 hours. Gentle cleanser only for 48 hours. Avoid retinol and acids for 1 week. Keep skin hydrated.',
  'Improved skin texture and tone. Reduced fine lines and wrinkles. Minimized pore size. Reduced acne scarring. Increased collagen production. Results progressive over 4-6 weeks. 3-6 treatments recommended.',
  ARRAY['Redness (24-48 hours)', 'Mild swelling', 'Dryness', 'Flaking', 'Pinpoint bleeding', 'Temporary sensitivity'],
  '{
    "no_makeup": "24 hours",
    "no_exercise": "24 hours",
    "no_sun_exposure": "1 week",
    "no_swimming": "48 hours"
  }'::jsonb,
  'Series of 3-6 treatments, 4-6 weeks apart',
  28,
  42,
  56
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SKIN REJUVENATION: CHEMICAL PEELS
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Skin Rejuvenation',
  'Chemical Peel Treatment',
  '1.0',
  true,
  '[
    {"item": "Confirm pre-treatment skin prep completed", "required": true},
    {"item": "Cleanse and degrease skin", "required": true},
    {"item": "Photo documentation", "required": true},
    {"item": "Determine peel strength and layers", "required": true},
    {"item": "Test patch if first treatment", "required": false}
  ]'::jsonb,
  ARRAY[
    'Pregnancy or breastfeeding',
    'Active herpes simplex (treat prophylactically)',
    'Open wounds or active infections',
    'Recent isotretinoin use (6 months)',
    'Eczema or psoriasis',
    'Keloid tendency'
  ],
  30,
  ARRAY['Full Face', 'Neck', 'Chest', 'Hands', 'Back'],
  'Apply evenly using gauze or brush. Start with lower concentration for first treatment. Time carefully based on peel type. Neutralize if required. Multiple layers may be applied based on Frosting level.',
  'Gentle cleanser only. Heavy moisturizer multiple times daily. SPF 50+ mandatory. No picking or peeling. Avoid heat and sweating for 48 hours. Expect peeling days 3-7.',
  'Improved skin texture and tone. Reduced hyperpigmentation. Minimized fine lines. Brighter complexion. Even skin tone. Progressive results with series. Maintenance every 4-6 weeks for optimal results.',
  ARRAY['Redness', 'Peeling', 'Dryness', 'Temporary darkening', 'Sensitivity', 'Breakouts (purging)', 'Hyperpigmentation (rare)'],
  'Series of 4-6 treatments recommended, 2-4 weeks apart',
  14,
  28
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SKIN REJUVENATION: LASER TREATMENTS
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Skin Rejuvenation',
  'Laser Skin Resurfacing',
  '1.0',
  true,
  '[
    {"item": "Verify no recent sun exposure or tanning", "required": true},
    {"item": "Photo documentation", "required": true},
    {"item": "Skin prep and cleansing", "required": true},
    {"item": "Apply topical anesthetic if required", "required": true},
    {"item": "Eye protection for patient and staff", "required": true}
  ]'::jsonb,
  ARRAY[
    'Recent sun exposure or tan',
    'Darker skin types (Fitzpatrick IV-VI) for ablative',
    'Active infection or acne',
    'Isotretinoin in past 6-12 months',
    'Pregnancy',
    'History of keloids',
    'Photosensitizing medications'
  ],
  45,
  ARRAY['Laser device', 'Eye protection', 'Cooling device', 'Topical anesthetic', 'Post-treatment healing cream'],
  'Systematic coverage with appropriate overlap. Adjust settings based on skin type and treatment area. Use cooling throughout. Monitor endpoint reactions. May require multiple passes.',
  'Apply healing ointment frequently. Keep skin moist. Gentle cleansing only. SPF 50+ when outside. Avoid sun exposure for 4-6 weeks. No makeup until skin healed. Expect redness and peeling.',
  'Significant improvement in skin texture, tone, and quality. Reduced wrinkles and fine lines. Minimized pore size. Reduced sun damage and age spots. Collagen remodeling. Progressive results over 3-6 months.',
  ARRAY['Redness (1-2 weeks)', 'Swelling', 'Crusting', 'Peeling', 'Sensitivity', 'Hyperpigmentation', 'Prolonged erythema', 'Infection (rare)'],
  90,
  180
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SKIN REJUVENATION: HYDRAFACIAL
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Skin Rejuvenation',
  'HydraFacial Treatment',
  '1.0',
  true,
  '[
    {"item": "Remove makeup and cleanse face", "required": true},
    {"item": "Photo documentation", "required": true},
    {"item": "Select appropriate serums for skin type", "required": true},
    {"item": "Prepare HydraFacial device", "required": true}
  ]'::jsonb,
  ARRAY[
    'Active rash or sunburn',
    'Recent laser treatment (2 weeks)',
    'Severe inflammatory acne'
  ],
  45,
  ARRAY['Full Face', 'Neck', 'Chest', 'Back'],
  ARRAY['HydraFacial device', 'Cleansing solution', 'Exfoliating tip', 'Extraction tip', 'Hydrating serums', 'LED light'],
  'Cleanse, exfoliate, extract, hydrate in systematic sequence. Use gentle suction. Multiple passes in each zone. Apply appropriate serums. Finish with LED therapy. Can add boosters for specific concerns.',
  'Gentle skincare routine. SPF protection daily. Avoid harsh products for 24 hours. Can apply makeup immediately. Stay hydrated. Avoid excessive sun exposure.',
  'Immediate glow and hydration. Improved skin texture. Clearer pores. Reduced fine lines. Brightened complexion. No downtime. Monthly treatments recommended for optimal maintenance.',
  'Monthly maintenance recommended',
  14,
  28
) ON CONFLICT DO NOTHING;

-- =====================================================
-- BODY CONTOURING: COOLSCULPTING
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Body Contouring',
  'CoolSculpting (Cryolipolysis)',
  '1.0',
  true,
  '[
    {"item": "Confirm patient BMI appropriate (not for weight loss)", "required": true},
    {"item": "Photo documentation - multiple angles", "required": true},
    {"item": "Mark treatment areas and measure fat pinch", "required": true},
    {"item": "Apply gel pad", "required": true},
    {"item": "Explain sensation expectations", "required": true}
  ]'::jsonb,
  ARRAY[
    'Cryoglobulinemia',
    'Cold agglutinin disease',
    'Paroxysmal cold hemoglobinuria',
    'Pregnancy',
    'Hernia in treatment area',
    'Recent surgery in area'
  ],
  60,
  ARRAY['Abdomen', 'Flanks', 'Thighs', 'Upper Arms', 'Back Fat', 'Submental', 'Banana Roll'],
  ARRAY['CoolSculpting device', 'Applicators (various sizes)', 'Gel pads', 'Massage tool'],
  'Select appropriate applicator for area and fat thickness. Position carefully for maximum coverage. 35-60 minute cycles depending on applicator. Perform 2-minute massage immediately after to enhance results.',
  'Normal activities immediately. Massage treated area daily for 5 minutes. Stay hydrated. Maintain healthy diet and exercise. Expect temporary numbness, redness, firmness.',
  'Gradual fat reduction over 8-12 weeks. 20-25% fat reduction per treatment in treated area. Natural-looking contour improvement. May require multiple treatments for optimal results. Results permanent if weight maintained.',
  ARRAY['Temporary numbness', 'Redness', 'Bruising', 'Swelling', 'Firmness', 'Tingling', 'Cramping', 'Paradoxical adipose hyperplasia (rare 0.05%)'],
  'Follow-up photos at 8-12 weeks. Additional treatments may be scheduled 6-8 weeks after initial',
  42,
  84
) ON CONFLICT DO NOTHING;

-- =====================================================
-- BODY CONTOURING: RF SKIN TIGHTENING
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Body Contouring',
  'RF Skin Tightening',
  '1.0',
  true,
  '[
    {"item": "Remove all jewelry and metal objects", "required": true},
    {"item": "Photo documentation", "required": true},
    {"item": "Mark treatment grid", "required": true},
    {"item": "Apply conducting gel", "required": true}
  ]'::jsonb,
  45,
  ARRAY['Abdomen', 'Arms', 'Thighs', 'Face', 'Neck', 'Buttocks'],
  ARRAY['RF device', 'Conducting gel', 'Cooling system'],
  'Systematic coverage with appropriate overlap. Maintain skin contact. Monitor temperature. Use circular or linear motions. Multiple passes in each zone. Adjust power based on patient tolerance and tissue response.',
  'No special aftercare required. May have mild redness for few hours. Normal activities immediately. Stay hydrated. Results progressive with collagen remodeling.',
  'Gradual skin tightening over 3-6 months. Improved skin texture and tone. Non-invasive with no downtime. Series of 4-6 treatments recommended. Maintenance treatments every 6-12 months.',
  'Series of 4-6 treatments, 2-4 weeks apart recommended',
  14,
  28
) ON CONFLICT DO NOTHING;

-- =====================================================
-- BODY CONTOURING: EMSCULPT
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Body Contouring',
  'EMSCULPT Muscle Building',
  '1.0',
  true,
  '[
    {"item": "Confirm no metal implants or electronic devices", "required": true},
    {"item": "Photo documentation and measurements", "required": true},
    {"item": "Explain sensation - intense muscle contractions", "required": true},
    {"item": "Position applicators correctly", "required": true}
  ]'::jsonb,
  ARRAY[
    'Pregnancy',
    'Metal implants in treatment area',
    'Cardiac pacemaker or defibrillator',
    'Electronic implants',
    'Recent surgery (3 months)',
    'Hernias'
  ],
  30,
  ARRAY['Abdomen', 'Buttocks', 'Arms', 'Calves'],
  'Position applicators on target muscle group. Start at lower intensity. Gradually increase to maximum tolerated. Treatment cycles through different contraction patterns. 4 treatments minimum over 2 weeks.',
  'Normal activities immediately. Drink plenty of water. May feel muscle soreness like after workout. Continue regular exercise program. Maintain healthy diet.',
  'Muscle building and toning visible after 2-4 weeks. Fat reduction in treated area. Average 16% muscle increase. 19% fat reduction. Results continue to improve for 2-4 weeks after treatment series. Maintenance every 3-6 months.',
  'Minimum 4 treatments over 2 weeks (2 per week). Results assessment at 4 weeks post-final treatment',
  2,
  3
) ON CONFLICT DO NOTHING;

-- =====================================================
-- HAIR & SCALP: PRP HAIR RESTORATION
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Hair & Scalp Treatments',
  'PRP Hair Restoration',
  '1.0',
  true,
  '[
    {"item": "Wash hair morning of treatment", "required": true},
    {"item": "Photo documentation - multiple angles", "required": true},
    {"item": "Draw blood for PRP preparation", "required": true},
    {"item": "Clean and mark injection grid on scalp", "required": true},
    {"item": "Apply topical anesthetic if requested", "required": false}
  ]'::jsonb,
  ARRAY[
    'Active infection on scalp',
    'Blood disorders',
    'Platelet dysfunction',
    'Taking anticoagulants',
    'Cancer diagnosis',
    'Severe anemia'
  ],
  60,
  ARRAY['Scalp - Crown', 'Scalp - Frontal', 'Scalp - Full', 'Eyebrows', 'Beard'],
  ARRAY['Blood collection tubes', 'Centrifuge', 'Insulin syringes 30G', 'Topical anesthetic', 'Gloves'],
  'Draw 20-60ml blood. Centrifuge per protocol. Extract PRP layer. Inject 0.05-0.1ml per point in grid pattern 1cm apart. Cover entire treatment area. Multiple passes if sufficient PRP. Can combine with microneedling.',
  'No hair washing for 24 hours. Avoid touching scalp for 6 hours. No hair products for 24 hours. Avoid strenuous exercise for 24 hours. May have mild soreness. Normal activities next day.',
  'Gradual improvement in hair density and thickness over 3-6 months. Decreased shedding. New hair growth stimulation. Improved hair quality. Series of 3-4 treatments recommended. Maintenance every 6-12 months.',
  'Series of 3-4 treatments initially, 4-6 weeks apart. Maintenance every 6-12 months',
  28,
  42
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SPECIALTY: LED LIGHT THERAPY
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  typical_duration_minutes,
  typical_areas,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  optimal_interval_days
) VALUES (
  'Specialty Treatments',
  'LED Light Therapy',
  '1.0',
  true,
  20,
  ARRAY['Full Face', 'Neck', 'Chest', 'Back', 'Localized Areas'],
  ARRAY['LED light panel or mask', 'Eye protection'],
  'Cleanse skin thoroughly. Position LED device at appropriate distance (typically 6-12 inches). Select wavelength based on concern (Red: anti-aging, Blue: acne, Yellow: redness). Patient relaxes during treatment. Can be standalone or add-on to other treatments.',
  'No special aftercare. Apply serum and moisturizer. Continue normal skincare routine. Can apply makeup immediately.',
  'Red light: Increased collagen, reduced fine lines, improved skin tone. Blue light: Reduced acne bacteria, clearer skin. Yellow light: Reduced redness, calming. Cumulative results with regular treatments. Safe for all skin types.',
  7
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SPECIALTY: IPL PHOTOFACIAL
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  equipment_required,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  follow_up_timeline,
  minimum_interval_days,
  optimal_interval_days
) VALUES (
  'Specialty Treatments',
  'IPL Photofacial',
  '1.0',
  true,
  '[
    {"item": "Verify no recent sun exposure (4 weeks)", "required": true},
    {"item": "Photo documentation", "required": true},
    {"item": "Cleanse and shave treatment area if needed", "required": true},
    {"item": "Apply cooling gel", "required": true},
    {"item": "Eye protection for patient", "required": true}
  ]'::jsonb,
  ARRAY[
    'Recent sun exposure or tan',
    'Darker skin types (Fitzpatrick V-VI)',
    'Active infection',
    'Photosensitizing medications',
    'Pregnancy',
    'History of keloids'
  ],
  30,
  ARRAY['IPL device', 'Eye protection', 'Cooling gel', 'Ultrasound gel'],
  'Apply gel liberally. Adjust settings for skin type and concern. Systematic coverage with slight overlap. Deliver pulses with appropriate cooling. Avoid bony prominences. Typical 1-2 passes.',
  'Apply aloe or healing cream. SPF 50+ mandatory. Avoid sun for 2 weeks. Expect darkening of pigmented spots (will flake off in 1-2 weeks). No harsh products for 48 hours. Keep skin hydrated.',
  'Reduced sun damage and age spots. Even skin tone. Reduced redness and broken capillaries. Improved skin texture. Progressive results over 3-5 treatments. Minimal downtime.',
  'Series of 3-5 treatments recommended, 3-4 weeks apart',
  21,
  28
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SPECIALTY: NON-SURGICAL RHINOPLASTY
-- =====================================================

INSERT INTO aesthetic_procedure_protocols (
  procedure_category,
  procedure_name,
  protocol_version,
  is_system_protocol,
  pre_treatment_checklist,
  contraindications,
  typical_duration_minutes,
  typical_dosage_range,
  technique_guidelines,
  post_care_instructions,
  expected_results,
  possible_side_effects,
  follow_up_timeline,
  optimal_interval_days
) VALUES (
  'Specialty Treatments',
  'Non-Surgical Rhinoplasty',
  '1.0',
  true,
  '[
    {"item": "Detailed consultation and treatment plan", "required": true},
    {"item": "Photo documentation - multiple angles", "required": true},
    {"item": "Mark injection points precisely", "required": true},
    {"item": "Apply topical anesthetic", "required": true},
    {"item": "Review vascular anatomy", "required": true}
  ]'::jsonb,
  ARRAY[
    'Previous surgical rhinoplasty complications',
    'Active nose infection',
    'Unrealistic expectations',
    'Vascular insufficiency in area',
    'Pregnancy'
  ],
  30,
  '0.3-1.0ml total',
  'CRITICAL: High-risk procedure - detailed anatomical knowledge required. Use cannula preferred. Small aliquots. Aspirate before every injection. Build gradually. Focus on camouflage, not volumization. Common areas: bridge, tip support, nostril asymmetry correction.',
  'Ice frequently first 24 hours. Sleep elevated. No pressure on nose. Avoid glasses for 2 weeks. No strenuous activity for 48 hours. Monitor for vascular compromise symptoms. Immediate contact if blanching, pain, or vision changes.',
  'Improved nasal contour and symmetry. Smoother dorsal profile. Enhanced tip projection. Results immediate. Duration 9-18 months. Temporary solution - not permanent like surgery.',
  ARRAY['Bruising', 'Swelling', 'Asymmetry', 'Vascular occlusion (serious - rare)', 'Migration', 'Tyndall effect'],
  '2-week assessment and touch-up if needed',
  270
) ON CONFLICT DO NOTHING;