import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { UserRole } from "@/types/next-auth";

export interface DashboardActivityItem {
  type: "user" | "pet" | "appointment" | "ai_scan";
  id: string;
  ts: string; // ISO
  title: string;
  subtitle?: string | null;
  href?: string | null;
}

function toIso(input: any): string {
  try {
    if (!input) return new Date().toISOString();
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// GET /api/dashboard/activity - Recent Activity Feed
// - SUPER_ADMIN: system-wide activity (users, pets, appointments, AI scans)
// - VETERINARIAN: vet-specific activity (appointments assigned to the logged-in vet)
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = ((session.user as any)?.userRole as UserRole) || "USER";
    if (userRole !== "SUPER_ADMIN" && userRole !== "VETERINARIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (userRole === "VETERINARIAN") {
      const apptsRes = await pool.query(
        `SELECT
           a.id,
           a.status,
           a.appointment_date,
           a.appointment_time,
           a.created_at,
           u.username AS user_name,
           u.email AS user_email
         FROM appointments a
         JOIN users u ON a.user_id_uuid = u.id
         WHERE a.veterinarian_id_uuid = $1
         ORDER BY a.created_at DESC
         LIMIT 15`,
        [session.user.id],
      );

      const appts: DashboardActivityItem[] = apptsRes.rows.map((r: any) => ({
        type: "appointment",
        id: String(r.id),
        ts: toIso(r.created_at),
        title: `Appointment #${r.id} • ${String(r.status || "pending")}`,
        subtitle:
          `${r.user_name || "User"} • ${r.appointment_date} ${r.appointment_time}`.trim(),
        href: "/dashboard/veterinarian-appointments",
      }));

      return NextResponse.json({ items: appts });
    }

    const [usersRes, petsRes, apptsRes, scansRes] = await Promise.all([
      pool.query(
        `SELECT id, username, email, user_role, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 10`,
      ),
      pool.query(
        `SELECT p.id, p.name, p.type, p.created_at, u.username AS owner_username
         FROM pets p
         LEFT JOIN users u ON p.owner_id = u.id
         ORDER BY p.created_at DESC
         LIMIT 10`,
      ),
      pool.query(
        `SELECT
           a.id,
           a.status,
           a.appointment_date,
           a.appointment_time,
           a.created_at,
           u.username AS user_name,
           v.username AS veterinarian_name
         FROM appointments a
         JOIN users u ON a.user_id_uuid = u.id
         JOIN users v ON a.veterinarian_id_uuid = v.id
         ORDER BY a.created_at DESC
         LIMIT 10`,
      ),
      pool.query(
        `SELECT
           p.id AS pet_id,
           p.name AS pet_name,
           u.username AS owner_username,
           elem
         FROM pets p
         LEFT JOIN users u ON p.owner_id = u.id
         CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.skin_disease_history, '[]'::jsonb)) AS elem
         ORDER BY (elem->>'createdAt')::timestamptz DESC NULLS LAST
         LIMIT 10`,
      ),
    ]);

    const users: DashboardActivityItem[] = usersRes.rows.map((r: any) => ({
      type: "user",
      id: String(r.id),
      ts: toIso(r.created_at),
      title: `New user: ${r.username || "Unknown"}`,
      subtitle: `${r.user_role || "USER"} • ${r.email || ""}`.trim(),
      href: null,
    }));

    const pets: DashboardActivityItem[] = petsRes.rows.map((r: any) => ({
      type: "pet",
      id: String(r.id),
      ts: toIso(r.created_at),
      title: `New pet: ${r.name || "Unnamed"}`,
      subtitle: `${(r.type || "pet").toString().toUpperCase()} • Owner: ${r.owner_username || "—"}`,
      href: `/dashboard/pets/${r.id}`,
    }));

    const appts: DashboardActivityItem[] = apptsRes.rows.map((r: any) => ({
      type: "appointment",
      id: String(r.id),
      ts: toIso(r.created_at),
      title: `Appointment #${r.id} • ${String(r.status || "pending")}`,
      subtitle: `${r.user_name || "User"} → Dr. ${r.veterinarian_name || "Vet"} • ${r.appointment_date} ${r.appointment_time}`,
      href: "/dashboard/appointment-schedule",
    }));

    const scans: DashboardActivityItem[] = scansRes.rows
      .map((r: any) => {
        const elem = r.elem || {};
        const createdAt =
          elem.createdAt ||
          elem.createdat ||
          elem.created_at ||
          elem["createdAt"] ||
          null;
        const disease = elem.disease || elem["disease"] || "Unknown";
        const scanId = elem.id || elem["id"] || `${r.pet_id}-${Date.now()}`;
        return {
          type: "ai_scan" as const,
          id: String(scanId),
          ts: toIso(createdAt),
          title: `AI scan: ${String(disease)}`,
          subtitle: `Pet: ${r.pet_name || "—"} • Owner: ${r.owner_username || "—"}`,
          href: r.pet_id ? `/dashboard/pets/${r.pet_id}` : null,
        };
      })
      // If createdAt is not a valid ISO, keep it but list might be out of order; OK for now.
      .filter((x: any) => x.id);

    const merged = [...users, ...pets, ...appts, ...scans]
      .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
      .slice(0, 15);

    return NextResponse.json({ items: merged });
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
