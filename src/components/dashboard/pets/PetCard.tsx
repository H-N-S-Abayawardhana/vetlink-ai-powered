'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Pet } from '@/lib/pets';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex items-center space-x-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
        {pet.avatarDataUrl ? (
          // Using next/image for potential optimization; if data URL it still works
          // keep styling consistent with other avatar usage in the project
          // fall back to emoji when unavailable
          <img src={pet.avatarDataUrl} alt={`${pet.name} avatar`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">🐕</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{pet.name}</p>
        <p className="text-sm text-gray-500 truncate">{pet.breed} • {pet.ageYears ? `${pet.ageYears} yrs` : '—'}</p>
      </div>

      <div className="flex items-center space-x-3">
        <Link href={`/dashboard/pets/${pet.id}`} className="text-sm text-blue-600 hover:text-blue-800">
          View
        </Link>
        <Link href={`/dashboard/pets/${pet.id}`} className="text-sm text-gray-600 hover:text-gray-900">
          Edit
        </Link>
      </div>
    </div>
  );
}
