import type {
  DiseasePredictionInput,
  DiseasePredictionResult,
  SingleDiseasePrediction,
  DiseaseType,
  RiskLevel,
} from "@/types/disease-prediction";

// -----------------------------------------------------------------------------
// Section: Configuration
// -----------------------------------------------------------------------------
const MULTI_DISEASE_API_URL = process.env.NEXT_PUBLIC_MULTI_DISEASE_API_URL;

const API_REQUEST_TIMEOUT = 120000;

export class MultiDiseaseApiService {
  // ---------------------------------------------------------------------------
  // Section: Public API
  // ---------------------------------------------------------------------------

  private static getApiEndpoint(): string {
    if (!MULTI_DISEASE_API_URL) {
      throw new Error(
        "NEXT_PUBLIC_MULTI_DISEASE_API_URL is not configured. Set it in your environment variables.",
      );
    }
    return `${MULTI_DISEASE_API_URL}/gradio_api/call/predict_diseases`;
  }

  /**
   * Predict disease risks using the Gradio event-based API.
   */
  static async predictDiseases(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    try {
      const endpoint = this.getApiEndpoint();
      console.log(`Calling Gradio disease prediction API: ${endpoint}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_REQUEST_TIMEOUT,
      );

      try {
        const gradioData = {
          data: [
            input.age_years,
            input.breed_size,
            input.sex,
            input.is_neutered ? "Neutered" : "Intact",
            input.body_condition_score,
            input.pale_gums ? "Yes" : "No",
            input.skin_lesions ? "Yes" : "No",
            input.polyuria ? "Yes" : "No",
            this.mapTickPrevention(input.tick_prevention),
            input.heartworm_prevention ? "Yes" : "No",
            this.mapDietType(input.diet_type),
            input.exercise_level,
            this.mapEnvironment(input.environment),
          ],
        };

        const submitResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gradioData),
          signal: controller.signal,
        });

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text();
          console.error(
            `Gradio API submit error - Status: ${submitResponse.status}`,
          );
          throw new Error(
            `Failed to submit prediction: ${submitResponse.status} - ${errorText.substring(0, 200)}`,
          );
        }

        const submitResult = await submitResponse.json();
        const eventId = submitResult.event_id;

        if (!eventId) {
          throw new Error("No event_id received from Gradio API");
        }

        const resultResponse = await fetch(`${endpoint}/${eventId}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get prediction result: ${resultResponse.status}`,
          );
        }

        const resultText = await resultResponse.text();
        const htmlResponse = this.parseSSEResponse(resultText);
        return this.transformHtmlResponse(htmlResponse, input);
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(
            `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. The Hugging Face Space might be starting up - please try again.`,
          );
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error predicting diseases:", error);
      throw error;
    }
  }

  /**
   * Map tick prevention from UI enum to API enum.
   */
  private static mapTickPrevention(tickPrevention: string): string {
    return tickPrevention === "Regular" ? "Yes" : "No";
  }

  /**
   * Map diet type from UI enum to API enum.
   */
  private static mapDietType(dietType: string): string {
    const dietMap: Record<string, string> = {
      Commercial: "Commercial",
      Homemade: "Homemade",
      Mixed: "Mixed",
    };
    return dietMap[dietType] || "Commercial";
  }

  /**
   * Map environment from UI enum to API enum.
   */
  private static mapEnvironment(environment: string): string {
    const envMap: Record<string, string> = {
      Indoor: "Urban",
      Outdoor: "Rural",
      Mixed: "Suburban",
      Suburban: "Suburban",
      Rural: "Rural",
      Urban: "Urban",
    };
    return envMap[environment] || "Suburban";
  }

  /**
   * Extract the HTML payload from Gradio SSE response.
   */
  private static parseSSEResponse(sseText: string): string {
    const lines = sseText.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.substring(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return String(parsed[0]);
          }
          if (typeof parsed === "string") {
            return parsed;
          }
        } catch {
          continue;
        }
      }
    }
    throw new Error("No valid data found in SSE response");
  }

  /**
   * Parse disease risk details from returned HTML.
   */
  private static parseHtmlResponse(
    html: string,
  ): Record<string, { riskLevel: string; probability: number }> {
    const results: Record<string, { riskLevel: string; probability: number }> =
      {};

    const diseaseBlocks = html.split("<div style='margin: 15px 0;");

    for (const block of diseaseBlocks) {
      const nameMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/);
      if (!nameMatch) continue;

      const diseaseName = nameMatch[1].trim();

      const riskMatch = block.match(/>([A-Z]+ RISK)<\/span>/);
      const riskLevel = riskMatch ? riskMatch[1].replace(" RISK", "") : "LOW";

      const probMatch = block.match(
        /<strong>Probability:<\/strong>\s*([\d.]+)%/,
      );
      const probability = probMatch ? parseFloat(probMatch[1]) : 0;

      const keyMap: Record<string, string> = {
        "Tick Borne Disease": "Tick-Borne Disease",
        "Tick-Borne Disease": "Tick-Borne Disease",
        Filariasis: "Filariasis",
        "Diabetes Mellitus Type2": "Diabetes Mellitus Type 2",
        "Diabetes Mellitus Type 2": "Diabetes Mellitus Type 2",
        "Obesity Related Metabolic Dysfunction":
          "Obesity-Related Metabolic Dysfunction",
        "Obesity-Related Metabolic Dysfunction":
          "Obesity-Related Metabolic Dysfunction",
        Urolithiasis: "Urolithiasis",
      };

      const normalizedName = keyMap[diseaseName] || diseaseName;

      results[normalizedName] = {
        riskLevel: riskLevel.charAt(0) + riskLevel.slice(1).toLowerCase(),
        probability,
      };
    }

    return results;
  }

  /**
   * Convert parsed HTML content into domain output format.
   */
  private static transformHtmlResponse(
    htmlResponse: string,
    input: DiseasePredictionInput,
  ): DiseasePredictionResult {
    const predictions: SingleDiseasePrediction[] = [];
    let highestRiskDisease: DiseaseType | null = null;
    let highestProbability = 0;
    let hasRisk = false;

    const parsedData = this.parseHtmlResponse(htmlResponse);

    const diseases: DiseaseType[] = [
      "Tick-Borne Disease",
      "Filariasis",
      "Diabetes Mellitus Type 2",
      "Obesity-Related Metabolic Dysfunction",
      "Urolithiasis",
    ];

    for (const diseaseName of diseases) {
      const data = parsedData[diseaseName];

      if (data) {
        const riskLevel = data.riskLevel as RiskLevel;
        const probability = data.probability;

        const prediction: SingleDiseasePrediction = {
          disease: diseaseName,
          probability,
          risk_level: riskLevel,
          is_positive:
            riskLevel === "High" ||
            (riskLevel === "Moderate" && probability >= 50),
          key_indicators: this.getKeyIndicators(diseaseName, input),
        };

        predictions.push(prediction);

        if (prediction.is_positive) hasRisk = true;
        if (probability > highestProbability) {
          highestProbability = probability;
          highestRiskDisease = diseaseName;
        }
      }
    }

    const maxRisk = Math.max(...predictions.map((p) => p.probability), 0);
    const healthyProb = Math.max(5, 100 - maxRisk);
    predictions.push({
      disease: "Healthy",
      probability: healthyProb,
      risk_level:
        healthyProb >= 60 ? "Low" : healthyProb >= 30 ? "Moderate" : "High",
      is_positive: healthyProb >= 50,
      key_indicators: this.getKeyIndicators("Healthy", input),
    });

    if (predictions.length <= 1) {
      console.error("Failed to parse HTML response:", htmlResponse);
      throw new Error("Failed to parse disease predictions from API response");
    }

    const ageGroup = this.getAgeGroup(input.age_years);
    const weightStatus = this.getWeightStatus(input.body_condition_score);
    const riskFactorsCount = this.countRiskFactors(input);

    const recommendations = this.generateRecommendations(predictions, input);

    return {
      has_risk: hasRisk,
      highest_risk_disease: highestRiskDisease,
      predictions: predictions.sort((a, b) => b.probability - a.probability),
      recommendations,
      pet_profile: {
        age_group: ageGroup,
        weight_status: weightStatus,
        risk_factors_count: riskFactorsCount,
      },
      analyzed_at: new Date().toISOString(),
    };
  }

  /**
   * Build key indicators for each disease based on input signs.
   */
  private static getKeyIndicators(
    disease: DiseaseType,
    input: DiseasePredictionInput,
  ): string[] {
    const indicators: string[] = [];

    switch (disease) {
      case "Tick-Borne Disease":
        if (
          input.environment === "Rural" ||
          input.environment === "Suburban" ||
          input.environment === "Outdoor" ||
          input.environment === "Mixed"
        ) {
          indicators.push("Outdoor/Rural environment exposure");
        }
        if (
          input.tick_prevention === "None" ||
          input.tick_prevention === "Irregular"
        ) {
          indicators.push("Inadequate tick prevention");
        }
        if (input.skin_lesions) {
          indicators.push("Presence of skin lesions");
        }
        if (input.pale_gums) {
          indicators.push("Pale gums (possible anemia)");
        }
        break;

      case "Filariasis":
        if (!input.heartworm_prevention) {
          indicators.push("No heartworm prevention");
        }
        if (
          input.environment === "Rural" ||
          input.environment === "Suburban" ||
          input.environment === "Outdoor" ||
          input.environment === "Mixed"
        ) {
          indicators.push("Outdoor/Rural exposure");
        }
        if (input.pale_gums) {
          indicators.push("Pale gums");
        }
        break;

      case "Diabetes Mellitus Type 2":
        if (input.age_years >= 7) {
          indicators.push("Senior/geriatric age");
        }
        if (input.body_condition_score >= 7) {
          indicators.push("Overweight/obese");
        }
        if (input.polyuria) {
          indicators.push("Excessive urination");
        }
        if (input.exercise_level === "Low") {
          indicators.push("Low activity level");
        }
        break;

      case "Obesity-Related Metabolic Dysfunction":
        if (input.body_condition_score >= 6) {
          indicators.push("Above ideal body condition");
        }
        if (input.exercise_level === "Low") {
          indicators.push("Low exercise level");
        }
        if (input.diet_type === "Mixed" || input.diet_type === "Homemade") {
          indicators.push("Diet type consideration");
        }
        break;

      case "Urolithiasis":
        if (input.polyuria) {
          indicators.push("Urinary symptoms");
        }
        if (input.diet_type !== "Commercial") {
          indicators.push("Non-commercial diet");
        }
        if (input.sex === "Male") {
          indicators.push("Male sex (higher risk)");
        }
        break;

      case "Healthy":
        if (
          input.body_condition_score >= 4 &&
          input.body_condition_score <= 5
        ) {
          indicators.push("Ideal body condition");
        }
        if (input.tick_prevention === "Regular" && input.heartworm_prevention) {
          indicators.push("Good preventive care");
        }
        if (input.exercise_level !== "Low") {
          indicators.push("Active lifestyle");
        }
        break;
    }

    return indicators;
  }

  /**
   * Convert age in years to an age-group label.
   */
  private static getAgeGroup(
    age: number,
  ): "Puppy" | "Adult" | "Senior" | "Geriatric" {
    if (age <= 2) return "Puppy";
    if (age <= 7) return "Adult";
    if (age <= 11) return "Senior";
    return "Geriatric";
  }

  /**
   * Convert body condition score to weight status.
   */
  private static getWeightStatus(
    bcs: number,
  ): "Underweight" | "Ideal" | "Overweight" | "Obese" {
    if (bcs <= 3) return "Underweight";
    if (bcs <= 5) return "Ideal";
    if (bcs <= 7) return "Overweight";
    return "Obese";
  }

  /**
   * Count the number of present risk factors.
   */
  private static countRiskFactors(input: DiseasePredictionInput): number {
    let count = 0;

    if (input.age_years >= 8) count++;
    if (input.body_condition_score <= 3 || input.body_condition_score >= 7)
      count++;
    if (input.pale_gums) count++;
    if (input.skin_lesions) count++;
    if (input.polyuria) count++;
    if (input.tick_prevention !== "Regular") count++;
    if (!input.heartworm_prevention) count++;
    if (input.exercise_level === "Low") count++;
    if (input.environment === "Rural" || input.environment === "Outdoor")
      count++;

    return count;
  }

  /**
   * Generate actionable recommendations from risk predictions.
   */
  private static generateRecommendations(
    predictions: SingleDiseasePrediction[],
    input: DiseasePredictionInput,
  ): string[] {
    const recommendations: string[] = [];

    const highRiskDiseases = predictions.filter(
      (p) => p.risk_level === "High" && p.disease !== "Healthy",
    );

    if (highRiskDiseases.length > 0) {
      recommendations.push(
        "🏥 Schedule an immediate veterinary consultation for comprehensive examination",
      );
    }

    for (const prediction of predictions) {
      if (prediction.risk_level === "High" || prediction.is_positive) {
        switch (prediction.disease) {
          case "Tick-Borne Disease":
            recommendations.push(
              "🔬 Request tick-borne disease panel blood test",
            );
            if (input.tick_prevention !== "Regular") {
              recommendations.push(
                "🛡️ Start regular tick prevention treatment",
              );
            }
            break;
          case "Filariasis":
            recommendations.push("🔬 Request heartworm antigen test");
            if (!input.heartworm_prevention) {
              recommendations.push("💊 Begin heartworm prevention medication");
            }
            break;
          case "Diabetes Mellitus Type 2":
            recommendations.push(
              "🩸 Request blood glucose and fructosamine tests",
            );
            recommendations.push(
              "📊 Monitor water intake and urination patterns",
            );
            break;
          case "Obesity-Related Metabolic Dysfunction":
            recommendations.push("⚖️ Implement a weight management program");
            recommendations.push("🏃 Increase daily exercise gradually");
            break;
          case "Urolithiasis":
            recommendations.push("💧 Encourage increased water intake");
            recommendations.push("🔬 Request urinalysis and possibly imaging");
            break;
        }
      }
    }

    if (input.body_condition_score >= 6) {
      recommendations.push("🥗 Consider adjusting diet portions and quality");
    }

    if (input.exercise_level === "Low") {
      recommendations.push("🚶 Gradually increase daily physical activity");
    }

    if (input.age_years >= 7) {
      recommendations.push(
        "📅 Schedule more frequent senior wellness checkups",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Continue current preventive care routine");
      recommendations.push("📅 Maintain regular veterinary checkups");
      recommendations.push("🏃 Keep up the healthy lifestyle");
    }

    return [...new Set(recommendations)];
  }

  /**
   * Check API availability.
   */
  static async healthCheck(): Promise<{ status: string }> {
    try {
      if (!MULTI_DISEASE_API_URL) {
        throw new Error("NEXT_PUBLIC_MULTI_DISEASE_API_URL is not configured");
      }
      const response = await fetch(`${MULTI_DISEASE_API_URL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Multi-disease API health check failed:", error);
      return { status: "unhealthy" };
    }
  }

  /**
   * Simulate predictions for local development/testing.
   */
  static async mockPredict(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    return this.predictDiseases(input);
  }
}

export default MultiDiseaseApiService;
