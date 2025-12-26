'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { listPets, type Pet } from '@/lib/pets';
import DiseasePredictionForm from '@/components/dashboard/bcs/DiseasePredictionForm';
import DiseasePredictionResults from '@/components/dashboard/bcs/DiseasePredictionResults';
import type {
  DiseasePredictionFormState,
  DiseasePredictionResult,
} from '@/types/disease-prediction';
import { formStateToApiInput } from '@/types/disease-prediction';
import {
  Stethoscope,
  PawPrint,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

export default function DiseasePredictionPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'result'>('select');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseasePredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const p = await listPets();
      setPets(p);
    }
    load();
  }, []);

  function onSelectPet(pet: Pet) {
    setSelected(pet);
    setStep('form');
    setResult(null);
    setError(null);
  }

  async function handleFormSubmit(formData: DiseasePredictionFormState) {
    setLoading(true);
    setError(null);

    try {
      const apiInput = formStateToApiInput(formData, selected?.id);

      if (!apiInput) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/disease/multi-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to predict diseases');
      }

      const data = await response.json();
      setResult(data.result);
      setStep('result');
    } catch (err) {
      console.error('Disease prediction failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to predict diseases');
      alert(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    setResult(null);
    setStep('form');
  }

  function handleBackToSelection() {
    setSelected(null);
    setStep('select');
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔬 Multi-Disease Risk Prediction
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI-powered analysis to assess your pet&apos;s risk for 6 different health conditions 
            based on health data, lifestyle, and clinical signs.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Conditions Analyzed
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-purple-100">
                <div className="flex items-center gap-2">
                  <span>🦠</span>
                  <span>Tick-Borne Disease</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🪱</span>
                  <span>Filariasis (Heartworm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💉</span>
                  <span>Diabetes Type 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Obesity Metabolic Issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💎</span>
                  <span>Urolithiasis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>Overall Health Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-2">
          {['Select Pet', 'Health Assessment', 'View Results'].map((label, idx) => {
            const stepMap = ['select', 'form', 'result'];
            const currentIdx = stepMap.indexOf(step);
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;

            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {label}
                    </span>
                  </div>
                </div>
                {idx < 2 && (
                  <ChevronRight
                    className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Step 1: Select Pet */}
          {step === 'select' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PawPrint className="w-6 h-6 text-purple-600" />
                Select Your Pet
              </h2>

              {pets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your pets...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Only pets with a calculated Body Condition Score (BCS) can be assessed. 
                      Please calculate BCS first if needed.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pets.map((pet) => {
                    const avatar =
                      (pet as any).avatarDataUrl ||
                      (pet as any).avatarUrl ||
                      (pet.type === 'dog'
                        ? '/uploads/default-dog.png'
                        : '/uploads/default-cat.png');
                    const hasAvatar = Boolean(
                      (pet as any).avatarDataUrl || (pet as any).avatarUrl
                    );
                    const hasBCS = pet.bcs !== null && pet.bcs !== undefined;

                    return (
                      <button
                        key={pet.id}
                        onClick={() => onSelectPet(pet)}
                        disabled={!hasBCS}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          !hasBCS
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                            : selected?.id === pet.id
                              ? 'border-purple-500 bg-purple-50 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        {hasAvatar ? (
                          <Image
                            src={avatar}
                            alt={pet.name}
                            width={56}
                            height={56}
                            unoptimized
                            className="w-14 h-14 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                            {pet.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{pet.name}</p>
                          <p className="text-sm text-gray-600">
                            {pet.breed || pet.type} • {pet.ageYears ? `${pet.ageYears} years` : 'Age unknown'}
                          </p>
                          {hasBCS ? (
                            <p className="text-xs text-purple-600 font-medium mt-1">
                              ✅ BCS: {pet.bcs}/9
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ BCS not calculated
                            </p>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 ${hasBCS ? 'text-gray-400' : 'text-gray-300'}`} />
                      </button>
                    );
                  })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Form (shown as modal via DiseasePredictionForm) */}
          {step === 'form' && selected && (
            <DiseasePredictionForm
              onSubmit={handleFormSubmit}
              onCancel={handleBackToSelection}
              initialBCS={selected.bcs}
              petName={selected.name}
              petAge={selected.ageYears}
              petGender={selected.gender}
            />
          )}

          {/* Step 3: Results */}
          {step === 'result' && result && selected && (
            <div className="p-4">
              <DiseasePredictionResults
                result={result}
                petName={selected.name}
                onNewAnalysis={handleNewAnalysis}
                onClose={handleBackToSelection}
              />
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🔬 Analyzing Disease Risks...
              </h3>
              <p className="text-gray-600">
                Our AI is processing your pet&apos;s health data across 6 different conditions.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            💡 This AI analysis is for informational purposes only. Always consult 
            your veterinarian for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
