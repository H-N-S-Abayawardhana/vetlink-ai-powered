"use client";

import React, { useState, useRef } from "react";
import { X, AlertTriangle, Stethoscope } from "lucide-react";
import type { DiseasePredictionFormState } from "@/types/disease-prediction";
import { initialFormState } from "@/types/disease-prediction";

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

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  tone: "blue" | "red";
  onClick: () => void;
}

interface QuestionCardProps {
  label: string;
  hint: string;
  hintTone?: "rose" | "amber" | "cyan" | "green";
  children: React.ReactNode;
}

function ChoiceButton({ label, selected, tone, onClick }: ChoiceButtonProps) {
  const selectedClasses =
    tone === "blue"
      ? "border-blue-300 bg-blue-50/80 text-blue-700"
      : "border-red-300 bg-red-50/80 text-red-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${
        selected
          ? selectedClasses
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function QuestionCard({
  label,
  hint,
  hintTone = "amber",
  children,
}: QuestionCardProps) {
  const toneClasses = {
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    cyan: "bg-cyan-50 text-cyan-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div>
        <label className="block text-sm font-semibold text-gray-800">
          {label} <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-xs text-gray-500 flex items-start gap-2">
          <span
            className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${toneClasses[hintTone]}`}
          >
            ?
          </span>
          <span>{hint}</span>
        </p>
      </div>
      {children}
    </div>
  );
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
        initial.breed_size = "Small";
      } else if (petWeight <= 25) {
        initial.breed_size = "Medium";
      } else {
        initial.breed_size = "Large";
      }
    } else if (petBreed) {
      // Fallback: detect from breed name
      const breedLower = petBreed.toLowerCase();
      const smallBreeds = [
        "chihuahua",
        "pomeranian",
        "yorkshire",
        "maltese",
        "shih tzu",
        "pug",
        "french bulldog",
        "boston terrier",
        "dachshund",
        "corgi",
        "beagle",
        "cavalier",
        "miniature",
        "toy",
        "terrier",
        "poodle",
      ];
      const largeBreeds = [
        "german shepherd",
        "labrador",
        "golden retriever",
        "rottweiler",
        "boxer",
        "doberman",
        "husky",
        "malamute",
        "great dane",
        "mastiff",
        "saint bernard",
        "bernese",
        "newfoundland",
        "akita",
        "bullmastiff",
        "cane corso",
        "irish wolfhound",
      ];

      if (smallBreeds.some((b) => breedLower.includes(b))) {
        initial.breed_size = "Small";
      } else if (largeBreeds.some((b) => breedLower.includes(b))) {
        initial.breed_size = "Large";
      } else {
        initial.breed_size = "Medium";
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
      if (
        envLower.includes("urban") ||
        envLower.includes("city") ||
        envLower.includes("apartment")
      ) {
        initial.environment = "Urban";
      } else if (envLower.includes("suburban") || envLower.includes("suburb")) {
        initial.environment = "Suburban";
      } else if (
        envLower.includes("rural") ||
        envLower.includes("farm") ||
        envLower.includes("country")
      ) {
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
      if (
        dietLower.includes("commercial") ||
        dietLower.includes("kibble") ||
        dietLower.includes("dry") ||
        dietLower.includes("wet")
      ) {
        initial.diet_type = "Commercial";
      } else if (
        dietLower.includes("homemade") ||
        dietLower.includes("home") ||
        dietLower.includes("raw")
      ) {
        initial.diet_type = "Homemade";
      } else if (dietLower.includes("mixed") || dietLower.includes("both")) {
        initial.diet_type = "Mixed";
      }
    }

    return initial;
  });

  const formContainerRef = useRef<HTMLDivElement>(null);

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

  const canSubmit = () => isStep1Valid() && isStep2Valid();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBCS && canSubmit()) {
      onSubmit(formData);
    }
  };

  // If no BCS, show error state
  if (!hasBCS) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            BCS required
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Please calculate the Body Condition Score (BCS) for{" "}
            {petName || "your pet"} first before running the disease risk
            assessment.
          </p>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to BCS Calculator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        ref={formContainerRef}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl mx-auto my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-5 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Health screening
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Multi-Disease Risk Assessment
                </h2>
                <p className="text-sm text-gray-500">
                  {petName ? `For ${petName}` : "For your pet"}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close assessment form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  Provide your pet&apos;s current symptoms and prevention
                  details before running the screening.
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Clinical signs
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mark the symptoms that best match what you are seeing now.
                </p>
              </div>

              <div className="space-y-3">
                <QuestionCard
                  label="Pale gums"
                  hint="Lift the lip to check. Healthy gums are pink. Concerning gums may look white, gray, or yellow."
                  hintTone="rose"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.pale_gums === "yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({ ...formData, pale_gums: "yes" })
                      }
                    />
                    <ChoiceButton
                      label="No"
                      selected={formData.pale_gums === "no"}
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, pale_gums: "no" })
                      }
                    />
                  </div>
                </QuestionCard>

                <QuestionCard
                  label="Skin lesions"
                  hint="Any lumps, bumps, red patches, scabs, rashes, or bald spots?"
                  hintTone="amber"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.skin_lesions === "yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({ ...formData, skin_lesions: "yes" })
                      }
                    />
                    <ChoiceButton
                      label="No"
                      selected={formData.skin_lesions === "no"}
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, skin_lesions: "no" })
                      }
                    />
                  </div>
                </QuestionCard>

                <QuestionCard
                  label="Increased thirst and urination"
                  hint="Drinking more water than usual or needing to go outside more often?"
                  hintTone="cyan"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.polyuria === "yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({ ...formData, polyuria: "yes" })
                      }
                    />
                    <ChoiceButton
                      label="No"
                      selected={formData.polyuria === "no"}
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, polyuria: "no" })
                      }
                    />
                  </div>
                </QuestionCard>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-200 pt-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Preventive care
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Record whether your pet is regularly protected against common
                  parasites.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <QuestionCard
                  label="Tick prevention"
                  hint="Uses flea or tick prevention products such as chews, spot-on drops, or a collar?"
                  hintTone="green"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.tick_prevention === "Regular"}
                      tone="blue"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tick_prevention: "Regular",
                        })
                      }
                    />
                    <ChoiceButton
                      label="No"
                      selected={
                        formData.tick_prevention === "None" ||
                        formData.tick_prevention === "Irregular"
                      }
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, tick_prevention: "None" })
                      }
                    />
                  </div>
                </QuestionCard>

                <QuestionCard
                  label="Heartworm prevention"
                  hint="Monthly heartworm tablets or a yearly injection from your veterinarian?"
                  hintTone="rose"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.heartworm_prevention === "yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heartworm_prevention: "yes",
                        })
                      }
                    />
                    <ChoiceButton
                      label="No"
                      selected={formData.heartworm_prevention === "no"}
                      tone="red"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heartworm_prevention: "no",
                        })
                      }
                    />
                  </div>
                </QuestionCard>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit()}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                canSubmit()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Analyze disease risks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
