"use client";

import React, { useEffect, useState } from "react";
import type { Pet } from "@/lib/pets";

interface Props {
  pet: Pet | null;
  onChange?: (updates: {
    ageYears?: number | null;
    weightKg?: number | null;
  }) => void;
}

export default function PetDetailsPanel({ pet, onChange }: Props) {
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [ageErr, setAgeErr] = useState<string | null>(null);
  const [weightErr, setWeightErr] = useState<string | null>(null);

  // Load pet details when pet changes
  useEffect(() => {
    if (!pet) {
      setAge("");
      setWeight("");
      setAgeErr(null);
      setWeightErr(null);
      return;
    }
    setAge(pet.ageYears != null ? String(pet.ageYears) : "");
    setWeight(pet.weightKg != null ? String(pet.weightKg) : "");
    setAgeErr(null);
    setWeightErr(null);
  }, [pet]);

  // Notify parent of changes
  useEffect(() => {
    const a = age === "" ? null : Number(age);
    const w = weight === "" ? null : Number(weight);
    onChange?.({ ageYears: a, weightKg: w });
  }, [age, weight, onChange]);

  // Validate inputs
  function validatePositiveNumber(value: string) {
    if (value === "") return null;
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return "Must be a positive number";
    return null;
  }

  useEffect(() => setAgeErr(validatePositiveNumber(age)), [age]);
  useEffect(() => setWeightErr(validatePositiveNumber(weight)), [weight]);

  return (
    <div className="border rounded-md p-4 space-y-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Pet Details</h3>
      {!pet ? (
        <div className="text-sm text-gray-700">
          Select a pet to view details.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <div className="font-medium text-gray-900">{pet.name}</div>
          </div>

          {/* Breed */}
          <div>
            <label className="text-sm font-medium text-gray-700">Breed</label>
            <div className="font-medium text-gray-900">{pet.breed || "—"}</div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <div className="font-medium text-gray-900">{pet.gender || "—"}</div>
          </div>

          {/* Age */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Age (years)
            </label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full border rounded px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              inputMode="numeric"
              placeholder="e.g. 3"
            />
            {ageErr && (
              <div className="mt-1 text-sm font-semibold text-red-700">
                {ageErr}
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Weight (kg)
            </label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border rounded px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              inputMode="decimal"
              placeholder="e.g. 12.5"
            />
            {weightErr && (
              <div className="mt-1 text-sm font-semibold text-red-700">
                {weightErr}
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="text-sm text-gray-700">
            You can update age or weight before calculating the BCS.
          </div>
        </div>
      )}
    </div>
  );
}
