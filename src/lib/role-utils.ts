import { UserRole } from "@/types/next-auth";

// Role hierarchy for permission checking
export const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  VETERINARIAN: 2,
  SUPER_ADMIN: 3,
};

// Check if a role has higher or equal privileges than another role
export function hasRolePermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    USER: "User",
    VETERINARIAN: "Veterinarian",
    SUPER_ADMIN: "Super Admin",
  };
  return displayNames[role];
}

// Get role description
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    USER: "Basic user with limited access to dashboard features",
    VETERINARIAN:
      "Veterinarian with access to medical tools and patient management",
    SUPER_ADMIN: "System administrator with full access to all features",
  };
  return descriptions[role];
}

// Check if user can access admin features
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "SUPER_ADMIN";
}

// Check if user can access veterinarian features
export function isVeterinarian(userRole: UserRole): boolean {
  return userRole === "VETERINARIAN" || userRole === "SUPER_ADMIN";
}
