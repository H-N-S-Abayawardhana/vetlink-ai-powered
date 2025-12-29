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

  const [form, setForm] = useState<Partial<Pet>>({
    type: "dog",
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
    avatarDataUrl: null,
  });

  useEffect(() => {
    if (petId) {
      (async () => {
        const pet = await getPet(petId);
        if (pet) {
          // Normalize backend `avatarUrl` -> frontend `avatarDataUrl` so ImageUpload shows the image
          const normalized = {
            ...pet,
            avatarDataUrl:
              (pet as any).avatarDataUrl || (pet as any).avatarUrl || null,
          } as Partial<Pet>;
          setForm(normalized);
        }
      })();
    }
  }, [petId]);

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

    // Text-field patterns (allow letters, some punctuation where appropriate)
    const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/u; // letters and spaces only
    const breedPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u;
    const allergyPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/u; // tokens: letters and spaces only; commas separate tokens in the input

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

    // Age required and range
    if (form.ageYears === null || form.ageYears === undefined) {
      e.ageYears = "Age is required";
    } else if (Number(form.ageYears) < 0) {
      e.ageYears = "Age must be 0 or greater";
    } else if (Number(form.ageYears) > 30) {
      e.ageYears = "Age must be 30 years or less";
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

    // Allergies (comma separated) - validate each token
    if (form.allergies && Array.isArray(form.allergies)) {
      for (const a of form.allergies) {
        if (!a) continue;
        if (!allergyPattern.test(a)) {
          e.allergies = "Allergies may only contain letters, spaces and commas";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Photo
          </label>
          <ImageUpload
            value={form.avatarDataUrl || null}
            onChange={(v) => handleChange("avatarDataUrl", v)}
          />
          {errors.avatarDataUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.avatarDataUrl}</p>
          )}
        </div>

        <div className="sm:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Name
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Breed
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
                Weight (kg)
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
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Activity Level
              </label>
              <select
                value={form.activityLevel || ""}
                onChange={(e) => handleChange("activityLevel", e.target.value)}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Age (years)
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
                className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.ageYears ? "border-red-500" : ""}`}
              />
              {errors.ageYears && (
                <p className="mt-1 text-sm text-red-600">{errors.ageYears}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Gender
              </label>
              <select
                value={form.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={`block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.gender ? "border-red-500" : ""}`}
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
          </div>

          <div>
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
              <p className="mt-1 text-sm text-red-600">{errors.allergies}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Preferred Diet
            </label>
            <select
              value={form.preferredDiet || ""}
              onChange={(e) => handleChange("preferredDiet", e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Living Environment
            </label>
            <select
              value={form.livingEnvironment || ""}
              onChange={(e) => handleChange("livingEnvironment", e.target.value)}
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

          <div>
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
              <p className="mt-1 text-sm text-red-600">{errors.healthNotes}</p>
            )}
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
