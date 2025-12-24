"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Sparkles,
  PawPrint,
  AlertCircle,
  TrendingUp,
  Droplet,
  Activity,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { listPets, type Pet } from "@/lib/pets";
import Image from "next/image";

export default function DietPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!selectedId) return setPet(null);
    const p = pets.find((pet: any) => pet.id === selectedId);
    setPet(p || null);
    setPlan(null);
  }, [selectedId, pets]);

  // Load pets (dogs) using client helper (matching BCSCalculator)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const all = await listPets();
        if (!mounted) return;
        const dogs = Array.isArray(all)
          ? (all as Pet[]).filter((p) => p.type === "dog")
          : [];
        setPets(dogs);
        setSelectedId((prev) => prev ?? (dogs.length > 0 ? dogs[0].id : null));
      } catch (err) {
        console.error("Error loading pets", err);
      }
    };
    load();
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
        "Failed to generate diet plan. Make sure the pet has a BCS and you are signed in.",
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  const downloadPdf = () => {
    if (!plan) return alert("No plan to download");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;

      // Header
      doc.setFontSize(18);
      doc.text(`${pet?.name || "Pet"} — Diet Plan`, margin, y);
      y += 24;

      doc.setFontSize(11);
      doc.text(
        `Generated: ${new Date(plan.generatedAt || Date.now()).toLocaleString()}`,
        margin,
        y,
      );
      y += 20;

      // If avatar is a data URL, try to include it
      const avatar = pet?.avatarDataUrl || pet?.avatarUrl || null;
      if (avatar && typeof avatar === "string" && avatar.startsWith("data:")) {
        try {
          doc.addImage(avatar, "JPEG", 450, margin, 90, 90);
        } catch (e) {
          // ignore image errors
        }
      }

      y += 6;

      // Pet basic info
      doc.setFontSize(13);
      doc.text("Pet Info", margin, y);
      y += 16;
      doc.setFontSize(11);
      doc.text(`Name: ${pet?.name || "—"}`, margin, y);
      y += 14;
      doc.text(`Breed: ${pet?.breed || "—"}`, margin, y);
      y += 14;
      doc.text(`Age: ${pet?.ageYears ?? "—"} years`, margin, y);
      y += 14;
      doc.text(`Weight: ${pet?.weightKg ?? "—"} kg`, margin, y);
      y += 20;

      // Key metrics
      doc.setFontSize(13);
      doc.text("Plan Summary", margin, y);
      y += 16;
      doc.setFontSize(11);
      doc.text(`Daily Calories: ${plan.dailyCalories} kcal`, margin, y);
      y += 14;
      doc.text(
        `Feeding Frequency: ${plan.feedingFrequency} per day`,
        margin,
        y,
      );
      y += 14;
      doc.text(
        `Per Meal: ${plan.portions?.cupsPerMeal ?? "—"} cups (~${plan.portions?.gramsPerMeal ?? "—"} g)`,
        margin,
        y,
      );
      y += 20;

      // Recommended foods
      doc.setFontSize(12);
      doc.text("Recommended Foods:", margin, y);
      y += 14;
      doc.setFontSize(11);
      (plan.recommendedFoodTypes || []).forEach((f: string) => {
        doc.text(`• ${f}`, margin + 8, y);
        y += 12;
        if (y > 740) {
          doc.addPage();
          y = margin;
        }
      });
      y += 6;

      // Foods to avoid
      doc.setFontSize(12);
      doc.text("Foods to Avoid:", margin, y);
      y += 14;
      doc.setFontSize(11);
      (plan.foodsToAvoid || []).forEach((f: string) => {
        doc.text(`• ${f}`, margin + 8, y);
        y += 12;
        if (y > 740) {
          doc.addPage();
          y = margin;
        }
      });
      y += 10;

      // Notes
      if (plan.notes && plan.notes.length) {
        doc.setFontSize(12);
        doc.text("Notes:", margin, y);
        y += 14;
        doc.setFontSize(11);
        plan.notes.forEach((n: string) => {
          doc.text(`• ${n}`, margin + 8, y);
          y += 12;
          if (y > 740) {
            doc.addPage();
            y = margin;
          }
        });
      }

      const filename = `${(pet?.name || "pet").replace(/\s+/g, "_")}_DietPlan_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PawPrint className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Diet Recommendations
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Create personalized nutrition plans for your furry friends
          </p>
        </div>

        {/* Pet Selection - Carousel/Slider Design */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Select Your Dog
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Swipe through your registered dogs
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Carousel Navigation */}
            <div
              className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {pets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex-shrink-0 transition-all duration-300 ${
                    selectedId === p.id
                      ? "scale-95"
                      : "scale-90 opacity-70 hover:scale-95"
                  }`}
                >
                  <div
                    className={`relative w-64 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                      selectedId === p.id
                        ? "ring-2 ring-blue-500 shadow-xl"
                        : "ring-1 ring-gray-200"
                    }`}
                  >
                    {/* Card Header with Gradient */}
                    <div
                      className={`h-24 ${
                        selectedId === p.id
                          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                          : "bg-gradient-to-r from-gray-300 to-gray-400"
                      }`}
                    >
                      {/* Paw Pattern Overlay */}
                      <div className="relative h-full flex items-center justify-center">
                        <PawPrint className="w-16 h-16 text-white opacity-20 absolute" />
                        <PawPrint className="w-8 h-8 text-white opacity-30 absolute top-2 right-4" />
                        <PawPrint className="w-6 h-6 text-white opacity-30 absolute bottom-3 left-6" />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="bg-white p-5 relative">
                      {/* Profile Circle */}
                      <div
                        className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                          selectedId === p.id
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 border-white"
                            : "bg-gradient-to-br from-gray-200 to-gray-300 border-white"
                        }`}
                      >
                        {/* Show pet avatar if available, otherwise fallback to PawPrint icon */}
                        {(p as any).avatarDataUrl || (p as any).avatarUrl ? (
                          <Image
                            src={
                              (p as any).avatarDataUrl || (p as any).avatarUrl
                            }
                            alt={`${p.name} avatar`}
                            width={56}
                            height={56}
                            unoptimized
                            className={`w-14 h-14 rounded-full object-cover ${selectedId === p.id ? "ring-2 ring-white" : ""}`}
                          />
                        ) : (
                          <PawPrint
                            className={`w-10 h-10 ${selectedId === p.id ? "text-white" : "text-gray-600"}`}
                          />
                        )}
                      </div>

                      <div className="mt-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {p.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{p.breed}</p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="text-xs text-blue-600 font-semibold">
                              Age
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {p.ageYears}
                            </div>
                            <div className="text-xs text-gray-500">years</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-xs text-green-600 font-semibold">
                              Weight
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {p.weightKg}
                            </div>
                            <div className="text-xs text-gray-500">kg</div>
                          </div>
                          <div
                            className={`rounded-lg p-2 ${p.bcs ? "bg-purple-50" : "bg-orange-50"}`}
                          >
                            <div
                              className={`text-xs font-semibold ${p.bcs ? "text-purple-600" : "text-orange-600"}`}
                            >
                              BCS
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {p.bcs || "—"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {p.bcs ? "set" : "none"}
                            </div>
                          </div>
                        </div>

                        {/* Selection Badge */}
                        {selectedId === p.id && (
                          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Carousel Dots Indicator */}
            <div className="flex justify-center gap-2">
              {pets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`transition-all duration-300 rounded-full ${
                    selectedId === p.id
                      ? "w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500"
                      : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {!selectedId && (
              <div className="text-center py-6 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
                <PawPrint className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No dog selected</p>
                <p className="text-gray-500 text-sm mt-1">
                  Click on a card above to select your dog
                </p>
              </div>
            )}

            {/* Pet Info Cards */}
            {pet && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Breed
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    {pet.breed}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                    Age
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    {pet.ageYears} years
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    Weight
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    {pet.weightKg} kg
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                    BCS
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    {pet.bcs || "—"}
                  </div>
                </div>
              </div>
            )}

            {/* BCS Warning */}
            {!pet?.bcs && pet && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-2">
                    Body Condition Score Required
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    This pet needs a BCS assessment before generating a diet
                    plan.
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/pets/bcs?petId=${pet.id}`)
                    }
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    Calculate BCS
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadPlan}
                disabled={!pet || loadingPlan || !pet.bcs}
                className="flex-1 min-w-[200px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingPlan ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Generate Diet Recommendation
                  </>
                )}
              </button>

              {plan && (
                <>
                  <button
                    onClick={downloadPdf}
                    className="min-w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>

                  {/* Save Plan removed — persisted via API automatically or via admin tools */}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Diet Plan Results */}
        {plan && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Personalized Diet Plan
              </h2>
              <p className="text-purple-100 mt-1">
                Generated on {new Date(plan.generatedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-sm font-semibold opacity-90 uppercase tracking-wide">
                    Daily Calories
                  </div>
                  <div className="text-4xl font-bold mt-2">
                    {plan.dailyCalories}
                  </div>
                  <div className="text-sm opacity-90 mt-1">kcal per day</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-sm font-semibold opacity-90 uppercase tracking-wide">
                    Feeding Times
                  </div>
                  <div className="text-4xl font-bold mt-2">
                    {plan.feedingFrequency}x
                  </div>
                  <div className="text-sm opacity-90 mt-1">per day</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-sm font-semibold opacity-90 uppercase tracking-wide">
                    Per Meal
                  </div>
                  <div className="text-4xl font-bold mt-2">
                    {plan.portions.cupsPerMeal}
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    cups (~{plan.portions.gramsPerMeal}g)
                  </div>
                </div>
              </div>

              {/* Detailed Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Food Recommendations */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Recommended Foods
                  </h3>
                  <ul className="space-y-2">
                    {plan.recommendedFoodTypes.map(
                      (food: string, i: number) => (
                        <li
                          key={i}
                          className="text-gray-700 flex items-start gap-2"
                        >
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{food}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Foods to Avoid */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-200">
                  <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Foods to Avoid
                  </h3>
                  <ul className="space-y-2">
                    {plan.foodsToAvoid.map((food: string, i: number) => (
                      <li
                        key={i}
                        className="text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-red-500 mt-1">✗</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
                  <Droplet className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-sm text-blue-600 font-semibold">
                      Daily Water
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {plan.waterMlPerDay} ml
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="text-sm text-orange-600 font-semibold">
                      Daily Exercise
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {plan.exerciseMinutesPerDay} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {plan.notes && plan.notes.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                  <h3 className="font-bold text-gray-800 text-lg mb-3">
                    Important Notes
                  </h3>
                  <ul className="space-y-2">
                    {plan.notes.map((note: string, i: number) => (
                      <li
                        key={i}
                        className="text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
