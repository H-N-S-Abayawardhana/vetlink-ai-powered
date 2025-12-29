// Helper utilities for pet records

export interface DbPetRow {
  id: number | string;
  owner_id: number | string;
  type: string;
  name: string;
  breed?: string | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  age_years?: number | null;
  bcs?: number | null;
  bcs_calculated_at?: string | null;
  gender?: string | null;
  allergies?: string[] | null;
  preferred_diet?: string | null;
  living_environment?: string | null;
  health_notes?: string | null;
  microchip_number?: string | null;
  microchip_implant_date?: string | null;
  spayed_neutered?: boolean | null;
  spay_neuter_date?: string | null;
  blood_type?: string | null;
  date_of_birth?: string | null;
  owner_phone?: string | null;
  secondary_contact_name?: string | null;
  secondary_contact_phone?: string | null;
  vet_clinic_name?: string | null;
  vet_clinic_phone?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function mapRowToPet(row: DbPetRow) {
  return {
    id: String(row.id),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    type: row.type,
    name: row.name,
    breed: row.breed || null,
    weightKg: row.weight_kg ?? null,
    bcs: row.bcs ?? null,
    bcsCalculatedAt: row.bcs_calculated_at || null,
    activityLevel: row.activity_level || null,
    ageYears: row.age_years ?? null,
    gender: row.gender || null,
    allergies: row.allergies || [],
    preferredDiet: row.preferred_diet || null,
    livingEnvironment: row.living_environment || null,
    healthNotes: row.health_notes || null,
    microchipNumber: row.microchip_number || null,
    microchipImplantDate: row.microchip_implant_date || null,
    spayedNeutered: row.spayed_neutered ?? null,
    spayNeuterDate: row.spay_neuter_date || null,
    bloodType: row.blood_type || null,
    dateOfBirth: row.date_of_birth || null,
    ownerPhone: row.owner_phone || null,
    secondaryContactName: row.secondary_contact_name || null,
    secondaryContactPhone: row.secondary_contact_phone || null,
    vetClinicName: row.vet_clinic_name || null,
    vetClinicPhone: row.vet_clinic_phone || null,
    avatarUrl: row.avatar_url || null,
    // Provide avatarDataUrl as an alias for frontend components that expect it
    avatarDataUrl: row.avatar_url || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}
