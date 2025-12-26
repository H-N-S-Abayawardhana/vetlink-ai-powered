'use client';

import React, { useState, useEffect } from 'react';
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
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
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
          {/* BCS Display Card - Read-only from database */}
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

          {/* Step 1: Demographic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
                    step="0.5"
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
                  <select
                    required
                    value={formData.breed_size}
                    onChange={(e) => setFormData({ ...formData, breed_size: e.target.value as BreedSize })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">Select breed size</option>
                    <option value="Small">🐕 Small (Under 10 kg)</option>
                    <option value="Medium">🐕 Medium (10-25 kg)</option>
                    <option value="Large">🐕 Large (Over 25 kg)</option>
                  </select>
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
                    Neutered/Spayed? <span className="text-red-500">*</span>
                  </label>
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
                      ✅ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_neutered: 'no' })}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.is_neutered === 'no'
                          ? 'bg-gray-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ❌ No
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
                  <p className="text-xs text-gray-500 mb-3">
                    Indicator of anemia or poor circulation (tick disease, parasites)
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
                  <p className="text-xs text-gray-500 mb-3">
                    Wounds or rashes (tick bites, allergies, infections)
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
                    Polyuria (Excessive Urination) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Frequent or increased urination (diabetes, kidney issues)
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
                  <select
                    required
                    value={formData.tick_prevention}
                    onChange={(e) => setFormData({ ...formData, tick_prevention: e.target.value as TickPrevention })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">Select tick prevention</option>
                    <option value="None">❌ None</option>
                    <option value="Irregular">⚠️ Irregular</option>
                    <option value="Regular">✅ Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Heartworm Prevention <span className="text-red-500">*</span>
                  </label>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diet Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.diet_type}
                    onChange={(e) => setFormData({ ...formData, diet_type: e.target.value as DietType })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">Select diet type</option>
                    <option value="Commercial">🏪 Commercial</option>
                    <option value="Homemade">🏠 Homemade</option>
                    <option value="Raw">🥩 Raw</option>
                    <option value="Mixed">🍽️ Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exercise Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.exercise_level}
                    onChange={(e) => setFormData({ ...formData, exercise_level: e.target.value as ExerciseLevel })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">Select exercise level</option>
                    <option value="Low">🛋️ Low (Minimal activity)</option>
                    <option value="Moderate">🚶 Moderate (Regular walks)</option>
                    <option value="High">🏃 High (Very active)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Indoor' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Indoor'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏠 Indoor
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Outdoor' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Outdoor'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🌳 Outdoor
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, environment: 'Mixed' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.environment === 'Mixed'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏡 Mixed
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
