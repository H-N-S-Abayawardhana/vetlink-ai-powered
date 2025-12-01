"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { listPets, updatePet, type Pet } from "@/lib/pets";
import PetCardBCS from "./PetCardBCS";
import PetDetailsModal from "./PetDetailsModal";
import ResultsPanel from "./ResultsPanel";

export default function BCSCalculator() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updates, setUpdates] = useState<{ ageYears?: number | null; weightKg?: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const p = await listPets();
      setPets(p);
    }
    load();
  }, []);

  function onSelectPet(p: Pet) {
    setSelected(p);
    setUpdates({ ageYears: p.ageYears ?? null, weightKg: p.weightKg ?? null });
    setResult(null);
    setModalOpen(true);
  }

  const onDetailsChange = useCallback((values: { ageYears?: number | null; weightKg?: number | null }) => {
    setUpdates((prev) => {
      const sameAge = (prev.ageYears ?? null) === (values.ageYears ?? null);
      const sameWeight = (prev.weightKg ?? null) === (values.weightKg ?? null);
      if (sameAge && sameWeight) return prev;
      return values;
    });
  }, []);

  const ageValid = useMemo(() => {
    if (!selected) return false;
    const a = updates.ageYears;
    return a == null || (typeof a === "number" && a > 0);
  }, [selected, updates]);

  const weightValid = useMemo(() => {
    if (!selected) return false;
    const w = updates.weightKg;
    return w != null && typeof w === "number" && w > 0;
  }, [selected, updates]);

  const canCalculate = !!selected && ageValid && weightValid;

  async function handleCalculate() {
    if (!selected) return;
    setLoading(true);
    setResult(null);

    // Persist age/weight if changed
    try {
      await updatePet(selected.id, { ageYears: updates.ageYears ?? null, weightKg: updates.weightKg ?? null });
    } catch (e) {
      console.warn("Failed to persist pet updates", e);
    }

    // Simulate async calculation
    const score = await new Promise<number>((res) => {
      setTimeout(() => {
        const w = updates.weightKg ?? selected.weightKg ?? 0;
        const a = updates.ageYears ?? selected.ageYears ?? 0;
        const base = Math.round(Math.min(Math.max((w / 10) + 1, 1), 9));
        const ageAdj = a >= 8 ? 1 : 0;
        const final = Math.min(Math.max(base + ageAdj, 1), 9);
        res(final);
      }, 700);
    });

    setResult(score);
    setLoading(false);
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-900">Body Condition Score (BCS) Calculator</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pet Selection */}
          <div className="grid grid-cols-2 gap-3">
            {pets.length === 0 ? (
              <div className="text-sm text-gray-700">No pets found.</div>
            ) : (
              pets.map((p) => (
                <PetCardBCS
                  key={p.id}
                  pet={p}
                  selected={selected?.id === p.id}
                  onSelect={onSelectPet}
                />
              ))
            )}
          </div>

          {/* Pet Details are edited in a modal */}
          {modalOpen && (
            <PetDetailsModal
              pet={selected}
              updates={updates}
              onChange={onDetailsChange}
              onClose={() => {
                setModalOpen(false);
                // keep selection but clear result when closing modal
                setResult(null);
              }}
              onCalculate={handleCalculate}
              loading={loading}
              result={result}
            />
          )}

          {/* Calculate Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCalculate}
              disabled={!canCalculate || loading}
              className={`px-5 py-2 rounded-md text-white font-medium transition-colors ${
                canCalculate && !loading
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Calculating…" : "Calculate BCS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
