import NextAuth from "next-auth";

// Define user roles
export type UserRole = "SUPER_ADMIN" | "VETERINARIAN" | "USER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      contactNumber?: string;
      createdAt: string;
      lastLogin?: string;
      userRole: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    contactNumber?: string;
    createdAt: string;
    lastLogin?: string;
    userRole: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    contactNumber?: string;
    createdAt: string;
    lastLogin?: string;
    userRole: UserRole;
  }
}
