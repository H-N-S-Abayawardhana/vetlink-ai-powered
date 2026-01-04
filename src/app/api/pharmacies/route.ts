import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all pharmacies (or filter by owner if needed)
    const result = await pool.query(
      `SELECT 
        id,
        owner_id,
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        pickup_available,
        delivery_available,
        delivery_fee,
        created_at,
        updated_at
      FROM pharmacies
      ORDER BY created_at DESC`,
    );

    // Transform database rows to match expected format
    const pharmacies = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address || "",
      location: {
        lat: row.latitude ? Number(row.latitude) : null,
        lng: row.longitude ? Number(row.longitude) : null,
      },
      contact: {
        phone: row.phone || "",
        email: row.email || "",
      },
      delivery: {
        pickup: row.pickup_available,
        delivery: row.delivery_available,
        delivery_fee: row.delivery_fee ? Number(row.delivery_fee) : 0,
      },
      inventory: [], // Inventory can be managed separately
      owner_id: row.owner_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ success: true, pharmacies });
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 },
    );
  }
}

// POST /api/pharmacies - register a new pharmacy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, location, contact, delivery = {} } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Pharmacy name is required" },
        { status: 400 },
      );
    }

    if (!location || location.lat === undefined || location.lng === undefined) {
      return NextResponse.json(
        { error: "Location (latitude and longitude) is required" },
        { status: 400 },
      );
    }

    // Insert pharmacy into database
    const result = await pool.query(
      `INSERT INTO pharmacies (
        owner_id,
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        pickup_available,
        delivery_available,
        delivery_fee,
        created_at,
        updated_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        session.user.id as string, // owner_id should be UUID
        name,
        address || null,
        location.lat,
        location.lng,
        contact?.phone || null,
        contact?.email || null,
        delivery.pickup !== undefined ? delivery.pickup : true,
        delivery.delivery !== undefined ? delivery.delivery : false,
        delivery.delivery_fee ? Number(delivery.delivery_fee) : 0,
      ],
    );

    const pharmacyRow = result.rows[0];

    // Transform to match expected response format
    const newPharmacy = {
      id: pharmacyRow.id,
      name: pharmacyRow.name,
      address: pharmacyRow.address || "",
      location: {
        lat: pharmacyRow.latitude ? Number(pharmacyRow.latitude) : null,
        lng: pharmacyRow.longitude ? Number(pharmacyRow.longitude) : null,
      },
      contact: {
        phone: pharmacyRow.phone || "",
        email: pharmacyRow.email || "",
      },
      delivery: {
        pickup: pharmacyRow.pickup_available,
        delivery: pharmacyRow.delivery_available,
        delivery_fee: pharmacyRow.delivery_fee
          ? Number(pharmacyRow.delivery_fee)
          : 0,
      },
      inventory: [],
      owner_id: pharmacyRow.owner_id,
      created_at: pharmacyRow.created_at,
      updated_at: pharmacyRow.updated_at,
    };

    return NextResponse.json(
      { success: true, pharmacy: newPharmacy },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering pharmacy:", error);

    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "Pharmacy with this name already exists" },
          { status: 409 },
        );
      }
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Invalid owner ID" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to register pharmacy" },
      { status: 500 },
    );
  }
}
