// Diet utilities and recommendation engine for dogs
// Supports BCS-based categories, RER calculation and plan generation

export type ActivityLevel = "couch_potato" | "normal" | "active" | "working";
export type LifeStage = "puppy" | "adult" | "senior";

export interface DietPlanInput {
  id?: string | number;
  name: string;
  breed?: string | null;
  weightKg: number;
  ageYears?: number | null;
  bcs?: number | null; // 1-9
  activityLevel?: ActivityLevel | null;
  lifeStage?: LifeStage | null;
}

export interface DietPredictionResult {
  calorie_level: string | null;
  diet_type: string | null;
  food_category: string | null;
}

export interface DietPlan {
  petId?: string | number;
  generatedAt: string;
  petName: string;
  breed?: string | null;
  weightKg: number;
  ageYears?: number | null;
  bcs?: number | null;
  bcsCategory?: string;
  rerKcal?: number | null;
  dailyCalories?: number | null;
  feedingFrequency?: number | null;
  portions?: {
    cupsPerMeal?: number | null;
    gramsPerMeal?: number | null;
    kcalPerMeal?: number | null;
  } | null;
  recommendedFoodTypes: string[];
  foodsToAvoid: string[];
  treatAllowanceKcal?: number | null;
  exerciseMinutesPerDay?: number | null;
  proteinGuidance?: string | null;
  fatGuidance?: string | null;
  waterMlPerDay?: number | null;
  notes: string[];
  calorieLevel?: string | null;
  dietType?: string | null;
  foodCategory?: string | null;
}

export const TOXIC_FOODS: string[] = [];

export function calculateRER(weightKg: number) {
  // RER = 70 * (body weight in kg)^0.75
  return 70 * Math.pow(weightKg, 0.75);
}

export function activityMultiplier(level: ActivityLevel | undefined | null) {
  switch (level) {
    case "couch_potato":
      return 1.2;
    case "normal":
      return 1.6;
    case "active":
      return 2.0;
    case "working":
      return 3.0;
    default:
      return 1.6;
  }
}

export function bcsCategoryFromScore(score: number | null | undefined) {
  if (score == null) return null;
  if (score <= 3) return "Underweight";
  if (score <= 5) return "Ideal";
  if (score <= 7) return "Overweight";
  return "Obese";
}

export function estimateLifeStage(ageYears?: number | null): LifeStage {
  if (ageYears == null) return "adult";
  if (ageYears < 1) return "puppy";
  if (ageYears >= 7) return "senior";
  return "adult";
}

export function generateDietPlan(
  input: DietPlanInput,
  prediction?: DietPredictionResult | null
): DietPlan {
  const now = new Date().toISOString();
  const calorieLevel = prediction?.calorie_level || null;
  const dietType = prediction?.diet_type || null;
  const foodCategory = prediction?.food_category || null;

  const plan: DietPlan = {
    petId: input.id,
    generatedAt: now,
    petName: input.name,
    breed: input.breed || null,
    weightKg: input.weightKg,
    ageYears: input.ageYears ?? null,
    bcs: input.bcs ?? null,
    bcsCategory: bcsCategoryFromScore(input.bcs) || undefined,
    rerKcal: null,
    dailyCalories: null,
    feedingFrequency: null,
    portions: null,
    recommendedFoodTypes: [],
    foodsToAvoid: [],
    treatAllowanceKcal: null,
    exerciseMinutesPerDay: null,
    proteinGuidance: null,
    fatGuidance: null,
    waterMlPerDay: null,
    notes: [],
    calorieLevel,
    dietType,
    foodCategory,
  };

  return plan;
}

const diet = {
  calculateRER,
  generateDietPlan,
  TOXIC_FOODS,
  bcsCategoryFromScore,
};

export default diet;
