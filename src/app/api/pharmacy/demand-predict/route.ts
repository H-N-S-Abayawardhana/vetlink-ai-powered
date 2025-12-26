import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PharmacyDemandApiService, {
  PharmacyDemandInput,
} from "@/services/pharmacyDemandApi";

// POST /api/pharmacy/demand-predict - Predict pharmacy demand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pharmacy_id,
      medicine_id,
      price,
      inventory_level,
      expiry_days,
      location_lat_x,
      location_long_x,
      promotion_flag,
      // Optional fields
      inventory_id,
      current_stock,
      reorder_level,
      supplier_lead_time_days,
      location_lat_y,
      location_long_y,
      delivery_available,
      pickup_available,
      price_markup_factor,
      total_prescribed_qty,
      avg_urgency,
    } = body;

    // Validate required fields
    if (
      pharmacy_id === undefined ||
      medicine_id === undefined ||
      price === undefined ||
      inventory_level === undefined ||
      expiry_days === undefined ||
      location_lat_x === undefined ||
      location_long_x === undefined ||
      promotion_flag === undefined
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    // Prepare input for demand prediction API
    const input: PharmacyDemandInput = {
      pharmacy_id: Number(pharmacy_id),
      medicine_id: Number(medicine_id),
      price: Number(price),
      inventory_level: Number(inventory_level),
      expiry_days: Number(expiry_days),
      location_lat_x: Number(location_lat_x),
      location_long_x: Number(location_long_x),
      promotion_flag: Number(promotion_flag),
      // Optional fields
      inventory_id:
        inventory_id !== undefined ? Number(inventory_id) : undefined,
      current_stock:
        current_stock !== undefined ? Number(current_stock) : undefined,
      reorder_level:
        reorder_level !== undefined ? Number(reorder_level) : undefined,
      supplier_lead_time_days:
        supplier_lead_time_days !== undefined
          ? Number(supplier_lead_time_days)
          : undefined,
      location_lat_y:
        location_lat_y !== undefined ? Number(location_lat_y) : undefined,
      location_long_y:
        location_long_y !== undefined ? Number(location_long_y) : undefined,
      delivery_available:
        delivery_available !== undefined
          ? Number(delivery_available)
          : undefined,
      pickup_available:
        pickup_available !== undefined ? Number(pickup_available) : undefined,
      price_markup_factor:
        price_markup_factor !== undefined
          ? Number(price_markup_factor)
          : undefined,
      total_prescribed_qty:
        total_prescribed_qty !== undefined
          ? Number(total_prescribed_qty)
          : undefined,
      avg_urgency: avg_urgency !== undefined ? Number(avg_urgency) : undefined,
    };

    // Call Hugging Face pharmacy demand prediction API
    const result = await PharmacyDemandApiService.predictDemand(input);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      prediction: result.prediction,
    });
  } catch (error) {
    console.error("Error predicting pharmacy demand:", error);
    return NextResponse.json(
      {
        error: "Failed to predict demand",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
