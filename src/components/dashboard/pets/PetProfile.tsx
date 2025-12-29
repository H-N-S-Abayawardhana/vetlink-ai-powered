"use client";

import { useEffect, useState } from "react";
import { Pet, deletePet } from "@/lib/pets";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listSkinDiseaseRecords,
  clearSkinDiseaseHistory,
  type SkinDiseaseRecord,
} from "@/lib/skin-disease-records";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/next-auth";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface PetProfileProps {
  pet: Pet;
}

export default function PetProfile({ pet }: PetProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";
  const isVeterinarian = userRole === "VETERINARIAN";
  const isOwner = userRole === "USER";
  const [skinRecords, setSkinRecords] = useState<SkinDiseaseRecord[]>([]);
  const [skinLoading, setSkinLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

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

  const computedAgeLabel = () => {
    if (pet.dateOfBirth) {
      const dob = new Date(pet.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;
        if (years < 0) years = 0;
        return `${years} ${years === 1 ? "year" : "years"}`;
      }
    }
    if (pet.ageYears !== null && pet.ageYears !== undefined) {
      return `${pet.ageYears} ${pet.ageYears === 1 ? "year" : "years"}`;
    }
    return "—";
  };

  useEffect(() => {
    // Don't load records if pet ID is invalid
    if (!pet?.id) {
      setSkinRecords([]);
      setSkinLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setSkinLoading(true);
      try {
        const records = await listSkinDiseaseRecords(pet.id);
        if (!cancelled) setSkinRecords(records || []);
      } catch (e) {
        // Silently handle errors (404s are expected if pet was deleted)
        if (!cancelled) setSkinRecords([]);
      } finally {
        if (!cancelled) setSkinLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pet.id]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowDeleteModal(false);
    try {
      const success = await deletePet(pet.id);
      if (success) {
        // Immediately redirect to prevent any further API calls
        router.replace("/dashboard/pets");
      } else {
        alert("Failed to delete pet. Please try again.");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Failed to delete pet. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleClearHistoryClick = () => {
    setShowClearHistoryModal(true);
  };

  const handleClearHistoryConfirm = async () => {
    setIsClearingHistory(true);
    try {
      await clearSkinDiseaseHistory(pet.id);
      // Refresh the records list
      setSkinRecords([]);
      setShowClearHistoryModal(false);
    } catch (error) {
      console.error("Error clearing skin disease history:", error);
      alert("Failed to clear history. Please try again.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Top row: Back button and Action buttons */}
        <div className="flex items-center justify-between">
          {/* Back to Pets Button */}
          <button
            onClick={() => router.push("/dashboard/pets")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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

          {/* Edit and Delete buttons */}
          <div className="flex items-center gap-2">
            {!isVeterinarian && (
              <Link
                href={`/dashboard/pets/${pet.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Pet Info Row */}
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
      </div>

      {/* At-a-glance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500">Age</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{computedAgeLabel()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500">Weight</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {pet.weightKg != null ? `${pet.weightKg} kg` : "—"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500">BCS</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {pet.bcs != null ? pet.bcs : "—"}
          </div>
          {pet.bcsCalculatedAt && (
            <div className="text-[11px] text-gray-500">{formatDate(pet.bcsCalculatedAt)}</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500">Spayed/Neutered</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {pet.spayedNeutered == null ? "—" : pet.spayedNeutered ? "Yes" : "No"}
          </div>
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
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.dateOfBirth ? formatDate(pet.dateOfBirth) : "—"}
              </dd>
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
                {computedAgeLabel()}
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
              <dt className="text-sm font-medium text-gray-500">Spayed/Neutered</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.spayedNeutered == null
                  ? "—"
                  : pet.spayedNeutered
                  ? "Yes"
                  : "No"}
                {pet.spayNeuterDate && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatDate(pet.spayNeuterDate)})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Blood Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{pet.bloodType || "—"}</dd>
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
                Living Environment
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pet.livingEnvironment || "—"}
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
            <dt className="text-sm font-medium text-gray-500">Microchip Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{pet.microchipNumber || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Microchip Implant Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {pet.microchipImplantDate ? formatDate(pet.microchipImplantDate) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Owner Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{pet.ownerPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Secondary Contact</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {pet.secondaryContactName || pet.secondaryContactPhone
                ? `${pet.secondaryContactName || "—"} (${pet.secondaryContactPhone || "—"})`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Vet Clinic</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {pet.vetClinicName || pet.vetClinicPhone
                ? `${pet.vetClinicName || "—"}${pet.vetClinicPhone ? `, ${pet.vetClinicPhone}` : ""}`
                : "—"}
            </dd>
          </div>
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
          <div className="flex items-center gap-3">
            {isOwner && skinRecords.length > 0 && (
              <button
                onClick={handleClearHistoryClick}
                disabled={isClearingHistory}
                className="cursor-pointer text-sm text-red-600 hover:text-red-800 underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear History
              </button>
            )}
            <Link
              href="/dashboard/skin-disease"
              className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap cursor-pointer"
            >
              New scan
            </Link>
          </div>
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

      {/* Delete Pet Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Pet Profile"
        message={`Are you sure you want to delete ${pet.name}'s profile? This action cannot be undone and will delete all associated data including images.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={isDeleting}
      />

      {/* Clear History Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        onConfirm={handleClearHistoryConfirm}
        title="Clear Skin Disease History"
        message={`Are you sure you want to clear all skin disease history for ${pet.name}? This action cannot be undone and will delete all associated images.`}
        confirmText="Clear History"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={isClearingHistory}
      />
    </div>
  );
}
