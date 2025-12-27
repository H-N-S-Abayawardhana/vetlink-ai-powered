'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Info, AlertTriangle, Stethoscope } from 'lucide-react';
import type {
  DiseasePredictionFormState,
  BreedSize,
  Sex,
  TickPrevention,
  DietType,
  ExerciseLevel,
  Environment,
} from '@/types/disease-prediction';
import { initialFormState, formStateToApiInput } from '@/types/disease-prediction';

interface DiseasePredictionFormProps {
  onSubmit: (formData: DiseasePredictionFormState) => void;
  onCancel: () => void;
  initialBCS?: number | null;
  petName?: string;
  petAge?: number | null;
  petGender?: string | null;
}

export default function DiseasePredictionForm({
  onSubmit,
  onCancel,
  initialBCS,
  petName,
  petAge,
  petGender,
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
      if (normalizedGender === 'male' || normalizedGender === 'm') {
        initial.sex = 'Male';
      } else if (normalizedGender === 'female' || normalizedGender === 'f') {
        initial.sex = 'Female';
      }
    }
    
    return initial;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Reduced from 4 since BCS is now read-only
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
      formData.age_years !== '' &&
      parseInt(formData.age_years) > 0 &&
      formData.breed_size !== '' &&
      formData.sex !== '' &&
      formData.is_neutered !== ''
    );
  };

  const isStep2Valid = () => {
    return (
      formData.pale_gums !== '' &&
      formData.skin_lesions !== '' &&
      formData.polyuria !== ''
    );
  };

  const isStep3Valid = () => {
    return (
      formData.tick_prevention !== '' &&
      formData.heartworm_prevention !== '' &&
      formData.diet_type !== '' &&
      formData.exercise_level !== '' &&
      formData.environment !== ''
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      default: return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBCS && isStep1Valid() && isStep2Valid() && isStep3Valid()) {
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
    if (score <= 3) return 'bg-orange-400';
    if (score <= 5) return 'bg-green-500';
    if (score <= 7) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const getBCSLabel = (score: number) => {
    if (score <= 3) return 'Underweight';
    if (score <= 5) return 'Ideal';
    if (score <= 7) return 'Overweight';
    return 'Obese';
  };

  const getBCSBorderColor = (score: number) => {
    if (score <= 3) return 'border-orange-300';
    if (score <= 5) return 'border-green-300';
    if (score <= 7) return 'border-amber-300';
    return 'border-red-300';
  };

  const getBCSBgColor = (score: number) => {
    if (score <= 3) return 'bg-orange-50';
    if (score <= 5) return 'bg-green-50';
    if (score <= 7) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getBCSTextColor = (score: number) => {
    if (score <= 3) return 'text-orange-700';
    if (score <= 5) return 'text-green-700';
    if (score <= 7) return 'text-amber-700';
    return 'text-red-700';
  };

  // If no BCS, show error state
  if (!hasBCS) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            BCS Required
          </h3>
          <p className="text-gray-600 mb-6">
            Please calculate the Body Condition Score (BCS) for {petName || 'your pet'} first 
            before running the disease risk assessment.
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
                  {petName ? `For ${petName} - ` : ''}Step {currentStep} of {totalSteps}
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
                  idx < currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Step 1: Demographic Information */}
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
                    <strong>AI-Powered Analysis:</strong> This assessment uses machine learning to evaluate
                    the risk of 6 different conditions based on your pet&apos;s health data, lifestyle, and clinical signs.
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                📋 Demographic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age (years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="1"
                    required
                    value={formData.age_years}
                    onChange={(e) => setFormData({ ...formData, age_years: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="e.g., 7"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter age in years (0-30)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Breed Size <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-blue-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    <span><strong>Small</strong> &lt;10kg · <strong>Medium</strong> 10-25kg · <strong>Large</strong> &gt;25kg</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, breed_size: 'Small' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.breed_size === 'Small'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🐕 Small
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, breed_size: 'Medium' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.breed_size === 'Medium'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🐕 Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, breed_size: 'Large' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.breed_size === 'Large'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🐕 Large
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sex: 'Male' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.sex === 'Male'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ♂️ Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sex: 'Female' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.sex === 'Female'
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ♀️ Female
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Spayed/Neutered Status <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-purple-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Surgery to prevent breeding. Select <strong>Intact</strong> if not done.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_neutered: 'yes' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.is_neutered === 'yes'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ✂️ Neutered
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_neutered: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.is_neutered === 'no'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🐕 Intact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Clinical Signs */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                🩺 Clinical Signs (Symptoms)
              </h3>

              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    Please indicate any symptoms you have observed. These are important indicators
                    for disease risk assessment.
                  </div>
                </div>
              </div>

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
                      onClick={() => setFormData({ ...formData, pale_gums: 'yes' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.pale_gums === 'yes'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pale_gums: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.pale_gums === 'no'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      onClick={() => setFormData({ ...formData, skin_lesions: 'yes' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.skin_lesions === 'yes'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, skin_lesions: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.skin_lesions === 'no'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      onClick={() => setFormData({ ...formData, polyuria: 'yes' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.polyuria === 'yes'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚠️ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, polyuria: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.polyuria === 'no'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ✅ No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Prevention & Care */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                🛡️ Prevention & Care
              </h3>

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
                      onClick={() => setFormData({ ...formData, heartworm_prevention: 'yes' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.heartworm_prevention === 'yes'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ✅ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, heartworm_prevention: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.heartworm_prevention === 'no'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ❌ No
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diet Type <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-orange-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    What&apos;s your dog&apos;s main food source?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, diet_type: 'Commercial' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.diet_type === 'Commercial'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏪 Commercial
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, diet_type: 'Homemade' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.diet_type === 'Homemade'
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏠 Homemade
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, diet_type: 'Mixed' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.diet_type === 'Mixed'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🍽️ Mixed
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exercise Level <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-indigo-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    <span><strong>Low</strong> &lt;30 min · <strong>Moderate</strong> 30-60 min · <strong>High</strong> 60+ min daily</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, exercise_level: 'Low' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.exercise_level === 'Low'
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🛋️ Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, exercise_level: 'Moderate' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.exercise_level === 'Moderate'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🚶 Moderate
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, exercise_level: 'High' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.exercise_level === 'High'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏃 High
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Living Environment <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-5 h-5 bg-teal-100 rounded-full text-center leading-5 text-[10px]">?</span>
                    Where does your dog primarily live and spend time?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Urban' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Urban'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏙️ Urban
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Suburban' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Suburban'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏡 Suburban
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Rural' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Rural'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🌾 Rural
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
