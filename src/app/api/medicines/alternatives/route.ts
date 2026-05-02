import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAlternativeMedicines } from "@/lib/medicine-alternatives";

/**
 * POST /api/medicines/alternatives
 * Body: { genericName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const genericName =
      typeof body.genericName === "string" ? body.genericName.trim() : "";

    if (!genericName) {
      return NextResponse.json(
        { error: "genericName is required" },
        { status: 400 },
      );
    }

    const matches = await getAlternativeMedicines(genericName);
    return NextResponse.json({
      success: true,
      genericName,
      count: matches.length,
      alternatives: matches.map((m) => ({
        matchedAlias: m.matchedAlias,
        score: m.score,
        item: {
          id: m.row.inventory_item_id,
          pharmacyId: m.row.pharmacy_id,
          name: m.row.name,
          generic_name: m.row.generic_name || "",
          form: m.row.form || "",
          strength: m.row.strength || "",
          stock: m.row.stock ?? 0,
          price: Number(m.row.price) || 0,
          expiry: m.row.expiry_date
            ? m.row.expiry_date.toISOString().split("T")[0]
            : null,
          image: m.row.image_url || null,
          pharmacyName: m.row.pharmacy_name || "",
          pharmacyAddress: m.row.pharmacy_address || "",
          pickup_available: Boolean(m.row.pickup_available),
          delivery_available: Boolean(m.row.delivery_available),
          delivery_fee:
            m.row.delivery_fee != null ? Number(m.row.delivery_fee) : 0,
        },
      })),
    });
  } catch (error) {
    console.error("Alternative medicines API failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch alternative medicines" },
      { status: 500 },
    );
  }
}
