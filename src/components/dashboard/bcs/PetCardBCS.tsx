"use client";

import React from "react";
import type { Pet } from "@/lib/pets";

interface Props {
  pet: Pet;
  selected: boolean;
  onSelect: (pet: Pet) => void;
}

export default function PetCardBCS({ pet, selected, onSelect }: Props) {
  const avatar = pet.avatarDataUrl || (pet.type === "dog" ? "/uploads/default-dog.png" : "/uploads/default-cat.png");

  return (
    <button
      onClick={() => onSelect(pet)}
      className={`border rounded-md p-2 text-left hover:shadow-sm transition-shadow flex gap-3 items-center ${selected ? "ring-2 ring-indigo-500 bg-indigo-50" : ""}`}
    >
      <img src={avatar as string} alt={pet.name} className="w-16 h-16 object-cover rounded-md" />
      <div>
        <div className="font-medium text-gray-900">{pet.name}</div>
        <div className="text-sm text-gray-700">{pet.breed || "Unknown breed"}</div>
        <div className="text-sm text-gray-700">{pet.ageYears ? `${pet.ageYears} yrs` : "Age unknown"}</div>
      </div>
    </button>
  );
}
