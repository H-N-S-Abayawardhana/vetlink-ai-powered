"use client";

import { useParams, useRouter } from "next/navigation";
import PetForm from "@/components/dashboard/pets/PetForm";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/next-auth";

export default function EditPetPage() {
  const params = useParams() as { petId?: string };
  const router = useRouter();
  const petId = params?.petId || null;
  const { data: session, status } = useSession();
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";
  const blockPetProfile =
    userRole === "SUPER_ADMIN" || userRole === "VETERINARIAN";

  useEffect(() => {
    if (status === "loading") return;
    if (blockPetProfile) {
      router.replace("/dashboard/pets");
    }
  }, [blockPetProfile, router, status]);

  if (blockPetProfile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pet Profile</h1>
        <p className="text-sm text-gray-500">Update the pet’s information</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PetForm petId={petId} />
      </div>
    </div>
  );
}
