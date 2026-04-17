"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PetListItem from "@/components/dashboard/pets/PetListItem";
import { listPets, Pet } from "@/lib/pets";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/next-auth";

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";
  const isAdminPetsView =
    userRole === "SUPER_ADMIN" || userRole === "VETERINARIAN";
  const isUser = userRole === "USER";

  useEffect(() => {
    (async () => {
      try {
        const data = await listPets();
        // Show all pets (not just dogs) - API already filters by user
        setPets(data || []);
      } catch (error) {
        console.error("Error loading pets:", error);
        setPets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdminPetsView ? "All Pets" : "My Pets"}
          </h1>
          <p className="text-sm text-gray-500">
            {isAdminPetsView
              ? "View all registered pets in the system"
              : "View and manage your pet profiles"}
          </p>
        </div>
        {isUser && (
          <div>
            <Link
              href="/dashboard/pets/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Pet
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : pets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700 mb-2">
              {isAdminPetsView ? "No pets in the system yet." : "No pets yet."}
            </p>
            {isUser && (
              <Link
                href="/dashboard/pets/new"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
              >
                Create your first pet profile
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pets.map((pet) => (
              <PetListItem key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
