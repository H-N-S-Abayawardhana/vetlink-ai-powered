// src/services/pharmacyDemandApi.ts
// Service for Pharmacy Demand Prediction API (Hugging Face Model)
// Supports both Hugging Face Inference API and Gradio Spaces

import { Client } from "@gradio/client";

// Hugging Face Model ID or Space URL
// Can be either:
// - Model ID: "username/model-name" (uses Inference API)
// - Space URL: "https://username-space-name.hf.space" or "https://huggingface.co/spaces/username/space"
const PHARMACY_DEMAND_MODEL_ID =
  process.env.NEXT_PUBLIC_PHARMACY_DEMAND_MODEL_ID ||
  process.env.NEXT_PUBLIC_PHARMACY_DEMAND_MODEL_URL ||
  "";

// Normalize HF Space URL: convert huggingface.co/spaces/user/space to https://user-space.hf.space
function normalizeSpaceUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  const match = trimmed.match(
    /^https?:\/\/huggingface\.co\/spaces\/([^/]+)\/([^/?#]+)/i,
  );
  if (match) {
    const user = match[1];
    const space = match[2];
    return `https://${user}-${space}.hf.space`;
  }
  return trimmed;
}

const RESOLVED_SPACE_URL =
  normalizeSpaceUrl(PHARMACY_DEMAND_MODEL_ID) || PHARMACY_DEMAND_MODEL_ID;

// Hugging Face API Token (optional, but recommended for private models)
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || "";

const API_REQUEST_TIMEOUT = 30000; // 30 seconds

// Determine if we're using Inference API or Gradio Space
const isGradioSpace =
  PHARMACY_DEMAND_MODEL_ID.startsWith("http") ||
  RESOLVED_SPACE_URL.startsWith("http");

const INFERENCE_API_BASE = "https://api-inference.huggingface.co/models";

export interface PharmacyDemandInput {
  // Core features (required by model)
  medicine_id: string; // Medicine identifier (from dropdown)
  price: number;
  inventory_level: number;
  expiry_days: number;
  location_lat: number;
  location_long: number;
  promotion_flag: number; // 0 or 1

  // Historical sales data (required for prediction)
  sales_lag_1: number; // Sales 1 day ago
  sales_lag_3: number; // Sales 3 days ago
  sales_lag_7: number; // Sales 7 days ago
  sales_lag_14: number; // Sales 14 days ago
  sales_rolling_mean_7: number; // 7-day rolling average
  sales_rolling_mean_14: number; // 14-day rolling average
}

export interface PharmacyDemandResult {
  prediction?: number; // For backward compatibility
  html?: string; // HTML output from the model
  error?: string;
}

export class PharmacyDemandApiService {
  /**
   * Predict pharmacy demand using Hugging Face Model
   * Supports both Inference API and Gradio Spaces
   */
  static async predictDemand(
    input: PharmacyDemandInput,
  ): Promise<PharmacyDemandResult> {
    try {
      // Prepare inputs as array in the order expected by the Gradio model (app.py predict_demand)
      // All values sent as numbers so the Space receives correct types for sklearn/pandas
      const inputs: number[] = [
        1, // pharmacy_id
        Number(input.medicine_id), // medicine_id
        Number(input.price),
        Number(input.inventory_level),
        Number(input.expiry_days),
        Number(input.location_lat),
        Number(input.location_long),
        Number(input.promotion_flag),
        101, // inventory_id
        Number(input.inventory_level), // current_stock
        25, // reorder_level
        7, // supplier_lead_time_days
        Number(input.location_lat), // location_lat_y
        Number(input.location_long), // location_long_y
        1, // delivery_available
        1, // pickup_available
        1.15, // price_markup_factor
        Number(input.sales_lag_1), // total_prescribed_qty
        0.7, // avg_urgency
      ];

      // Try Gradio Space (primary method for this model)
      if (isGradioSpace || PHARMACY_DEMAND_MODEL_ID) {
        try {
          return await this.predictWithGradio(input, inputs);
        } catch (gradioError) {
          const errMsg =
            gradioError instanceof Error
              ? gradioError.message
              : typeof gradioError === "object"
                ? JSON.stringify(gradioError)
                : String(gradioError);
          console.warn("Gradio failed:", errMsg);
          // Fall through to direct API
        }
      }

      // Try Inference API as fallback
      if (!isGradioSpace && PHARMACY_DEMAND_MODEL_ID) {
        try {
          return await this.predictWithInferenceAPI(input, inputs);
        } catch (inferenceError) {
          console.warn(
            "Inference API failed:",
            inferenceError instanceof Error
              ? inferenceError.message
              : String(inferenceError),
          );
          // Fall through to direct API
        }
      }

      // Fallback to direct API call
      return await this.predictDemandDirectAPI(input, inputs);
    } catch (error) {
      console.error("Error predicting pharmacy demand:", error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (
          error.message.includes("fetch") ||
          error.message.includes("connect") ||
          error.message.includes("404") ||
          error.message.includes("405") ||
          error.message.includes("500") ||
          error.message.includes("503") ||
          error.message.includes("Method Not Allowed")
        ) {
          // Return a mock prediction when the model is not available or errors
          console.warn(
            "Hugging Face model not available, returning mock prediction",
          );
          return this.generateMockPrediction(input);
        }
        throw error;
      }

      throw new Error(
        `Failed to predict demand: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Predict using Hugging Face Inference API
   */
  private static async predictWithInferenceAPI(
    fullInput: any,
    inputs: (string | number)[],
  ): Promise<PharmacyDemandResult> {
    const modelUrl = `${INFERENCE_API_BASE}/${PHARMACY_DEMAND_MODEL_ID}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (HF_API_TOKEN) {
      headers["Authorization"] = `Bearer ${HF_API_TOKEN}`;
    }

    const response = await fetch(modelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: inputs,
      }),
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Inference API error: ${response.status} - ${errorText.substring(0, 200)}`,
      );
    }

    const data = await response.json();

    // Handle different response formats from Inference API
    return this.parseInferenceAPIResult(data);
  }

  /**
   * Predict using Gradio Client
   */
  private static async predictWithGradio(
    fullInput: any,
    inputs: (string | number)[],
  ): Promise<PharmacyDemandResult> {
    const spaceUrl = isGradioSpace
      ? RESOLVED_SPACE_URL
      : `https://${PHARMACY_DEMAND_MODEL_ID.replace("/", "-")}.hf.space`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);

    try {
      const app = await Client.connect(spaceUrl);

      const result: any = await app.predict(0, inputs);

      clearTimeout(timeoutId);
      return this.parsePredictionResult(result);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${API_REQUEST_TIMEOUT}ms`);
      }
      throw error;
    }
  }

  /**
   * Fallback method using Gradio's /call/predict API (POST then GET event_id)
   * See: https://gradio.app/guides/querying-gradio-apps-with-curl
   */
  private static async predictDemandDirectAPI(
    fullInput: any,
    inputs: (string | number)[],
  ): Promise<PharmacyDemandResult> {
    if (!RESOLVED_SPACE_URL && !PHARMACY_DEMAND_MODEL_ID) {
      throw new Error(
        "Pharmacy demand model URL or ID is not configured. Please set NEXT_PUBLIC_PHARMACY_DEMAND_MODEL_ID or NEXT_PUBLIC_PHARMACY_DEMAND_MODEL_URL environment variable.",
      );
    }

    const baseUrl = isGradioSpace
      ? RESOLVED_SPACE_URL
      : `https://${PHARMACY_DEMAND_MODEL_ID.replace("/", "-")}.hf.space`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (HF_API_TOKEN) {
      headers["Authorization"] = `Bearer ${HF_API_TOKEN}`;
    }

    // Step 1: POST to /gradio_api/call/predict (HF Spaces use /gradio_api/ prefix)
    const postUrl = `${baseUrl}/gradio_api/call/predict`;
    const postRes = await fetch(postUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: inputs }),
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT),
    });

    if (!postRes.ok) {
      const errorText = await postRes.text();
      // Log full error so we can see Python traceback from the Space
      console.warn(
        "Gradio API error (full response):",
        errorText.substring(0, 2000),
      );
      throw new Error(
        `Gradio API error: ${postRes.status} - ${errorText.substring(0, 300)}`,
      );
    }

    const postData = (await postRes.json()) as { event_id?: string };
    const eventId = postData?.event_id;
    if (!eventId) {
      throw new Error(
        `Gradio API did not return event_id: ${JSON.stringify(postData).substring(0, 200)}`,
      );
    }

    // Step 2: GET result via SSE stream
    const getUrl = `${baseUrl}/gradio_api/call/predict/${eventId}`;
    const getRes = await fetch(getUrl, {
      method: "GET",
      headers: HF_API_TOKEN ? { Authorization: `Bearer ${HF_API_TOKEN}` } : {},
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT),
    });

    if (!getRes.ok) {
      throw new Error(
        `Gradio result fetch error: ${getRes.status} - ${await getRes.text()}`,
      );
    }

    const text = await getRes.text();
    // Parse SSE: last "data: ..." line is usually the final result
    let dataStr: string | null = null;
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("data:")) {
        dataStr = line.replace(/^data:\s*/, "").trim();
      }
    }
    if (!dataStr) dataStr = text.trim();
    try {
      const data = JSON.parse(dataStr) as unknown;
      return this.parsePredictionResult(data);
    } catch {
      throw new Error(
        `Could not parse Gradio response: ${text.substring(0, 300)}`,
      );
    }
  }

  /**
   * Parse prediction result from Inference API
   */
  private static parseInferenceAPIResult(result: any): PharmacyDemandResult {
    // Inference API can return different formats:
    // 1. Direct number: 123
    // 2. Array: [123]
    // 3. Object with prediction: { prediction: 123 }
    // 4. Array of objects: [{ label: "...", score: 0.9 }]

    if (typeof result === "number") {
      return {
        prediction: Math.round(result),
      };
    }

    if (Array.isArray(result)) {
      // If array of numbers
      if (typeof result[0] === "number") {
        return {
          prediction: Math.round(result[0]),
        };
      }
      // If array of objects, try to extract prediction
      if (result[0] && typeof result[0] === "object") {
        const firstItem = result[0];
        // Try common prediction fields
        if (typeof firstItem.prediction === "number") {
          return {
            prediction: Math.round(firstItem.prediction),
          };
        }
        if (typeof firstItem.score === "number") {
          return {
            prediction: Math.round(firstItem.score),
          };
        }
        if (typeof firstItem.value === "number") {
          return {
            prediction: Math.round(firstItem.value),
          };
        }
      }
    }

    // If object with prediction field
    if (result && typeof result === "object") {
      if (typeof result.prediction === "number") {
        return {
          prediction: Math.round(result.prediction),
        };
      }
      if (typeof result[0] === "number") {
        return {
          prediction: Math.round(result[0]),
        };
      }
      // Try to find any numeric field
      for (const key in result) {
        if (typeof result[key] === "number") {
          return {
            prediction: Math.round(result[key]),
          };
        }
      }
    }

    throw new Error(
      `Unexpected Inference API response format: ${JSON.stringify(result).substring(0, 200)}`,
    );
  }

  /**
   * Parse prediction result from Gradio or direct API
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

    // Check if the output is HTML (contains HTML tags)
    if (
      outputText.includes("<div") ||
      outputText.includes("<p") ||
      outputText.includes("<h")
    ) {
      return {
        html: outputText,
      };
    }

    // Extract the number from the output string (fallback for older format)
    // Pattern: "✅ Predicted demand: **123 units**"
    const match = outputText.match(/\*\*(\d+)\s*units?\*\*/i);
    if (match && match[1]) {
      return {
        prediction: parseInt(match[1], 10),
      };
    }

    // If parsing fails, try to extract any number from the text
    const numberMatch = outputText.match(/(\d+\.?\d*)/);
    if (numberMatch && numberMatch[1]) {
      return {
        prediction: Math.round(parseFloat(numberMatch[1])),
      };
    }

    // If still no match, return the raw output as HTML
    return {
      html: outputText,
    };
  }

  /**
   * Generate a mock prediction when the Hugging Face model is not available
   */
  private static generateMockPrediction(
    input: PharmacyDemandInput,
  ): PharmacyDemandResult {
    // Simple mock prediction based on input parameters
    const basePrediction = Math.max(
      1,
      Math.round(
        input.inventory_level * 0.1 + // 10% of inventory as base
          input.sales_lag_1 * 0.8 + // Recent sales trend
          input.sales_lag_3 * 0.15 + // 3-day trend
          input.sales_lag_7 * 0.05, // 7-day trend
      ),
    );

    // Adjust for price (higher price might reduce demand)
    const priceAdjustment = input.price > 1500 ? 0.8 : 1.1;
    const adjustedPrediction = Math.round(basePrediction * priceAdjustment);

    // Adjust for expiry (closer expiry increases urgency)
    const expiryAdjustment =
      input.expiry_days < 60 ? 1.3 : input.expiry_days < 120 ? 1.1 : 0.9;
    const finalPrediction = Math.round(adjustedPrediction * expiryAdjustment);

    // Calculate days to stockout
    const daysToStockout = Math.max(
      1,
      Math.round(input.inventory_level / Math.max(1, finalPrediction)),
    );

    // Determine priority level
    let priority: string;
    let color: string;
    let action: string;
    let reason: string;

    if (daysToStockout < 5) {
      priority = "🔴 CRITICAL";
      action = "IMMEDIATE RESTOCK REQUIRED";
      reason = `Stock depletes in ${daysToStockout} days`;
      color = "#ff4444";
    } else if (daysToStockout < 10) {
      priority = "🟠 URGENT";
      action = "Restock within 2-3 days";
      reason = `Low stock: ${daysToStockout} days remaining`;
      color = "#ff8800";
    } else if (daysToStockout < 15) {
      priority = "🟡 HIGH";
      action = "Plan restock soon";
      reason = `Moderate stock: ${daysToStockout} days left`;
      color = "#ffcc00";
    } else {
      priority = "🟢 LOW";
      action = "Stock optimal";
      reason = `Sufficient for ${daysToStockout} days`;
      color = "#44ff44";
    }

    // Generate HTML response similar to the Hugging Face model
    const html = `
      <div style="padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h2 style="color: white; text-align: center;">📊 Sales Prediction Results</h2>
        <p style="color: #e8f4f8; text-align: center; font-size: 14px;">⚠️ Demo Mode - Hugging Face Model Not Available</p>
      </div>

      <div style="padding: 20px; margin-top: 20px; border: 2px solid ${color}; border-radius: 10px; background: #f8f9fa;">
        <h3 style="color: ${color}; margin-bottom: 15px;">${priority} Priority</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0; font-size: 14px; color: #666;">Predicted Sales (Next Period)</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #333;">${finalPrediction} units</p>
          </div>
          <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0; font-size: 14px; color: #666;">Days Until Stockout</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: ${color};">${daysToStockout} days</p>
          </div>
        </div>
        <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 15px;">
          <p style="margin: 0; font-size: 14px; color: #666;">Recommended Restock Quantity</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #333;">${Math.max(0, Math.round(finalPrediction * 14 - input.inventory_level))} units</p>
        </div>
        <div style="padding: 15px; background: ${color}; border-radius: 8px; color: white;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">✓ ${action}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${reason}</p>
        </div>
      </div>

      <div style="padding: 15px; margin-top: 20px; background: #e8f4f8; border-radius: 10px; border-left: 4px solid #2196F3;">
        <p style="margin: 0; font-size: 14px; color: #555;"><strong>Current Inventory:</strong> ${input.inventory_level} units</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;"><strong>Days to Expiry:</strong> ${input.expiry_days} days</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;"><strong>Medicine ID:</strong> ${input.medicine_id}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #777; font-style: italic;">📝 This is a simulated prediction for demonstration purposes</p>
      </div>
    `;

    return {
      html: html,
      prediction: finalPrediction,
    };
  }

  /**
   * Health check for pharmacy demand API
   */
  static async healthCheck(): Promise<{ status: string; model?: string }> {
    try {
      if (!PHARMACY_DEMAND_MODEL_ID) {
        return {
          status: "unhealthy",
          model: "Not configured",
        };
      }

      // Try Inference API health check
      if (!isGradioSpace) {
        try {
          const modelUrl = `${INFERENCE_API_BASE}/${PHARMACY_DEMAND_MODEL_ID}`;
          const headers: Record<string, string> = {};
          if (HF_API_TOKEN) {
            headers["Authorization"] = `Bearer ${HF_API_TOKEN}`;
          }

          const response = await fetch(modelUrl, {
            method: "GET",
            headers,
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok || response.status === 503) {
            // 503 means model is loading, but API is reachable
            return {
              status: response.status === 503 ? "loading" : "healthy",
              model: PHARMACY_DEMAND_MODEL_ID,
            };
          }
        } catch (err) {
          // Fall through to try Gradio
        }
      }

      // Try Gradio Space health check
      const spaceUrl = isGradioSpace
        ? RESOLVED_SPACE_URL
        : `https://${PHARMACY_DEMAND_MODEL_ID.replace("/", "-")}.hf.space`;

      const response = await fetch(`${spaceUrl}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          status: "healthy",
          model: PHARMACY_DEMAND_MODEL_ID,
        };
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error("Pharmacy demand API health check failed:", error);
      return {
        status: "unhealthy",
        model: PHARMACY_DEMAND_MODEL_ID || "Not configured",
      };
    }
  }
}

export default PharmacyDemandApiService;
