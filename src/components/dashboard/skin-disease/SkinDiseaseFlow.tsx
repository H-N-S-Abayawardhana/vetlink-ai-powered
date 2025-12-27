"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pet } from "@/lib/pets";
import { listPets } from "@/lib/pets";
import SkinAnalysis from "./SkinAnalysis";
import PetSelector from "./PetSelector";

type Step = "pick" | "analyze";

export default function SkinDiseaseFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const selectedPet = useMemo(
    () =>
      selectedPetId ? (pets.find((p) => p.id === selectedPetId) ?? null) : null,
    [pets, selectedPetId],
  );

  async function loadPets() {
    setLoadingPets(true);
    setPetsError(null);
    try {
      const data = await listPets();
      setPets(data || []);
    } catch (e) {
      console.error("Error loading pets for skin disease page:", e);
      setPets([]);
      setPetsError(
        "Failed to load your pets. You can still continue without selecting a pet.",
      );
    } finally {
      setLoadingPets(false);
    }
  }

  useEffect(() => {
    void loadPets();
  }, []);

  if (step === "pick") {
    return (
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Dog Skin Disease Detection
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Select a pet to attach results to a profile — or continue without
            selecting one.
          </p>
        </div>

        <PetSelector
          pets={pets}
          loading={loadingPets}
          error={petsError}
          selectedPetId={selectedPetId}
          onSelectPetId={setSelectedPetId}
          onRefresh={loadPets}
          onContinueWithoutPet={() => setStep("analyze")}
          onContinueWithPet={() => setStep("analyze")}
        />

        {!loadingPets && pets.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  No pets found.
                </p>
                <p className="text-sm text-gray-600">
                  Create a pet profile to see breed/age and the pet photo in
                  results.
                </p>
              </div>
              <Link
                href="/dashboard/pets/new"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add a Pet
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <SkinAnalysis
      selectedPet={selectedPet}
      onChangePet={() => {
        setStep("pick");
      }}
      onClearPet={() => {
        setSelectedPetId(null);
        setStep("pick");
      }}
    />
  );
}
