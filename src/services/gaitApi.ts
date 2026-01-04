// src/services/gaitApi.ts
// Service for Dog Gait Analysis APIs (Hugging Face Spaces)

// API Base URLs
const LIMPING_API_URL =
  process.env.NEXT_PUBLIC_LIMPING_API_URL ||
  "https://ishara1234-dog-limping-detection.hf.space";
const DISEASE_API_URL =
  process.env.NEXT_PUBLIC_DISEASE_API_URL ||
  "https://ishara1234-dog-disease-risk-prediction.hf.space";

// Timeout configuration (in milliseconds)
const VIDEO_ANALYSIS_TIMEOUT = 600000; // 10 minutes for video processing
const API_REQUEST_TIMEOUT = 60000; // 1 minute for regular API calls

// ✅ FIXED: Match the actual Python API response structure
export interface LimpingDetectionResult {
  prediction: "Normal" | "Limping"; // ← Changed from "class"
  confidence: number;
  symmetry_indices: {
    SI_overall: number;
    SI_front: number;
    SI_back: number;
  };
  leg_status: {
    front_legs: string;
    back_legs: string;
  };
  stride_measurements: {
    left_front: number;
    right_front: number;
    left_back: number;
    right_back: number;
  };
  frames_analyzed: number;
  error?: string;
}

export interface DiseasePredictionInput {
  Limping_Detected: number;
  Age_Years: number;
  Weight_Category: "Light" | "Medium" | "Heavy";
  Pain_While_Walking: number;
  Difficulty_Standing: number;
  Reduced_Activity: number;
  Joint_Swelling: number;
}

export interface DiseasePredictionResult {
  predicted_disease: string;
  confidence: number;
  risk_level: "High" | "Medium" | "Low";
  symptom_score: number;
  pain_severity: number;
  recommendations: string[];
  disease_probabilities?: {
    "Hip Dysplasia": number;
    "Osteoarthritis": number;
    "IVDD": number;
    "Normal": number;
    "Patellar Luxation": number;
  };
  error?: string;
}

export class GaitApiService {
  /**
   * Detect limping from video
   * Sends video to Hugging Face limping detection API
   * Note: The limping API includes pose detection (best.pt model) built-in
   */
  static async detectLimping(videoFile: File): Promise<LimpingDetectionResult> {
    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      // Log request details for debugging
      console.log(
        `[Limping API] Sending request to: ${LIMPING_API_URL}/predict`,
      );
      console.log(
        `[Limping API] Video file: ${videoFile.name}, size: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB, type: ${videoFile.type}`,
      );

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        VIDEO_ANALYSIS_TIMEOUT,
      );

      try {
        const startTime = Date.now();
        const response = await fetch(`${LIMPING_API_URL}/predict`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        });
        const duration = Date.now() - startTime;
        console.log(
          `[Limping API] Response received in ${duration}ms, status: ${response.status}`,
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorText = "";
          let errorJson = null;

          try {
            // Try to parse as JSON first (FastAPI might return JSON error)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              errorJson = await response.json();
              errorText =
                errorJson.detail ||
                errorJson.error ||
                errorJson.message ||
                JSON.stringify(errorJson);
            } else {
              errorText = await response.text();
            }
          } catch (e) {
            errorText = `Failed to read error response: ${e}`;
          }

          console.error(
            `[Limping API] Error - Status: ${response.status}, URL: ${LIMPING_API_URL}/predict`,
          );
          console.error(
            `[Limping API] Error response: ${errorText.substring(0, 1000)}`,
          );
          if (errorJson) {
            console.error(
              `[Limping API] Full error JSON:`,
              JSON.stringify(errorJson, null, 2),
            );
          }

          // Provide more helpful error messages
          if (response.status === 500) {
            throw new Error(
              `API server error (500). The video processing may have failed. Details: ${errorText.substring(0, 500)}. Please try with a different video or check if the API is running properly.`,
            );
          }

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText.substring(0, 500)}`,
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          const responseText = await response.text();
          console.error(
            "Failed to parse JSON response:",
            responseText.substring(0, 500),
          );
          throw new Error(`Invalid JSON response from API: ${jsonError}`);
        }

        // ✅ Check for error object in response (API can return 200 with error object)
        if (data.error) {
          console.error("API returned error object:", data.error);
          throw new Error(`API error: ${data.error}`);
        }

        // ✅ Validate response structure
        if (!data.prediction || typeof data.confidence !== "number") {
          console.error(
            "Invalid response structure:",
            JSON.stringify(data, null, 2),
          );
          throw new Error(
            "Invalid response format from API - missing prediction or confidence",
          );
        }

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error(
            `Request timeout after ${VIDEO_ANALYSIS_TIMEOUT / 1000} seconds. The video might be too large or the API is taking too long to process.`,
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error detecting limping:", error);
      throw error;
    }
  }

  /**
   * Predict disease risk from health data
   * Sends health information to Hugging Face disease prediction API
   */
  static async predictDisease(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_REQUEST_TIMEOUT,
      );

      try {
        const response = await fetch(`${DISEASE_API_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Disease API error - Status: ${response.status}, URL: ${DISEASE_API_URL}/predict`,
          );

          if (response.status === 404) {
            throw new Error(
              `API endpoint not found (404). Please verify the Hugging Face Space URL is correct: ${DISEASE_API_URL}/predict`,
            );
          }

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText.substring(0, 500)}`,
          );
        }

        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error(
            `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. The API might be slow or unresponsive.`,
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error predicting disease:", error);
      throw error;
    }
  }

  /**
   * Health check for limping API
   */
  static async healthCheckLimping(): Promise<{ status: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${LIMPING_API_URL}/`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Limping API health check failed:", error);
      return { status: "unhealthy" };
    }
  }

  /**
   * Health check for disease API
   */
  static async healthCheckDisease(): Promise<{ status: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${DISEASE_API_URL}/`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Disease API health check failed:", error);
      return { status: "unhealthy" };
    }
  }
}

export default GaitApiService;
