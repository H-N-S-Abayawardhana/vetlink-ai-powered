"use client";

import PetForm from '@/components/dashboard/pets/PetForm';

export default function NewPetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Dog</h1>
        <p className="text-sm text-gray-500">Create a new dog profile</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PetForm />
      </div>
    </div>
  );
}
