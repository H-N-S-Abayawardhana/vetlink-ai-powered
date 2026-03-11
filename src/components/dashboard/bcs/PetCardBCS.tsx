"use client";

import React from "react";
import { formatBCSTimestamp } from "@/lib/format-date";
import { ChevronRight } from "lucide-react";
import type { Pet } from "@/lib/pets";
import Image from "next/image";

interface Props {
  pet: Pet;
  selected: boolean;
  onSelect: (pet: Pet) => void;
}

export default function PetCardBCS({ pet, selected, onSelect }: Props) {
  const avatar = pet.avatarDataUrl || "/uploads/default-dog.png";

  return (
    <button
      onClick={() => onSelect(pet)}
      className={`group rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-blue-300 bg-blue-50/70"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-4">
        {pet.avatarDataUrl ? (
          <Image
            src={avatar as string}
            alt={pet.name}
            width={56}
            height={56}
            unoptimized
            className="w-14 h-14 object-cover rounded-lg"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold">
            {pet.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {pet.name}
            </h3>
            {selected && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Selected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {pet.breed || "Mixed breed"}
          </p>
          {pet.bcsCalculatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              BCS last: {formatBCSTimestamp(pet.bcsCalculatedAt)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dog • {pet.ageYears ? `${pet.ageYears} years` : "Age unknown"}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </button>
  );
}
