'use client';

import { useRouter } from 'next/navigation';
import { Pet } from '@/lib/pets';

interface PetListItemProps {
  pet: Pet;
}

export default function PetListItem({ pet }: PetListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/pets/${pet.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {(pet as any).avatarDataUrl || (pet as any).avatarUrl ? (
            <img 
              src={(pet as any).avatarDataUrl || (pet as any).avatarUrl} 
              alt={pet.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-2xl">🐕</span>
          )}
        </div>
      </div>

      {/* Pet Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {pet.name}
          </h3>
          {pet.type && (
            <span className="text-xs text-gray-500 capitalize">
              {pet.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          {pet.breed && (
            <span className="truncate">{pet.breed}</span>
          )}
          {pet.ageYears !== null && pet.ageYears !== undefined && (
            <span>{pet.ageYears} {pet.ageYears === 1 ? 'year' : 'years'}</span>
          )}
          {pet.weightKg !== null && pet.weightKg !== undefined && (
            <span>{pet.weightKg} kg</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0">
        <svg 
          className="w-5 h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}






