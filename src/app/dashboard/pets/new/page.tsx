"use client";

import PetForm from "@/components/dashboard/pets/PetForm";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/next-auth";

export default function NewPetPage() {
  const router = useRouter();
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Dog</h1>
        <p className="text-sm text-gray-500">Create a new dog profile</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PetForm />
      </div>
    </div>
  );
}
