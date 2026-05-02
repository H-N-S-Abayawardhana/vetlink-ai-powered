"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Sparkles,
  PawPrint,
  AlertCircle,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { listPets, type Pet } from "@/lib/pets";
import { generateDietPlanPdf } from "@/lib/diet-plan-pdf";
import Image from "next/image";

function getPetAvatar(pet: any): string | null {
  return pet?.avatarDataUrl || pet?.avatarUrl || null;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function humanizeKey(key: string) {
  const normalized = String(key).toLowerCase().trim();
  const dayRange = normalized.match(/^day_(\d+)_(\d+)$/);
  if (dayRange) {
    return `Day ${dayRange[1]}-${dayRange[2]}`;
  }
  const dayPlus = normalized.match(/^day_(\d+)_plus$/);
  if (dayPlus) {
    return `Day ${dayPlus[1]}+`;
  }

  return String(key)
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

export default function DietPage() {
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    if (!selectedId) return setPet(null);
    const selectedPet = pets.find((item: any) => item.id === selectedId);
    setPet(selectedPet || null);
    setPlan(null);
  }, [selectedId, pets]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingPets(true);
      try {
        const all = await listPets();
        if (!mounted) return;
        const dogs = Array.isArray(all) ? (all as Pet[]) : [];
        setPets(dogs);
        setSelectedId((prev) => prev ?? (dogs.length > 0 ? dogs[0].id : null));
      } catch (err) {
        console.error("Error loading pets", err);
      } finally {
        if (mounted) {
          setLoadingPets(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const loadPlan = async () => {
    if (!selectedId) return;
    setLoadingPlan(true);
    try {
      const res = await fetch(`/api/pets/${selectedId}/diet`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate plan");
      }
      const json = await res.json();
      setPlan(json.plan || null);
    } catch (err) {
      console.error("Error generating diet plan", err);
      alert(
        "Failed to generate diet plan. Please ensure the pet profile is complete (age, weight, BCS, activity level, gender, meals per day, dietary preferences) and you are signed in.",
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (plan && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [plan]);

  const downloadPdf = () => {
    if (!plan) return alert("No plan to download");
    try {
      generateDietPlanPdf({ plan, pet });
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF.");
    }
  };

  const hasKbDetails = Boolean(
    plan?.dietary_recommendations ||
      (plan?.nutrition_targets && Object.keys(plan.nutrition_targets).length > 0) ||
      (Array.isArray(plan?.feeding_plan) && plan.feeding_plan.length > 0) ||
      (plan?.micronutrient_profile &&
        Object.keys(plan.micronutrient_profile).length > 0) ||
      (Array.isArray(plan?.commercial_food_options) &&
        plan.commercial_food_options.length > 0) ||
      (Array.isArray(plan?.homemade_food_options) &&
        plan.homemade_food_options.length > 0) ||
      (Array.isArray(plan?.breed_specific_considerations) &&
        plan.breed_specific_considerations.length > 0) ||
      plan?.portion_and_calorie_guidance ||
      plan?.meal_timing_guidance ||
      plan?.food_safety ||
      plan?.allergy_and_sensitivity_rules ||
      plan?.supplement_guidance ||
      plan?.transition_plan ||
      plan?.monitoring_metrics ||
      (Array.isArray(plan?.veterinary_review_required_for) &&
        plan.veterinary_review_required_for.length > 0),
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Sparkles className="w-3.5 h-3.5" />
              Nutrition planning
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Diet Recommendations
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Generate a simple nutrition and feeding plan based on your
              pet&apos;s profile, body condition score, and lifestyle details.
            </p>
          </div>
        </div>
      </div>

      {!plan && (
        <div
          id="pet-selection-section"
          className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-5"
        >
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-blue-600" />
              Select your pet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a pet to generate a personalized diet recommendation.
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
                Add a pet profile first to generate a diet plan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pets.map((p: any) => {
                const selected = selectedId === p.id;
                const avatar = getPetAvatar(p);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-blue-300 bg-blue-50/70"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={`${p.name} avatar`}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <PawPrint className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 truncate">
                            {p.name}
                          </p>
                          {selected && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {p.breed || "Breed: -"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Age
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {p.ageYears ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Weight
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {p.weightKg ?? "-"} {p.weightKg ? "kg" : ""}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          p.bcs ? "bg-purple-50" : "bg-amber-50"
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-wide ${
                            p.bcs ? "text-purple-600" : "text-amber-600"
                          }`}
                        >
                          BCS
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {p.bcs ?? "-"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!pet?.bcs && pet && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Body Condition Score required
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Calculate BCS for this pet before generating a diet plan.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  router.push(`/dashboard/pets/bcs?petId=${pet.id}`)
                }
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
              >
                Calculate BCS
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={loadPlan}
              disabled={!pet || loadingPlan || !pet.bcs}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {loadingPlan ? "Generating..." : "Generate diet recommendation"}
            </button>
          </div>
        </div>
      )}

      {plan && (
        <div ref={resultsRef} className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Generated plan
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                  {plan.petName}&apos;s Diet Plan
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Generated on {new Date(plan.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {(plan.kbDietType || plan.Diet_Type) && (
            <div className="space-y-4 sm:space-y-6">
              {/* 1. Plan Overview */}
              <SectionCard title="Plan Overview">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Diet type: {plan.kbDietType || plan.Diet_Type}
                </div>

                {(plan.meals_per_day || plan.energy_kcal || plan.hydration) && (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.meals_per_day && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                          Meals per day
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.meals_per_day}
                        </p>
                      </div>
                    )}
                    {plan.energy_kcal && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Energy
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.energy_kcal}
                        </p>
                      </div>
                    )}
                    {plan.hydration && (
                      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                          Hydration
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.hydration}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* 2. Goal */}
              {(plan.diet_goal || plan.life_stage_or_goal) && (
                <SectionCard title="Goal">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.life_stage_or_goal && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Life stage / goal
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.life_stage_or_goal}
                        </p>
                      </div>
                    )}
                    {plan.diet_goal && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Diet goal
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.diet_goal}
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 3. Dietary Recommendations */}
              {plan.dietary_recommendations && (
                <SectionCard title="Dietary Recommendations">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                    {plan.dietary_recommendations}
                  </div>
                </SectionCard>
              )}

              {/* 4. Nutrition Targets */}
              {plan.nutrition_targets && (
                <SectionCard title="Nutrition Targets">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(
                      plan.nutrition_targets as Record<string, string | number>,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {humanizeKey(key)}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 5. Feeding Plan */}
              {Array.isArray(plan.feeding_plan) && plan.feeding_plan.length > 0 && (
                <SectionCard title="Feeding Plan">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">
                            Food
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Amount (g)
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Calories
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(plan.feeding_plan as any[]).map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-3 text-gray-900">
                              {item?.food_item || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item?.amount_g ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item?.calories ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {/* 6. Food Options */}
              {(Array.isArray(plan.commercial_food_options) &&
                plan.commercial_food_options.length > 0) ||
              (Array.isArray(plan.homemade_food_options) &&
                plan.homemade_food_options.length > 0) ? (
                <SectionCard title="Food Options">
                  <div className="space-y-5">
                    {Array.isArray(plan.commercial_food_options) &&
                      plan.commercial_food_options.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Commercial
                          </p>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {plan.commercial_food_options.map(
                              (food: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-700"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{food}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {Array.isArray(plan.homemade_food_options) &&
                      plan.homemade_food_options.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Homemade
                          </p>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {plan.homemade_food_options.map(
                              (food: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700"
                                >
                                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <span>{food}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </SectionCard>
              ) : null}

              {/* 7. Micronutrient Profile */}
              {plan.micronutrient_profile && (
                <SectionCard title="Micronutrient Profile">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(
                      plan.micronutrient_profile as Record<string, string>,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-600">
                          {humanizeKey(key)}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 8. Breed Considerations */}
              {Array.isArray(plan.breed_specific_considerations) &&
                plan.breed_specific_considerations.length > 0 && (
                  <SectionCard title="Breed Considerations">
                    <div className="flex flex-wrap gap-2">
                      {plan.breed_specific_considerations.map(
                        (item: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {/* 9. Meal Timing */}
              {plan.meal_timing_guidance && (
                <SectionCard title="Meal Timing">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.meal_timing_guidance?.feeding_frequency && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Feeding frequency
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.meal_timing_guidance.feeding_frequency}
                        </p>
                      </div>
                    )}
                    {plan.meal_timing_guidance?.meal_spacing && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Meal spacing
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.meal_timing_guidance.meal_spacing}
                        </p>
                      </div>
                    )}
                    {plan.meal_timing_guidance?.bloat_precaution && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Bloat precaution
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {plan.meal_timing_guidance.bloat_precaution}
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 10. Portion & Calorie Guidance */}
              {plan.portion_and_calorie_guidance && (
                <SectionCard title="Portion & Calorie Guidance">
                  <div className="space-y-4">
                    {(plan.portion_and_calorie_guidance?.portion_rule ||
                      plan.portion_and_calorie_guidance?.review_interval) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plan.portion_and_calorie_guidance?.portion_rule && (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                            <p className="text-[11px] uppercase tracking-wide text-blue-700">
                              Portion rule
                            </p>
                            <p className="mt-1">
                              {plan.portion_and_calorie_guidance.portion_rule}
                            </p>
                          </div>
                        )}
                        {plan.portion_and_calorie_guidance?.review_interval && (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                            <p className="text-[11px] uppercase tracking-wide text-blue-700">
                              Review interval
                            </p>
                            <p className="mt-1">
                              {plan.portion_and_calorie_guidance.review_interval}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {plan.portion_and_calorie_guidance?.calorie_adjustment && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(
                          plan.portion_and_calorie_guidance
                            .calorie_adjustment as Record<string, string>,
                        ).map(([level, text]) => (
                          <div
                            key={level}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              {humanizeKey(level)}
                            </p>
                            <p className="mt-1">{text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 11. Supplement Guidance */}
              {plan.supplement_guidance && (
                <SectionCard title="Supplement Guidance">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(
                      plan.supplement_guidance as Record<string, string>,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-900">
                          {humanizeKey(key)}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 12. Food Safety */}
              {plan.food_safety && (
                <SectionCard title="Food Safety">
                  <div className="space-y-4">
                    {Array.isArray(plan.food_safety?.avoid_toxic_foods) &&
                      plan.food_safety.avoid_toxic_foods.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Avoid toxic foods
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {plan.food_safety.avoid_toxic_foods.map(
                              (food: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                                >
                                  {food}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {Array.isArray(plan.food_safety?.preparation_rules) &&
                      plan.food_safety.preparation_rules.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Preparation rules
                          </p>
                          <div className="mt-2 space-y-2">
                            {plan.food_safety.preparation_rules.map(
                              (rule: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{rule}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {plan.food_safety?.treat_limit && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-800">
                        <p className="text-[11px] uppercase tracking-wide text-amber-700">
                          Treat limit
                        </p>
                        <p className="mt-1">{plan.food_safety.treat_limit}</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 13. Allergy & Sensitivity */}
              {plan.allergy_and_sensitivity_rules && (
                <SectionCard title="Allergy & Sensitivity">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(
                      plan.allergy_and_sensitivity_rules as Record<string, string>,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {humanizeKey(key)}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 14. Transition Plan */}
              {plan.transition_plan && (
                <SectionCard title="Transition Plan">
                  <div className="space-y-2">
                    {Object.entries(plan.transition_plan as Record<string, string>).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                        >
                          <span className="text-xs font-semibold text-gray-900">
                            {humanizeKey(key)}:
                          </span>
                          <span>{value}</span>
                        </div>
                      ),
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 15. Monitoring */}
              {plan.monitoring_metrics && (
                <SectionCard title="Monitoring">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {plan.monitoring_metrics?.body_condition_score && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Body condition score
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {plan.monitoring_metrics.body_condition_score}
                          </p>
                        </div>
                      )}
                      {plan.monitoring_metrics?.weight_tracking && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Weight tracking
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {plan.monitoring_metrics.weight_tracking}
                          </p>
                        </div>
                      )}
                      {plan.monitoring_metrics?.stool_score && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Stool score
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {plan.monitoring_metrics.stool_score}
                          </p>
                        </div>
                      )}
                    </div>

                    {Array.isArray(plan.monitoring_metrics?.clinical_flags) &&
                      plan.monitoring_metrics.clinical_flags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Watch for
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {plan.monitoring_metrics.clinical_flags.map(
                              (flag: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-800"
                                >
                                  <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                                  <span>{flag}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Glossary">
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-gray-900">RER</span> —
                    Resting Energy Requirement: an estimate of the calories a dog
                    needs at rest (baseline energy).
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">MER</span> —
                    Maintenance Energy Requirement: an estimate of daily calories
                    needed to maintain body weight.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      MER ≈ 1.6×RER
                    </span>
                    means MER is being estimated as 1.6 times RER (a common
                    general multiplier for many adult dogs; the right multiplier
                    can vary with age, activity level, and neuter status).
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">DM</span> — Dry
                    Matter: nutrition values expressed with water removed, used
                    to compare foods with different moisture levels.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">IU/kg DM</span>
                    — International Units per kilogram of dry matter.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">EPA + DHA</span>
                    — Omega-3 fatty acids (eicosapentaenoic acid +
                    docosahexaenoic acid).{" "}
                    <span className="font-semibold text-gray-900">~0.1–0.2% DM</span>
                    means the combined EPA + DHA target is about 0.1–0.2%
                    of the diet on a dry-matter basis.
                  </p>
                </div>
              </SectionCard>

              {Array.isArray(plan.veterinary_review_required_for) &&
                plan.veterinary_review_required_for.length > 0 && (
                  <SectionCard title="Veterinary Review Recommended">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plan.veterinary_review_required_for.map(
                        (reason: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-800"
                          >
                            <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {!hasKbDetails && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      No detailed knowledge base entry found.
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Update the pet&apos;s breed to match the nutrition
                      knowledge base and try again.
                    </p>
                  </div>
                )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              <button
                onClick={() => {
                  const petSelect = document.getElementById(
                    "pet-selection-section",
                  );
                  if (petSelect) {
                    petSelect.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  setPlan(null);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Select another pet
              </button>

              <button
                onClick={downloadPdf}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md mx-4">
            <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating diet recommendation
            </h3>
            <p className="text-sm text-gray-600">
              Preparing a personalized nutrition and feeding plan for your pet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
