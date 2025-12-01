"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PetCard from '@/components/dashboard/pets/PetCard';
import { listPets, Pet } from '@/lib/pets';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await listPets();
      setPets(data.filter(p => p.type === 'dog'));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
          <p className="text-sm text-gray-500">Manage your dog profiles</p>
        </div>
        <div>
          <Link href="/dashboard/pets/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add New Pet
          </Link>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-700">No dog profiles yet.</p>
            <Link href="/dashboard/pets/new" className="text-blue-600 hover:text-blue-800">Create your first pet profile</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pets.map(pet => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
