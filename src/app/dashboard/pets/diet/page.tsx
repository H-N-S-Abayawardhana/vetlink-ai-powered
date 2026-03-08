"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Sparkles,
  PawPrint,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { listPets, type Pet } from "@/lib/pets";
import Image from "next/image";

export default function DietPage() {
  // Ref for the results section
  const resultsRef = useRef<HTMLDivElement | null>(null);
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
        const dogs = Array.isArray(all) ? (all as Pet[]) : [];
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
        "Failed to generate diet plan. Please ensure the pet profile is complete (age, weight, BCS, activity level, gender, meals per day, dietary preferences) and you are signed in.",
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  // Scroll to results when plan is set
  useEffect(() => {
    if (plan && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [plan]);

  const downloadPdf = () => {
    if (!plan) return alert("No plan to download");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number = 40) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Helper function to add wrapped text
      const addWrappedText = (
        text: string,
        x: number,
        maxW: number,
        lineHeight: number = 14,
      ) => {
        const lines = doc.splitTextToSize(text, maxW);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, x, y);
          y += lineHeight;
        });
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`${pet?.name || "Pet"} — Diet Plan`, margin, y);
      y += 28;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated: ${new Date(plan.generatedAt || Date.now()).toLocaleString()}`,
        margin,
        y,
      );
      y += 24;

      // Pet basic info section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Pet Information", margin, y);
      y += 18;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${pet?.name || "—"}`, margin, y);
      y += 14;
      doc.text(`Breed: ${pet?.breed || "—"}`, margin, y);
      y += 14;
      doc.text(`Age: ${pet?.ageYears ?? "—"} years`, margin, y);
      y += 14;
      doc.text(`Weight: ${pet?.weightKg ?? "—"} kg`, margin, y);
      y += 14;
      if (pet?.bcs) {
        doc.text(`Body Condition Score: ${pet.bcs}/9`, margin, y);
        y += 14;
      }
      y += 10;

      checkPageBreak(60);

      // ============ BREED-SPECIFIC DIET STRUCTURE ============
      if (plan.Diet_Type) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Diet Type: ${plan.Diet_Type}`, margin, y);
        doc.setFont("helvetica", "normal");
        y += 20;

        checkPageBreak(60);

        // Nutrition Profile
        if (plan.Nutrition_Profile) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Nutrition Profile:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          if (plan.Nutrition_Profile.Protein_Level) {
            doc.text(
              `  Protein Level: ${plan.Nutrition_Profile.Protein_Level}`,
              margin,
              y,
            );
            y += 14;
          }
          if (plan.Nutrition_Profile.Fat_Level) {
            doc.text(
              `  Fat Level: ${plan.Nutrition_Profile.Fat_Level}`,
              margin,
              y,
            );
            y += 14;
          }
          if (plan.Nutrition_Profile.Carb_Level) {
            doc.text(
              `  Carb Level: ${plan.Nutrition_Profile.Carb_Level}`,
              margin,
              y,
            );
            y += 14;
          }
          y += 8;
          checkPageBreak(60);
        }

        // Feeding Guidelines
        if (plan.Feeding_Guidelines) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Feeding Guidelines:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          if (plan.Feeding_Guidelines.Meals_Per_Day) {
            doc.text(
              `  Meals Per Day: ${plan.Feeding_Guidelines.Meals_Per_Day}`,
              margin,
              y,
            );
            y += 14;
          }
          if (plan.Feeding_Guidelines.Treat_Allowance) {
            doc.text(
              `  Treat Allowance: ${plan.Feeding_Guidelines.Treat_Allowance}`,
              margin,
              y,
            );
            y += 14;
          }
          if (plan.Feeding_Guidelines.Portion_Control_Advice) {
            doc.setFont("helvetica", "bold");
            doc.text("  Portion Control Advice:", margin, y);
            doc.setFont("helvetica", "normal");
            y += 14;
            addWrappedText(
              plan.Feeding_Guidelines.Portion_Control_Advice,
              margin + 16,
              maxWidth - 16,
            );
            y += 4;
          }
          y += 8;
          checkPageBreak(60);
        }

        // Recommended Foods
        if (plan.Recommended_Foods && plan.Recommended_Foods.length > 0) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Recommended Foods:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          plan.Recommended_Foods.forEach((food: string) => {
            checkPageBreak();
            doc.text(`  ✓ ${food}`, margin, y);
            y += 13;
          });
          y += 8;
          checkPageBreak(60);
        }

        // Foods to Avoid
        if (plan.Foods_to_Avoid && plan.Foods_to_Avoid.length > 0) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Foods to Avoid:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          plan.Foods_to_Avoid.forEach((food: string) => {
            checkPageBreak();
            doc.text(`  ✗ ${food}`, margin, y);
            y += 13;
          });
          y += 8;
          checkPageBreak(60);
        }

        // Exercise Recommendation
        if (plan.Exercise_Recommendation) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Exercise Recommendation:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          addWrappedText(plan.Exercise_Recommendation, margin, maxWidth);
          y += 12;
          checkPageBreak(60);
        }

        // Important Notes
        if (plan.Notes) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text("Important Notes:", margin, y);
          y += 16;

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          addWrappedText(plan.Notes, margin, maxWidth);
          y += 12;
          checkPageBreak(60);
        }
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
        {!plan && (
          <div
            id="pet-selection-section"
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
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
                className="flex items-center justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide"
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
                          <p className="text-sm text-gray-500 mb-4">
                            {p.breed}
                          </p>

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
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-200"
                    >
                      Calculate BCS
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons (only show here if plan is not generated) */}
              {!plan && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={loadPlan}
                    disabled={!pet || loadingPlan || !pet.bcs}
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diet Plan Results */}
        {plan && (
          <div
            ref={resultsRef}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                {plan.petName}&apos;s Diet Plan
              </h2>
              <p className="text-purple-100 mt-1">
                Generated on {new Date(plan.generatedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* ============ KNOWLEDGE BASE DIET STRUCTURE ============ */}
              {plan.Diet_Type && (
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
                  {/* Diet Type */}
                  <div className="mb-6">
                    <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md">
                      Diet Type: {plan.Diet_Type}
                    </div>
                  </div>

                  {/* Nutrition Profile */}
                  {plan.Nutrition_Profile && (
                    <div className="mb-6 bg-white rounded-xl p-5 border border-indigo-200">
                      <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Nutrition Profile
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {plan.Nutrition_Profile.Protein_Level && (
                          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                            <div className="text-sm font-semibold text-red-600 mb-1">
                              Protein Level
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {plan.Nutrition_Profile.Protein_Level}
                            </div>
                          </div>
                        )}
                        {plan.Nutrition_Profile.Fat_Level && (
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <div className="text-sm font-semibold text-yellow-600 mb-1">
                              Fat Level
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {plan.Nutrition_Profile.Fat_Level}
                            </div>
                          </div>
                        )}
                        {plan.Nutrition_Profile.Carb_Level && (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="text-sm font-semibold text-green-600 mb-1">
                              Carb Level
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {plan.Nutrition_Profile.Carb_Level}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feeding Guidelines */}
                  {plan.Feeding_Guidelines && (
                    <div className="mb-6 bg-white rounded-xl p-5 border border-indigo-200">
                      <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Feeding Guidelines
                      </h4>
                      <div className="space-y-3">
                        {plan.Feeding_Guidelines.Meals_Per_Day && (
                          <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                              {plan.Feeding_Guidelines.Meals_Per_Day}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                Meals Per Day
                              </div>
                              <div className="text-sm text-gray-600">
                                Feed {plan.Feeding_Guidelines.Meals_Per_Day}{" "}
                                times daily
                              </div>
                            </div>
                          </div>
                        )}
                        {plan.Feeding_Guidelines.Portion_Control_Advice && (
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <div className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              Portion Control Advice
                            </div>
                            <div className="text-gray-700">
                              {plan.Feeding_Guidelines.Portion_Control_Advice}
                            </div>
                          </div>
                        )}
                        {plan.Feeding_Guidelines.Treat_Allowance && (
                          <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-3 border border-pink-200">
                            <div className="bg-pink-600 text-white rounded-lg px-4 py-2 font-bold">
                              {plan.Feeding_Guidelines.Treat_Allowance}
                            </div>
                            <div className="text-gray-700">
                              Treat Allowance Level
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommended Foods */}
                  {plan.Recommended_Foods &&
                    plan.Recommended_Foods.length > 0 && (
                      <div className="mb-6 bg-white rounded-xl p-5 border border-indigo-200">
                        <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Recommended Foods
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {plan.Recommended_Foods.map(
                            (food: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-200"
                              >
                                <span className="text-green-600 font-bold">
                                  ✓
                                </span>
                                <span className="text-gray-700">{food}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Foods to Avoid */}
                  {plan.Foods_to_Avoid && plan.Foods_to_Avoid.length > 0 && (
                    <div className="mb-6 bg-white rounded-xl p-5 border border-red-200">
                      <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Foods to Avoid
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plan.Foods_to_Avoid.map((food: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-red-50 rounded-lg p-3 border border-red-200"
                          >
                            <span className="text-red-600 font-bold">✗</span>
                            <span className="text-gray-700">{food}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercise Recommendation */}
                  {plan.Exercise_Recommendation && (
                    <div className="mb-6 bg-white rounded-xl p-5 border border-indigo-200">
                      <h4 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Exercise Recommendation
                      </h4>
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 border border-indigo-200">
                        <div className="text-gray-800 font-medium">
                          {plan.Exercise_Recommendation}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {plan.Notes && (
                    <div className="bg-white rounded-xl p-5 border border-indigo-200">
                      <h4 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Important Notes
                      </h4>
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-gray-700 leading-relaxed">
                          {plan.Notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons at the very bottom after notes */}
              <div className="flex flex-wrap gap-3 justify-end pt-6">
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
                  className="flex-1 min-w-[200px] px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="whitespace-nowrap">Select Another Pet</span>
                </button>

                <button
                  onClick={downloadPdf}
                  className="flex-1 min-w-[200px] px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="whitespace-nowrap">Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
