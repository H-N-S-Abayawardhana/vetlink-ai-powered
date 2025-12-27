import type {
  DiseasePredictionInput,
  DiseasePredictionResult,
  SingleDiseasePrediction,
  DiseaseType,
  RiskLevel,
} from "@/types/disease-prediction";

// API Base URL - Hugging Face Space for disease risk prediction
const MULTI_DISEASE_API_URL = process.env.NEXT_PUBLIC_MULTI_DISEASE_API_URL || 'https://maleesha29-diseaseriskprediction.hf.space';

// Timeout configuration
const API_REQUEST_TIMEOUT = 120000; // 2 minutes for Gradio cold start

// Disease list for iteration
const DISEASES: DiseaseType[] = [
  "Tick-Borne Disease",
  "Filariasis",
  "Diabetes Mellitus Type 2",
  "Obesity-Related Metabolic Dysfunction",
  "Urolithiasis",
  "Healthy",
];

export class MultiDiseaseApiService {
  /**
   * Predict disease risks from health data
   * Sends health information to the Gradio-based multi-disease prediction API
   */
  static async predictDiseases(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    try {
      console.log(`Calling Gradio disease prediction API: ${MULTI_DISEASE_API_URL}/gradio_api/call/predict_diseases`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_REQUEST_TIMEOUT,
      );

      try {
        // Transform input to Gradio API format with correct parameter names
        // Parameters: Age, Breed_Size, Sex, Neutered_Status, Body_Condition_Score,
        // Pale_Gums, Skin_Lesions, Polyuria, Tick_Prevention, Heartworm_Prevention,
        // Diet_Type, Exercise_Level, Environment
        const gradioData = {
          data: [
            input.age_years,                                    // Age (number)
            input.breed_size,                                   // Breed_Size (Small/Medium/Large)
            input.sex,                                          // Sex (Male/Female)
            input.is_neutered ? 'Neutered' : 'Intact',          // Neutered_Status (Neutered/Intact)
            input.body_condition_score,                         // Body_Condition_Score (number)
            input.pale_gums ? 'Yes' : 'No',                     // Pale_Gums (Yes/No)
            input.skin_lesions ? 'Yes' : 'No',                  // Skin_Lesions (Yes/No)
            input.polyuria ? 'Yes' : 'No',                      // Polyuria (Yes/No)
            this.mapTickPrevention(input.tick_prevention),      // Tick_Prevention (Yes/No)
            input.heartworm_prevention ? 'Yes' : 'No',          // Heartworm_Prevention (Yes/No)
            this.mapDietType(input.diet_type),                  // Diet_Type (Commercial/Homemade)
            input.exercise_level,                               // Exercise_Level (Low/Moderate/High)
            this.mapEnvironment(input.environment),             // Environment (Suburban/Rural/Urban)
          ],
        };

        // Step 1: Submit the prediction request
        const submitResponse = await fetch(`${MULTI_DISEASE_API_URL}/gradio_api/call/predict_diseases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

        // Step 2: Get the result using Server-Sent Events (SSE)
        const resultResponse = await fetch(`${MULTI_DISEASE_API_URL}/gradio_api/call/predict_diseases/${eventId}`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get prediction result: ${resultResponse.status}`,
          );
        }

        // Parse SSE response - returns HTML string
        const resultText = await resultResponse.text();
        const htmlResponse = this.parseSSEResponse(resultText);

        // Parse HTML and transform to our format
        return this.transformHtmlResponse(htmlResponse, input);
      } catch (fetchError: unknown) {      // ...existing code...
              // Step 1: Submit the prediction request
              const submitResponse = await fetch(`${MULTI_DISEASE_API_URL}/gradio_api/call/predict_diseases`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(AudioData),
                signal: controller.signal,
              });
      // ...existing code...
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(
            `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. The Hugging Face Space might be starting up - please try again.`,
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error predicting diseases:", error);
      throw error;
    }
  }

  /**
   * Map tick prevention from frontend format to API format
   * New API uses Yes/No instead of None/Irregular/Regular
   */
  private static mapTickPrevention(tickPrevention: string): string {
    // Regular tick prevention = Yes, None/Irregular = No
    return tickPrevention === 'Regular' ? 'Yes' : 'No';
  }

  /**
   * Map diet type from frontend format to API format
   */
  private static mapDietType(dietType: string): string {
    // API accepts: Commercial, Homemade, Mixed, Raw
    const dietMap: Record<string, string> = {
      'Commercial': 'Commercial',
      'Homemade': 'Homemade',
      'Raw': 'Raw',
      'Mixed': 'Mixed',
    };
    return dietMap[dietType] || "Commercial";
  }

  /**
   * Map environment from frontend format to API format
   * New API uses Suburban/Rural/Urban instead of Indoor/Outdoor/Mixed
   */
  private static mapEnvironment(environment: string): string {
    const envMap: Record<string, string> = {
      'Indoor': 'Urban',
      'Outdoor': 'Rural',
      'Mixed': 'Suburban',
      // Direct mappings if already using new format
      'Suburban': 'Suburban',
      'Rural': 'Rural',
      'Urban': 'Urban',
    };
    return envMap[environment] || 'Suburban';
  }

  /**
   * Parse Server-Sent Events (SSE) response from Gradio
   * Returns the HTML string from the response
   */
  private static parseSSEResponse(sseText: string): string {
    const lines = sseText.split('\n');
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.substring(6);
        try {
          const parsed = JSON.parse(jsonStr);
          // The new API returns an array with a single HTML string
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0] as string;
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
   * Parse HTML response from the new API and extract disease predictions
   */
  private static parseHtmlResponse(html: string): Record<string, { riskLevel: string; probability: number }> {
    const results: Record<string, { riskLevel: string; probability: number }> = {};
    
    // Extract disease blocks from HTML
    // Pattern: <h3...>Disease Name</h3>...<span...>RISK LEVEL</span>...<strong>Probability:</strong> XX.X%
    const diseaseBlocks = html.split('<div style=\'margin: 15px 0;');
    
    for (const block of diseaseBlocks) {
      // Extract disease name
      const nameMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/);
      if (!nameMatch) continue;
      
      const diseaseName = nameMatch[1].trim();
      
      // Extract risk level
      const riskMatch = block.match(/>([A-Z]+ RISK)<\/span>/);
      const riskLevel = riskMatch ? riskMatch[1].replace(' RISK', '') : 'LOW';
      
      // Extract probability
      const probMatch = block.match(/<strong>Probability:<\/strong>\s*([\d.]+)%/);
      const probability = probMatch ? parseFloat(probMatch[1]) : 0;
      
      // Map disease names to our keys
      const keyMap: Record<string, string> = {
        'Tick Borne Disease': 'Tick-Borne Disease',
        'Tick-Borne Disease': 'Tick-Borne Disease',
        'Filariasis': 'Filariasis',
        'Diabetes Mellitus Type2': 'Diabetes Mellitus Type 2',
        'Diabetes Mellitus Type 2': 'Diabetes Mellitus Type 2',
        'Obesity Related Metabolic Dysfunction': 'Obesity-Related Metabolic Dysfunction',
        'Obesity-Related Metabolic Dysfunction': 'Obesity-Related Metabolic Dysfunction',
        'Urolithiasis': 'Urolithiasis',
      };
      
      const normalizedName = keyMap[diseaseName] || diseaseName;
      
      results[normalizedName] = {
        riskLevel: riskLevel.charAt(0) + riskLevel.slice(1).toLowerCase(), // "LOW" -> "Low"
        probability,
      };
    }
    
    return results;
  }

  /**
   * Transform HTML response from new API to our internal format
   */
  private static transformHtmlResponse(
    htmlResponse: string,
    input: DiseasePredictionInput
  ): DiseasePredictionResult {
    const predictions: SingleDiseasePrediction[] = [];
    let highestRiskDisease: DiseaseType | null = null;
    let highestProbability = 0;
    let hasRisk = false;

    // Parse HTML to extract disease data
    const parsedData = this.parseHtmlResponse(htmlResponse);

    // All disease types we expect
    const diseases: DiseaseType[] = [
      'Tick-Borne Disease',
      'Filariasis',
      'Diabetes Mellitus Type 2',
      'Obesity-Related Metabolic Dysfunction',
      'Urolithiasis',
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
          is_positive: riskLevel === 'High' || (riskLevel === 'Moderate' && probability >= 50),
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

    // Add Healthy status based on overall risk
    const maxRisk = Math.max(...predictions.map(p => p.probability), 0);
    const healthyProb = Math.max(5, 100 - maxRisk);
    predictions.push({
      disease: 'Healthy',
      probability: healthyProb,
      risk_level: healthyProb >= 60 ? 'Low' : healthyProb >= 30 ? 'Moderate' : 'High',
      is_positive: healthyProb >= 50,
      key_indicators: this.getKeyIndicators('Healthy', input),
    });

    // If no predictions were parsed, throw an error
    if (predictions.length <= 1) {
      console.error('Failed to parse HTML response:', htmlResponse);
      throw new Error('Failed to parse disease predictions from API response');
    }

    // Calculate pet profile
    const ageGroup = this.getAgeGroup(input.age_years);
    const weightStatus = this.getWeightStatus(input.body_condition_score);
    const riskFactorsCount = this.countRiskFactors(input);

    // Generate recommendations
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
   * Transform Gradio API response to our internal format (legacy)
   */
  private static transformGradioResponse(
    apiResponse: Record<string, unknown>,
    input: DiseasePredictionInput,
  ): DiseasePredictionResult {
    const predictions: SingleDiseasePrediction[] = [];
    let highestRiskDisease: DiseaseType | null = null;
    let highestProbability = 0;
    let hasRisk = false;

    // Map API response keys to our disease names
    const keyToDiseaseMap: Record<string, DiseaseType> = {
      Tick_Borne_Disease: "Tick-Borne Disease",
      Filariasis: "Filariasis",
      Diabetes_Mellitus_Type2: "Diabetes Mellitus Type 2",
      Obesity_Related_Metabolic_Dysfunction:
        "Obesity-Related Metabolic Dysfunction",
      Urolithiasis: "Urolithiasis",
      Healthy: "Healthy",
    };

    // Parse API response - format: "Low Risk (5.94%)" or "High Risk (69.20%)"
    for (const [apiKey, diseaseName] of Object.entries(keyToDiseaseMap)) {
      const rawValue = apiResponse[apiKey];

      if (typeof rawValue === "string") {
        // Parse format: "Low Risk (5.94%)" -> { riskLevel: "Low", probability: 5.94 }
        const parsed = this.parseRiskString(rawValue);

        const prediction: SingleDiseasePrediction = {
          disease: diseaseName,
          probability: parsed.probability,
          risk_level: parsed.riskLevel,
          is_positive:
            parsed.riskLevel === "High" ||
            (parsed.riskLevel === "Moderate" && parsed.probability >= 50),
          key_indicators: this.getKeyIndicators(diseaseName, input),
        };

        predictions.push(prediction);

        if (diseaseName !== "Healthy") {
          if (prediction.is_positive) hasRisk = true;
          if (parsed.probability > highestProbability) {
            highestProbability = parsed.probability;
            highestRiskDisease = diseaseName;
          }
        }
      }
    }

    // If no predictions were parsed, throw an error
    if (predictions.length === 0) {
      console.error("Failed to parse API response:", apiResponse);
      throw new Error("Failed to parse disease predictions from API response");
    }

    // Calculate pet profile
    const ageGroup = this.getAgeGroup(input.age_years);
    const weightStatus = this.getWeightStatus(input.body_condition_score);
    const riskFactorsCount = this.countRiskFactors(input);

    // Generate recommendations
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
   * Parse risk string from API response
   * Format: "Low Risk (5.94%)" or "High Risk (69.20%)"
   */
  private static parseRiskString(riskString: string): {
    riskLevel: RiskLevel;
    probability: number;
  } {
    // Extract risk level
    let riskLevel: RiskLevel = "Low";
    if (riskString.includes("High")) {
      riskLevel = "High";
    } else if (riskString.includes("Moderate")) {
      riskLevel = "Moderate";
    }

    // Extract probability - match pattern like (5.94%) or (69.20%)
    const percentMatch = riskString.match(/\((\d+\.?\d*)%\)/);
    const probability = percentMatch ? parseFloat(percentMatch[1]) : 0;

    return { riskLevel, probability };
  } /**
   * Transform API response to our internal format
   */
  private static transformApiResponse(
    apiResponse: Record<string, unknown>,
    input: DiseasePredictionInput,
  ): DiseasePredictionResult {
    // Extract predictions from API response
    // Expected API response format:
    // {
    //   tick_borne_disease: { probability: 0.75, risk_level: "High", positive: true },
    //   filariasis: { probability: 0.25, risk_level: "Low", positive: false },
    //   ...
    // }

    const predictions: SingleDiseasePrediction[] = [];
    let highestRiskDisease: DiseaseType | null = null;
    let highestProbability = 0;
    let hasRisk = false;

    // Map API response keys to disease names
    const keyToDiseaseMap: Record<string, DiseaseType> = {
      tick_borne_disease: "Tick-Borne Disease",
      filariasis: "Filariasis",
      diabetes_mellitus_type_2: "Diabetes Mellitus Type 2",
      obesity_related_metabolic_dysfunction:
        "Obesity-Related Metabolic Dysfunction",
      urolithiasis: "Urolithiasis",
      healthy: "Healthy",
    };

    for (const [key, diseaseName] of Object.entries(keyToDiseaseMap)) {
      const diseaseData = apiResponse[key] as
        | {
            probability: number;
            risk_level: RiskLevel;
            positive: boolean;
            key_indicators?: string[];
          }
        | undefined;

      if (diseaseData) {
        const prediction: SingleDiseasePrediction = {
          disease: diseaseName,
          probability: diseaseData.probability * 100, // Convert to percentage
          risk_level: diseaseData.risk_level,
          is_positive: diseaseData.positive,
          key_indicators:
            diseaseData.key_indicators ||
            this.getKeyIndicators(diseaseName, input),
        };

        predictions.push(prediction);

        if (diseaseName !== "Healthy") {
          if (prediction.is_positive) {
            hasRisk = true;
          }

          if (prediction.probability > highestProbability) {
            highestProbability = prediction.probability;
            highestRiskDisease = diseaseName;
          }
        }
      }
    }

    // Calculate pet profile
    const ageGroup = this.getAgeGroup(input.age_years);
    const weightStatus = this.getWeightStatus(input.body_condition_score);
    const riskFactorsCount = this.countRiskFactors(input);

    // Generate recommendations
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
   * Get key indicators for a disease based on input
   */
  private static getKeyIndicators(
    disease: DiseaseType,
    input: DiseasePredictionInput,
  ): string[] {
    const indicators: string[] = [];

    switch (disease) {
      case 'Tick-Borne Disease':
        if (input.environment === 'Rural' || input.environment === 'Suburban' || input.environment === 'Outdoor' || input.environment === 'Mixed') {
          indicators.push('Outdoor/Rural environment exposure');
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
        if (input.environment === 'Rural' || input.environment === 'Suburban' || input.environment === 'Outdoor' || input.environment === 'Mixed') {
          indicators.push('Outdoor/Rural exposure');
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
   * Get age group from years
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
   * Get weight status from BCS
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
   * Count risk factors
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
    if (input.exercise_level === 'Low') count++;
    if (input.environment === 'Rural' || input.environment === 'Outdoor') count++;
    
    return count;
  }

  /**
   * Generate recommendations based on predictions
   */
  private static generateRecommendations(
    predictions: SingleDiseasePrediction[],
    input: DiseasePredictionInput,
  ): string[] {
    const recommendations: string[] = [];

    // High-risk disease recommendations
    const highRiskDiseases = predictions.filter(
      (p) => p.risk_level === "High" && p.disease !== "Healthy",
    );

    if (highRiskDiseases.length > 0) {
      recommendations.push(
        "🏥 Schedule an immediate veterinary consultation for comprehensive examination",
      );
    }

    // Specific disease recommendations
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

    // General recommendations
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

    // If no specific concerns
    if (recommendations.length === 0) {
      recommendations.push("✅ Continue current preventive care routine");
      recommendations.push("📅 Maintain regular veterinary checkups");
      recommendations.push("🏃 Keep up the healthy lifestyle");
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Health check for multi-disease API
   */
  static async healthCheck(): Promise<{ status: string }> {
    try {
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
   * Mock prediction for development/testing
   * Simulates the multi-disease prediction locally
   */
  static async mockPredict(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const predictions: SingleDiseasePrediction[] = [];

    // Calculate Tick-Borne Disease risk
    let tickRisk = 10;
    if (input.environment === 'Rural' || input.environment === 'Outdoor') tickRisk += 30;
    if (input.environment === 'Suburban' || input.environment === 'Mixed') tickRisk += 15;
    if (input.tick_prevention === 'None') tickRisk += 35;
    if (input.tick_prevention === 'Irregular') tickRisk += 20;
    if (input.skin_lesions) tickRisk += 15;
    if (input.pale_gums) tickRisk += 10;
    tickRisk = Math.min(tickRisk, 95);
    predictions.push({
      disease: "Tick-Borne Disease",
      probability: tickRisk,
      risk_level: tickRisk >= 60 ? "High" : tickRisk >= 30 ? "Moderate" : "Low",
      is_positive: tickRisk >= 50,
      key_indicators: this.getKeyIndicators("Tick-Borne Disease", input),
    });

    // Calculate Filariasis risk
    let filariaRisk = 10;
    if (!input.heartworm_prevention) filariaRisk += 40;
    if (input.environment === 'Rural' || input.environment === 'Outdoor') filariaRisk += 20;
    if (input.environment === 'Suburban' || input.environment === 'Mixed') filariaRisk += 10;
    if (input.pale_gums) filariaRisk += 15;
    filariaRisk = Math.min(filariaRisk, 95);
    predictions.push({
      disease: "Filariasis",
      probability: filariaRisk,
      risk_level:
        filariaRisk >= 60 ? "High" : filariaRisk >= 30 ? "Moderate" : "Low",
      is_positive: filariaRisk >= 50,
      key_indicators: this.getKeyIndicators("Filariasis", input),
    });

    // Calculate Diabetes risk
    let diabetesRisk = 5;
    if (input.age_years >= 10) diabetesRisk += 25;
    else if (input.age_years >= 7) diabetesRisk += 15;
    if (input.body_condition_score >= 8) diabetesRisk += 30;
    else if (input.body_condition_score >= 7) diabetesRisk += 20;
    if (input.polyuria) diabetesRisk += 25;
    if (input.exercise_level === "Low") diabetesRisk += 10;
    diabetesRisk = Math.min(diabetesRisk, 95);
    predictions.push({
      disease: "Diabetes Mellitus Type 2",
      probability: diabetesRisk,
      risk_level:
        diabetesRisk >= 60 ? "High" : diabetesRisk >= 30 ? "Moderate" : "Low",
      is_positive: diabetesRisk >= 50,
      key_indicators: this.getKeyIndicators("Diabetes Mellitus Type 2", input),
    });

    // Calculate Obesity-Related Metabolic Dysfunction risk
    let obesityRisk = 5;
    if (input.body_condition_score >= 9) obesityRisk += 45;
    else if (input.body_condition_score >= 8) obesityRisk += 35;
    else if (input.body_condition_score >= 7) obesityRisk += 25;
    else if (input.body_condition_score >= 6) obesityRisk += 15;
    if (input.exercise_level === "Low") obesityRisk += 15;
    if (input.age_years >= 7) obesityRisk += 10;
    obesityRisk = Math.min(obesityRisk, 95);
    predictions.push({
      disease: "Obesity-Related Metabolic Dysfunction",
      probability: obesityRisk,
      risk_level:
        obesityRisk >= 60 ? "High" : obesityRisk >= 30 ? "Moderate" : "Low",
      is_positive: obesityRisk >= 50,
      key_indicators: this.getKeyIndicators(
        "Obesity-Related Metabolic Dysfunction",
        input,
      ),
    });

    // Calculate Urolithiasis risk
    let uroRisk = 8;
    if (input.polyuria) uroRisk += 25;
    if (input.sex === "Male") uroRisk += 15;
    if (input.diet_type !== "Commercial") uroRisk += 10;
    if (!input.is_neutered) uroRisk += 10;
    uroRisk = Math.min(uroRisk, 95);
    predictions.push({
      disease: "Urolithiasis",
      probability: uroRisk,
      risk_level: uroRisk >= 60 ? "High" : uroRisk >= 30 ? "Moderate" : "Low",
      is_positive: uroRisk >= 50,
      key_indicators: this.getKeyIndicators("Urolithiasis", input),
    });

    // Calculate Healthy probability (inverse of highest risk)
    const maxRisk = Math.max(...predictions.map((p) => p.probability));
    const healthyProb = Math.max(5, 100 - maxRisk);
    predictions.push({
      disease: "Healthy",
      probability: healthyProb,
      risk_level:
        healthyProb >= 60 ? "Low" : healthyProb >= 30 ? "Moderate" : "High",
      is_positive: healthyProb >= 50,
      key_indicators: this.getKeyIndicators("Healthy", input),
    });

    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);

    const hasRisk = predictions.some(
      (p) => p.is_positive && p.disease !== "Healthy",
    );
    const highestRiskDisease =
      predictions.find((p) => p.disease !== "Healthy")?.disease || null;

    return {
      has_risk: hasRisk,
      highest_risk_disease: highestRiskDisease,
      predictions,
      recommendations: this.generateRecommendations(predictions, input),
      pet_profile: {
        age_group: this.getAgeGroup(input.age_years),
        weight_status: this.getWeightStatus(input.body_condition_score),
        risk_factors_count: this.countRiskFactors(input),
      },
      analyzed_at: new Date().toISOString(),
    };
  }
}

export default MultiDiseaseApiService;
