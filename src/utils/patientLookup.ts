/**
 * Enhanced patient lookup utilities for consistent patient-user relationships
 */

export interface PatientLookupResult {
  patient: any | null;
  strategy: 'name_match' | 'creator_match' | 'clinic_fallback' | 'none';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Find the current user's patient record using multiple fallback strategies
 */
export function findUserPatient(
  patients: any[], 
  user: any, 
  componentName: string = 'Unknown'
): PatientLookupResult {
  console.log(`🔍 Debug ${componentName} - Starting patient lookup:`, {
    userId: user.id,
    userEmail: user.email,
    userFullName: user.full_name,
    userClinicId: user.clinic_id,
    totalPatients: patients.length,
    clinicPatients: patients.filter(p => p.clinic_id === user.clinic_id).length
  });

  // Filter to only patients in the same clinic
  const clinicPatients = patients.filter(p => p.clinic_id === user.clinic_id);
  
  if (clinicPatients.length === 0) {
    console.log(`❌ ${componentName} - No patients found in clinic:`, user.clinic_id);
    return { patient: null, strategy: 'none', confidence: 'low' };
  }

  // Strategy 1: Try to find by matching name (highest confidence)
  if (user.full_name) {
    const [firstName, ...lastNameParts] = user.full_name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    const nameMatch = clinicPatients.find(p => 
      p.first_name?.trim().toLowerCase() === firstName?.trim().toLowerCase() &&
      p.last_name?.trim().toLowerCase() === lastName?.trim().toLowerCase()
    );
    
    if (nameMatch) {
      console.log(`✅ ${componentName} - Found patient by name match:`, {
        patientId: nameMatch.id,
        patientName: `${nameMatch.first_name} ${nameMatch.last_name}`,
        userFullName: user.full_name
      });
      return { patient: nameMatch, strategy: 'name_match', confidence: 'high' };
    }
  }

  // Strategy 2: Try to find by created_by or updated_by (medium confidence)
  const creatorMatch = clinicPatients.find(p => 
    p.created_by === user.id || p.updated_by === user.id
  );
  
  if (creatorMatch) {
    console.log(`✅ ${componentName} - Found patient by creator/updater:`, {
      patientId: creatorMatch.id,
      patientName: `${creatorMatch.first_name} ${creatorMatch.last_name}`,
      createdBy: creatorMatch.created_by,
      updatedBy: creatorMatch.updated_by,
      userId: user.id
    });
    return { patient: creatorMatch, strategy: 'creator_match', confidence: 'medium' };
  }

  // Strategy 3: As last resort, get the first patient in the clinic (low confidence)
  if (clinicPatients.length > 0) {
    const fallbackPatient = clinicPatients[0];
    console.log(`⚠️ ${componentName} - Using first patient in clinic as fallback:`, {
      patientId: fallbackPatient.id,
      patientName: `${fallbackPatient.first_name} ${fallbackPatient.last_name}`,
      totalClinicPatients: clinicPatients.length
    });
    return { patient: fallbackPatient, strategy: 'clinic_fallback', confidence: 'low' };
  }

  console.log(`❌ ${componentName} - No suitable patient found`);
  return { patient: null, strategy: 'none', confidence: 'low' };
}

/**
 * Validate that data items have required clinic_id for filtering
 */
export function validateDataClinicIds(data: any[], componentName: string = 'Unknown'): boolean {
  const itemsWithoutClinicId = data.filter(item => !item.clinic_id);
  
  if (itemsWithoutClinicId.length > 0) {
    console.warn(`⚠️ ${componentName} - Found ${itemsWithoutClinicId.length} items without clinic_id:`, 
      itemsWithoutClinicId.map(item => ({ id: item.id, clinic_id: item.clinic_id }))
    );
    return false;
  }
  
  console.log(`✅ ${componentName} - All ${data.length} items have clinic_id`);
  return true;
}

/**
 * Filter data by clinic and log the results
 */
export function filterDataByClinic(
  data: any[], 
  clinicId: string, 
  componentName: string = 'Unknown'
): any[] {
  const filtered = data.filter(item => item.clinic_id === clinicId);
  
  console.log(`🔍 ${componentName} - Clinic filtering results:`, {
    totalItems: data.length,
    filteredItems: filtered.length,
    targetClinicId: clinicId,
    uniqueClinicIds: [...new Set(data.map(item => item.clinic_id))],
    itemsWithoutClinicId: data.filter(item => !item.clinic_id).length
  });
  
  return filtered;
}