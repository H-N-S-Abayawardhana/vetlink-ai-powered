"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasAccess } from "./rbac";
import { UserRole } from "@/types/next-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  allowedRoles,
  fallbackPath = "/dashboard",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/signin");
      return;
    }

    const userRole = (session.user as any)?.userRole as UserRole;

    if (!userRole) {
      router.push("/signin");
      return;
    }

    // Check if user has required role
    if (requiredRole && userRole !== requiredRole) {
      router.push(fallbackPath);
      return;
    }

    // Check if user role is in allowed roles
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      router.push(fallbackPath);
      return;
    }
  }, [session, status, router, requiredRole, allowedRoles, fallbackPath]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.userRole as UserRole;

  if (!userRole) {
    return null;
  }

  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

// Hook to check if user has access to a specific path
export function useAccessCheck(path: string) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.userRole as UserRole;

  return {
    hasAccess: userRole ? hasAccess(userRole, path) : false,
    userRole,
    isLoading: !session,
  };
}
