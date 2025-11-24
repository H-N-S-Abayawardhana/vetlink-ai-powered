"use client";

// Simple mock client for pets using localStorage as a fallback store.
// The project uses `fetch('/api/..')` patterns; in absence of backend
// this module provides the same async functions and persists data
// to localStorage so the UI can be fully interactive during frontend-only work.

export type ActivityLevel = 'Low' | 'Medium' | 'High';

export interface Pet {
  id: string;
  type: 'dog' | 'cat' | 'other';
  name: string;
  breed?: string;
  weightKg?: number | null;
  activityLevel?: ActivityLevel;
  ageYears?: number | null;
  gender?: string | null;
  allergies?: string[];
  preferredDiet?: string | null;
  healthNotes?: string | null;
  vaccinationStatus?: string | null;
  avatarDataUrl?: string | null; // base64 image preview
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'vetlink:mock:pets';

function readStore(): Pet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Pet[];
  } catch (e) {
    console.error('Failed to read pets store', e);
    return [];
  }
}

function writeStore(pets: Pet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
  } catch (e) {
    console.error('Failed to write pets store', e);
  }
}

function nowIso() {
  return new Date().toISOString();
}

export async function listPets(): Promise<Pet[]> {
  // try real API first (non-blocking), fallback to localStorage
  try {
    const res = await fetch('/api/pets');
    if (res.ok) {
      const data = await res.json();
      return data.pets || [];
    }
  } catch (e) {
    // network not available or route missing
  }

  return readStore();
}

export async function getPet(id: string): Promise<Pet | null> {
  try {
    const res = await fetch(`/api/pets/${id}`);
    if (res.ok) {
      const data = await res.json();
      return data.pet || null;
    }
  } catch (e) {}

  const pets = readStore();
  return pets.find(p => p.id === id) || null;
}

export async function createPet(payload: Partial<Pet>): Promise<Pet> {
  try {
    const res = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.pet;
    }
  } catch (e) {}

  const pets = readStore();
  const id = String(Date.now());
  const now = nowIso();
  const newPet: Pet = {
    id,
    type: (payload.type as any) || 'dog',
    name: payload.name || 'Untitled',
    breed: payload.breed || null,
    weightKg: payload.weightKg ?? null,
    activityLevel: (payload.activityLevel as ActivityLevel) || 'Medium',
    ageYears: payload.ageYears ?? null,
    gender: payload.gender || null,
    allergies: payload.allergies || [],
    preferredDiet: payload.preferredDiet || null,
    healthNotes: payload.healthNotes || null,
    vaccinationStatus: payload.vaccinationStatus || null,
    avatarDataUrl: payload.avatarDataUrl || null,
    createdAt: now,
    updatedAt: now,
  };
  pets.unshift(newPet);
  writeStore(pets);
  return newPet;
}

export async function updatePet(id: string, payload: Partial<Pet>): Promise<Pet | null> {
  try {
    const res = await fetch(`/api/pets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.pet;
    }
  } catch (e) {}

  const pets = readStore();
  const idx = pets.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const now = nowIso();
  const updated: Pet = {
    ...pets[idx],
    ...payload,
    updatedAt: now,
  } as Pet;
  pets[idx] = updated;
  writeStore(pets);
  return updated;
}

export async function deletePet(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/pets/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {}

  const pets = readStore();
  const newPets = pets.filter(p => p.id !== id);
  writeStore(newPets);
  return true;
}

// Easy helper to seed sample dog if store empty
export function seedSampleDog() {
  const pets = readStore();
  if (pets.length === 0) {
    const now = nowIso();
    const samples: Pet[] = [
      {
        id: 'dog-' + (Date.now() + 1),
        type: 'dog',
        name: 'Buddy',
        breed: 'Golden Retriever',
        weightKg: 28,
        activityLevel: 'High',
        ageYears: 3,
        gender: 'Male',
        allergies: ['None'],
        preferredDiet: 'Dry kibble',
        healthNotes: 'Very friendly. No chronic illnesses.',
        vaccinationStatus: 'Up to date',
        avatarDataUrl: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dog-' + (Date.now() + 2),
        type: 'dog',
        name: 'Charlie',
        breed: 'Labrador Retriever',
        weightKg: 32,
        activityLevel: 'High',
        ageYears: 5,
        gender: 'Male',
        allergies: ['Pollen'],
        preferredDiet: 'Fish-based kibble',
        healthNotes: 'Prone to ear infections; monitor after baths.',
        vaccinationStatus: 'Due in 3 months',
        avatarDataUrl: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dog-' + (Date.now() + 3),
        type: 'dog',
        name: 'Daisy',
        breed: 'Beagle',
        weightKg: 12,
        activityLevel: 'Medium',
        ageYears: 4,
        gender: 'Female',
        allergies: ['Chicken'],
        preferredDiet: 'Grain-free wet food',
        healthNotes: 'Loves walks; watch weight.',
        vaccinationStatus: 'Up to date',
        avatarDataUrl: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dog-' + (Date.now() + 4),
        type: 'dog',
        name: 'Bella',
        breed: 'Poodle',
        weightKg: 18,
        activityLevel: 'Low',
        ageYears: 6,
        gender: 'Female',
        allergies: [],
        preferredDiet: 'Small-breed kibble',
        healthNotes: 'Dental care recommended; regular grooming.',
        vaccinationStatus: 'Up to date',
        avatarDataUrl: null,
        createdAt: now,
        updatedAt: now,
      }
    ];
    // prepend samples so newest appear first
    const newStore = [...samples.reverse(), ...pets];
    writeStore(newStore);
  }
}
