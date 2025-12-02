'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pet } from '@/lib/pets';

interface PetCardProps {
  pet: Pet;
}

// Get species-specific emoji and gradient
const getSpeciesStyle = (species?: string) => {
  const speciesLower = species?.toLowerCase() || '';
  if (speciesLower.includes('cat')) {
    return { emoji: '🐱', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', ring: 'ring-purple-200' };
  }
  if (speciesLower.includes('bird')) {
    return { emoji: '🦜', gradient: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50', ring: 'ring-yellow-200' };
  }
  if (speciesLower.includes('rabbit') || speciesLower.includes('bunny')) {
    return { emoji: '🐰', gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', ring: 'ring-pink-200' };
  }
  if (speciesLower.includes('hamster') || speciesLower.includes('guinea')) {
    return { emoji: '🐹', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  }
  if (speciesLower.includes('fish')) {
    return { emoji: '🐠', gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50', ring: 'ring-cyan-200' };
  }
  if (speciesLower.includes('turtle') || speciesLower.includes('tortoise')) {
    return { emoji: '🐢', gradient: 'from-green-400 to-emerald-500', bg: 'bg-green-50', ring: 'ring-green-200' };
  }
  // Default: dog
  return { emoji: '🐕', gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', ring: 'ring-blue-200' };
};

export default function PetCard({ pet }: PetCardProps) {
  const router = useRouter();
  const speciesStyle = getSpeciesStyle((pet as any).species);

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
      className="group cursor-pointer transform transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-2xl"
      aria-label={`Open pet ${pet.name} details`}
    >
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300">
        {/* Decorative gradient bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${speciesStyle.gradient}`} />
        
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <div className={`w-20 h-20 sm:w-18 sm:h-18 rounded-2xl overflow-hidden ${speciesStyle.bg} flex items-center justify-center ring-2 ${speciesStyle.ring} shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
              {(pet as any).avatarDataUrl || (pet as any).avatarUrl ? (
                <img 
                  src={(pet as any).avatarDataUrl || (pet as any).avatarUrl} 
                  alt={`${pet.name} photo`} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
              ) : (
                <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">{speciesStyle.emoji}</span>
              )}
            </div>
            {/* Status indicator dot */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br ${speciesStyle.gradient} rounded-full border-2 border-white shadow-sm flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {pet.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {pet.breed || 'Unknown breed'}
                  </span>
                  {pet.ageYears && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pet.ageYears} {pet.ageYears === 1 ? 'year' : 'years'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex items-center justify-center sm:justify-end gap-2 mt-2 sm:mt-0">
                <Link
                  href={`/dashboard/pets/${pet.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200"
                  aria-label={`Edit ${pet.name}`}
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>

                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${speciesStyle.gradient} flex items-center justify-center transform group-hover:translate-x-1 transition-transform duration-300 shadow-md`}>
                  <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subtle hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none rounded-2xl" />
      </div>
    </div>
  );
}
