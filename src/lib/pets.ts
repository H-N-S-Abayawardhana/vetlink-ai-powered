"use client";

// Simple mock client for pets using localStorage as a fallback store.
// The project uses `fetch('/api/..')` patterns; in absence of backend
// this module provides the same async functions and persists data
// to localStorage so the UI can be fully interactive during frontend-only work.

export type ActivityLevel = "Low" | "Medium" | "High";

export interface Pet {
  id: string;
  ownerId?: string | null; // Owner's user ID
  ownerUsername?: string | null; // Present for SUPER_ADMIN list views
  ownerEmail?: string | null; // Present for SUPER_ADMIN list views
  name: string;
  breed?: string;
  weightKg?: number | null;
  bcs?: number | null;
  bcsCalculatedAt?: string | null;
  activityLevel?: ActivityLevel;
  ageYears?: number | null;
  gender?: string | null;
  allergies?: string[];
  preferredDiet?: string | null;
  livingEnvironment?: string | null;
  healthNotes?: string | null;
  // New professional profile fields
  microchipNumber?: string | null;
  microchipImplantDate?: string | null; // ISO date string
  spayedNeutered?: boolean | null;
  spayNeuterDate?: string | null; // ISO date string
  bloodType?: string | null;
  dateOfBirth?: string | null; // ISO date string
  ownerPhone?: string | null;
  secondaryContactName?: string | null;
  secondaryContactPhone?: string | null;
  vetClinicName?: string | null;
  vetClinicPhone?: string | null;
  avatarDataUrl?: string | null; // base64 image preview
  createdAt: string;
  updatedAt: string;
}

// This module is API-driven. LocalStorage mock/fallback has been removed.

function nowIso() {
  return new Date().toISOString();
}

export async function listPets(): Promise<Pet[]> {
  // API-only: fetch pets or return empty array on error
  try {
    const res = await fetch("/api/pets");
    if (!res.ok) {
      console.error("listPets: API responded with", res.status);
      return [];
    }
    const data = await res.json();
    return data.pets || [];
  } catch (e) {
    console.error("listPets error", e);
    return [];
  }
}

export async function getPet(id: string): Promise<Pet | null> {
  try {
    const res = await fetch(`/api/pets/${id}`);
    if (!res.ok) {
      console.error("getPet: API responded with", res.status);
      return null;
    }
    const data = await res.json();
    return data.pet || null;
  } catch (e) {
    console.error("getPet error", e);
    return null;
  }
}

export async function createPet(payload: Partial<Pet>): Promise<Pet> {
  // API-only create; throw on failure so callers can handle errors
  const res = await fetch("/api/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`createPet failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.pet;
}

export async function updatePet(
  id: string,
  payload: Partial<Pet>,
): Promise<Pet | null> {
  const res = await fetch(`/api/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("updatePet failed", res.status);
    return null;
  }

  const data = await res.json();
  return data.pet;
}

export async function deletePet(id: string): Promise<boolean> {
  const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
  if (!res.ok) {
    console.error("deletePet failed", res.status);
    return false;
  }
  return true;
}

// Easy helper to seed sample dog if store empty
// seeding helper removed; frontend is API-driven. Keep upload helper below.

// Upload avatar via server endpoint. Accepts pet id and a data URL (base64) and returns hosted URL.
export async function uploadAvatar(
  petId: string,
  dataUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(`/api/pets/${petId}/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.url || null;
    }
  } catch (e) {
    console.error("Avatar upload failed", e);
  }
  return null;
}
