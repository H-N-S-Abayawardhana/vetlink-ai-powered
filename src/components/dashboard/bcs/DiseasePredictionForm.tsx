"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, FileText, Info, AlertTriangle, Stethoscope } from 'lucide-react';
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

  // BCS display helper
  const getBCSColor = (score: number) => {
    if (score <= 3) return "bg-orange-400";
    if (score <= 5) return "bg-green-500";
    if (score <= 7) return "bg-amber-400";
    return "bg-red-500";
  };

  const getBCSLabel = (score: number) => {
    if (score <= 3) return "Underweight";
    if (score <= 5) return "Ideal";
    if (score <= 7) return "Overweight";
    return "Obese";
  };

  const getBCSBorderColor = (score: number) => {
    if (score <= 3) return "border-orange-300";
    if (score <= 5) return "border-green-300";
    if (score <= 7) return "border-amber-300";
    return "border-red-300";
  };

  const getBCSBgColor = (score: number) => {
    if (score <= 3) return "bg-orange-50";
    if (score <= 5) return "bg-green-50";
    if (score <= 7) return "bg-amber-50";
    return "bg-red-50";
  };

  const getBCSTextColor = (score: number) => {
    if (score <= 3) return "text-orange-700";
    if (score <= 5) return "text-green-700";
    if (score <= 7) return "text-amber-700";
    return "text-red-700";
  };

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
              {/* BCS Display Card - Read-only from database - Only shown in Step 1 */}
              <div className={`mb-6 p-4 rounded-xl border-2 ${getBCSBorderColor(initialBCS)} ${getBCSBgColor(initialBCS)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${getBCSColor(initialBCS)} rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {initialBCS}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Body Condition Score</p>
                      <p className={`font-bold text-lg ${getBCSTextColor(initialBCS)}`}>
                        {getBCSLabel(initialBCS)} ({initialBCS}/9)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-sm text-gray-600">
                      <span>📊</span> From Pet Profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Step 1:</strong> Review and confirm your pet&apos;s profile information. These details have been auto-filled from the database. You can edit any field if needed.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  📋 Pet Profile & Lifestyle
                </h3>
                {petId && (
                  <Link
                    href={`/dashboard/pets/${petId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 border border-purple-200 rounded-lg hover:border-purple-400 hover:text-purple-900 bg-purple-50"
                  >
                    Edit pet profile
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age Display */}
                <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {formData.age_years || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-bold text-lg text-blue-700">
                          {formData.age_years ? `${formData.age_years} years` : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breed Size Display */}
                <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {formData.breed_size ? formData.breed_size.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Breed Size</p>
                        <p className="font-bold text-lg text-purple-700">
                          {formData.breed_size || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sex Display */}
                <div className={`p-4 rounded-xl border-2 ${formData.sex === 'Male' ? 'border-blue-200 bg-blue-50' : 'border-pink-200 bg-pink-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${formData.sex === 'Male' ? 'bg-blue-500' : 'bg-pink-500'} rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                        {formData.sex === 'Male' ? 'M' : formData.sex === 'Female' ? 'F' : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sex</p>
                        <p className={`font-bold text-lg ${formData.sex === 'Male' ? 'text-blue-700' : 'text-pink-700'}`}>
                          {formData.sex || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spayed/Neutered Display */}
                <div className={`p-4 rounded-xl border-2 ${formData.is_neutered === 'yes' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${formData.is_neutered === 'yes' ? 'bg-green-500' : 'bg-amber-500'} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {formData.is_neutered === 'yes' ? 'Yes' : formData.is_neutered === 'no' ? 'No' : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Spayed/Neutered</p>
                        <p className={`font-bold text-lg ${formData.is_neutered === 'yes' ? 'text-green-700' : 'text-amber-700'}`}>
                          {formData.is_neutered === 'yes' ? 'Neutered' : formData.is_neutered === 'no' ? 'Intact' : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle & Environment Section */}
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 mt-8 pt-6 border-t border-gray-200">
                🏡 Lifestyle & Environment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diet Type Display */}
                <div className="p-4 rounded-xl border-2 border-orange-200 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {formData.diet_type ? formData.diet_type.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Diet Type</p>
                        <p className="font-bold text-lg text-orange-700">
                          {formData.diet_type || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exercise Level Display */}
                <div className={`p-4 rounded-xl border-2 ${
                  formData.exercise_level === 'Low' ? 'border-amber-200 bg-amber-50' : 
                  formData.exercise_level === 'Moderate' ? 'border-blue-200 bg-blue-50' : 
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${
                        formData.exercise_level === 'Low' ? 'bg-amber-500' : 
                        formData.exercise_level === 'Moderate' ? 'bg-blue-500' : 
                        'bg-green-500'
                      } rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {formData.exercise_level ? formData.exercise_level.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Exercise Level</p>
                        <p className={`font-bold text-lg ${
                          formData.exercise_level === 'Low' ? 'text-amber-700' : 
                          formData.exercise_level === 'Moderate' ? 'text-blue-700' : 
                          'text-green-700'
                        }`}>
                          {formData.exercise_level || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Living Environment Display */}
                <div className={`p-4 rounded-xl border-2 md:col-span-2 ${
                  formData.environment === 'Urban' ? 'border-blue-200 bg-blue-50' : 
                  formData.environment === 'Suburban' ? 'border-purple-200 bg-purple-50' : 
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${
                        formData.environment === 'Urban' ? 'bg-blue-500' : 
                        formData.environment === 'Suburban' ? 'bg-purple-500' : 
                        'bg-green-500'
                      } rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {formData.environment ? formData.environment.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Living Environment</p>
                        <p className={`font-bold text-lg ${
                          formData.environment === 'Urban' ? 'text-blue-700' : 
                          formData.environment === 'Suburban' ? 'text-purple-700' : 
                          'text-green-700'
                        }`}>
                          {formData.environment || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                        <span>📊</span> Auto-filled
                      </span>
                    </div>
                  </div>
                </div>
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
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, pale_gums: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.pale_gums === "no"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ✅ No
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
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, skin_lesions: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.skin_lesions === "no"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ✅ No
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
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, polyuria: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.polyuria === "no"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ✅ No
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
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ✅ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tick_prevention: 'None' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.tick_prevention === 'None' || formData.tick_prevention === 'Irregular'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ❌ No
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
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ✅ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heartworm_prevention: "no" })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.heartworm_prevention === "no"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ❌ No
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
