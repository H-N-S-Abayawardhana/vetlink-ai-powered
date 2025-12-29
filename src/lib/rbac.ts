import { UserRole } from "@/types/next-auth";

// Define access permissions for each role
export const rolePermissions = {
  SUPER_ADMIN: {
    // Super admin has access to all routes
    allowedPaths: ["*"], // '*' means all paths
    description: "Full system access",
  },
  VETERINARIAN: {
    allowedPaths: [
      "/",
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/pharmacy",
      "/dashboard/skin-disease",
      "/dashboard/Limping",
      "/dashboard/pets",
      "/dashboard/veterinarian-appointments",
    ],
    description:
      "Veterinarian access to core features and appointment management",
  },
  USER: {
    allowedPaths: [
      "/",
      "/dashboard",
      "/dashboard/pets",
      "/dashboard/skin-disease",
      "/dashboard/appointment-schedule",
      "/dashboard/Limping",
      "/dashboard/pharmacy",
    ],
    description: "Basic user access with appointment scheduling",
  },
  PHARMACIST: {
    allowedPaths: [
      "/",
      "/dashboard",
      "/dashboard/pharmacy",
      "/dashboard/pharmacy/register",
    ],
    description: "Pharmacist access to dashboard and pharmacy management",
  },
};

// Check if a user role has access to a specific path
export function hasAccess(userRole: UserRole, path: string): boolean {
  const permissions = rolePermissions[userRole];

  // Super admin has access to everything
  if (permissions.allowedPaths.includes("*")) {
    return true;
  }

  // Check if the path is in the allowed paths
  return permissions.allowedPaths.some((allowedPath) => {
    // Exact match
    if (allowedPath === path) {
      return true;
    }

    // Check if path starts with allowed path (for nested routes)
    if (path.startsWith(allowedPath + "/")) {
      return true;
    }

    return false;
  });
}

// Middleware function to check access
export function checkAccess(
  userRole: UserRole,
  path: string,
): { allowed: boolean; reason?: string } {
  if (!userRole) {
    return { allowed: false, reason: "No user role provided" };
  }

  if (!hasAccess(userRole, path)) {
    return {
      allowed: false,
      reason: `Access denied. Role '${userRole}' does not have permission to access '${path}'`,
    };
  }

  return { allowed: true };
}
