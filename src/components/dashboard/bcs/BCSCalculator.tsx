"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { listPets, updatePet, type Pet } from "@/lib/pets";
import { formatBCSTimestamp } from "@/lib/format-date";
import PetCardBCS from "./PetCardBCS";
import DiseasePredictionForm from "./DiseasePredictionForm";
import DiseasePredictionResults from "./DiseasePredictionResults";
import type {
  DiseasePredictionFormState,
  DiseasePredictionResult,
} from "@/types/disease-prediction";
import { formStateToApiInput } from "@/types/disease-prediction";
import {
  Scale,
  PawPrint,
  ChevronRight,
  Check,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

export default function BCSCalculator() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [step, setStep] = useState<"select" | "details" | "result" | "disease-result">("select");
  const [updates, setUpdates] = useState<{
    ageYears?: number | null;
    weightKg?: number | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  // Disease prediction states
  const [showDiseaseForm, setShowDiseaseForm] = useState(false);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseasePredictionResult | null>(null);
  const [diseaseError, setDiseaseError] = useState<string | null>(null);

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
    setStep("details");
  }

  const onDetailsChange = useCallback(
    (field: "ageYears" | "weightKg", value: number | null) => {
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

  const canCalculate = ageValid && weightValid;

  async function handleCalculate() {
    if (!selected || !canCalculate) return;
    setLoading(true);
    setResult(null);

    // Persist age/weight if changed
    try {
      // Ensure stored values are numeric where appropriate
      const persistPayload: any = {
        ageYears:
          updates.ageYears == null
            ? null
            : typeof updates.ageYears === "string"
              ? parseFloat(updates.ageYears as any)
              : updates.ageYears,
        weightKg:
          updates.weightKg == null
            ? null
            : typeof updates.weightKg === "string"
              ? parseFloat(updates.weightKg as any)
              : updates.weightKg,
      };
      await updatePet(selected.id, persistPayload);
    } catch (e) {
      console.warn("Failed to persist pet updates", e);
    }

    // Calculate BCS
    const score = await new Promise<number>((res) => {
      setTimeout(() => {
        const wRaw = updates.weightKg ?? selected.weightKg ?? 0;
        const aRaw = updates.ageYears ?? selected.ageYears ?? 0;
        const w =
          typeof wRaw === "string" ? parseFloat(wRaw as any) : (wRaw as number);
        const a =
          typeof aRaw === "string" ? parseFloat(aRaw as any) : (aRaw as number);
        const safeW = Number.isNaN(w) ? 0 : w;
        const safeA = Number.isNaN(a) ? 0 : a;
        const base = Math.round(Math.min(Math.max(safeW / 10 + 1, 1), 9));
        const ageAdj = safeA >= 8 ? 1 : 0;
        const final = Math.min(Math.max(base + ageAdj, 1), 9);
        res(final);
      }, 700);
    });

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
    setLoading(false);
  }

  function resetCalculator() {
    setSelected(null);
    setStep("select");
    setResult(null);
    setUpdates({});
    setDiseaseResult(null);
    setDiseaseError(null);
    setShowDiseaseForm(false);
  }

  // Handle disease prediction form submission
  async function handleDiseasePrediction(formData: DiseasePredictionFormState) {
    setShowDiseaseForm(false);
    setDiseaseLoading(true);
    setDiseaseError(null);

    try {
      const apiInput = formStateToApiInput(formData, selected?.id);

      if (!apiInput) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/disease/multi-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to predict diseases");
      }

      const data = await response.json();
      setDiseaseResult(data.result);
      setStep("disease-result");
    } catch (err) {
      console.error("Disease prediction failed:", err);
      setDiseaseError(err instanceof Error ? err.message : "Failed to predict diseases");
      alert(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDiseaseLoading(false);
    }
  }

  // Start new disease analysis
  function handleNewDiseaseAnalysis() {
    setDiseaseResult(null);
    setShowDiseaseForm(true);
  }

  // Go back to BCS results
  function handleBackToBCS() {
    setStep("result");
    setDiseaseResult(null);
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
          {["Select Pet", "Enter Details", "View Results"].map((label, idx) => {
            const stepMap = ["select", "details", "result"];
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
                {idx < 2 && (
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
              <button
                onClick={() => setStep("select")}
                className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-1"
              >
                ← Back to pets
              </button>

              <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                {(() => {
                  const avatar =
                    (selected as any).avatarDataUrl ||
                    (selected as any).avatarUrl ||
                    (selected.type === "dog"
                      ? "/uploads/default-dog.png"
                      : "/uploads/default-cat.png");
                  const hasAvatar = Boolean(
                    (selected as any).avatarDataUrl ||
                    (selected as any).avatarUrl,
                  );
                  return hasAvatar ? (
                    <Image
                      src={avatar as string}
                      alt={selected.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="w-16 h-16 object-cover rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      {selected.name.charAt(0)}
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selected.name}
                  </h2>
                  <p className="text-gray-600">
                    {selected.breed || "Mixed breed"}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    value={updates.ageYears ?? ""}
                    onChange={(e) =>
                      onDetailsChange(
                        "ageYears",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder="Enter age in years"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  />
                  {!ageValid && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Please enter a valid age
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={updates.weightKg ?? ""}
                    onChange={(e) =>
                      onDetailsChange(
                        "weightKg",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder="Enter weight in kilograms"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  />
                  {!weightValid && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Weight is required
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={!canCalculate || loading}
                className={`mt-8 w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                  canCalculate && !loading
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                    Calculating BCS...
                  </span>
                ) : (
                  "Calculate Body Condition Score"
                )}
              </button>
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

              <div className="flex gap-4">
                <button
                  onClick={resetCalculator}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Calculate Another Pet
                </button>
                <button
                  onClick={() => setStep("details")}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Adjust Details
                </button>
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
                        Continue to analyze your pet for 6 different health conditions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDiseaseForm(true)}
                    disabled={diseaseLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {diseaseLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Analyzing...
                      </span>
                    ) : (
                      "Start Assessment →"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Disease Prediction Results */}
          {step === "disease-result" && diseaseResult && selected && (
            <div className="p-4">
              <DiseasePredictionResults
                result={diseaseResult}
                petName={selected.name}
                onNewAnalysis={handleNewDiseaseAnalysis}
                onClose={handleBackToBCS}
              />
            </div>
          )}
        </div>

        {/* Disease Prediction Form Modal */}
        {showDiseaseForm && selected && (
          <DiseasePredictionForm
            onSubmit={handleDiseasePrediction}
            onCancel={() => setShowDiseaseForm(false)}
            initialBCS={result}
            petName={selected.name}
            petAge={updates.ageYears ?? selected.ageYears}
            petGender={selected.gender}
          />
        )}

        {/* Disease Loading Overlay */}
        {diseaseLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🔬 Analyzing Disease Risks...
              </h3>
              <p className="text-gray-600">
                Our AI is processing your pet&apos;s health data across 6 different conditions.
              </p>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            💡 BCS is a valuable tool for monitoring your pet’s health. Consult
            your veterinarian for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
