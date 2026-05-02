"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  const [loadingPets, setLoadingPets] = useState(true);
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
      setLoadingPets(true);
      try {
        const p = await listPets();
        setPets(p);
      } finally {
        setLoadingPets(false);
      }
    }
    void load();
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
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Scale className="w-3.5 h-3.5" />
              Health screening
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Body Condition Score
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Calculate your pet&apos;s BCS using profile details and guided
              physical observations.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 lg:max-w-sm">
            A BCS score helps you understand whether your pet is underweight,
            ideal, overweight, or obese.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {["Select pet", "Results"].map((label, idx) => {
            const currentIdx = step === "result" ? 1 : 0;
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;

            return (
              <React.Fragment key={label}>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "border border-green-200 bg-green-50 text-green-700"
                        : "border border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                      {idx + 1}
                    </span>
                  )}
                  <span>{label}</span>
                </div>
                {idx < 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {selected && step !== "select" && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Selected pet</p>
              <h2 className="font-semibold text-gray-900">{selected.name}</h2>
              <p className="text-sm text-gray-600">
                {selected.breed || "Breed: -"}
                {selected.ageYears != null
                  ? ` • ${selected.ageYears} ${selected.ageYears === 1 ? "year" : "years"}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={resetCalculator}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change pet
            </button>
          </div>
        </div>
      )}

      {step === "select" && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-blue-600" />
              Select your pet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a pet to start the body condition score assessment.
            </p>
          </div>

          {loadingPets ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-3 text-sm text-gray-700">Loading your pets...</p>
            </div>
          ) : pets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">
                No pets found.
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Add a pet profile first to calculate BCS.
              </p>
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

      {step === "result" && result !== null && selected && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${getBCSDescription(result).bg} ${getBCSDescription(result).border} ${getBCSDescription(result).color}`}
                >
                  {getBCSDescription(result).text}
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                  {selected.name}&apos;s Body Condition Score
                </h2>
                {selected.bcsCalculatedAt && (
                  <p className="mt-1 text-sm text-gray-500">
                    Last calculated:{" "}
                    {formatBCSTimestamp(selected.bcsCalculatedAt)}
                  </p>
                )}
                <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
                  Based on the weight of {updates.weightKg} kg and age of{" "}
                  {updates.ageYears ?? "unknown"} years,
                  {result <= 3 &&
                    " your pet may need additional nutrition. Consult your veterinarian."}
                  {result > 3 &&
                    result <= 5 &&
                    " your pet is at an ideal weight. Keep up the good routine."}
                  {result > 5 &&
                    result <= 7 &&
                    " your pet could benefit from a diet and exercise plan."}
                  {result > 7 &&
                    " your pet may be at health risk. Please consult your veterinarian soon."}
                </p>
              </div>

              <div
                className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${getBCSDescription(result).bg} ${getBCSDescription(result).border}`}
              >
                <span
                  className={`text-4xl font-bold ${getBCSDescription(result).color}`}
                >
                  {result}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">
              BCS scale reference
            </h3>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                <p className="font-semibold text-orange-700">1-3</p>
                <p className="mt-1 text-gray-700">Underweight</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <p className="font-semibold text-green-700">4-5</p>
                <p className="mt-1 text-gray-700">Ideal</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="font-semibold text-amber-700">6-7</p>
                <p className="mt-1 text-gray-700">Overweight</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="font-semibold text-red-700">8-9</p>
                <p className="mt-1 text-gray-700">Obese</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-green-400 via-amber-400 to-red-400" />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-gray-900"
                  style={{ left: `${((result - 1) / 8) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Score shown on a 1-9 scale.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Multi-disease risk assessment
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Continue to analyze your pet across six common health
                    conditions.
                  </p>
                </div>
              </div>
              <button
                onClick={handleNavigateToDiseasePrediction}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Start assessment
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        BCS is a helpful screening tool, but veterinary guidance is still the
        best source for diagnosis and treatment decisions.
      </p>

      {showClinicalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-5 sm:px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                      Physical observations
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Clinical Observations
                    </h2>
                    <p className="text-sm text-gray-500">
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
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Close observations modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-6 text-sm text-blue-900">
                These observations improve BCS accuracy. Choose the option that
                best describes your pet right now.
              </div>

              {(!weightValid || !ageValid) && (
                <div className="space-y-3 mb-6">
                  {!weightValid && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Weight is required to calculate BCS.
                    </div>
                  )}
                  {!ageValid && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Age looks invalid. Update your pet profile before
                      continuing.
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={updates.gender || ""}
                    onChange={(e) => onDetailsChange("gender", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select gender</option>
                    {clinicalOptions.gender.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Choose the pet&apos;s sex.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Activity Level *
                  </label>
                  <select
                    value={updates.activityLevel || ""}
                    onChange={(e) =>
                      onDetailsChange("activityLevel", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select activity level</option>
                    {clinicalOptions.activity_level.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How active is your pet on most days?
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rib Condition *
                  </label>
                  <select
                    value={updates.ribCondition || ""}
                    onChange={(e) =>
                      onDetailsChange("ribCondition", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select rib condition</option>
                    {clinicalOptions.rib_condition.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How easily can you feel the ribs?
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Waist *
                  </label>
                  <select
                    value={updates.waist || ""}
                    onChange={(e) => onDetailsChange("waist", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select waist condition</option>
                    {clinicalOptions.waist.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How prominent is the waist?
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Abdominal Tuck *
                  </label>
                  <select
                    value={updates.abdominalTuck || ""}
                    onChange={(e) =>
                      onDetailsChange("abdominalTuck", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select abdominal tuck</option>
                    {clinicalOptions.abdominal_tuck.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How much abdominal tuck is present?
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Spine & Hips *
                  </label>
                  <select
                    value={updates.spineHips || ""}
                    onChange={(e) =>
                      onDetailsChange("spineHips", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select spine/hips condition</option>
                    {clinicalOptions.spine_hips.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How prominent are spine and hip bones?
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fat Deposits *
                  </label>
                  <select
                    value={updates.fatDeposits || ""}
                    onChange={(e) =>
                      onDetailsChange("fatDeposits", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select fat deposit level</option>
                    {clinicalOptions.fat_deposits.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    How much fat is deposited on the body?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-200 pt-5">
                <button
                  onClick={() => {
                    setShowClinicalModal(false);
                    setSelected(null);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowClinicalModal(false);
                    void handleCalculate();
                  }}
                  disabled={!canCalculate || loading}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    canCalculate && !loading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Calculating BCS..." : "Calculate BCS"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Calculating BCS
            </h3>
            <p className="text-sm text-gray-600">
              Reviewing your pet&apos;s body condition across multiple physical
              indicators.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
