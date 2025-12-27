"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { UserRole } from "@/types/next-auth";

interface NavBarProps {
  onMenuClick: () => void;
}

export default function NavBar({ onMenuClick }: NavBarProps) {
  const { data: session } = useSession();
  const [showProfile, setShowProfile] = useState(false);

  // Get user role from session
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";

  // Get role display name and greeting
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "VETERINARIAN":
        return "Veterinarian";
      case "USER":
        return "Pet Owner";
      default:
        return "User";
    }
  };

  const getGreeting = (role: UserRole): string => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Hi, Super Admin!";
      case "VETERINARIAN":
        return "Hi, Veterinarian!";
      case "USER":
        return "Hi, Pet Owner!";
      default:
        return "Hi, User!";
    }
  };

  const getGreetingColor = (role: UserRole): string => {
    switch (role) {
      case "SUPER_ADMIN":
        return "from-purple-50 to-purple-100 text-purple-700";
      case "VETERINARIAN":
        return "from-green-50 to-green-100 text-green-700";
      case "USER":
        return "from-blue-50 to-blue-100 text-blue-700";
      default:
        return "from-gray-50 to-gray-100 text-gray-700";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Menu button */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Right side - Notifications and profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md relative transition-colors duration-200 cursor-not-allowed"
              disabled
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {session?.user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {getRoleDisplayName(userRole)}
                </p>
              </div>
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {getGreeting(userRole)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session?.user?.username || "User"}
                    </p>
                  </div>

                  {/* Profile link for all roles */}
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    My Profile
                  </Link>

                  {/* Pets shortcut (role-aware) */}
                  {userRole === "USER" ? (
                    <Link
                      href="/dashboard/pets"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Pet Profile
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/pets"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      All Pets
                    </Link>
                  )}

                  {userRole === "SUPER_ADMIN" && (
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Settings
                    </Link>
                  )}

                  <Link
                    href="/dashboard/billing"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Billing
                  </Link>

                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showProfile && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
}
