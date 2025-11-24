"use client";

import { useParams } from 'next/navigation';
import PetForm from '@/components/dashboard/pets/PetForm';

export default function EditPetPage() {
  // In the app router, useParams is available in client components
  const params = useParams() as { petId?: string };
  const petId = params?.petId || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Dog Profile</h1>
        <p className="text-sm text-gray-500">Update the dog's information</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PetForm petId={petId} />
      </div>
    </div>
  );
}
