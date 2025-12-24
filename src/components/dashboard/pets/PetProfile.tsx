"use client";

import { useEffect, useState } from "react";
import { Pet } from "@/lib/pets";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listSkinDiseaseRecords,
  type SkinDiseaseRecord,
} from "@/lib/skin-disease-records";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/next-auth";

interface PetProfileProps {
  pet: Pet;
}

export default function PetProfile({ pet }: PetProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";
  const isVeterinarian = userRole === "VETERINARIAN";
  const [skinRecords, setSkinRecords] = useState<SkinDiseaseRecord[]>([]);
  const [skinLoading, setSkinLoading] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSkinLoading(true);
      try {
        const records = await listSkinDiseaseRecords(pet.id);
        if (!cancelled) setSkinRecords(records || []);
      } catch (e) {
        console.error("Error loading skin disease records:", e);
        if (!cancelled) setSkinRecords([]);
      } finally {
        if (!cancelled) setSkinLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pet.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            {(pet as any).avatarDataUrl || (pet as any).avatarUrl ? (
              <Image
                src={(pet as any).avatarDataUrl || (pet as any).avatarUrl}
                alt={pet.name}
                width={80}
                height={80}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl">🐕</span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pet.type
                ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1)
                : "Pet"}{" "}
              Profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isVeterinarian && (
            <Link
              href={`/dashboard/pets/${pet.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Link>
          )}
          <button
            onClick={() => router.push("/dashboard/pets")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Pets
          </button>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {pet.type || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Breed</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.breed || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.gender || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.ageYears !== null && pet.ageYears !== undefined
                  ? `${pet.ageYears} ${pet.ageYears === 1 ? "year" : "years"}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Weight</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.weightKg !== null && pet.weightKg !== undefined
                  ? `${pet.weightKg} kg`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Activity Level
              </dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {pet.activityLevel || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Health Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Health Information
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Body Condition Score (BCS)
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.bcs !== null && pet.bcs !== undefined ? pet.bcs : "—"}
                {pet.bcsCalculatedAt && (
                  <span className="text-xs text-gray-500 ml-2">
                    (calculated {formatDate(pet.bcsCalculatedAt)})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Vaccination Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.vaccinationStatus || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Allergies</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.allergies && pet.allergies.length > 0
                  ? pet.allergies.join(", ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Preferred Diet
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.preferredDiet || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Health Notes
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {pet.healthNotes || "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Information
        </h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(pet.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(pet.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Skin Disease History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Skin Disease History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Recent skin scans for this pet
            </p>
          </div>
          <Link
            href="/dashboard/skin-disease"
            className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            New scan
          </Link>
        </div>

        {skinLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : skinRecords.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-700">No skin disease scans yet.</p>
            <p className="text-sm text-gray-600 mt-1">
              Run a scan from the skin disease detection page to save records
              here.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {skinRecords.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-200"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rec.imageUrl}
                      alt="Affected area"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🩺</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-gray-900 truncate">
                      {rec.disease}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(rec.createdAt)}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Confidence:{" "}
                    {rec.confidence != null
                      ? `${(rec.confidence * 100).toFixed(1)}%`
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
            {skinRecords.length > 5 && (
              <div className="text-sm text-gray-500">
                Showing 5 of {skinRecords.length} records.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
