/**
 * BCS Prediction API Service
 * Calls the Hugging Face BCS Prediction Model
 */

export interface BCSPredictionInput {
  breed: string;
  age: number;
  weight_kg: number;
  gender: string;
  activity_level: string;
  rib_condition: string;
  waist: string;
  abdominal_tuck: string;
  spine_hips: string;
  fat_deposits: string;
}

export interface BCSPredictionResponse {
  bcs_score: number;
  bcs_category: string;
}

// Hugging Face Spaces URL
const HF_SPACE_URL =
  process.env.NEXT_PUBLIC_BCS_API_URL ||
  "https://maleesha29-bcs-prediction-model.hf.space";

// Timeout configuration (Gradio cold start can take time)
const API_REQUEST_TIMEOUT = 120000; // 2 minutes

// Split API endpoint into base and path for flexibility
// Try newer Gradio endpoint format first: /api/{function_name}
const API_ENDPOINT_BASE = `${HF_SPACE_URL}/api/predict_bcs`;

// Fallback Gradio async pattern if needed
const API_SUBMIT_ENDPOINT_ASYNC = `${HF_SPACE_URL}/gradio_api/call/predict_bcs`;
const API_GET_ENDPOINT_ASYNC = (eventId: string) =>
  `${HF_SPACE_URL}/gradio_api/call/predict_bcs/${eventId}`;

/**
 * Predict BCS (Body Condition Score) using the Hugging Face model
 * Requires clinical observations + breed info for accurate prediction
 */
export async function predictBCS(
  input: BCSPredictionInput
): Promise<BCSPredictionResponse> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      API_REQUEST_TIMEOUT
    );

    try {
      // Gradio API format: data array with input parameters in correct order
      // Order: Breed, Age, Weight_kg, Gender, Activity_Level, Rib_Condition, Waist, Abdominal_Tuck, Spine_Hips, Fat_Deposits
      const payload = {
        data: [
          input.breed,
          input.age,
          input.weight_kg,
          input.gender,
          input.activity_level,
          input.rib_condition,
          input.waist,
          input.abdominal_tuck,
          input.spine_hips,
          input.fat_deposits,
        ],
      };

      // Log the request payload for debugging
      console.log(`Submitting BCS prediction to: ${API_ENDPOINT_BASE}`);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Try the simpler endpoint format first (/api/predict_bcs)
      let submitResponse = await fetch(API_ENDPOINT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // If 404, try the async pattern (/gradio_api/call/predict_bcs)
      if (submitResponse.status === 404) {
        console.log("Endpoint /api/predict_bcs not found, trying async pattern...");
        submitResponse = await fetch(API_SUBMIT_ENDPOINT_ASYNC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error(
          `BCS API submit error - Status: ${submitResponse.status}`,
          errorText
        );
        throw new Error(
          `Failed to submit BCS prediction: ${submitResponse.status} - ${errorText}`
        );
      }

      const submitResult = await submitResponse.json();
      console.log("Submit response:", submitResult);

      // Check if this is an async response (has event_id) or direct response
      if (submitResult.event_id) {
        // Async pattern - need to poll for result
        const eventId = submitResult.event_id;
        console.log(`Async response received, polling with event_id: ${eventId}`);

        // Step 2: Get the result using Server-Sent Events (SSE)
        const resultResponse = await fetch(API_GET_ENDPOINT_ASYNC(eventId), {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get BCS prediction result: ${resultResponse.status}`
          );
        }

        // Parse SSE response
        const resultText = await resultResponse.text();
        const result = parseSSEResponse(resultText);
        return normalizeBCSResponse(result);
      } else {
        // Direct response pattern - result is in the response
        clearTimeout(timeoutId);
        console.log("Direct response received. Type:", typeof submitResult);
        console.log("Is Array:", Array.isArray(submitResult));
        console.log("Full response:", JSON.stringify(submitResult));
        
        // Handle various response formats from Gradio
        // Could be: [{...}], [...], or direct object
        return normalizeBCSResponse(submitResult);
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error(
          `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. The Hugging Face Space might be starting up - please try again.`
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("BCS Prediction Error:", error);
    throw new Error(
      `Failed to get BCS prediction from Hugging Face model: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Parse Server-Sent Events (SSE) response from Gradio
 */
function parseSSEResponse(sseText: string): Record<string, unknown> {
  const lines = sseText.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.substring(6);
      try {
        const parsed = JSON.parse(jsonStr);
        // The API returns data array with predictions
        if (parsed && Array.isArray(parsed.data)) {
          return {
            score: parsed.data[0],
            category: parsed.data[1],
          };
        }
        return parsed;
      } catch {
        continue;
      }
    }
  }
  throw new Error("No valid data found in SSE response");
}

/**
 * Normalize the BCS response to our format
 * Handles:
 * - Array response: ["Predicted Body Condition Score (BCS): X"]
 * - Direct string response: "Predicted Body Condition Score (BCS): X"
 * - SSE response with data array
 * - Response object with data field
 */
function normalizeBCSResponse(
  result: Record<string, unknown> | string | unknown[] | unknown
): BCSPredictionResponse {
  let bcsScore: number;
  let bcsCategory: string;

  // Extract response string from various formats
  let responseStr = "";

  // First, unwrap if this is a response object with a "data" field
  let unwrappedResult = result;
  if (
    typeof result === "object" &&
    result !== null &&
    !Array.isArray(result) &&
    "data" in (result as Record<string, unknown>)
  ) {
    unwrappedResult = (result as Record<string, unknown>).data;
  }

  // Handle array format: ["Predicted Body Condition Score (BCS): X"]
  if (Array.isArray(unwrappedResult)) {
    if (typeof unwrappedResult[0] === "string") {
      responseStr = unwrappedResult[0];
    } else if (typeof unwrappedResult[0] === "object" && unwrappedResult[0] !== null) {
      // Array of objects - try to extract from first object
      const obj = unwrappedResult[0] as Record<string, unknown>;
      if (typeof obj.data === "string") {
        responseStr = obj.data;
      } else if (Array.isArray(obj.data) && typeof obj.data[0] === "string") {
        responseStr = obj.data[0];
      }
    }
  } else if (typeof unwrappedResult === "string") {
    responseStr = unwrappedResult;
  } else if (typeof unwrappedResult === "object" && unwrappedResult !== null) {
    const resultObj = unwrappedResult as Record<string, unknown>;
    if (typeof resultObj.data === "string") {
      responseStr = resultObj.data;
    } else if (Array.isArray(resultObj.data) && typeof resultObj.data[0] === "string") {
      responseStr = resultObj.data[0];
    } else if (typeof resultObj.bcs_score === "number") {
      // Direct response object with bcs_score field
      bcsScore = resultObj.bcs_score;
      bcsCategory = categorizeScore(bcsScore);
      return {
        bcs_score: Math.max(1, Math.min(9, bcsScore)),
        bcs_category: bcsCategory,
      };
    }
  }

  // Parse string response with format: "Predicted Body Condition Score (BCS): X"
  if (responseStr) {
    // Try to extract number after "BCS):"
    const match = responseStr.match(/BCS\):\s*(\d+)/i);
    if (match && match[1]) {
      bcsScore = parseInt(match[1], 10);
    } else {
      throw new Error(
        `Failed to extract BCS score from response: ${responseStr}`
      );
    }
  } else {
    console.error("Failed to extract response string. Debugging info:", {
      result,
      resultType: typeof result,
      isArray: Array.isArray(result),
      stringified: JSON.stringify(result).substring(0, 200),
    });
    throw new Error(
      `Invalid response format from BCS model. Received: ${JSON.stringify(result).substring(0, 100)}`
    );
  }

  // Ensure BCS score is in valid range (1-9 scale)
  const normalizedScore = Math.max(1, Math.min(9, bcsScore));
  bcsCategory = categorizeScore(normalizedScore);

  return {
    bcs_score: normalizedScore,
    bcs_category: bcsCategory,
  };
}

/**
 * Categorize BCS score into health categories
 * Handles both 1-9 and 0-10 scale
 */
function categorizeScore(score: number): string {
  const normalizedScore = Math.max(1, Math.min(9, score));

  if (normalizedScore <= 3) return "Underweight";
  if (normalizedScore <= 5) return "Ideal Weight";
  if (normalizedScore <= 7) return "Overweight";
  return "Obese";
}
