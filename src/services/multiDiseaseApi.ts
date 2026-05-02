import type {
  DiseasePredictionInput,
  DiseasePredictionResult,
  SingleDiseasePrediction,
  DiseaseType,
  RiskLevel,
} from "@/types/disease-prediction";

const DEFAULT_METABOLIC_RISK_API_URL =
  "https://maleesha29-diseaseriskprediction.hf.space";

const METABOLIC_RISK_API_URL =
  process.env.METABOLIC_RISK_API_URL ??
  process.env.NEXT_PUBLIC_METABOLIC_RISK_API_URL ??
  DEFAULT_METABOLIC_RISK_API_URL;

const API_REQUEST_TIMEOUT = 120000;

type ModelLabelResult = { risk?: number | boolean; probability?: number };

function normalizeProbability(probability: number | undefined): number {
  if (probability === undefined || Number.isNaN(probability)) return 0;
  if (probability > 1) return Math.max(0, Math.min(100, probability));
  return Math.max(0, Math.min(100, probability * 100));
}

function normalizeRisk(risk: ModelLabelResult["risk"], probPct: number): 0 | 1 {
  if (risk === true) return 1;
  if (risk === false) return 0;
  if (typeof risk === "number") return risk >= 1 ? 1 : 0;
  return probPct >= 50 ? 1 : 0;
}

export class MultiDiseaseApiService {
  private static getApiBaseUrl(): string {
    return METABOLIC_RISK_API_URL.replace(/\/$/, "");
  }

  private static getGradioCallEndpoint(): string {
    return `${this.getApiBaseUrl()}/gradio_api/call/predict_disease_risk`;
  }

  private static async readGradioCompleteData(
    eventUrl: string,
    signal: AbortSignal,
  ): Promise<unknown> {
    const res = await fetch(eventUrl, {
      method: "GET",
      headers: { Accept: "text/event-stream" },
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Prediction service error (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    const sse = await res.text();
    const lines = sse.split(/\r?\n/);
    let currentEvent: string | null = null;
    const completeDataLines: string[] = [];
    const errorDataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice("event:".length).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        const dataPart = line.slice("data:".length).trim();
        if (currentEvent === "complete") completeDataLines.push(dataPart);
        if (currentEvent === "error") errorDataLines.push(dataPart);
      }
    }

    if (errorDataLines.length > 0) {
      const msg = errorDataLines[errorDataLines.length - 1];
      throw new Error(`Prediction service error: ${msg}`);
    }

    if (completeDataLines.length === 0) {
      throw new Error("Prediction service did not return a completed result.");
    }

    const jsonText = completeDataLines.join("\n");
    try {
      return JSON.parse(jsonText) as unknown;
    } catch {
      throw new Error(
        `Prediction service returned invalid JSON: ${jsonText.slice(0, 200)}`,
      );
    }
  }

  static async predictDiseases(
    input: DiseasePredictionInput,
  ): Promise<DiseasePredictionResult> {
    const endpoint = this.getGradioCallEndpoint();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);

    try {
      const gradioData = [
        input.age_years,
        input.weight_kg,
        input.breed_size,
        input.neutered_status,
        input.activity_level,
        input.daily_exercise_minutes,
        input.diet_type,
        input.fatty_food_frequency,
        input.treat_frequency,
        input.water_intake,
        input.urination,
        input.appetite_change,
        input.vomiting,
        input.digestive_issues,
        input.lethargy,
        input.body_condition_score,
      ];

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: gradioData }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Prediction service error (${res.status}): ${text.slice(0, 200)}`,
        );
      }

      const submit = (await res.json()) as { event_id?: string };
      const eventId = submit?.event_id;
      if (!eventId) {
        throw new Error("Prediction service did not return an event_id.");
      }

      const eventUrl = `${endpoint}/${encodeURIComponent(eventId)}`;
      const completePayload = await this.readGradioCompleteData(
        eventUrl,
        controller.signal,
      );
      return this.transformResponse(completePayload, input);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Request timeout after ${API_REQUEST_TIMEOUT / 1000} seconds. Please try again.`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static pickLabelResult(
    payload: any,
    label: DiseaseType,
  ): ModelLabelResult {
    const candidates = [
      payload?.[label],
      payload?.results?.[label],
      payload?.predictions?.[label],
      payload?.data?.[label],
      payload?.[label.toLowerCase?.() ?? label],
      payload?.results?.[label.toLowerCase?.() ?? label],
      payload?.predictions?.[label.toLowerCase?.() ?? label],
    ];

    for (const c of candidates) {
      if (c && typeof c === "object") return c as ModelLabelResult;
    }

    return {};
  }

  private static pickGradioRowPredictions(
    payload: unknown,
  ): Array<{
    disease: DiseaseType;
    probability: number;
    isPositive: boolean;
  }> | null {
    if (!Array.isArray(payload) || payload.length < 1) return null;
    const df = payload[0] as any;
    if (!df || !Array.isArray(df.data)) return null;

    const diseases: DiseaseType[] = [
      "Diabetes",
      "Pancreatitis",
      "Hyperlipidemia",
      "Urolithiasis",
    ];

    const out: Array<{
      disease: DiseaseType;
      probability: number;
      isPositive: boolean;
    }> = [];

    for (const row of df.data as any[]) {
      const name = row?.[0];
      const prob = row?.[1];
      const pred = row?.[3];
      if (typeof name !== "string") continue;
      if (!diseases.includes(name as DiseaseType)) continue;
      const probability = typeof prob === "number" ? prob : Number(prob);
      const isPositive = String(pred).toLowerCase().includes("at risk");
      out.push({
        disease: name as DiseaseType,
        probability,
        isPositive,
      });
    }

    if (out.length === 0) return null;
    return out;
  }

  private static transformResponse(
    payload: unknown,
    input: DiseasePredictionInput,
  ): DiseasePredictionResult {
    const diseases: DiseaseType[] = [
      "Diabetes",
      "Pancreatitis",
      "Hyperlipidemia",
      "Urolithiasis",
    ];

    const predictions: SingleDiseasePrediction[] = [];
    let hasRisk = false;
    let highestRiskDisease: DiseaseType | null = null;
    let highestProbability = -1;
    let highestPositiveProbability = -1;

    const gradioRows = this.pickGradioRowPredictions(payload);

    for (const disease of diseases) {
      const gradioRow = gradioRows?.find((r) => r.disease === disease);
      const labelResult = gradioRow
        ? ({
            risk: gradioRow.isPositive ? 1 : 0,
            probability: gradioRow.probability,
          } as ModelLabelResult)
        : this.pickLabelResult(payload as any, disease);

      const probPct = normalizeProbability(labelResult.probability);
      const risk = normalizeRisk(labelResult.risk, probPct);
      const riskLevel: RiskLevel = risk === 1 ? "High" : "Low";
      const isPositive = risk === 1;

      const prediction: SingleDiseasePrediction = {
        disease,
        probability: probPct,
        risk_level: riskLevel,
        is_positive: isPositive,
        key_indicators: this.getKeyIndicators(disease, input),
      };

      predictions.push(prediction);
      if (isPositive) hasRisk = true;
      if (isPositive && probPct > highestPositiveProbability) {
        highestPositiveProbability = probPct;
        highestRiskDisease = disease;
      }
      if (probPct > highestProbability) {
        highestProbability = probPct;
      }
    }

    const ageGroup = this.getAgeGroup(input.age_years);
    const weightStatus = this.getWeightStatus(input.body_condition_score);
    const riskFactorsCount = this.countRiskFactors(input);
    const recommendations = this.generateRecommendations(predictions, input);

    return {
      has_risk: hasRisk,
      highest_risk_disease: hasRisk ? highestRiskDisease : null,
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

  private static getKeyIndicators(
    disease: DiseaseType,
    input: DiseasePredictionInput,
  ): string[] {
    const indicators: string[] = [];

    if (
      input.body_condition_score >= 7 &&
      (input.activity_level === "Low" || input.activity_level === "Moderate")
    ) {
      indicators.push("Obesity + low/moderate activity");
    }

    switch (disease) {
      case "Diabetes":
        if (input.age_years > 7) indicators.push("Senior age");
        if (
          input.water_intake === "High" &&
          input.urination === "Frequent" &&
          input.appetite_change === "Increased"
        ) {
          indicators.push(
            "High thirst + frequent urination + increased appetite",
          );
        }
        break;
      case "Pancreatitis":
        if (input.fatty_food_frequency === "High")
          indicators.push("High fatty food intake");
        if (input.vomiting === "Yes") indicators.push("Vomiting");
        if (
          input.digestive_issues === "Mild" ||
          input.digestive_issues === "Severe"
        ) {
          indicators.push("Digestive issues");
        }
        break;
      case "Hyperlipidemia":
        if (input.fatty_food_frequency === "High")
          indicators.push("High fatty food intake");
        if (input.activity_level === "Low") indicators.push("Low activity");
        if (input.body_condition_score >= 7)
          indicators.push("Overweight/obese BCS");
        break;
      case "Urolithiasis":
        if (input.water_intake === "Low") indicators.push("Low water intake");
        if (input.urination === "Frequent" || input.urination === "Difficult") {
          indicators.push("Urination changes");
        }
        break;
    }

    if (input.lethargy === "Yes") indicators.push("Lethargy");
    return indicators;
  }

  private static getAgeGroup(
    age: number,
  ): "Puppy" | "Adult" | "Senior" | "Geriatric" {
    if (age <= 2) return "Puppy";
    if (age <= 7) return "Adult";
    if (age <= 11) return "Senior";
    return "Geriatric";
  }

  private static getWeightStatus(
    bcs: number,
  ): "Underweight" | "Ideal" | "Overweight" | "Obese" {
    if (bcs <= 3) return "Underweight";
    if (bcs <= 5) return "Ideal";
    if (bcs <= 7) return "Overweight";
    return "Obese";
  }

  private static countRiskFactors(input: DiseasePredictionInput): number {
    let count = 0;

    if (input.age_years >= 8) count++;
    if (input.body_condition_score >= 7) count++;
    if (input.activity_level === "Low") count++;
    if (input.daily_exercise_minutes < 20) count++;
    if (input.fatty_food_frequency === "High") count++;
    if (input.water_intake === "Low") count++;
    if (input.urination !== "Normal") count++;
    if (input.vomiting === "Yes") count++;
    if (input.digestive_issues !== "None") count++;
    if (input.lethargy === "Yes") count++;

    return count;
  }

  private static generateRecommendations(
    predictions: SingleDiseasePrediction[],
    input: DiseasePredictionInput,
  ): string[] {
    const recommendations: string[] = [];

    const positive = predictions.filter((p) => p.is_positive);
    if (positive.length > 0) {
      recommendations.push(
        "🏥 Schedule a veterinary consultation for confirmation and next steps",
      );
    }

    for (const prediction of positive) {
      switch (prediction.disease) {
        case "Diabetes":
          recommendations.push("🩸 Request blood glucose evaluation");
          recommendations.push("📊 Monitor water intake and urination");
          break;
        case "Pancreatitis":
          recommendations.push("🥗 Avoid high-fat foods and treats");
          recommendations.push(
            "🔬 Discuss pancreatitis blood tests with your vet",
          );
          break;
        case "Hyperlipidemia":
          recommendations.push("🧪 Consider a lipid profile blood test");
          recommendations.push("⚖️ Start a guided weight management plan");
          break;
        case "Urolithiasis":
          recommendations.push("💧 Encourage increased water intake");
          recommendations.push("🔬 Consider urinalysis and imaging if advised");
          break;
      }
    }

    if (input.body_condition_score >= 7) {
      recommendations.push("⚖️ Reduce calories with vet-approved diet plan");
    }

    if (input.activity_level === "Low") {
      recommendations.push("🚶 Increase daily exercise gradually");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Maintain a balanced diet and regular exercise");
      recommendations.push("📅 Keep routine wellness checks");
    }

    return [...new Set(recommendations)];
  }
}

export default MultiDiseaseApiService;
