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

// Base URL for the BCS model space.
const HF_SPACE_URL =
  process.env.NEXT_PUBLIC_BCS_API_URL ||
  "https://maleesha29-bcs-prediction-model.hf.space";

// HF spaces can take time on cold start.
const API_REQUEST_TIMEOUT = 120000; // 2 minutes

// Primary sync endpoint.
const API_ENDPOINT_BASE = `${HF_SPACE_URL}/api/predict_bcs`;

// Async endpoint fallback.
const API_SUBMIT_ENDPOINT_ASYNC = `${HF_SPACE_URL}/gradio_api/call/predict_bcs`;
const API_GET_ENDPOINT_ASYNC = (eventId: string) =>
  `${HF_SPACE_URL}/gradio_api/call/predict_bcs/${eventId}`;

/**
 * Predict BCS (Body Condition Score) using the Hugging Face model
 */
export async function predictBCS(
  input: BCSPredictionInput,
): Promise<BCSPredictionResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);

    try {
      // Gradio expects ordered inputs in a `data` array.
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

      // Try sync endpoint first.
      let submitResponse = await fetch(API_ENDPOINT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Fallback to async endpoint if sync route is not available.
      if (submitResponse.status === 404) {
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
          errorText,
        );
        throw new Error(
          `Failed to submit BCS prediction: ${submitResponse.status} - ${errorText}`,
        );
      }

      const submitResult = await submitResponse.json();

      // Async flow: submit returns event_id; result comes from a follow-up GET.
      if (submitResult.event_id) {
        const eventId = submitResult.event_id;

        const resultResponse = await fetch(API_GET_ENDPOINT_ASYNC(eventId), {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get BCS prediction result: ${resultResponse.status}`,
          );
        }

        const resultText = await resultResponse.text();
        const result = parseSSEResponse(resultText);
        return normalizeBCSResponse(result);
      } else {
        clearTimeout(timeoutId);
        return normalizeBCSResponse(submitResult);
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error(
          `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. The Hugging Face Space might be starting up - please try again.`,
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("BCS Prediction Error:", error);
    throw new Error(
      `Failed to get BCS prediction from Hugging Face model: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Extract first parseable `data:` payload from Gradio SSE text.
function parseSSEResponse(sseText: string): Record<string, unknown> {
  const lines = sseText.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.substring(6);
      try {
        const parsed = JSON.parse(jsonStr);
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

// Normalize different Gradio payload shapes to the BCS response contract.
function normalizeBCSResponse(
  result: Record<string, unknown> | string | unknown[] | unknown,
): BCSPredictionResponse {
  let bcsScore: number;
  let bcsCategory: string;

  let responseStr = "";

  let unwrappedResult = result;
  if (
    typeof result === "object" &&
    result !== null &&
    !Array.isArray(result) &&
    "data" in (result as Record<string, unknown>)
  ) {
    unwrappedResult = (result as Record<string, unknown>).data;
  }

  if (Array.isArray(unwrappedResult)) {
    if (typeof unwrappedResult[0] === "string") {
      responseStr = unwrappedResult[0];
    } else if (
      typeof unwrappedResult[0] === "object" &&
      unwrappedResult[0] !== null
    ) {
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
    } else if (
      Array.isArray(resultObj.data) &&
      typeof resultObj.data[0] === "string"
    ) {
      responseStr = resultObj.data[0];
    } else if (typeof resultObj.bcs_score === "number") {
      bcsScore = resultObj.bcs_score;
      bcsCategory = categorizeScore(bcsScore);
      return {
        bcs_score: Math.max(1, Math.min(9, bcsScore)),
        bcs_category: bcsCategory,
      };
    }
  }

  if (responseStr) {
    const match = responseStr.match(/BCS\):\s*(\d+)/i);
    if (match && match[1]) {
      bcsScore = parseInt(match[1], 10);
    } else {
      throw new Error(
        `Failed to extract BCS score from response: ${responseStr}`,
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
      `Invalid response format from BCS model. Received: ${JSON.stringify(result).substring(0, 100)}`,
    );
  }

  const normalizedScore = Math.max(1, Math.min(9, bcsScore));
  bcsCategory = categorizeScore(normalizedScore);

  return {
    bcs_score: normalizedScore,
    bcs_category: bcsCategory,
  };
}

// Map score bands to user-facing weight category.
function categorizeScore(score: number): string {
  const normalizedScore = Math.max(1, Math.min(9, score));

  if (normalizedScore <= 3) return "Underweight";
  if (normalizedScore <= 5) return "Ideal Weight";
  if (normalizedScore <= 7) return "Overweight";
  return "Obese";
}
