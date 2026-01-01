"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types/next-auth";
import { getRoleDisplayName } from "@/lib/role-utils";

interface User {
  id: number;
  username: string;
  email: string;
  user_role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.userRole as UserRole;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchUsers();
    }
  }, [status, session, router, fetchUsers]);

  const updateUser = async (
    userId: number,
    field: "user_role" | "is_active",
    value: UserRole | boolean,
  ) => {
    try {
      setUpdating((prev) => new Set(prev).add(userId));
      setError(null);
      setSuccess(null);

      const updateData: any = { userId };
      if (field === "user_role") {
        updateData.newRole = value;
      } else {
        updateData.isActive = value;
      }

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const data = await response.json();
      setSuccess(
        `User ${field === "user_role" ? "role" : "status"} updated successfully`,
      );

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                user_role:
                  field === "user_role" ? (value as UserRole) : user.user_role,
                is_active:
                  field === "is_active" ? (value as boolean) : user.is_active,
              }
            : user,
        ),
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || "Failed to update user. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.userRole as UserRole;
  if (userRole !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all registered users in the system
          </p>
        </div>
        <Link
          href="/dashboard/user-management/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add New User
        </Link>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.user_role}
                        onChange={(e) =>
                          updateUser(
                            user.id,
                            "user_role",
                            e.target.value as UserRole,
                          )
                        }
                        disabled={updating.has(user.id)}
                        className="block w-full min-w-[160px] px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
                      >
                        <option value="USER">User</option>
                        <option value="VETERINARIAN">Veterinarian</option>
                        <option value="PHARMACIST">Pharmacist</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.is_active ? "true" : "false"}
                        onChange={(e) =>
                          updateUser(
                            user.id,
                            "is_active",
                            e.target.value === "true",
                          )
                        }
                        disabled={updating.has(user.id)}
                        className="block w-full min-w-[140px] px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(user.last_login)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-semibold text-gray-900">
              {users.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-semibold text-green-600">
              {users.filter((u) => u.is_active).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Inactive Users</p>
            <p className="text-2xl font-semibold text-red-600">
              {users.filter((u) => !u.is_active).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Super Admins</p>
            <p className="text-2xl font-semibold text-blue-600">
              {users.filter((u) => u.user_role === "SUPER_ADMIN").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
