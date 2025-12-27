// src/services/pharmacyDemandApi.ts
// Service for Pharmacy Demand Prediction API (Hugging Face Gradio Space)

import { Client } from "@gradio/client";

const PHARMACY_DEMAND_API_URL =
  process.env.NEXT_PUBLIC_PHARMACY_DEMAND_MODEL_URL ||
  "https://malindaz-sales.hf.space";

const API_REQUEST_TIMEOUT = 30000; // 30 seconds

export interface PharmacyDemandInput {
  // Core features (8 inputs from user)
  pharmacy_id: number;
  medicine_id: number;
  price: number;
  inventory_level: number;
  expiry_days: number;
  location_lat_x: number;
  location_long_x: number;
  promotion_flag: number; // 0 or 1

  // Additional features (11 inputs with defaults)
  inventory_id?: number;
  current_stock?: number;
  reorder_level?: number;
  supplier_lead_time_days?: number;
  location_lat_y?: number;
  location_long_y?: number;
  delivery_available?: number; // 0 or 1
  pickup_available?: number; // 0 or 1
  price_markup_factor?: number;
  total_prescribed_qty?: number;
  avg_urgency?: number; // 0-1
}

export interface PharmacyDemandResult {
  prediction: number; // Predicted demand in units
  error?: string;
}

export class PharmacyDemandApiService {
  /**
   * Predict pharmacy demand using Gradio Client
   * Sends input data to Hugging Face Gradio Space
   */
  static async predictDemand(
    input: PharmacyDemandInput,
  ): Promise<PharmacyDemandResult> {
    try {
      // Set defaults for optional fields
      const fullInput = {
        inventory_id: input.inventory_id ?? 101,
        current_stock: input.current_stock ?? 150,
        reorder_level: input.reorder_level ?? 25,
        supplier_lead_time_days: input.supplier_lead_time_days ?? 7,
        location_lat_y: input.location_lat_y ?? 6.9271,
        location_long_y: input.location_long_y ?? 79.8612,
        delivery_available: input.delivery_available ?? 1,
        pickup_available: input.pickup_available ?? 1,
        price_markup_factor: input.price_markup_factor ?? 1.15,
        total_prescribed_qty: input.total_prescribed_qty ?? 40,
        avg_urgency: input.avg_urgency ?? 0.7,
        ...input,
      };

      // Prepare inputs in the exact order expected by the model
      // Based on app.py, the function expects 19 inputs in this order:
      const inputs: (string | number)[] = [
        fullInput.pharmacy_id,
        fullInput.medicine_id,
        fullInput.price,
        fullInput.inventory_level,
        fullInput.expiry_days,
        fullInput.location_lat_x,
        fullInput.location_long_x,
        fullInput.promotion_flag,
        fullInput.inventory_id,
        fullInput.current_stock,
        fullInput.reorder_level,
        fullInput.supplier_lead_time_days,
        fullInput.location_lat_y,
        fullInput.location_long_y,
        fullInput.delivery_available,
        fullInput.pickup_available,
        fullInput.price_markup_factor,
        fullInput.total_prescribed_qty,
        fullInput.avg_urgency,
      ];

      // Try using Gradio client first
      try {
        // The Gradio client can accept either:
        // 1. Full URL: "https://username-space-name.hf.space"
        // 2. Space identifier: "username/space-name" (if we know it)
        // Let's try the full URL first
        const app = await Client.connect(PHARMACY_DEMAND_API_URL);

        const result: any = await app.predict(0, inputs);

        // Parse the result
        return this.parsePredictionResult(result);
      } catch (clientError) {
        console.warn("Gradio client failed, trying direct API:", clientError);
        console.warn(
          "Client error details:",
          clientError instanceof Error
            ? clientError.message
            : String(clientError),
        );

        // Fallback to direct API call
        return await this.predictDemandDirectAPI(fullInput, inputs);
      }
    } catch (error) {
      console.error("Error predicting pharmacy demand:", error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (
          error.message.includes("fetch") ||
          error.message.includes("connect")
        ) {
          throw new Error(
            `Failed to connect to the prediction API. Please check if the Hugging Face Space is running at ${PHARMACY_DEMAND_API_URL}`,
          );
        }
        throw error;
      }

      throw new Error(
        `Failed to predict demand: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fallback method using direct API call
   */
  private static async predictDemandDirectAPI(
    fullInput: any,
    inputs: (string | number)[],
  ): Promise<PharmacyDemandResult> {
    // Try different API endpoint formats
    const endpoints = [
      "/api/predict",
      "/api/predict/",
      "/predict",
      "/run/predict",
    ];

    const errors: string[] = [];

    for (const endpoint of endpoints) {
      try {
        const url = `${PHARMACY_DEMAND_API_URL}${endpoint}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: inputs,
            fn_index: 0,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return this.parsePredictionResult(data);
        } else {
          const errorText = await response.text();
          errors.push(
            `${endpoint}: ${response.status} - ${errorText.substring(0, 100)}`,
          );
          console.warn(
            `Endpoint ${endpoint} failed:`,
            response.status,
            errorText.substring(0, 200),
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${endpoint}: ${errorMsg}`);
        console.warn(`Endpoint ${endpoint} error:`, errorMsg);
        // Try next endpoint
        continue;
      }
    }

    throw new Error(
      `Failed to connect to API using all available endpoints. Errors: ${errors.join("; ")}`,
    );
  }

  /**
   * Parse prediction result from various formats
   */
  private static parsePredictionResult(result: any): PharmacyDemandResult {
    let outputText: string;

    if (Array.isArray(result)) {
      outputText = String(result[0]);
    } else if (result && typeof result === "object" && "data" in result) {
      if (Array.isArray(result.data)) {
        outputText = String(result.data[0]);
      } else {
        outputText = String(result.data);
      }
    } else if (typeof result === "string") {
      outputText = result;
    } else if (typeof result === "number") {
      return {
        prediction: Math.round(result),
      };
    } else {
      throw new Error(
        `Unexpected API response format: ${JSON.stringify(result).substring(0, 200)}`,
      );
    }

    // Extract the number from the output string
    // Pattern: "✅ Predicted demand: **123 units**"
    const match = outputText.match(/\*\*(\d+)\s*units?\*\*/i);
    if (match && match[1]) {
      return {
        prediction: parseInt(match[1], 10),
      };
    }

    // If parsing fails, try to extract any number from the text
    const numberMatch = outputText.match(/(\d+)/);
    if (numberMatch && numberMatch[1]) {
      return {
        prediction: parseInt(numberMatch[1], 10),
      };
    }

    // If still no match, return error with the raw output
    throw new Error(
      `Unexpected API response format: ${outputText.substring(0, 200)}`,
    );
  }

  /**
   * Health check for pharmacy demand API
   */
  static async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${PHARMACY_DEMAND_API_URL}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { status: "healthy" };
    } catch (error) {
      console.error("Pharmacy demand API health check failed:", error);
      return { status: "unhealthy" };
    }
  }
}

export default PharmacyDemandApiService;
