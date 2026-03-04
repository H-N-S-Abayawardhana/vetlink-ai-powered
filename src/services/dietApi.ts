/**
 * Diet Recommendation API Service
 * Calls the Hugging Face Diet Recommendation Model
 */

export interface DietPredictionInput {
  age: number;
  weight_kg: number;
  body_condition_score: number;
  meals_per_day: number;
  breed: string;
  gender: string;
  neutered_status: string;
  activity_level: string;
  digestive_sensitivity: string;
  current_food_type: string;
}

export interface DietPredictionResponse {
  calorie_level: string | null;
  diet_type: string | null;
  food_category: string | null;
}

const HF_SPACE_URL =
  process.env.NEXT_PUBLIC_DIET_API_URL ||
  "https://maleesha29-diet-recommendation-model.hf.space";

const API_REQUEST_TIMEOUT = 120000;

const API_ENDPOINT_BASE = `${HF_SPACE_URL}/api/recommend_diet`;
const API_SUBMIT_ENDPOINT_ASYNC = `${HF_SPACE_URL}/gradio_api/call/recommend_diet`;
const API_GET_ENDPOINT_ASYNC = (eventId: string) =>
  `${HF_SPACE_URL}/gradio_api/call/recommend_diet/${eventId}`;

export async function predictDietRecommendation(
  input: DietPredictionInput,
): Promise<DietPredictionResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);

    try {
      const payload = {
        data: [
          input.age,
          input.weight_kg,
          input.body_condition_score,
          input.meals_per_day,
          input.breed,
          input.gender,
          input.neutered_status,
          input.activity_level,
          input.digestive_sensitivity,
          input.current_food_type,
        ],
      };

      let submitResponse = await fetch(API_ENDPOINT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

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
        throw new Error(
          `Failed to submit diet prediction: ${submitResponse.status} - ${errorText}`,
        );
      }

      const submitResult = await submitResponse.json();

      if (submitResult.event_id) {
        const eventId = submitResult.event_id;
        const resultResponse = await fetch(API_GET_ENDPOINT_ASYNC(eventId), {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get diet prediction result: ${resultResponse.status}`,
          );
        }

        const resultText = await resultResponse.text();
        const parsed = parseSSEResponse(resultText);
        return normalizeDietResponse(parsed);
      }

      clearTimeout(timeoutId);
      return normalizeDietResponse(submitResult);
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
    console.error("Diet Prediction Error:", error);
    throw new Error(
      `Failed to get diet recommendation from Hugging Face model: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function parseSSEResponse(sseText: string): unknown {
  const lines = sseText.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.substring(6);
      try {
        return JSON.parse(jsonStr);
      } catch {
        continue;
      }
    }
  }
  throw new Error("No valid data found in SSE response");
}

function normalizeDietResponse(result: unknown): DietPredictionResponse {
  let unwrapped: unknown = result;

  if (
    typeof unwrapped === "object" &&
    unwrapped !== null &&
    !Array.isArray(unwrapped) &&
    "data" in (unwrapped as Record<string, unknown>)
  ) {
    unwrapped = (unwrapped as Record<string, unknown>).data;
  }

  if (Array.isArray(unwrapped)) {
    if (typeof unwrapped[0] === "string") {
      return parseDietString(unwrapped[0]);
    }
    if (
      typeof unwrapped[0] === "object" &&
      unwrapped[0] !== null &&
      "data" in (unwrapped[0] as Record<string, unknown>)
    ) {
      const inner = (unwrapped[0] as Record<string, unknown>).data;
      if (typeof inner === "string") {
        return parseDietString(inner);
      }
      if (Array.isArray(inner) && typeof inner[0] === "string") {
        return parseDietString(inner[0]);
      }
    }
  }

  if (typeof unwrapped === "string") {
    return parseDietString(unwrapped);
  }

  if (typeof unwrapped === "object" && unwrapped !== null) {
    const obj = unwrapped as Record<string, unknown>;

    const calorie_level =
      (typeof obj.Calorie_Level === "string" && obj.Calorie_Level) ||
      (typeof obj.calorie_level === "string" && obj.calorie_level) ||
      (typeof obj.calorieLevel === "string" && obj.calorieLevel) ||
      null;

    const diet_type =
      (typeof obj.Diet_Type === "string" && obj.Diet_Type) ||
      (typeof obj.diet_type === "string" && obj.diet_type) ||
      (typeof obj.dietType === "string" && obj.dietType) ||
      null;

    const food_category =
      (typeof obj.Food_Category === "string" && obj.Food_Category) ||
      (typeof obj.food_category === "string" && obj.food_category) ||
      (typeof obj.foodCategory === "string" && obj.foodCategory) ||
      null;

    if (calorie_level || diet_type || food_category) {
      return { calorie_level, diet_type, food_category };
    }
  }

  throw new Error(
    `Invalid response format from diet model. Received: ${JSON.stringify(result).substring(0, 120)}`,
  );
}

function parseDietString(text: string): DietPredictionResponse {
  const calorieMatch = text.match(/Calorie\s*Level\s*:\s*(.+)/i);
  const dietMatch = text.match(/Diet\s*Type\s*:\s*(.+)/i);
  const foodMatch = text.match(/Food\s*Category\s*:\s*(.+)/i);

  return {
    calorie_level: calorieMatch?.[1]?.trim() || null,
    diet_type: dietMatch?.[1]?.trim() || null,
    food_category: foodMatch?.[1]?.trim() || null,
  };
}
