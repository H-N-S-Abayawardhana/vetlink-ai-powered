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
      medicine_id,
      price,
      inventory_level,
      expiry_days,
      location_lat,
      location_long,
      promotion_flag,
      sales_lag_1,
      sales_lag_3,
      sales_lag_7,
      sales_lag_14,
      sales_rolling_mean_7,
      sales_rolling_mean_14,
    } = body;

    // Validate required fields
    if (
      medicine_id === undefined ||
      price === undefined ||
      inventory_level === undefined ||
      expiry_days === undefined ||
      location_lat === undefined ||
      location_long === undefined ||
      promotion_flag === undefined ||
      sales_lag_1 === undefined ||
      sales_lag_3 === undefined ||
      sales_lag_7 === undefined ||
      sales_lag_14 === undefined ||
      sales_rolling_mean_7 === undefined ||
      sales_rolling_mean_14 === undefined
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    // Prepare input for demand prediction API
    const input: PharmacyDemandInput = {
      medicine_id: String(medicine_id),
      price: Number(price),
      inventory_level: Number(inventory_level),
      expiry_days: Number(expiry_days),
      location_lat: Number(location_lat),
      location_long: Number(location_long),
      promotion_flag: Number(promotion_flag),
      sales_lag_1: Number(sales_lag_1),
      sales_lag_3: Number(sales_lag_3),
      sales_lag_7: Number(sales_lag_7),
      sales_lag_14: Number(sales_lag_14),
      sales_rolling_mean_7: Number(sales_rolling_mean_7),
      sales_rolling_mean_14: Number(sales_rolling_mean_14),
    };

    // Call Hugging Face pharmacy demand prediction API
    const result = await PharmacyDemandApiService.predictDemand(input);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return HTML if available (from Gradio model), otherwise return prediction number
    return NextResponse.json({
      success: true,
      prediction: result.prediction,
      html: result.html || (result.prediction ? null : null), // HTML output from model
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
