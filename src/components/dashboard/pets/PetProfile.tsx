'use client';

import { Pet } from '@/lib/pets';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PetProfileProps {
  pet: Pet;
}

export default function PetProfile({ pet }: PetProfileProps) {
  const router = useRouter();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            {(pet as any).avatarDataUrl || (pet as any).avatarUrl ? (
              <img 
                src={(pet as any).avatarDataUrl || (pet as any).avatarUrl} 
                alt={pet.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-4xl">🐕</span>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'} Profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/pets/${pet.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={() => router.push('/dashboard/pets')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Pets
          </button>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{pet.type || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Breed</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.breed || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.ageYears !== null && pet.ageYears !== undefined 
                  ? `${pet.ageYears} ${pet.ageYears === 1 ? 'year' : 'years'}` 
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Weight</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.weightKg !== null && pet.weightKg !== undefined 
                  ? `${pet.weightKg} kg` 
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Activity Level</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{pet.activityLevel || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Health Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Body Condition Score (BCS)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.bcs !== null && pet.bcs !== undefined ? pet.bcs : '—'}
                {pet.bcsCalculatedAt && (
                  <span className="text-xs text-gray-500 ml-2">
                    (calculated {formatDate(pet.bcsCalculatedAt)})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vaccination Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.vaccinationStatus || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Allergies</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.allergies && pet.allergies.length > 0 
                  ? pet.allergies.join(', ') 
                  : 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Preferred Diet</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.preferredDiet || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Health Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {pet.healthNotes || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(pet.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(pet.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

