"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";
import {
  createPet,
  getPet,
  updatePet,
  uploadAvatar,
  deletePet,
  Pet,
} from "@/lib/pets";
import { useRouter } from "next/navigation";

interface PetFormProps {
  petId?: string | null; // when provided, loads pet for edit
}

export default function PetForm({ petId }: PetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSpayedTooltip, setShowSpayedTooltip] = useState(false);

  const [form, setForm] = useState<Partial<Pet>>({
    name: "",
    breed: "",
    weightKg: null,
    activityLevel: undefined,
    ageYears: null,
    gender: undefined,
    allergies: [],
    preferredDiet: "",
    livingEnvironment: "",
    healthNotes: "",
    // New fields
    microchipNumber: "",
    microchipImplantDate: "",
    spayedNeutered: null,
    spayNeuterDate: "",
    bloodType: "",
    dateOfBirth: "",
    ownerPhone: "",
    secondaryContactName: "",
    secondaryContactPhone: "",
    vetClinicName: "",
    vetClinicPhone: "",
    avatarDataUrl: null,
  });

  // Helper function to format date from ISO to YYYY-MM-DD
  const formatDateForInput = (
    dateString: string | null | undefined,
  ): string => {
    if (!dateString) return "";
    try {
      // Handle both ISO strings and YYYY-MM-DD format
      const dateStr = String(dateString);

      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Parse and format to YYYY-MM-DD
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";

      // Use UTC to avoid timezone issues
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (petId) {
      (async () => {
        const pet = await getPet(petId);
        if (pet) {
          console.log("Loaded pet data:", pet);
          console.log("Date of Birth raw:", pet.dateOfBirth);
          console.log("Spay Neuter Date raw:", pet.spayNeuterDate);
          console.log("Microchip Implant Date raw:", pet.microchipImplantDate);

          // Normalize backend `avatarUrl` -> frontend `avatarDataUrl` so ImageUpload shows the image
          // Format date fields for input type="date"
          const formattedDOB = formatDateForInput(pet.dateOfBirth);
          const formattedSpay = formatDateForInput(pet.spayNeuterDate);
          const formattedMicrochip = formatDateForInput(
            pet.microchipImplantDate,
          );

          console.log("Date of Birth formatted:", formattedDOB);
          console.log("Spay Neuter Date formatted:", formattedSpay);
          console.log("Microchip Implant Date formatted:", formattedMicrochip);

          const normalized = {
            ...pet,
            avatarDataUrl:
              (pet as any).avatarDataUrl || (pet as any).avatarUrl || null,
            dateOfBirth: formattedDOB,
            spayNeuterDate: formattedSpay,
            microchipImplantDate: formattedMicrochip,
          } as Partial<Pet>;
          setForm(normalized);
        }
      })();
    }
  }, [petId]);

  // Derive ageYears from dateOfBirth when DOB is provided
  useEffect(() => {
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          years--;
        }
        const normalized = years < 0 ? 0 : years;
        if (form.ageYears !== normalized) {
          setForm((prev) => ({ ...prev, ageYears: normalized }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dateOfBirth]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    // Basic required checks
    if (!form.name || form.name.trim() === "") e.name = "Name is required";
    if (!form.activityLevel) e.activityLevel = "Activity level is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.livingEnvironment)
      e.livingEnvironment = "Living environment is required";
    if (!form.preferredDiet || form.preferredDiet.trim() === "")
      e.preferredDiet = "Preferred diet is required";
    if (form.spayedNeutered == null)
      e.spayedNeutered = "Spayed/neutered status is required";
    if (!form.ownerPhone || form.ownerPhone.trim() === "")
      e.ownerPhone = "Owner phone is required";

    // Text-field patterns (allow letters, some punctuation where appropriate)
    const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/u; // letters and spaces only
    const breedPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u;
    const allergyPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/u; // tokens: letters and spaces only; commas separate tokens in the input
    const nameOnlyPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/u; // for contact names

    // Name format
    if (form.name && !namePattern.test(form.name))
      e.name = "Name may only contain letters and spaces";

    // Breed format
    if (
      !form.breed ||
      (typeof form.breed === "string" && form.breed.trim() === "")
    )
      e.breed = "Breed is required";
    else if (!breedPattern.test(String(form.breed)))
      e.breed = "Breed may only contain letters, spaces and hyphens";

    // Age/DOB requirement and range
    if (
      (form.ageYears === null || form.ageYears === undefined) &&
      !form.dateOfBirth
    ) {
      e.ageYears = "Provide age or date of birth";
    }
    if (form.ageYears !== null && form.ageYears !== undefined) {
      if (Number(form.ageYears) < 0) {
        e.ageYears = "Age must be 0 or greater";
      } else if (Number(form.ageYears) > 30) {
        e.ageYears = "Age must be 30 years or less";
      }
    }

    // Date of Birth validation
    if (form.dateOfBirth && typeof form.dateOfBirth === "string") {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        e.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    // Weight required and range
    if (form.weightKg === null || form.weightKg === undefined) {
      e.weightKg = "Weight is required";
    } else if (Number(form.weightKg) <= 0) {
      e.weightKg = "Weight must be positive";
    } else if (Number(form.weightKg) > 200) {
      e.weightKg = "Weight must be 200 kg or less";
    }

    // Photo required
    if (!form.avatarDataUrl) {
      e.avatarDataUrl = "Photo is required";
    }

    // Preferred diet validation (must be one of the valid options)
    const validDietTypes = ["Commercial", "Homemade", "Mixed"];
    if (
      form.preferredDiet &&
      typeof form.preferredDiet === "string" &&
      form.preferredDiet.trim() !== "" &&
      !validDietTypes.includes(form.preferredDiet)
    ) {
      e.preferredDiet = "Please select a valid diet type";
    }

    // Living environment validation
    const validEnvironments = ["Urban", "Suburban", "Rural"];
    if (
      form.livingEnvironment &&
      typeof form.livingEnvironment === "string" &&
      !validEnvironments.includes(form.livingEnvironment)
    ) {
      e.livingEnvironment = "Please select a valid living environment";
    }

    // Allergies (comma separated) - validate each token
    if (form.allergies && Array.isArray(form.allergies)) {
      for (const a of form.allergies) {
        if (!a) continue;
        if (!allergyPattern.test(a)) {
          e.allergies = "Allergies may only contain letters and spaces";
          break;
        }
      }
    }

    // Health notes: allow letters, spaces, commas, hyphens and apostrophes; enforce max length
    const healthNotesPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ,'-]+$/u;
    if (form.healthNotes && typeof form.healthNotes === "string") {
      if (form.healthNotes.length > 1000) {
        e.healthNotes = "Health Notes must be 1000 characters or fewer";
      } else if (!healthNotesPattern.test(form.healthNotes)) {
        e.healthNotes =
          "Health Notes may only contain letters, spaces, commas, hyphens or apostrophes";
      }
    }

    // Phone pattern validation
    const phonePattern = /^[0-9+()\-\s]{6,20}$/;
    if (form.ownerPhone && !phonePattern.test(form.ownerPhone)) {
      e.ownerPhone = "Invalid phone number format";
    }
    if (
      form.secondaryContactPhone &&
      !phonePattern.test(form.secondaryContactPhone)
    ) {
      e.secondaryContactPhone = "Invalid phone number format";
    }
    if (form.vetClinicPhone && !phonePattern.test(form.vetClinicPhone)) {
      e.vetClinicPhone = "Invalid phone number format";
    }

    // Blood type validation (e.g., DEA 1.1+, O, AB, etc.)
    const bloodPattern = /^[A-Za-z0-9+.\- ]{1,15}$/;
    if (form.bloodType && !bloodPattern.test(form.bloodType)) {
      e.bloodType =
        "Blood type may only contain letters, numbers, +, ., -, and spaces";
    }

    // Microchip number validation (alphanumeric, 6-20 chars)
    const microchipPattern = /^[A-Za-z0-9]{6,20}$/;
    if (form.microchipNumber && !microchipPattern.test(form.microchipNumber)) {
      e.microchipNumber =
        "Microchip number must be 6-20 alphanumeric characters";
    }

    // Secondary contact name validation
    if (
      form.secondaryContactName &&
      !nameOnlyPattern.test(form.secondaryContactName)
    ) {
      e.secondaryContactName =
        "Secondary contact name may only contain letters and spaces";
    }

    // Vet clinic name validation
    const clinicNamePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ &.,'-]+$/u;
    if (form.vetClinicName && !clinicNamePattern.test(form.vetClinicName)) {
      e.vetClinicName =
        "Vet clinic name may only contain letters, spaces, and common punctuation";
    }

    // Microchip implant date validation
    if (
      form.microchipImplantDate &&
      typeof form.microchipImplantDate === "string"
    ) {
      const implantDate = new Date(form.microchipImplantDate);
      const today = new Date();
      if (implantDate > today) {
        e.microchipImplantDate =
          "Microchip implant date cannot be in the future";
      }
      if (form.dateOfBirth) {
        const dob = new Date(form.dateOfBirth);
        if (implantDate < dob) {
          e.microchipImplantDate =
            "Microchip implant date cannot be before date of birth";
        }
      }
    }

    // Spay/neuter date validation
    if (form.spayNeuterDate && typeof form.spayNeuterDate === "string") {
      const spayDate = new Date(form.spayNeuterDate);
      const today = new Date();
      if (spayDate > today) {
        e.spayNeuterDate = "Spay/neuter date cannot be in the future";
      }
      if (form.dateOfBirth) {
        const dob = new Date(form.dateOfBirth);
        if (spayDate < dob) {
          e.spayNeuterDate = "Spay/neuter date cannot be before date of birth";
        }
      }
    }

    // If spay/neuter date present, require spayedNeutered selection
    if (form.spayNeuterDate && form.spayedNeutered == null) {
      e.spayedNeutered = "Select spayed/neutered status";
    }

    // If spayedNeutered is true, spay/neuter date should ideally be provided
    if (form.spayedNeutered === true && !form.spayNeuterDate) {
      e.spayNeuterDate = "Spay/neuter date is required when spayed/neutered";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // If an avatar is provided as data URL, upload it first to get a hosted URL
      if (form.avatarDataUrl && petId) {
        const uploaded = await uploadAvatar(petId, form.avatarDataUrl);
        if (uploaded) form.avatarDataUrl = uploaded as any;
      }

      if (petId) {
        await updatePet(petId, form as Partial<Pet>);
        // Redirect to profile view after editing
        router.push(`/dashboard/pets/${petId}`);
      } else {
        // Create then upload avatar (create returns id)
        const created = await createPet(form as Partial<Pet>);
        if (created && form.avatarDataUrl) {
          const uploaded = await uploadAvatar(created.id, form.avatarDataUrl);
          if (uploaded) {
            await updatePet(created.id, { avatarDataUrl: uploaded as any });
          }
        }
        // Redirect to the new pet's profile
        if (created) {
          router.push(`/dashboard/pets/${created.id}`);
        } else {
          router.push("/dashboard/pets");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Photo <span className="text-red-500">*</span>
          </label>
          <ImageUpload
            value={form.avatarDataUrl || null}
            onChange={(v) => handleChange("avatarDataUrl", v)}
          />
          {errors.avatarDataUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.avatarDataUrl}</p>
          )}
        </div>

        <div className="sm:col-span-2 space-y-6">
          {/* Section: Basic Information */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Breed <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.breed || ""}
                  onChange={(e) => handleChange("breed", e.target.value)}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.breed ? "border-red-500" : ""}`}
                />
                {errors.breed && (
                  <p className="mt-1 text-sm text-red-600">{errors.breed}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.weightKg ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "weightKg",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  min="0"
                  step="0.1"
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.weightKg ? "border-red-500" : ""}`}
                />
                {errors.weightKg && (
                  <p className="mt-1 text-sm text-red-600">{errors.weightKg}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.gender || ""}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.gender ? "border-red-500" : ""}`}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Activity Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.activityLevel || ""}
                  onChange={(e) =>
                    handleChange("activityLevel", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.activityLevel ? "border-red-500" : ""}`}
                >
                  <option value="">Select activity level</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                {errors.activityLevel && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.activityLevel}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Age (years){form.dateOfBirth ? " (calculated from DOB)" : ""}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ageYears ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "ageYears",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  min="0"
                  disabled={!!form.dateOfBirth}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.ageYears ? "border-red-500" : ""}`}
                />
                {errors.ageYears && (
                  <p className="mt-1 text-sm text-red-600">{errors.ageYears}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Dates & Reproductive Status */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Dates & Reproductive Status
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Date of Birth
                </label>
                <input
                  value={form.dateOfBirth || ""}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  type="date"
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.dateOfBirth ? "border-red-500" : ""}`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
              <div>
                <div className="relative mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    Spayed/Neutered <span className="text-red-500">*</span>
                    <button
                      type="button"
                      onClick={() => setShowSpayedTooltip(!showSpayedTooltip)}
                      className="inline-flex items-center justify-center w-5 h-5 text-gray-500 hover:text-blue-600 cursor-help"
                      title="Click for more information"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </label>
                  {showSpayedTooltip && (
                    <div className="absolute z-10 w-64 p-2 text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-lg bottom-full mb-2 left-0">
                      <p className="font-semibold text-blue-900 mb-1">
                        Spayed/Neutered?
                      </p>
                      <p className="mb-1">
                        <strong>Spaying:</strong> Remove ovaries and uterus from
                        female pet.
                      </p>
                      <p>
                        <strong>Neutering:</strong> Remove testicles from male
                        pet.
                      </p>
                    </div>
                  )}
                </div>
                <select
                  value={
                    form.spayedNeutered == null
                      ? ""
                      : form.spayedNeutered
                        ? "yes"
                        : "no"
                  }
                  onChange={(e) =>
                    handleChange(
                      "spayedNeutered",
                      e.target.value === "" ? null : e.target.value === "yes",
                    )
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.spayedNeutered ? "border-red-500" : ""}`}
                >
                  <option value="">Select status</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.spayedNeutered && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.spayedNeutered}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Spay/Neuter Date
                </label>
                <input
                  value={form.spayNeuterDate || ""}
                  onChange={(e) =>
                    handleChange("spayNeuterDate", e.target.value)
                  }
                  type="date"
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.spayNeuterDate ? "border-red-500" : ""}`}
                />
                {errors.spayNeuterDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.spayNeuterDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Identification */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Identification
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Microchip Number
                </label>
                <input
                  value={form.microchipNumber || ""}
                  onChange={(e) =>
                    handleChange("microchipNumber", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.microchipNumber ? "border-red-500" : ""}`}
                />
                {errors.microchipNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.microchipNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Microchip Implant Date
                </label>
                <input
                  value={form.microchipImplantDate || ""}
                  onChange={(e) =>
                    handleChange("microchipImplantDate", e.target.value)
                  }
                  type="date"
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.microchipImplantDate ? "border-red-500" : ""}`}
                />
                {errors.microchipImplantDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.microchipImplantDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Blood Type
                </label>
                <input
                  value={form.bloodType || ""}
                  onChange={(e) => handleChange("bloodType", e.target.value)}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bloodType ? "border-red-500" : ""}`}
                />
                {errors.bloodType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.bloodType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Diet & Environment */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Diet & Environment
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Living Environment <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.livingEnvironment || ""}
                  onChange={(e) =>
                    handleChange("livingEnvironment", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.livingEnvironment ? "border-red-500" : ""}`}
                >
                  <option value="">Select environment</option>
                  <option value="Urban">Urban</option>
                  <option value="Suburban">Suburban</option>
                  <option value="Rural">Rural</option>
                </select>
                {errors.livingEnvironment && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.livingEnvironment}
                  </p>
                )}
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Preferred Diet <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.preferredDiet || ""}
                  onChange={(e) =>
                    handleChange("preferredDiet", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.preferredDiet ? "border-red-500" : ""}`}
                >
                  <option value="">Select diet type</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Homemade">Homemade</option>
                  <option value="Mixed">Mixed</option>
                </select>
                {errors.preferredDiet && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.preferredDiet}
                  </p>
                )}
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Allergies (comma separated)
                </label>
                <input
                  value={(form.allergies || []).join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "allergies",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.allergies ? "border-red-500" : ""}`}
                />
                {errors.allergies && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.allergies}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Health Notes
              </label>
              <textarea
                value={form.healthNotes || ""}
                onChange={(e) => handleChange("healthNotes", e.target.value)}
                rows={4}
                className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.healthNotes ? "border-red-500" : ""}`}
              />
              {errors.healthNotes && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.healthNotes}
                </p>
              )}
            </div>
          </div>

          {/* Section: Emergency & Vet Contacts */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Emergency & Vet Contacts
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Owner Phone <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ownerPhone || ""}
                  onChange={(e) => handleChange("ownerPhone", e.target.value)}
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.ownerPhone ? "border-red-500" : ""}`}
                />
                {errors.ownerPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.ownerPhone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Secondary Contact Name
                </label>
                <input
                  value={form.secondaryContactName || ""}
                  onChange={(e) =>
                    handleChange("secondaryContactName", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.secondaryContactName ? "border-red-500" : ""}`}
                />
                {errors.secondaryContactName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.secondaryContactName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Secondary Contact Phone
                </label>
                <input
                  value={form.secondaryContactPhone || ""}
                  onChange={(e) =>
                    handleChange("secondaryContactPhone", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.secondaryContactPhone ? "border-red-500" : ""}`}
                />
                {errors.secondaryContactPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.secondaryContactPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Vet Clinic Name
                </label>
                <input
                  value={form.vetClinicName || ""}
                  onChange={(e) =>
                    handleChange("vetClinicName", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.vetClinicName ? "border-red-500" : ""}`}
                />
                {errors.vetClinicName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.vetClinicName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Vet Clinic Phone
                </label>
                <input
                  value={form.vetClinicPhone || ""}
                  onChange={(e) =>
                    handleChange("vetClinicPhone", e.target.value)
                  }
                  className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.vetClinicPhone ? "border-red-500" : ""}`}
                />
                {errors.vetClinicPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.vetClinicPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : petId ? "Save Changes" : "Create Pet"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/pets")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {petId && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = confirm(
                    "Are you sure you want to delete this pet? This action cannot be undone.",
                  );
                  if (!confirmed) return;
                  setLoading(true);
                  try {
                    const ok = await deletePet(petId);
                    if (ok) router.push("/dashboard/pets");
                    else alert("Failed to delete pet");
                  } catch (err) {
                    console.error(err);
                    alert("An error occurred while deleting the pet");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
