"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { listPets, type Pet } from "@/lib/pets";
import DiseasePredictionForm from "@/components/dashboard/bcs/DiseasePredictionForm";
import DiseasePredictionResults from "@/components/dashboard/bcs/DiseasePredictionResults";
import type {
  DiseasePredictionFormState,
  DiseasePredictionResult,
} from "@/types/disease-prediction";
import { formStateToApiInput } from "@/types/disease-prediction";
import { Stethoscope, PawPrint, ChevronRight, Check, Info } from "lucide-react";

const ANALYZED_CONDITIONS = [
  "Tick-borne disease",
  "Filariasis",
  "Diabetes type 2",
  "Obesity-related dysfunction",
  "Urolithiasis",
  "Overall health status",
];

const STEP_LABELS = ["Select pet", "Assessment", "Results"] as const;

function getPetAvatar(pet: Pet): string | null {
  const anyPet = pet as any;
  return anyPet.avatarDataUrl || anyPet.avatarUrl || null;
}

export default function DiseasePredictionPage() {
  const searchParams = useSearchParams();
  const petIdFromUrl = searchParams.get("petId");

  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [step, setStep] = useState<"select" | "form" | "result">("select");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseasePredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingPets(true);
      try {
        const petList = await listPets();
        setPets(petList);

        if (petIdFromUrl) {
          const petFromUrl = petList.find((pet) => pet.id === petIdFromUrl);
          if (petFromUrl && petFromUrl.bcs) {
            setSelected(petFromUrl);
            setStep("form");
          }
        }
      } finally {
        setLoadingPets(false);
      }
    }

    void load();
  }, [petIdFromUrl]);

  function onSelectPet(pet: Pet) {
    setSelected(pet);
    setStep("form");
    setResult(null);
    setError(null);
  }

  async function handleFormSubmit(formData: DiseasePredictionFormState) {
    setLoading(true);
    setError(null);

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
      setResult(data.result);
      setStep("result");
    } catch (err) {
      console.error("Disease prediction failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to predict diseases",
      );
      alert(
        `Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    setResult(null);
    setStep("form");
  }

  function handleBackToSelection() {
    setSelected(null);
    setStep("select");
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Stethoscope className="w-3.5 h-3.5" />
              AI Health Screening
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Multi-Disease Risk Prediction
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Review common risk indicators for six canine health conditions
              using your pet&apos;s profile, body condition score, and symptom
              history.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {ANALYZED_CONDITIONS.map((condition) => (
              <div
                key={condition}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
              >
                {condition}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Before you start
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This assessment requires a saved pet profile with a completed body
              condition score.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:max-w-xl">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Use this tool as a screening aid only. Always confirm concerning
              results with a veterinarian.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {STEP_LABELS.map((label, idx) => {
            const stepMap = ["select", "form", "result"];
            const currentIdx = stepMap.indexOf(step);
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
                {idx < STEP_LABELS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
          {error}
        </div>
      )}

      {selected && step !== "select" && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getPetAvatar(selected) ? (
                  <Image
                    src={getPetAvatar(selected) as string}
                    alt={selected.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-12 h-12 object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-500">
                    {selected.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Selected pet</p>
                <h2 className="font-semibold text-gray-900 truncate">
                  {selected.name}
                </h2>
                <p className="text-sm text-gray-600 truncate">
                  {selected.breed || "Breed: -"}{" "}
                  {selected.ageYears != null
                    ? `• ${selected.ageYears} ${selected.ageYears === 1 ? "year" : "years"}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                BCS {selected.bcs}/9
              </span>
              <button
                type="button"
                onClick={handleBackToSelection}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Change pet
              </button>
            </div>
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
            <p className="text-sm text-gray-600 mt-1">
              Only pets with a completed BCS can continue to the disease risk
              assessment.
            </p>
          </div>

          {loadingPets ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-3 text-sm text-gray-700">Loading your pets...</p>
            </div>
          ) : pets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  No pets found.
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Create a pet profile first, then calculate BCS to continue.
                </p>
              </div>
              <Link
                href="/dashboard/pets/new"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Add a pet
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pets.map((pet) => {
                  const avatar = getPetAvatar(pet);
                  const hasBCS = pet.bcs !== null && pet.bcs !== undefined;

                  return (
                    <button
                      type="button"
                      key={pet.id}
                      onClick={() => onSelectPet(pet)}
                      disabled={!hasBCS}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        hasBCS
                          ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {avatar ? (
                            <Image
                              src={avatar}
                              alt={pet.name}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-12 h-12 object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-500">
                              {pet.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-gray-900 truncate">
                              {pet.name}
                            </div>
                            {hasBCS ? (
                              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                BCS {pet.bcs}/9
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                BCS needed
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 truncate">
                            {pet.breed || "Breed: -"}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {pet.ageYears != null
                              ? `Age: ${pet.ageYears} ${pet.ageYears === 1 ? "year" : "years"}`
                              : "Age: -"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!pets.some(
                (pet) => pet.bcs !== null && pet.bcs !== undefined,
              ) && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      No pets are ready for assessment yet.
                    </p>
                    <p className="text-sm text-gray-600">
                      Calculate BCS first to unlock disease screening.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/pets/bcs"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Open BCS calculator
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === "form" && selected && (
        <DiseasePredictionForm
          onSubmit={handleFormSubmit}
          onCancel={handleBackToSelection}
          initialBCS={selected.bcs}
          petName={selected.name}
          petAge={selected.ageYears}
          petGender={selected.gender}
          petBreed={selected.breed}
          petWeight={selected.weightKg}
          petActivityLevel={selected.activityLevel}
          petLivingEnvironment={selected.livingEnvironment}
          petPreferredDiet={selected.preferredDiet}
          petSpayedNeutered={selected.spayedNeutered}
          petId={selected.id}
        />
      )}

      {step === "result" && result && selected && (
        <DiseasePredictionResults
          result={result}
          petName={selected.name}
          onNewAnalysis={handleNewAnalysis}
          onClose={handleBackToSelection}
        />
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analyzing disease risks
            </h3>
            <p className="text-sm text-gray-600">
              Reviewing your pet&apos;s profile across six health conditions.
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        This assessment is informational only and should not replace
        professional veterinary diagnosis.
      </p>
    </div>
  );
}
