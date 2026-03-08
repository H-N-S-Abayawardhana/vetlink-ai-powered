"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listPets, updatePet, type Pet } from "@/lib/pets";
import { formatBCSTimestamp } from "@/lib/format-date";
import PetCardBCS from "./PetCardBCS";
import {
  Scale,
  PawPrint,
  ChevronRight,
  Check,
  Stethoscope,
  X,
} from "lucide-react";

export default function BCSCalculator() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [step, setStep] = useState<"select" | "details" | "result">("select");
  const [updates, setUpdates] = useState<{
    ageYears?: number | null;
    weightKg?: number | null;
    gender?: string | null;
    activityLevel?: string | null;
    ribCondition?: string | null;
    waist?: string | null;
    abdominalTuck?: string | null;
    spineHips?: string | null;
    fatDeposits?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClinicalModal, setShowClinicalModal] = useState(false);

  // Clinical observation options from Hugging Face model
  const clinicalOptions = {
    activity_level: ["Low", "Medium", "High"],
    rib_condition: [
      "Visible/protruding",
      "Easy to feel",
      "Slight fat cover",
      "Hard to feel",
      "Cannot feel",
    ],
    waist: [
      "Severely narrowed",
      "Moderate waist",
      "Barely visible",
      "Oval/Round",
    ],
    abdominal_tuck: [
      "Severe upward tuck",
      "Gentle upward tuck",
      "Slight belly hang",
      "Sagging belly",
    ],
    spine_hips: [
      "Very prominent",
      "Easy to feel",
      "Felt but not visible",
      "Difficult to feel",
    ],
    fat_deposits: ["None", "Mild", "Moderate", "Large"],
    gender: ["Male", "Female"],
  };

  useEffect(() => {
    async function load() {
      const p = await listPets();
      setPets(p);
    }
    load();
  }, []);

  function onSelectPet(p: Pet) {
    setSelected(p);
    setUpdates({
      ageYears: p.ageYears ?? null,
      weightKg: p.weightKg ?? null,
      gender: p.gender ?? null,
      activityLevel: p.activityLevel ?? "Medium",
      ribCondition: "",
      waist: "",
      abdominalTuck: "",
      spineHips: "",
      fatDeposits: "",
    });
    setResult(null);
    setError(null);
    // Auto-open clinical observations modal on pet selection page
    setShowClinicalModal(true);
  }

  const onDetailsChange = useCallback(
    (
      field:
        | "ageYears"
        | "weightKg"
        | "gender"
        | "activityLevel"
        | "ribCondition"
        | "waist"
        | "abdominalTuck"
        | "spineHips"
        | "fatDeposits",
      value: string | number | null,
    ) => {
      setUpdates((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const ageValid = useMemo(() => {
    const a = updates.ageYears;
    if (a == null) return true;
    const n = typeof a === "string" ? parseFloat(a as any) : a;
    return typeof n === "number" && !Number.isNaN(n) && n > 0;
  }, [updates]);

  const weightValid = useMemo(() => {
    const w = updates.weightKg;
    if (w == null) return false;
    const n = typeof w === "string" ? parseFloat(w as any) : w;
    return typeof n === "number" && !Number.isNaN(n) && n > 0;
  }, [updates]);

  const clinicalObservationsValid = useMemo(() => {
    return (
      updates.ribCondition &&
      updates.waist &&
      updates.abdominalTuck &&
      updates.spineHips &&
      updates.fatDeposits &&
      updates.activityLevel &&
      updates.gender
    );
  }, [updates]);

  const canCalculate = ageValid && weightValid && clinicalObservationsValid;

  async function handleCalculate() {
    if (!selected || !canCalculate) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Get validated values
      const wRaw = updates.weightKg ?? selected.weightKg ?? 0;
      const aRaw = updates.ageYears ?? selected.ageYears ?? 0;
      const w =
        typeof wRaw === "string" ? parseFloat(wRaw as any) : (wRaw as number);
      const a =
        typeof aRaw === "string" ? parseFloat(aRaw as any) : (aRaw as number);

      // Call the BCS prediction API with all clinical observations
      const response = await fetch("/api/bcs/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          breed: selected.breed || "Mixed",
          age: a,
          weight_kg: w,
          gender: updates.gender || selected.gender || "Male",
          activity_level:
            updates.activityLevel || selected.activityLevel || "Medium",
          rib_condition: updates.ribCondition || "Easy to feel",
          waist: updates.waist || "Moderate waist",
          abdominal_tuck: updates.abdominalTuck || "Slight belly hang",
          spine_hips: updates.spineHips || "Felt but not visible",
          fat_deposits: updates.fatDeposits || "Mild",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to calculate BCS from the model",
        );
      }

      const prediction = await response.json();
      const rawScore = Number(prediction.bcs_score);
      const score = Number.isFinite(rawScore)
        ? Math.max(1, Math.min(9, Math.round(rawScore)))
        : null;

      if (score == null) {
        throw new Error("Invalid BCS score received from the model");
      }

      setResult(score);

      // Persist calculated BCS and timestamp
      try {
        const when = new Date().toISOString();
        const updated = await updatePet(selected.id, {
          bcs: score,
          bcsCalculatedAt: when,
        });
        // update local selected and pets list with returned pet when available
        if (updated) {
          setSelected(updated as any);
          setPets((prev) =>
            prev.map((p) => (p.id === updated.id ? (updated as any) : p)),
          );
        }
      } catch (e) {
        console.warn("Failed to persist BCS", e);
      }

      setStep("result");
    } catch (error) {
      console.error("BCS Calculation Error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(errorMsg);
      alert(`Error calculating BCS: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  function resetCalculator() {
    setSelected(null);
    setStep("select");
    setResult(null);
    setUpdates({});
  }

  // Navigate to disease prediction page
  function handleNavigateToDiseasePrediction() {
    if (selected) {
      router.push(`/dashboard/pets/disease-prediction?petId=${selected.id}`);
    }
  }

  const getBCSDescription = (score: number) => {
    if (score <= 3)
      return {
        text: "Underweight",
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
      };
    if (score <= 5)
      return {
        text: "Ideal Weight",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      };
    if (score <= 7)
      return {
        text: "Overweight",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    return {
      text: "Obese",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Body Condition Score
          </h1>
          <p className="text-gray-600">
            Calculate your pet’s health score in 3 easy steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-2">
          {["Select Pet", "View Results"].map((label, idx) => {
            const stepMap = ["select", "result"];
            const currentIdx = stepMap.indexOf(step);
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;

            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg scale-105"
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {label}
                    </span>
                  </div>
                </div>
                {idx < 1 && (
                  <ChevronRight
                    className={`w-5 h-5 ${isCompleted ? "text-green-500" : "text-gray-300"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Step 1: Select Pet */}
          {step === "select" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PawPrint className="w-6 h-6 text-indigo-600" />
                Select Your Pet
              </h2>

              {pets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your pets...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pets.map((pet) => (
                    <PetCardBCS
                      key={pet.id}
                      pet={pet}
                      selected={selected?.id === pet.id}
                      onSelect={onSelectPet}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Details */}
          {step === "details" && selected && (
            <div className="p-8">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-8">
                <div className="space-y-6">
                  {!weightValid && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-900">
                        Weight is required to calculate BCS.
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Update your pet’s weight in the profile, then return
                        here.
                      </p>
                    </div>
                  )}
                  {!ageValid && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-900">
                        Age looks invalid.
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Update your pet’s age in the profile, then return here.
                      </p>
                    </div>
                  )}{" "}
                </div>{" "}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === "result" && result !== null && selected && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div
                  className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${getBCSDescription(result).bg} ${getBCSDescription(result).border} border-4 shadow-2xl`}
                >
                  <div
                    className={`text-5xl font-bold ${getBCSDescription(result).color}`}
                  >
                    {result}
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selected.name}’s Body Condition Score
                </h2>
                {selected.bcsCalculatedAt && (
                  <div className="text-xs text-gray-500 mb-2">
                    Last calculated:{" "}
                    {formatBCSTimestamp(selected.bcsCalculatedAt)}
                  </div>
                )}

                <div
                  className={`inline-block px-6 py-3 rounded-full ${getBCSDescription(result).bg} ${getBCSDescription(result).border} border-2 mb-4`}
                >
                  <span
                    className={`text-lg font-bold ${getBCSDescription(result).color}`}
                  >
                    {getBCSDescription(result).text}
                  </span>
                </div>

                <p className="text-gray-600 max-w-2xl mx-auto mt-4">
                  Based on the weight of {updates.weightKg} kg and age of{" "}
                  {updates.ageYears ?? "unknown"} years,
                  {result <= 3 &&
                    " your pet may need additional nutrition. Consult your veterinarian."}
                  {result > 3 &&
                    result <= 5 &&
                    " your pet is at an ideal weight! Keep up the great work."}
                  {result > 5 &&
                    result <= 7 &&
                    " your pet could benefit from a diet and exercise plan."}
                  {result > 7 &&
                    " your pet may be at health risk. Please consult your veterinarian soon."}
                </p>
              </div>

              {/* BCS Scale Visual */}
              <div className="bg-gradient-to-r from-orange-100 via-green-100 to-red-100 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-orange-600">
                    1-3
                    <br />
                    Underweight
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    4-5
                    <br />
                    Ideal
                  </span>
                  <span className="text-sm font-semibold text-amber-600">
                    6-7
                    <br />
                    Overweight
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    8-9
                    <br />
                    Obese
                  </span>
                </div>
                <div className="relative h-3 bg-white rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-green-400 via-amber-400 to-red-400"></div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-gray-900 shadow-lg"
                    style={{ left: `${((result - 1) / 8) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                      Your pet
                    </div>
                  </div>
                </div>
              </div>

              {/* Disease Prediction CTA */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Stethoscope className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        🔬 Multi-Disease Risk Assessment
                      </h3>
                      <p className="text-sm text-gray-600">
                        Continue to analyze your pet for 6 different health
                        conditions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleNavigateToDiseasePrediction}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Start Assessment →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Disease Prediction Results - Removed, now handled on separate page */}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            💡 BCS is a valuable tool for monitoring your pet’s health. Consult
            your veterinarian for personalized advice.
          </p>
        </div>
      </div>
      {/* Clinical Observations Modal */}
      {showClinicalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      🩺 Clinical Observations
                    </h2>
                    <p className="text-purple-100 text-sm">
                      {selected?.name
                        ? `For ${selected.name}`
                        : "Enter observations"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClinicalModal(false);
                    setSelected(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg mb-6">
                <p className="text-sm text-blue-900">
                  These observations help provide a more accurate BCS
                  prediction. Select the condition that best describes your pet.
                </p>
              </div>

              <div className="space-y-6">
                {/* Physical Observations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rib Condition *
                    </label>
                    <select
                      value={updates.ribCondition || ""}
                      onChange={(e) =>
                        onDetailsChange("ribCondition", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select rib condition</option>
                      {clinicalOptions.rib_condition.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How easily can you feel the ribs?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Waist *
                    </label>
                    <select
                      value={updates.waist || ""}
                      onChange={(e) => onDetailsChange("waist", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select waist condition</option>
                      {clinicalOptions.waist.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How prominent is the waist?
                    </p>
                  </div>
                </div>

                {/* More Physical Observations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Abdominal Tuck *
                    </label>
                    <select
                      value={updates.abdominalTuck || ""}
                      onChange={(e) =>
                        onDetailsChange("abdominalTuck", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select abdominal tuck</option>
                      {clinicalOptions.abdominal_tuck.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How much abdominal tuck is present?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Spine & Hips *
                    </label>
                    <select
                      value={updates.spineHips || ""}
                      onChange={(e) =>
                        onDetailsChange("spineHips", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select spine/hips condition</option>
                      {clinicalOptions.spine_hips.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How prominent are spine and hip bones?
                    </p>
                  </div>
                </div>

                {/* Fat Deposits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fat Deposits *
                    </label>
                    <select
                      value={updates.fatDeposits || ""}
                      onChange={(e) =>
                        onDetailsChange("fatDeposits", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select fat deposit level</option>
                      {clinicalOptions.fat_deposits.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How much fat is deposited on the body?
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowClinicalModal(false);
                    setSelected(null);
                  }}
                  className="flex-1 py-4 rounded-xl font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowClinicalModal(false);
                    handleCalculate();
                  }}
                  disabled={!canCalculate || loading}
                  className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                    canCalculate && !loading
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg cursor-pointer hover:from-indigo-700 hover:to-purple-700"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                      Calculating BCS...
                    </span>
                  ) : (
                    "Calculate BCS"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ⚖️ Calculating BCS...
            </h3>
            <p className="text-gray-600">
              Our AI is analyzing your pet&apos;s body condition across multiple
              physical parameters.
            </p>
          </div>
        </div>
      )}{" "}
    </div>
  );
}
