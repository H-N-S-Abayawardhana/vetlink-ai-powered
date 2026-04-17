"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      setSuccessMessage(
        data.message ||
          "Password reset link has been sent to your email address.",
      );
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
              Forgot your password?
            </h2>
            <p className="mt-3 text-sm text-gray-600 text-center sm:text-left">
              No worries! Enter your email address and we&apos;ll send you a
              link to reset your password.
            </p>
          </div>

          <div className="mt-8 sm:mt-10">
            {successMessage && (
              <div className="mb-4">
                <Alert
                  type="success"
                  title="Email Sent"
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
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Email address
                  </label>
                  <div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="text-sm font-semibold text-blue-700 hover:text-blue-600 transition-colors cursor-pointer"
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Password Recovery
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Reset Your Password
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Enter your email address and we&apos;ll send you a secure link
                to reset your password and regain access to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
