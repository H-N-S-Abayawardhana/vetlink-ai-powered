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

function formatKeyLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() || "-";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseFeedingAmountKb(text: string) {
  const source = (text || "").toLowerCase();

  // Examples:
  // - "Approx 20-30 g/kg body weight/day (2-3% BW)"
  // - "Approx 25-30 g/kg body weight/day"
  // - "Approx 20 g/kg body weight/day"
  const gPerKgRange = source.match(
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*g\s*\/\s*kg/,
  );
  const gPerKgSingle = source.match(/(\d+(?:\.\d+)?)\s*g\s*\/\s*kg/);

  const percentRange = source.match(
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%\s*bw/,
  );
  const percentSingle = source.match(/(\d+(?:\.\d+)?)\s*%\s*bw/);

  if (gPerKgRange) {
    return {
      mode: "g_per_kg" as const,
      min: Number.parseFloat(gPerKgRange[1]),
      max: Number.parseFloat(gPerKgRange[2]),
    };
  }

  if (gPerKgSingle) {
    const value = Number.parseFloat(gPerKgSingle[1]);
    return { mode: "g_per_kg" as const, min: value, max: value };
  }

  if (percentRange) {
    return {
      mode: "percent_bw" as const,
      min: Number.parseFloat(percentRange[1]),
      max: Number.parseFloat(percentRange[2]),
    };
  }

  if (percentSingle) {
    const value = Number.parseFloat(percentSingle[1]);
    return { mode: "percent_bw" as const, min: value, max: value };
  }

  return null;
}

function cleanKbText(value?: string | null) {
  if (!value) return value || "";
  return value
    .replace(/â\u20ac\u201c/g, "-")
    .replace(/â\u20ac\u201d/g, "-")
    .replace(/â\u20ac\u2019/g, "'")
    .replace(/â\u20ac\u2018/g, "'")
    .replace(/â\u20ac\u0153/g, '"')
    .replace(/â\u20ac\u009d/g, '"')
    .replace(/â\u20ac\u00a6/g, "...");
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
      const res = await fetch(`/api/pets/${selectedId}/diet?t=${Date.now()}`, {
        cache: "no-store",
      });
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

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 lg:max-w-sm">
            For the best recommendation, keep your pet&apos;s age, weight,
            activity level, diet preference, and BCS up to date.
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
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Age
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {p.ageYears ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          Weight
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {p.weightKg ?? "-"} {p.weightKg ? "kg" : ""}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          p.bcs ? "bg-purple-50" : "bg-amber-50"
                        }`}
                      >
                        <p
                          className={`text-[11px] uppercase tracking-wide ${
                            p.bcs ? "text-purple-600" : "text-amber-600"
                          }`}
                        >
                          BCS
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
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

              {pet && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-900">
                      {pet.name}
                    </span>
                    {pet.breed ? ` • ${pet.breed}` : ""}
                  </p>
                  <p className="mt-1">
                    Weight: {pet.weightKg ?? "-"} kg • BCS: {pet.bcs ?? "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {plan.Diet_Type && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Diet type: {plan.Diet_Type}
                </div>

                {plan.kb?.dietary_recommendations && (
                  <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                    {cleanKbText(plan.kb.dietary_recommendations)}
                  </div>
                )}

                {plan.Nutrition_Profile && (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.Nutrition_Profile.Protein_Level && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-red-600">
                          Protein
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile.Protein_Level}
                        </p>
                      </div>
                    )}
                    {plan.Nutrition_Profile.Fat_Level && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-amber-600">
                          Fat
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile.Fat_Level}
                        </p>
                      </div>
                    )}
                    {plan.Nutrition_Profile.Carb_Level && (
                      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-green-600">
                          Carbs
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile.Carb_Level}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {plan.Feeding_Guidelines && (
                <SectionCard title="Feeding Guidelines">
                  <div className="space-y-3">
                    {(plan.kb?.meals_per_day || plan.Feeding_Guidelines.Meals_Per_Day) && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          Meals per day
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          Feed {cleanKbText(safeDisplayValue(plan.kb?.meals_per_day ?? plan.Feeding_Guidelines.Meals_Per_Day))} times daily.
                        </p>
                      </div>
                    )}
                    {!plan.kb?.dietary_recommendations &&
                      plan.Feeding_Guidelines.Portion_Control_Advice && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          Portion control advice
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {cleanKbText(
                            plan.Feeding_Guidelines.Portion_Control_Advice,
                          )}
                        </p>
                      </div>
                    )}
                    {plan.Feeding_Guidelines.Treat_Allowance && (
                      <div className="rounded-lg border border-pink-200 bg-pink-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          Treat allowance
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {plan.Feeding_Guidelines.Treat_Allowance}
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {plan.kb?.nutrition_targets &&
                Object.keys(plan.kb.nutrition_targets).length > 0 && (
                  <SectionCard title="Nutrition Targets">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(plan.kb.nutrition_targets)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-sky-700">
                              {formatKeyLabel(key)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {cleanKbText(safeDisplayValue(value))}
                            </p>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}

              {plan.kb?.feeding_amount_g_per_kg && (
                <SectionCard title="Feeding Amount (KB)">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-gray-700 space-y-2">
                    <div>{cleanKbText(plan.kb.feeding_amount_g_per_kg)}</div>

                    {typeof plan.weightKg === "number" &&
                      Number.isFinite(plan.weightKg) &&
                      plan.weightKg > 0 && (() => {
                        const parsed = parseFeedingAmountKb(
                          String(plan.kb?.feeding_amount_g_per_kg || ""),
                        );
                        if (!parsed) return null;

                        let minG = 0;
                        let maxG = 0;

                        if (parsed.mode === "g_per_kg") {
                          minG = plan.weightKg * parsed.min;
                          maxG = plan.weightKg * parsed.max;
                        } else {
                          // percent of body weight per day
                          minG = plan.weightKg * 1000 * (parsed.min / 100);
                          maxG = plan.weightKg * 1000 * (parsed.max / 100);
                        }

                        const minRounded = Math.round(minG);
                        const maxRounded = Math.round(maxG);
                        const rangeText =
                          minRounded === maxRounded
                            ? `${minRounded} g/day`
                            : `${minRounded}–${maxRounded} g/day`;

                        return (
                          <div className="text-xs text-indigo-800">
                            For {plan.weightKg} kg: <span className="font-semibold">{rangeText}</span>
                          </div>
                        );
                      })()}
                  </div>
                </SectionCard>
              )}

              {plan.kb?.feeding_plan && plan.kb.feeding_plan.length > 0 && (
                <SectionCard title="Feeding Plan">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.kb.feeding_plan.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {cleanKbText(item?.food_item || "Food")}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                              Amount
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {typeof item?.amount_g === "number"
                                ? `${item.amount_g} g`
                                : typeof item?.quantity_g === "number"
                                  ? `${item.quantity_g} g`
                                  : "-"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                              Calories
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {typeof item?.calories === "number"
                                ? `${item.calories} kcal`
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {(plan.kb?.hydration || plan.kb?.energy_kcal) && (
                <SectionCard title="Hydration & Energy">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.kb?.hydration && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          Hydration
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {cleanKbText(plan.kb.hydration)}
                        </p>
                      </div>
                    )}
                    {plan.kb?.energy_kcal && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          Energy
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {cleanKbText(plan.kb.energy_kcal)}
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {plan.kb?.macronutrient_profile &&
                Object.keys(plan.kb.macronutrient_profile).length > 0 && (
                  <SectionCard title="Macronutrient Profile">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(plan.kb.macronutrient_profile).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-emerald-700">
                              {formatKeyLabel(key)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {cleanKbText(safeDisplayValue(value))}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.kb?.micronutrient_profile &&
                Object.keys(plan.kb.micronutrient_profile).length > 0 && (
                  <SectionCard title="Micronutrient Profile">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(plan.kb.micronutrient_profile).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-violet-700">
                              {formatKeyLabel(key)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {cleanKbText(safeDisplayValue(value))}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.kb?.commercial_food_options &&
                plan.kb.commercial_food_options.length > 0 && (
                  <SectionCard title="Commercial Food Options">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plan.kb.commercial_food_options.map(
                        (food: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{cleanKbText(food)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.kb?.homemade_food_options &&
                plan.kb.homemade_food_options.length > 0 && (
                  <SectionCard title="Homemade Food Options">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plan.kb.homemade_food_options.map(
                        (food: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{cleanKbText(food)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {!plan.kb?.commercial_food_options &&
                !plan.kb?.homemade_food_options &&
                plan.Recommended_Foods &&
                plan.Recommended_Foods.length > 0 && (
                  <SectionCard title="Recommended Foods">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plan.Recommended_Foods.map(
                        (food: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{cleanKbText(food)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.Foods_to_Avoid && plan.Foods_to_Avoid.length > 0 && (
                <SectionCard title="Foods to Avoid">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.Foods_to_Avoid.map((food: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-700"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>{cleanKbText(food)}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {plan.Nutrition_Profile_Percent && (
                <SectionCard title="Nutrition Profile (Percent)">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.Nutrition_Profile_Percent.Protein && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-sky-700">
                          Protein
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_Percent.Protein}
                        </p>
                      </div>
                    )}
                    {plan.Nutrition_Profile_Percent.Fat && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-orange-700">
                          Fat
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_Percent.Fat}
                        </p>
                      </div>
                    )}
                    {plan.Nutrition_Profile_Percent.Carbohydrate && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-700">
                          Carbohydrate
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_Percent.Carbohydrate}
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {plan.Nutrition_Profile_g_per_kg && (
                <SectionCard title="Nutrition Profile (g per kg feed)">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {typeof plan.Nutrition_Profile_g_per_kg.Protein_g_per_kg ===
                      "number" && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-sky-700">
                          Protein
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_g_per_kg.Protein_g_per_kg} g/kg
                        </p>
                      </div>
                    )}
                    {typeof plan.Nutrition_Profile_g_per_kg.Fat_g_per_kg ===
                      "number" && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-orange-700">
                          Fat
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_g_per_kg.Fat_g_per_kg} g/kg
                        </p>
                      </div>
                    )}
                    {typeof plan.Nutrition_Profile_g_per_kg.Carb_g_per_kg ===
                      "number" && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-700">
                          Carbohydrate
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {plan.Nutrition_Profile_g_per_kg.Carb_g_per_kg} g/kg
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {!plan.kb?.feeding_amount_g_per_kg &&
                plan.Feeding_g_per_kg_bodyweight_day &&
                Object.keys(plan.Feeding_g_per_kg_bodyweight_day).length > 0 && (
                  <SectionCard title="Daily Feeding Amount (g per kg body weight)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(plan.Feeding_g_per_kg_bodyweight_day).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-indigo-700">
                              {formatKeyLabel(key)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {value ?? "-"} g/kg/day
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.Mineral_spec_per_1000kcal &&
                Object.keys(plan.Mineral_spec_per_1000kcal).length > 0 && (
                  <SectionCard title="Mineral Specification (per 1000 kcal)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(plan.Mineral_spec_per_1000kcal).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-violet-700">
                              {formatKeyLabel(key)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {cleanKbText(String(value ?? "-"))}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </SectionCard>
                )}

              {plan.Exercise_Recommendation && (
                <SectionCard title="Exercise Recommendation">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                    {cleanKbText(plan.Exercise_Recommendation)}
                  </div>
                </SectionCard>
              )}

              {plan.Notes && (
                <SectionCard title="Important Notes">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700">
                    {cleanKbText(plan.Notes)}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {!plan.Diet_Type && (
            <SectionCard title="Recommendation Summary">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700">
                No exact knowledge base diet type was matched for this pet.
                Please review the pet breed details and profile values, then
                regenerate the recommendation.
              </div>
            </SectionCard>
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
