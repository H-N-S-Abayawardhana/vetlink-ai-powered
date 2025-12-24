"use client";

import React from "react";
import ResultsPanel from "./ResultsPanel";
import type { Pet } from "@/lib/pets";

type Props = {
  pet: Pet | null;
  updates: { ageYears?: number | null; weightKg?: number | null };
  onChange: (v: { ageYears?: number | null; weightKg?: number | null }) => void;
  onClose: () => void;
  onCalculate: () => void;
  loading: boolean;
  result: number | null;
};

export default function PetDetailsModal({
  pet,
  updates,
  onChange,
  onClose,
  onCalculate,
  loading,
  result,
}: Props) {
  if (!pet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl mx-4 md:mx-0 bg-white rounded-t-lg md:rounded-lg shadow-lg overflow-hidden transform transition-all">
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {pet.name}
              </h3>
              <p className="text-sm text-gray-500">
                Edit details and calculate BCS
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm text-gray-700">Age (years)</div>
              <input
                type="number"
                min={0}
                value={updates.ageYears ?? ""}
                onChange={(e) =>
                  onChange({
                    ageYears:
                      e.target.value === "" ? null : Number(e.target.value),
                    weightKg: updates.weightKg ?? null,
                  })
                }
                className="w-full border rounded px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 3"
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-700">Weight (kg)</div>
              <input
                type="number"
                min={0}
                value={updates.weightKg ?? ""}
                onChange={(e) =>
                  onChange({
                    weightKg:
                      e.target.value === "" ? null : Number(e.target.value),
                    ageYears: updates.ageYears ?? null,
                  })
                }
                className="w-full border rounded px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 6.5"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onCalculate}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                !loading
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Calculating…" : "Calculate BCS"}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {result != null && (
            <div className="mt-5">
              <ResultsPanel
                score={result}
                petName={pet.name}
                lastCalculated={pet.bcsCalculatedAt ?? null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
