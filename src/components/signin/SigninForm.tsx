"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import Link from "next/link";

export default function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is already logged in, redirect to dashboard
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Check for success message from signup
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        // Show success message before redirecting
        setSuccessMessage("Sign in Successfully! Redirecting...");

        // Navigate to dashboard after a short delay to show the success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMessage("");
    try {
      // Show success message before redirecting
      setSuccessMessage("Sign in Successfully! Redirecting...");

      // Small delay to show the message before redirect
      setTimeout(() => {
        signIn("google", { callbackUrl: "/dashboard" });
      }, 500);
    } catch (error) {
      setError("An error occurred during Google sign in");
    }
  };

  // Show loading state while checking session or if user is already logged in
  if (status === "loading" || session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm text-gray-600 text-center sm:text-left">
              Not a member?{" "}
              <a
                href="/signup"
                className="font-semibold text-blue-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Sign up for free
              </a>
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
                  title="Sign In Failed"
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Password
                  </label>
                  <div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg bg-white px-4 py-3 text-base text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 shrink-0 items-center">
                      <div className="group grid size-4 grid-cols-1">
                        <input
                          id="remember-me"
                          name="rememberMe"
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                          className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 indeterminate:border-blue-600 indeterminate:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                        />
                        <svg
                          viewBox="0 0 14 14"
                          fill="none"
                          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                        >
                          <path
                            d="M3 8L6 11L11 3.5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-checked:opacity-100"
                          />
                          <path
                            d="M3 7H11"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-indeterminate:opacity-100"
                          />
                        </svg>
                      </div>
                    </div>
                    <label
                      htmlFor="remember-me"
                      className="block text-sm/6 text-gray-900"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm/6">
                    <Link
                      href="/forgot-password"
                      className="font-semibold text-blue-700 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 sm:mt-10">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm/6 font-medium">
                  <span className="bg-gray-50 px-6 text-gray-900">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-base font-semibold text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all cursor-pointer shadow-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm/6 font-semibold">
                    Continue with Google
                  </span>
                </button>
              </div>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Premium AI Pet Healthcare
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Welcome Back
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Access your pet&apos;s health records, AI-powered diagnostics,
                and personalized care plans all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
