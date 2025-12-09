"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PetProfile from '@/components/dashboard/pets/PetProfile';
import { getPet, Pet } from '@/lib/pets';

export default function PetDetailPage() {
  const params = useParams() as { petId?: string };
  const petId = params?.petId || null;
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      (async () => {
        try {
          const petData = await getPet(petId);
          setPet(petData);
        } catch (error) {
          console.error('Error loading pet:', error);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [petId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">Pet not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PetProfile pet={pet} />
    </div>
  );
}
