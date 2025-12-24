import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import pool from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND is_active = true",
            [credentials.email],
          );

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash,
          );

          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          await pool.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id],
          );

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            username: user.username,
            contactNumber: user.contact_number,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            userRole: user.user_role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists in database
          const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [user.email],
          );

          if (existingUser.rows.length === 0) {
            // Create new user for Google OAuth
            const username =
              user.name?.replace(/\s+/g, "").toLowerCase() ||
              user.email?.split("@")[0] ||
              "user";
            const result = await pool.query(
              `INSERT INTO users (username, email, password_hash, user_role, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               RETURNING id, username, email, contact_number, user_role, created_at, last_login`,
              [username, user.email, "oauth_user"], // Special password hash for OAuth users
            );

            const newUser = result.rows[0];
            user.id = newUser.id.toString();
            (user as any).username = newUser.username;
            (user as any).contactNumber = newUser.contact_number;
            (user as any).userRole = newUser.user_role;
            (user as any).createdAt = newUser.created_at;
            (user as any).lastLogin = newUser.last_login;
          } else {
            // Update existing user's last login
            const existingUserData = existingUser.rows[0];
            await pool.query(
              "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
              [existingUserData.id],
            );

            user.id = existingUserData.id.toString();
            (user as any).username = existingUserData.username;
            (user as any).contactNumber = existingUserData.contact_number;
            (user as any).userRole = existingUserData.user_role;
            (user as any).createdAt = existingUserData.created_at;
            (user as any).lastLogin = existingUserData.last_login;
          }
        } catch (error) {
          console.error("Google OAuth sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.contactNumber = (user as any).contactNumber;
        token.userRole = (user as any).userRole;
        token.createdAt = (user as any).createdAt;
        token.lastLogin = (user as any).lastLogin;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).contactNumber = token.contactNumber;
        (session.user as any).userRole = token.userRole;
        (session.user as any).createdAt = token.createdAt;
        (session.user as any).lastLogin = token.lastLogin;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
