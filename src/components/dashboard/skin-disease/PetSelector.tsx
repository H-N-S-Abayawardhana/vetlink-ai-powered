"use client";

import type { Pet } from "@/lib/pets";

interface Props {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  selectedPetId: string | null;
  onSelectPetId: (id: string) => void;
  onRefresh: () => void;
  onContinueWithoutPet: () => void;
  onContinueWithPet: () => void;
}

function petAvatarSrc(pet: Pet): string | null {
  const anyPet = pet as any;
  return anyPet.avatarDataUrl || anyPet.avatarUrl || null;
}

export default function PetSelector({
  pets,
  loading,
  error,
  selectedPetId,
  onSelectPetId,
  onRefresh,
  onContinueWithoutPet,
  onContinueWithPet,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Select your pet (optional)
          </h2>
          <p className="text-sm text-gray-600">
            If you select a pet, the result screen will include the pet photo,
            breed, and age.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : pets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-700">You don’t have any pets yet.</p>
          <p className="text-sm text-gray-600 mt-1">
            You can continue without selecting a pet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pets.map((pet) => {
            const selected = pet.id === selectedPetId;
            const avatar = petAvatarSrc(pet);

            return (
              <button
                type="button"
                key={pet.id}
                onClick={() => onSelectPetId(pet.id)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  selected
                    ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900 truncate">
                        {pet.name}
                      </div>
                      {selected && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 truncate">
                      {pet.breed || "Breed: —"}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {pet.ageYears != null
                        ? `Age: ${pet.ageYears} ${pet.ageYears === 1 ? "year" : "years"}`
                        : "Age: —"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onContinueWithoutPet}
          className="px-4 py-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Continue without selecting a pet
        </button>

        <button
          type="button"
          onClick={onContinueWithPet}
          disabled={!selectedPetId}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with selected pet
        </button>
      </div>
    </div>
  );
}
