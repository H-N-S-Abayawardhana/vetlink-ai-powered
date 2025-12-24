"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import { AuthGuard } from "@/lib/auth-guard";
import { UserRole } from "@/types/next-auth";
import { listPets, Pet } from "@/lib/pets";

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";

interface ProfileData {
  username: string;
  email: string;
  contactNumber: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    email: "",
    contactNumber: "",
  });
  const [pets, setPets] = useState<Pet[]>([]);
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!isBrowser) return;
    if (session?.user) {
      setFormData({
        username: (session.user as any).username || "",
        email: session.user.email || "",
        contactNumber: (session.user as any).contactNumber || "",
      });
    }
    (async () => {
      try {
        const data = await listPets();
        setPets(data || []);
      } catch (e) {
        console.error("Failed to load user pets for profile", e);
      }
    })();
  }, [session, isBrowser]);

  // Prevent SSR issues by checking if we're in the browser (after hooks)
  if (!isBrowser) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setAlert({ type: "success", message: "Profile updated successfully!" });
        setIsEditing(false);
        // Update the session with new data
        await update();
      } else {
        setAlert({
          type: "error",
          message: result.message || "Failed to update profile",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "An error occurred while updating your profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (session?.user) {
      setFormData({
        username: (session.user as any).username || "",
        email: session.user.email || "",
        contactNumber: (session.user as any).contactNumber || "",
      });
    }
    setIsEditing(false);
    setAlert(null);
  };

  if (!session) {
    router.push("/signin");
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "VETERINARIAN"]}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  My Profile
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your account information
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Alert */}
          {alert && (
            <div className="px-6 py-4">
              <Alert
                type={alert.type}
                title={alert.type === "success" ? "Success" : "Error"}
                message={alert.message}
              />
            </div>
          )}

          {/* Profile Content */}
          <div className="px-6 py-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contactNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder="Enter your contact number"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Pet Pictures (replaces user avatar) */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-3">
                    {pets && pets.length > 0 ? (
                      pets.slice(0, 3).map((pet) => (
                        <div
                          key={pet.id}
                          className="w-20 h-20 rounded-full overflow-hidden bg-gray-100"
                        >
                          {(pet as any).avatarUrl ||
                          (pet as any).avatarDataUrl ? (
                            <Image
                              src={
                                (pet as any).avatarUrl ||
                                (pet as any).avatarDataUrl
                              }
                              alt={pet.name}
                              width={80}
                              height={80}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🐾
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-semibold text-blue-600">
                          {(session.user as any).username
                            ?.charAt(0)
                            .toUpperCase() ||
                            session.user.name?.charAt(0).toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {(session.user as any).username || session.user.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Username
                    </h3>
                    <p className="text-lg text-gray-900">
                      {(session.user as any).username || "Not set"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Email Address
                    </h3>
                    <p className="text-lg text-gray-900">
                      {session.user.email}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Contact Number
                    </h3>
                    <p className="text-lg text-gray-900">
                      {(session.user as any).contactNumber || "Not provided"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Member Since
                    </h3>
                    <p className="text-lg text-gray-900">
                      {formatDate((session.user as any).createdAt)}
                    </p>
                  </div>

                  {(session.user as any).lastLogin && (
                    <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Last Login
                      </h3>
                      <p className="text-lg text-gray-900">
                        {formatDate((session.user as any).lastLogin)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
