const API_BASE_URL =
  process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL ||
  "https://niwarthana-skin-disease-detection-of-dogs.hf.space";

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
  };
  model_type?: string;
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
   */
  static async predictFromFile(file: File): Promise<PredictionResult> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/predict/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error predicting from file:", error);
      throw error;
    }
  }

  /**
   * Predict from base64 image (useful for camera capture)
   */
  static async predictFromBase64(
    base64Image: string,
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict-base64/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error predicting from base64:", error);
      throw error;
    }
  }

  /**
   * Check if API is healthy
   */
  static async healthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
