import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch inventory items for a pharmacy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paramId } = await params;

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [paramId],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];

    // Check if user owns the pharmacy or is admin
    const userRole = (session.user as any)?.userRole || "USER";
    if (pharmacy.owner_id !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get inventory items
    const result = await pool.query(
      `SELECT 
        id,
        pharmacy_id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date,
        created_at,
        updated_at
      FROM pharmacy_inventory_items
      WHERE pharmacy_id = $1::uuid
      ORDER BY created_at DESC`,
      [paramId],
    );

    // Transform to match expected format
    const inventory = result.rows.map((row) => ({
      id: parseInt(row.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      uuid: row.id, // Store UUID for updates
      name: row.name,
      form: row.form,
      strength: row.strength || "",
      stock: row.stock || 0,
      expiry: row.expiry_date
        ? row.expiry_date.toISOString().split("T")[0]
        : null,
      price: row.price ? Number(row.price) : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

// POST - Add inventory item to pharmacy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const body = await request.json();
    const { name, form, strength, stock = 0, expiry = null, price = 0 } = body;

    if (!name || !form) {
      return NextResponse.json(
        { error: "Missing required fields: name and form" },
        { status: 400 },
      );
    }

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [paramId],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (pharmacy.owner_id !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert inventory item
    const result = await pool.query(
      `INSERT INTO pharmacy_inventory_items (
        pharmacy_id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date,
        created_at,
        updated_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [paramId, name, form, strength || null, stock, price, expiry || null],
    );

    const itemRow = result.rows[0];

    // Transform to match expected format
    const newItem = {
      id: parseInt(itemRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      uuid: itemRow.id, // Store UUID for future updates
      name: itemRow.name,
      form: itemRow.form,
      strength: itemRow.strength || "",
      stock: itemRow.stock || 0,
      expiry: itemRow.expiry_date
        ? itemRow.expiry_date.toISOString().split("T")[0]
        : null,
      price: itemRow.price ? Number(itemRow.price) : 0,
    };

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error adding inventory:", error);

    if (error instanceof Error) {
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Invalid pharmacy ID" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
