"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`,
        );
        const data = await response.json();

        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error || "Invalid or expired reset token");
        }
      } catch (error) {
        setTokenValid(false);
        setError("Failed to verify reset token");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccessMessage(
        "Password reset successfully! Redirecting to sign in...",
      );
      setTimeout(() => {
        router.push(
          "/signin?message=Password reset successfully. Please sign in with your new password.",
        );
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex w-full flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <div className="flex items-center justify-center mb-8">
                <Link href="/" passHref>
                  <Image
                    src="/vetlink_logo.png"
                    alt="VetLink Logo"
                    width={120}
                    height={40}
                    className="h-8 w-auto cursor-pointer"
                    priority
                  />
                </Link>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              {error && (
                <div className="mb-6">
                  <Alert
                    type="error"
                    title="Error"
                    message={error}
                    onDismiss={() => setError("")}
                  />
                </div>
              )}
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:from-blue-800 hover:to-blue-700 transition-all"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-md lg:w-full lg:max-w-lg">
          <div>
            <div className="flex items-center justify-center sm:justify-start mb-8">
              <div className="flex-shrink-0">
                <Link href="/" passHref>
                  <Image
                    src="/vetlink_logo.png"
                    alt="VetLink Logo"
                    width={120}
                    height={40}
                    className="h-8 w-auto cursor-pointer"
                    priority
                  />
                </Link>
              </div>
            </div>
            <h2 className="mt-6 sm:mt-8 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center sm:text-left">
              Reset your password
            </h2>
            <p className="mt-3 text-sm text-gray-600 text-center sm:text-left">
              Enter your new password below.
            </p>
          </div>

          <div className="mt-8 sm:mt-10">
            {successMessage && (
              <div className="mb-4">
                <Alert
                  type="success"
                  title="Success"
                  message={successMessage}
                  onDismiss={() => setSuccessMessage("")}
                />
              </div>
            )}
            {error && (
              <div className="mb-4">
                <Alert
                  type="error"
                  title="Error"
                  message={error}
                  onDismiss={() => setError("")}
                />
              </div>
            )}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    New Password
                  </label>
                  <div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
                      placeholder="Enter your new password"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="text-sm font-semibold text-blue-700 hover:text-blue-600 transition-colors"
              >
                ← Back to Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2 lg:h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100/50 to-gray-50 h-full">
          {/* Subtle blur effects */}
          <div className="absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute -bottom-28 right-[-10rem] h-80 w-[44rem] rounded-full bg-blue-50/50 blur-3xl" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-md text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 mb-6">
                <svg
                  className="h-4 w-4 text-blue-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure Password Reset
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Create New Password
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose a strong password to secure your account. Make sure
                it&apos;s at least 6 characters long.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
