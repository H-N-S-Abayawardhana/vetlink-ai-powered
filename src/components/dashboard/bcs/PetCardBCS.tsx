"use client";

import React from "react";
import { formatBCSTimestamp } from '@/lib/format-date';
import { ChevronRight } from "lucide-react";
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
      className="group relative bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 border-2 border-gray-200 hover:border-indigo-400 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
    >
      <div className="flex items-center gap-4">
        {pet.avatarDataUrl ? (
          <img 
            src={avatar as string} 
            alt={pet.name} 
            className="w-20 h-20 object-cover rounded-xl shadow-md"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {pet.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h3>
          <p className="text-sm text-gray-600">{pet.breed || "Mixed breed"}</p>
          {pet.bcsCalculatedAt && (
            <p className="text-xs text-gray-500 mt-1">BCS last: {formatBCSTimestamp(pet.bcsCalculatedAt)}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {pet.type === "dog" ? "🐕 Dog" : "🐈 Cat"} • {pet.ageYears ? `${pet.ageYears} years` : "Age unknown"}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
      </div>
    </button>
  );
}