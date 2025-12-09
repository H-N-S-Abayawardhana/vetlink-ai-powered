"use client";

import { useParams, useRouter } from 'next/navigation';
import PetForm from '@/components/dashboard/pets/PetForm';

export default function EditPetPage() {
  const params = useParams() as { petId?: string };
  const router = useRouter();
  const petId = params?.petId || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pet Profile</h1>
        <p className="text-sm text-gray-500">Update the pet's information</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PetForm petId={petId} />
      </div>
    </div>
  );
}

