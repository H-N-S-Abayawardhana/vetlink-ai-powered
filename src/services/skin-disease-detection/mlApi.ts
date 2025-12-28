const API_BASE_URL =
  process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL ||
  "https://niwarthana-skin-disease-detection-of-dogs.hf.space";

export interface ParsedDisease {
  disease: string;
  severity: "mild" | "severe" | null;
  fullName: string;
}

export interface PredictionResult {
  success: boolean;
  valid?: boolean;
  similarity?: number;
  threshold?: number;
  reason?: string;
  prediction?: {
    disease: string;
    confidence: number;
    all_probabilities: Record<string, number>;
    parsed?: ParsedDisease;
  };
  model_type?: string;
}

/**
 * Parse disease name to extract disease type and severity
 */
export function parseDiseaseName(fullName: string): ParsedDisease {
  // Handle healthy case (no severity)
  if (fullName.toLowerCase() === "healthy") {
    return {
      disease: "Healthy",
      severity: null,
      fullName: fullName,
    };
  }

  // Split by "/" to separate disease and severity
  const parts = fullName.split("/");

  if (parts.length === 2) {
    const diseasePart = parts[0];
    const severityPart = parts[1].toLowerCase();

    // Format disease name (replace underscores with spaces, capitalize)
    const disease = diseasePart
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Validate severity
    const severity =
      severityPart === "mild" || severityPart === "severe"
        ? (severityPart as "mild" | "severe")
        : null;

    return {
      disease,
      severity,
      fullName: fullName,
    };
  }

  // Fallback: treat as disease name without severity
  const disease = fullName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    disease,
    severity: null,
    fullName: fullName,
  };
}

export interface HealthCheckResult {
  status: string;
  model_loaded: boolean;
  device: string;
  num_classes: number;
  classes: string[];
  model_type?: string;
  error?: string;
}

export class MLApiService {
  /**
   * Upload and predict from file
   * Uses the new FastAPI endpoint
   */
  static async predictFromFile(file: File): Promise<PredictionResult> {
    try {
      const formData = new FormData();
      formData.append("file", file); // FastAPI expects "file" parameter

      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try text
          try {
            const errorText = await response.text();
            if (errorText && errorText.length < 200) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Parse disease and severity if prediction exists
      if (data.prediction?.disease) {
        data.prediction.parsed = parseDiseaseName(data.prediction.disease);
      }

      // Ensure success flag is set
      if (data.success === undefined) {
        data.success = true;
      }

      return data;
    } catch (error) {
      console.error("Error predicting from file:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }

  /**
   * Predict from base64 image (useful for camera capture)
   * Converts base64 to File and uses the same API endpoint
   */
  static async predictFromBase64(
    base64Image: string,
  ): Promise<PredictionResult> {
    try {
      // Convert base64 to File
      const base64Data = base64Image.startsWith("data:")
        ? base64Image.split(",")[1]
        : base64Image;

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      // Use the same API endpoint
      return this.predictFromFile(file);
    } catch (error) {
      console.error("Error predicting from base64:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }

  /**
   * Check if API is healthy
   * Uses the new FastAPI /health endpoint
   */
  static async healthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map FastAPI response to our interface
      return {
        status: data.status || "healthy",
        model_loaded: data.model_loaded !== false,
        device: data.device || "unknown",
        num_classes: data.num_classes || 9,
        classes: data.classes || [],
        model_type: data.model_type || "dinov2",
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "unhealthy",
        model_loaded: false,
        device: "unknown",
        num_classes: 0,
        classes: [],
        model_type: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default MLApiService;
