'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pet } from '@/lib/pets';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      router.push(`/dashboard/pets/${pet.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/pets/${pet.id}`)}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer transform transition duration-200 ease-out hover:scale-105 hover:shadow-lg focus:shadow-lg rounded-2xl"
      aria-label={`Open pet ${pet.name} details`}
    >
      <div className="bg-gradient-to-r from-white/60 to-white/30 backdrop-blur-sm border border-gray-200/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center ring-1 ring-white ring-opacity-60 shadow-sm">
            { (pet as any).avatarDataUrl || (pet as any).avatarUrl ? (
              <img src={(pet as any).avatarDataUrl || (pet as any).avatarUrl} alt={`${pet.name} photo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🐕</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{pet.name}</p>
              <p className="mt-1 text-sm text-gray-500 truncate">{pet.breed} • {pet.ageYears ? `${pet.ageYears} yrs` : '—'}</p>
            </div>

            <div className="flex items-center gap-4 ml-4">
              <Link
                href={`/dashboard/pets/${pet.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-gray-600 hover:text-gray-900"
                aria-label={`Edit ${pet.name}`}
              >
                Edit
              </Link>

              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
