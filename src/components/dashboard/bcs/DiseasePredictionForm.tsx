"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, Stethoscope } from 'lucide-react';
import type {
  DiseasePredictionFormState,
  BreedSize,
  Sex,
  TickPrevention,
  DietType,
  ExerciseLevel,
  Environment,
} from "@/types/disease-prediction";
import {
  initialFormState,
  formStateToApiInput,
} from "@/types/disease-prediction";

interface DiseasePredictionFormProps {
  onSubmit: (formData: DiseasePredictionFormState) => void;
  onCancel: () => void;
  initialBCS?: number | null;
  petName?: string;
  petAge?: number | null;
  petGender?: string | null;
  petBreed?: string | null;
  petWeight?: number | null;
  petActivityLevel?: string | null;
  petLivingEnvironment?: string | null;
  petPreferredDiet?: string | null;
  petSpayedNeutered?: boolean | null;
  petId?: string | null;
}

export default function DiseasePredictionForm({
  onSubmit,
  onCancel,
  initialBCS,
  petName,
  petAge,
  petGender,
  petBreed,
  petWeight,
  petActivityLevel,
  petLivingEnvironment,
  petPreferredDiet,
  petSpayedNeutered,
  petId,
}: DiseasePredictionFormProps) {
  // BCS is required - if not available, show error
  const hasBCS = initialBCS !== null && initialBCS !== undefined;

  const [formData, setFormData] = useState<DiseasePredictionFormState>(() => {
    const initial = { ...initialFormState };

    // Pre-fill from pet data if available
    if (hasBCS) {
      initial.body_condition_score = initialBCS;
    }
    if (petAge !== null && petAge !== undefined) {
      initial.age_years = String(petAge);
    }
    if (petGender) {
      const normalizedGender = petGender.toLowerCase();
      if (normalizedGender === "male" || normalizedGender === "m") {
        initial.sex = "Male";
      } else if (normalizedGender === "female" || normalizedGender === "f") {
        initial.sex = "Female";
      }
    }
    
    // Auto-detect breed size based on weight or breed name
    if (petWeight !== null && petWeight !== undefined) {
      if (petWeight < 10) {
        initial.breed_size = 'Small';
      } else if (petWeight <= 25) {
        initial.breed_size = 'Medium';
      } else {
        initial.breed_size = 'Large';
      }
    } else if (petBreed) {
      // Fallback: detect from breed name
      const breedLower = petBreed.toLowerCase();
      const smallBreeds = ['chihuahua', 'pomeranian', 'yorkshire', 'maltese', 'shih tzu', 'pug', 'french bulldog', 'boston terrier', 'dachshund', 'corgi', 'beagle', 'cavalier', 'miniature', 'toy', 'terrier', 'poodle'];
      const largeBreeds = ['german shepherd', 'labrador', 'golden retriever', 'rottweiler', 'boxer', 'doberman', 'husky', 'malamute', 'great dane', 'mastiff', 'saint bernard', 'bernese', 'newfoundland', 'akita', 'bullmastiff', 'cane corso', 'irish wolfhound'];
      
      if (smallBreeds.some(b => breedLower.includes(b))) {
        initial.breed_size = 'Small';
      } else if (largeBreeds.some(b => breedLower.includes(b))) {
        initial.breed_size = 'Large';
      } else {
        initial.breed_size = 'Medium';
      }
    }
    
    // Auto-fill spayed/neutered status from pet profile
    if (petSpayedNeutered !== null && petSpayedNeutered !== undefined) {
      initial.is_neutered = petSpayedNeutered ? "yes" : "no";
    }
    
    // Auto-fill exercise level from activity level
    if (petActivityLevel) {
      const activityLower = petActivityLevel.toLowerCase();
      if (activityLower === "low") {
        initial.exercise_level = "Low";
      } else if (activityLower === "medium" || activityLower === "moderate") {
        initial.exercise_level = "Moderate";
      } else if (activityLower === "high") {
        initial.exercise_level = "High";
      }
    }
    
    // Auto-fill environment from living environment
    if (petLivingEnvironment) {
      const envLower = petLivingEnvironment.toLowerCase();
      // Map common living environment values to API expected values
      if (envLower.includes("urban") || envLower.includes("city") || envLower.includes("apartment")) {
        initial.environment = "Urban";
      } else if (envLower.includes("suburban") || envLower.includes("suburb")) {
        initial.environment = "Suburban";
      } else if (envLower.includes("rural") || envLower.includes("farm") || envLower.includes("country")) {
        initial.environment = "Rural";
      } else if (envLower.includes("indoor")) {
        initial.environment = "Urban"; // Map indoor to Urban
      } else if (envLower.includes("outdoor")) {
        initial.environment = "Rural"; // Map outdoor to Rural
      } else if (envLower.includes("mixed")) {
        initial.environment = "Suburban"; // Map mixed to Suburban
      }
    }
    
    // Auto-fill diet type from preferred diet
    if (petPreferredDiet) {
      const dietLower = petPreferredDiet.toLowerCase();
      if (dietLower.includes("commercial") || dietLower.includes("kibble") || dietLower.includes("dry") || dietLower.includes("wet")) {
        initial.diet_type = "Commercial";
      } else if (dietLower.includes("homemade") || dietLower.includes("home") || dietLower.includes("raw")) {
        initial.diet_type = "Homemade";
      } else if (dietLower.includes("mixed") || dietLower.includes("both")) {
        initial.diet_type = "Mixed";
      }
    }
    
    return initial;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2; // Step 1: Auto-filled profile data, Step 2: User observations
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of form when step changes
  const scrollToTop = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validation
  const isStep1Valid = () => {
    return (
      formData.age_years !== "" &&
      parseInt(formData.age_years) > 0 &&
      formData.breed_size !== "" &&
      formData.sex !== "" &&
      formData.is_neutered !== "" &&
      formData.diet_type !== "" &&
      formData.exercise_level !== "" &&
      formData.environment !== ""
    );
  };

  const isStep2Valid = () => {
    return (
      formData.pale_gums !== "" &&
      formData.skin_lesions !== "" &&
      formData.polyuria !== "" &&
      formData.tick_prevention !== "" &&
      formData.heartworm_prevention !== ""
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid();
      case 2:
        return isStep2Valid();
      default:
        return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBCS && isStep1Valid() && isStep2Valid()) {
      onSubmit(formData);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
      setTimeout(scrollToTop, 50);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setTimeout(scrollToTop, 50);
    }
  };

  const getBCSLabel = (score: number) => {
    if (score <= 3) return "Underweight";
    if (score <= 5) return "Ideal";
    if (score <= 7) return "Overweight";
    return "Obese";
  };

  const SummaryItem = ({
    label,
    value,
    hint,
  }: {
    label: string;
    value: string;
    hint?: string;
  }) => (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
      {hint ? <p className="text-xs text-gray-500 mt-0.5">{hint}</p> : null}
    </div>
  );

  // If no BCS, show error state
  if (!hasBCS) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">BCS Required</h3>
          <p className="text-gray-600 mb-6">
            Please calculate the Body Condition Score (BCS) for{" "}
            {petName || "your pet"} first before running the disease risk
            assessment.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Go to BCS Calculator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div ref={formContainerRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  🔬 Multi-Disease Risk Assessment
                </h2>
                <p className="text-purple-100 text-sm">
                  {petName ? `For ${petName} - ` : ""}Step {currentStep} of{" "}
                  {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx < currentStep ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Step 1: Pet Profile (Auto-filled from Database) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 1</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">
                    Review auto-filled profile
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    We pulled these details from the pet profile. Confirm or adjust anything that looks off before moving on.
                  </p>
                </div>
                {petId && (
                  <Link
                    href={`/dashboard/pets/${petId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:border-blue-300 hover:bg-blue-100"
                  >
                    Edit pet profile
                  </Link>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Body condition score
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {initialBCS}/9
                    </p>
                    <p className="text-sm text-gray-600">{getBCSLabel(initialBCS)}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">From pet profile</p>
                    <p>BCS stays read-only in this step.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SummaryItem
                  label="Age"
                  value={formData.age_years ? `${formData.age_years} years` : "Not set"}
                  hint="Update in pet profile if this is outdated."
                />
                <SummaryItem
                  label="Breed size"
                  value={formData.breed_size || "Not set"}
                  hint="Estimated from weight/breed where available."
                />
                <SummaryItem
                  label="Sex"
                  value={formData.sex || "Not set"}
                  hint="Auto-detected from profile."
                />
                <SummaryItem
                  label="Spayed / neutered"
                  value={
                    formData.is_neutered === "yes"
                      ? "Neutered"
                      : formData.is_neutered === "no"
                        ? "Intact"
                        : "Not set"
                  }
                  hint="Based on recorded procedure status."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SummaryItem
                  label="Diet type"
                  value={formData.diet_type || "Not set"}
                  hint="What the pet usually eats."
                />
                <SummaryItem
                  label="Exercise level"
                  value={formData.exercise_level || "Not set"}
                  hint="Mapped from activity level."
                />
                <SummaryItem
                  label="Living environment"
                  value={formData.environment || "Not set"}
                  hint="Urban / suburban / rural."
                />
              </div>
            </div>
          )}

          {/* Step 2: Clinical Signs & Health Observations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                🩺 Health Observations & Prevention
              </h3>

              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    Please provide information about your pet&apos;s current health symptoms and preventive care.
                  </div>
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2 mb-3">
                📊 Clinical Signs
              </h4>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pale Gums <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-rose-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Lift lip to check. Healthy = <span className="text-green-600 font-medium">pink</span> · Concern = <span className="text-red-600 font-medium">white/gray/yellow</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, pale_gums: "yes" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.pale_gums === "yes"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, pale_gums: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.pale_gums === "no"
                          ? "bg-red-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Skin Lesions <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-amber-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Any lumps, bumps, red patches, scabs, rashes, or bald spots?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, skin_lesions: "yes" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.skin_lesions === "yes"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, skin_lesions: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.skin_lesions === "no"
                          ? "bg-red-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Increased Thirst &amp; Urination <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-cyan-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Drinking more water than usual? Needing to go outside more often?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, polyuria: "yes" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.polyuria === "yes"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, polyuria: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.polyuria === "no"
                          ? "bg-red-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Prevention Care Section */}
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2 mb-3 mt-8 pt-6 border-t border-gray-200">
                🛡️ Preventive Care
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tick Prevention <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-green-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Uses flea/tick products? (chews, spot-on drops, or collar)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tick_prevention: 'Regular' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.tick_prevention === 'Regular'
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tick_prevention: 'None' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.tick_prevention === 'None' || formData.tick_prevention === 'Irregular'
                          ? 'bg-red-600 text-white shadow'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Heartworm Prevention <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-red-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Monthly heartworm tablets or annual injection from vet?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heartworm_prevention: "yes",
                        })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.heartworm_prevention === "yes"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heartworm_prevention: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.heartworm_prevention === "no"
                          ? "bg-red-600 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                  canProceed()
                    ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canProceed()}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                  canProceed()
                    ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                🔬 Analyze Disease Risks
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
