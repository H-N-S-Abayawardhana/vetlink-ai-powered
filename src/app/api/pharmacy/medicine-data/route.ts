import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/pharmacy/medicine-data?medicine_id=XXX&pharmacy_id=XXX
// Fetches medicine data including current inventory and calculated sales lags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get("medicine_id");
    const pharmacyId = searchParams.get("pharmacy_id");

    if (!medicineId) {
      return NextResponse.json(
        { error: "medicine_id parameter is required" },
        { status: 400 },
      );
    }

    if (!pharmacyId) {
      return NextResponse.json(
        { error: "pharmacy_id parameter is required" },
        { status: 400 },
      );
    }

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id, latitude, longitude FROM pharmacies WHERE id = $1::uuid",
      [pharmacyId],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current inventory item for this medicine
    const inventoryResult = await pool.query(
      `SELECT 
        id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date
      FROM pharmacy_inventory_items
      WHERE pharmacy_id = $1::uuid 
        AND (name ILIKE $2 OR id::text = $2 OR name = $2)
      ORDER BY created_at DESC
      LIMIT 1`,
      [pharmacyId, medicineId],
    );

    let inventoryData = null;
    if (inventoryResult.rows.length > 0) {
      const item = inventoryResult.rows[0];
      inventoryData = {
        id: item.id,
        name: item.name,
        form: item.form,
        strength: item.strength || "",
        stock: item.stock || 0,
        price: item.price ? Number(item.price) : 0,
        expiry_date: item.expiry_date,
      };
    }

    // Calculate expiry days if expiry_date exists
    let expiryDays = 180; // Default
    if (inventoryData?.expiry_date) {
      const expiryDate = new Date(inventoryData.expiry_date);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      expiryDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      expiryDays = Math.max(0, expiryDays);
    }

    // Get historical sales data and calculate lags
    const salesResult = await pool.query(
      `SELECT 
        sale_date,
        quantity_sold,
        price_at_sale
      FROM pharmacy_medicine_sales
      WHERE pharmacy_id = $1::uuid 
        AND medicine_id = $2
      ORDER BY sale_date DESC
      LIMIT 30`,
      [pharmacyId, medicineId],
    );

    const sales = salesResult.rows.map((row) => ({
      date: row.sale_date,
      quantity: Number(row.quantity_sold),
      price: Number(row.price_at_sale),
    }));

    // Calculate sales lags (1, 3, 7, 14 days ago)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getSalesForDaysAgo = (daysAgo: number): number => {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysAgo);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      const sale = sales.find((s) => {
        const saleDate = new Date(s.date);
        return saleDate.toISOString().split("T")[0] === targetDateStr;
      });

      return sale ? sale.quantity : 0;
    };

    // Calculate rolling averages
    const getRollingAverage = (days: number): number => {
      const recentSales = sales
        .filter((s) => {
          const saleDate = new Date(s.date);
          const daysDiff =
            (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= days && daysDiff > 0;
        })
        .slice(0, days);

      if (recentSales.length === 0) return 0;
      const sum = recentSales.reduce((acc, s) => acc + s.quantity, 0);
      return sum / recentSales.length;
    };

    const salesLag1 = getSalesForDaysAgo(1);
    const salesLag3 = getSalesForDaysAgo(3);
    const salesLag7 = getSalesForDaysAgo(7);
    const salesLag14 = getSalesForDaysAgo(14);
    const salesRollingMean7 = getRollingAverage(7);
    const salesRollingMean14 = getRollingAverage(14);

    // Get most recent promotion status
    const recentPromotion = sales
      .filter((s) => {
        const saleDate = new Date(s.date);
        const daysDiff =
          (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      })
      .slice(0, 1)[0];

    return NextResponse.json({
      success: true,
      medicine_id: medicineId,
      inventory: inventoryData,
      location: {
        lat: pharmacy.latitude ? Number(pharmacy.latitude) : 7.2906,
        lng: pharmacy.longitude ? Number(pharmacy.longitude) : 80.6337,
      },
      sales_data: {
        sales_lag_1: salesLag1,
        sales_lag_3: salesLag3,
        sales_lag_7: salesLag7,
        sales_lag_14: salesLag14,
        sales_rolling_mean_7: Math.round(salesRollingMean7 * 100) / 100,
        sales_rolling_mean_14: Math.round(salesRollingMean14 * 100) / 100,
      },
      calculated_fields: {
        price: inventoryData?.price || 0,
        inventory_level: inventoryData?.stock || 0,
        expiry_days: expiryDays,
        promotion_flag: recentPromotion ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch medicine data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/pharmacy/medicine-data - Record a sale
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pharmacy_id,
      inventory_item_id,
      medicine_id,
      sale_date,
      quantity_sold,
      price_at_sale,
      promotion_active = false,
    } = body;

    // Validate required fields
    if (
      !pharmacy_id ||
      !medicine_id ||
      !sale_date ||
      quantity_sold === undefined ||
      price_at_sale === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [pharmacy_id],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert sale record
    const result = await pool.query(
      `INSERT INTO pharmacy_medicine_sales (
        pharmacy_id,
        inventory_item_id,
        medicine_id,
        sale_date,
        quantity_sold,
        price_at_sale,
        promotion_active,
        created_at,
        updated_at
      ) VALUES ($1::uuid, $2::uuid, $3, $4::date, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        pharmacy_id,
        inventory_item_id || null,
        medicine_id,
        sale_date,
        quantity_sold,
        price_at_sale,
        promotion_active,
      ],
    );

    return NextResponse.json(
      {
        success: true,
        sale: {
          id: result.rows[0].id,
          medicine_id: result.rows[0].medicine_id,
          sale_date: result.rows[0].sale_date,
          quantity_sold: result.rows[0].quantity_sold,
          price_at_sale: Number(result.rows[0].price_at_sale),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error recording sale:", error);
    return NextResponse.json(
      {
        error: "Failed to record sale",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

