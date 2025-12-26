// src/services/gaitApi.ts
// Service for Dog Gait Analysis APIs (Hugging Face Spaces)

// API Base URLs - Update these with your Hugging Face Space URLs
// For FastAPI apps on Hugging Face Spaces, use the direct Space URL
// Format: https://{username}-{space-name}.hf.space
// Example: https://ishara1234-dog-limping-detection.hf.space
const POSE_API_URL =
  process.env.NEXT_PUBLIC_POSE_API_URL ||
  "https://ishara1234-dog-pose-detection.hf.space";
const LIMPING_API_URL =
  process.env.NEXT_PUBLIC_LIMPING_API_URL ||
  "https://ishara1234-dog-limping-detection.hf.space";
const DISEASE_API_URL =
  process.env.NEXT_PUBLIC_DISEASE_API_URL ||
  "https://ishara1234-dog-disease-risk-prediction.hf.space";

// Timeout configuration (in milliseconds)
const VIDEO_ANALYSIS_TIMEOUT = 600000; // 10 minutes for video processing
const API_REQUEST_TIMEOUT = 60000; // 1 minute for regular API calls

export interface LimpingDetectionResult {
  class: "Normal" | "Limping";
  confidence: number;
  SI_front: number;
  SI_back: number;
  SI_overall: number;
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
  error?: string;
}

export interface PoseDetectionResult {
  annotated_image?: string; // Base64 encoded image (for image input)
  annotated_video?: string; // Video URL (for video input)
  keypoints_info?: string; // Text description of detected keypoints
  frame_count?: number;
  status?: string;
  error?: string;
}

export interface PoseKeypoint {
  index: number;
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export class GaitApiService {
  /**
   * Detect pose from image (Gradio API)
   * Sends image to Hugging Face pose detection API
   * Note: Gradio apps use /api/predict/ endpoint
   */
  static async detectPoseFromImage(
    imageFile: File,
  ): Promise<PoseDetectionResult> {
    try {
      console.log(
        `Calling pose detection API (image): ${POSE_API_URL}/api/predict/`,
      );

      // Convert file to base64 for Gradio API
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix if present
          const base64Data = result.includes(",")
            ? result.split(",")[1]
            : result;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Gradio API format for image input
      const response = await fetch(`${POSE_API_URL}/api/predict/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            `data:image/${imageFile.type.split("/")[1]};base64,${base64}`, // Gradio expects data URL format
          ],
          fn_index: 0, // Image detection function index
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pose detection API error - Status: ${response.status}`);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText.substring(0, 500)}`,
        );
      }

      const data = await response.json();

      // Gradio returns { data: [output1, output2] }
      if (data.data && data.data.length >= 2) {
        return {
          annotated_image: data.data[0], // Base64 encoded annotated image
          keypoints_info: data.data[1], // Text description
        };
      }

      return data;
    } catch (error) {
      console.error("Error detecting pose from image:", error);
      throw error;
    }
  }

  /**
   * Detect pose from video (Gradio API)
   * Sends video to Hugging Face pose detection API
   */
  static async detectPoseFromVideo(
    videoFile: File,
  ): Promise<PoseDetectionResult> {
    try {
      console.log(
        `Calling pose detection API (video): ${POSE_API_URL}/api/predict/`,
      );

      // For Gradio video API, we need to upload the file first or use base64
      // Since Gradio handles file uploads, we'll use FormData approach
      const formData = new FormData();
      formData.append("video", videoFile);

      // For Gradio video API, we need to use the Gradio API format
      // First, convert video to base64 or use file upload endpoint
      // Note: Gradio video API typically expects base64 encoded data URL
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result); // Keep as data URL for Gradio
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        VIDEO_ANALYSIS_TIMEOUT,
      );

      try {
        // Gradio API format for video input (fn_index: 1 for video tab)
        const response = await fetch(`${POSE_API_URL}/api/predict/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: [base64], // Gradio expects data URL format
            fn_index: 1, // Video detection function index (second tab)
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Pose detection API error - Status: ${response.status}`,
          );
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText.substring(0, 500)}`,
          );
        }

        const data = await response.json();

        // Gradio returns { data: [output_video, status_text] }
        if (data.data && data.data.length >= 2) {
          return {
            annotated_video: data.data[0], // Video URL or path
            status: data.data[1], // Status message
            frame_count: data.data[1]?.match(/\d+/)?.[0]
              ? parseInt(data.data[1].match(/\d+/)?.[0] || "0")
              : undefined,
          };
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
      console.error("Error detecting pose from video:", error);
      throw error;
    }
  }

  /**
   * Detect limping from video
   * Sends video to Hugging Face limping detection API
   */
  static async detectLimping(videoFile: File): Promise<LimpingDetectionResult> {
    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      console.log(`Calling limping API: ${LIMPING_API_URL}/predict`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        VIDEO_ANALYSIS_TIMEOUT,
      );

      try {
        const response = await fetch(`${LIMPING_API_URL}/predict`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Limping API error - Status: ${response.status}, URL: ${LIMPING_API_URL}/predict`,
          );
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
      console.log(`Calling disease API: ${DISEASE_API_URL}/predict`);

      // Create AbortController for timeout
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

          // Provide helpful error message for 404
          if (response.status === 404) {
            throw new Error(
              `API endpoint not found (404). Please verify the Hugging Face Space URL is correct: ${DISEASE_API_URL}/predict. Make sure the Space is running and the endpoint path is correct.`,
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
      const response = await fetch(`${LIMPING_API_URL}/`);
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
      const response = await fetch(`${DISEASE_API_URL}/`);
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

  /**
   * Health check for pose detection API (Gradio)
   */
  static async healthCheckPose(): Promise<{ status: string }> {
    try {
      // Gradio apps don't have a simple health endpoint
      // We can check if the Space is accessible
      const response = await fetch(`${POSE_API_URL}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { status: "healthy" };
    } catch (error) {
      console.error("Pose detection API health check failed:", error);
      return { status: "unhealthy" };
    }
  }
}

export default GaitApiService;
