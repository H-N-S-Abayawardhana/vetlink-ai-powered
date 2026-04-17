"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PetProfile from "@/components/dashboard/pets/PetProfile";
import { getPet, Pet } from "@/lib/pets";
import { UserRole } from "@/types/next-auth";

export default function PetDetailPage() {
  const params = useParams() as { petId?: string };
  const petId = params?.petId || null;
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";
  // Only block SUPER_ADMIN, allow VETERINARIAN to view pet details
  const blockPetProfile = userRole === "SUPER_ADMIN";

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (blockPetProfile) {
      router.replace("/dashboard/pets");
      return;
    }
    if (petId) {
      (async () => {
        try {
          const petData = await getPet(petId);
          setPet(petData);
        } catch (error) {
          console.error("Error loading pet:", error);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [petId, blockPetProfile, router, status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (blockPetProfile) {
    return null;
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
