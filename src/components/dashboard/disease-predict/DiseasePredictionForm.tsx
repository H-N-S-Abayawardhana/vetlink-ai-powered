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
  petDigestiveSensitivity?: string | null;
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

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
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
      className={`h-10 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors ${
        selected
          ? selectedClasses
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function QuestionCard({ label, hint, children }: QuestionCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="relative flex items-center gap-2">
        <label className="block text-sm font-semibold text-gray-800">
          {label} <span className="text-red-500">*</span>
        </label>

        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          aria-label={`${label} help`}
        >
          ?
        </button>

        {showTooltip && (
          <div className="absolute bottom-7 left-0 z-20 w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg">
            {hint}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
  placeholder,
  disabled,
}: TextInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-10 w-full rounded-lg border px-3 text-sm shadow-sm outline-none transition-colors focus:ring-2 focus:ring-blue-100 ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-600"
          : "cursor-pointer border-gray-200 bg-white text-gray-800 focus:border-blue-300"
      }`}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm outline-none transition-colors focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
    >
      <option value="" disabled>
        {placeholder}
      </option>

      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function DiseasePredictionForm({
  onSubmit,
  onCancel,
  initialBCS,
  petName,
  petAge,
  petBreed,
  petWeight,
  petActivityLevel,
  petPreferredDiet,
  petSpayedNeutered,
  petDigestiveSensitivity,
}: DiseasePredictionFormProps) {
  const hasBCS = initialBCS !== null && initialBCS !== undefined;

  const hasRequiredProfile =
    hasBCS &&
    petAge !== null &&
    petAge !== undefined &&
    petWeight !== null &&
    petWeight !== undefined &&
    petSpayedNeutered !== null &&
    petSpayedNeutered !== undefined;

  const [formData, setFormData] = useState<DiseasePredictionFormState>(() => {
    const initial = { ...initialFormState };

    if (hasBCS) {
      initial.body_condition_score = initialBCS;
    }

    if (petAge !== null && petAge !== undefined) {
      initial.age_years = String(petAge);
    }

    if (petWeight !== null && petWeight !== undefined) {
      initial.weight_kg = String(petWeight);
    }

    if (petWeight !== null && petWeight !== undefined) {
      if (petWeight < 10) {
        initial.breed_size = "Small";
      } else if (petWeight <= 25) {
        initial.breed_size = "Medium";
      } else {
        initial.breed_size = "Large";
      }
    } else if (petBreed) {
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

    if (petSpayedNeutered !== null && petSpayedNeutered !== undefined) {
      initial.neutered_status = petSpayedNeutered ? "Yes" : "No";
    }

    if (petActivityLevel) {
      const activityLower = petActivityLevel.toLowerCase();

      if (activityLower === "low") {
        initial.activity_level = "Low";
      } else if (activityLower === "medium" || activityLower === "moderate") {
        initial.activity_level = "Moderate";
      } else if (activityLower === "high") {
        initial.activity_level = "High";
      }
    }

    if (petPreferredDiet) {
      const dietLower = petPreferredDiet.toLowerCase();
      if (dietLower.includes("dry") || dietLower.includes("kibble")) {
        initial.diet_type = "Dry";
      } else if (dietLower.includes("wet") || dietLower.includes("canned")) {
        initial.diet_type = "Wet";
      } else if (dietLower.includes("mixed") || dietLower.includes("both")) {
        initial.diet_type = "Mixed";
      } else if (
        dietLower.includes("home") ||
        dietLower.includes("homemade") ||
        dietLower.includes("home-made") ||
        dietLower.includes("home cooked") ||
        dietLower.includes("home-cooked")
      ) {
        initial.diet_type = "Homemade";
      }
    }

    if (petDigestiveSensitivity) {
      const ds = petDigestiveSensitivity.toLowerCase();

      if (ds.includes("none") || ds.includes("no")) {
        initial.digestive_issues = "None";
      } else if (
        ds.includes("severe") ||
        ds.includes("frequent") ||
        ds.includes("chronic")
      ) {
        initial.digestive_issues = "Severe";
      } else {
        initial.digestive_issues = "Mild";
      }
    } else {
      initial.digestive_issues = "None";
    }

    if (!initial.activity_level) initial.activity_level = "Moderate";
    if (!initial.diet_type) initial.diet_type = "Mixed";

    return initial;
  });

  const formContainerRef = useRef<HTMLDivElement>(null);

  const canSubmit = () => {
    return (
      formData.age_years !== "" &&
      parseFloat(formData.age_years) > 0 &&
      formData.weight_kg !== "" &&
      parseFloat(formData.weight_kg) > 0 &&
      formData.breed_size !== "" &&
      formData.neutered_status !== "" &&
      formData.body_condition_score !== null &&
      formData.activity_level !== "" &&
      formData.daily_exercise_minutes !== "" &&
      parseInt(formData.daily_exercise_minutes, 10) >= 0 &&
      formData.diet_type !== "" &&
      formData.fatty_food_frequency !== "" &&
      formData.treat_frequency !== "" &&
      formData.water_intake !== "" &&
      formData.urination !== "" &&
      formData.appetite_change !== "" &&
      formData.vomiting !== "" &&
      formData.digestive_issues !== "" &&
      formData.lethargy !== ""
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasBCS && canSubmit()) {
      onSubmit(formData);
    }
  };

  if (!hasBCS) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            BCS required
          </h3>

          <p className="mb-6 text-sm text-gray-600">
            Please calculate the Body Condition Score (BCS) for{" "}
            {petName || "your pet"} first before running the disease risk
            assessment.
          </p>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to BCS Calculator
          </button>
        </div>
      </div>
    );
  }

  if (!hasRequiredProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Pet profile incomplete
          </h3>

          <p className="mb-6 text-sm text-gray-600">
            Please ensure {petName || "your pet"} has age, weight, and
            spay/neuter status saved in the pet profile before running the
            assessment.
          </p>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div
        ref={formContainerRef}
        className="mx-auto my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Stethoscope className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Health screening
                </p>

                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                  Multi-Disease Risk Assessment
                </h2>

                <p className="text-sm text-gray-500">
                  {petName ? `For ${petName}` : "For your pet"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close assessment form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />

                <div className="text-sm text-amber-800">
                  Provide accurate diet, activity, and symptom details before
                  running the screening.
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Lifestyle and symptoms
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  These questions help refine the risk prediction.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <QuestionCard
                  label="Daily exercise (minutes)"
                  hint="Approximate total exercise time per day."
                  hintTone="green"
                >
                  <TextInput
                    value={formData.daily_exercise_minutes}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        daily_exercise_minutes: value,
                      })
                    }
                    type="number"
                    min={0}
                    max={600}
                    step={1}
                    placeholder="e.g., 30"
                  />
                </QuestionCard>

                <QuestionCard
                  label="Fatty food frequency"
                  hint="How often your pet eats high-fat foods."
                  hintTone="rose"
                >
                  <SelectInput
                    value={formData.fatty_food_frequency}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        fatty_food_frequency: value as any,
                      })
                    }
                    options={[
                      { label: "Low", value: "Low" },
                      { label: "Moderate", value: "Moderate" },
                      { label: "High", value: "High" },
                    ]}
                  />
                </QuestionCard>

                <QuestionCard
                  label="Treat frequency"
                  hint="How often your pet receives treats."
                  hintTone="green"
                >
                  <SelectInput
                    value={formData.treat_frequency}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        treat_frequency: value as any,
                      })
                    }
                    options={[
                      { label: "Rare", value: "Rare" },
                      { label: "Moderate", value: "Moderate" },
                      { label: "Frequent", value: "Frequent" },
                    ]}
                  />
                </QuestionCard>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-200 pt-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Symptoms and clinical signs
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Choose the options that best match your pet currently.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <QuestionCard
                  label="Water intake"
                  hint="Whether your pet drinks less, normal, or more than usual."
                  hintTone="cyan"
                >
                  <SelectInput
                    value={formData.water_intake}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        water_intake: value as any,
                      })
                    }
                    options={[
                      { label: "Low", value: "Low" },
                      { label: "Normal", value: "Normal" },
                      { label: "High", value: "High" },
                    ]}
                  />
                </QuestionCard>

                <QuestionCard
                  label="Urination"
                  hint="Any noticeable changes in urination pattern."
                  hintTone="amber"
                >
                  <SelectInput
                    value={formData.urination}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        urination: value as any,
                      })
                    }
                    options={[
                      { label: "Normal", value: "Normal" },
                      { label: "Frequent", value: "Frequent" },
                      { label: "Difficult", value: "Difficult" },
                    ]}
                  />
                </QuestionCard>

                <QuestionCard
                  label="Appetite change"
                  hint="Whether appetite decreased, stayed normal, or increased."
                  hintTone="green"
                >
                  <SelectInput
                    value={formData.appetite_change}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        appetite_change: value as any,
                      })
                    }
                    options={[
                      { label: "Decreased", value: "Decreased" },
                      { label: "Normal", value: "Normal" },
                      { label: "Increased", value: "Increased" },
                    ]}
                  />
                </QuestionCard>

                <QuestionCard
                  label="Vomiting"
                  hint="Whether your pet has vomited recently."
                  hintTone="rose"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.vomiting === "Yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({ ...formData, vomiting: "Yes" })
                      }
                    />

                    <ChoiceButton
                      label="No"
                      selected={formData.vomiting === "No"}
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, vomiting: "No" })
                      }
                    />
                  </div>
                </QuestionCard>

                <QuestionCard
                  label="Lethargy"
                  hint="Whether your pet seems more tired than usual."
                  hintTone="cyan"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Yes"
                      selected={formData.lethargy === "Yes"}
                      tone="blue"
                      onClick={() =>
                        setFormData({ ...formData, lethargy: "Yes" })
                      }
                    />

                    <ChoiceButton
                      label="No"
                      selected={formData.lethargy === "No"}
                      tone="red"
                      onClick={() =>
                        setFormData({ ...formData, lethargy: "No" })
                      }
                    />
                  </div>
                </QuestionCard>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit()}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                canSubmit()
                  ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
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
