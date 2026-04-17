// Diet utilities and recommendation engine for dogs
// Supports BCS-based categories, RER calculation and plan generation

import knowledgeBase from "@/data/dog_nutrition_knowledge_base.json";

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
  gender?: string | null;
  spayedNeutered?: boolean | null;
  mealsPerDay?: number | null;
  digestiveSensitivity?: boolean | null;
  preferredDiet?: string | null;
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

  // ML Predictions
  calorieLevel?: string | null;
  dietType?: string | null;
  foodCategory?: string | null;

  // Knowledge Base (2026-04) schema
  dietCategory?: string | null;
  dietary_recommendations?: string | null;
  nutrition_targets?: Record<string, string> | null;
  meals_per_day?: string | null;
  feeding_plan?: Array<{
    food_item: string;
    amount_g?: number | null;
    calories?: number | null;
  }> | null;
  hydration?: string | null;
  energy_kcal?: string | null;
  micronutrient_profile?: Record<string, string> | null;
  commercial_food_options?: string[] | null;
  homemade_food_options?: string[] | null;

  // Legacy aliases (kept for backwards compatibility with older UI/PDF)
  Diet_Type?: string | null;
  Feeding_Guidelines?: {
    Meals_Per_Day?: number | null;
    Portion_Control_Advice?: string | null;
    Treat_Allowance?: string | null;
  } | null;
  Recommended_Foods?: string[] | null;
  Foods_to_Avoid?: string[] | null;
  Exercise_Recommendation?: string | null;
  Notes?: string | null;
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

/**
 * Maps prediction values to knowledge base diet categories
 */
function mapCalorieLevel(calorieLevel: string | null): string | null {
  if (!calorieLevel) return null;
  const normalized = calorieLevel.toLowerCase().trim();

  // Map variations to standard Diet_Type categories in knowledge base
  if (normalized.includes("maintenance") || normalized.includes("normal")) {
    return "Maintenance";
  }
  if (normalized.includes("weight loss") || normalized.includes("loss")) {
    return "Weight Loss";
  }
  if (normalized.includes("weight gain") || normalized.includes("gain")) {
    return "Weight Gain";
  }
  if (normalized.includes("puppy") || normalized.includes("growth")) {
    return "Puppy Diet";
  }
  if (normalized.includes("senior") || normalized.includes("elderly")) {
    return "Senior Diet";
  }

  return calorieLevel; // Return as-is if no mapping found
}

/**
 * Finds the best matching diet from the knowledge base
 */
function findMatchingDiet(
  breed: string | null | undefined,
  predictions: DietPredictionResult | null | undefined,
): { dietCategory: string; diet: any } | null {
  if (!breed) return null;

  // Find breed in knowledge base
  const breedData = (knowledgeBase as any).breeds.find(
    (b: any) =>
      b.breed.toLowerCase() === breed.toLowerCase() ||
      breed.toLowerCase().includes(b.breed.toLowerCase()) ||
      b.breed.toLowerCase().includes(breed.toLowerCase()),
  );

  if (!breedData || !breedData.diets) return null;

  const dietsObj = breedData.diets as Record<string, any>;
  const dietKeys = Object.keys(dietsObj);
  if (dietKeys.length === 0) return null;

  const pickDefault = () => {
    const preferredDefault = dietKeys.find(
      (key) => key.toLowerCase() === "maintenance",
    );
    const defaultKey = preferredDefault || dietKeys[0];
    return { dietCategory: defaultKey, diet: dietsObj[defaultKey] };
  };

  if (!predictions) return pickDefault();

  const mappedCalorieLevel = mapCalorieLevel(predictions.calorie_level);
  if (mappedCalorieLevel && dietsObj[mappedCalorieLevel]) {
    return { dietCategory: mappedCalorieLevel, diet: dietsObj[mappedCalorieLevel] };
  }

  if (mappedCalorieLevel) {
    const keyInsensitive = dietKeys.find(
      (key) => key.toLowerCase() === mappedCalorieLevel.toLowerCase(),
    );
    if (keyInsensitive) {
      return { dietCategory: keyInsensitive, diet: dietsObj[keyInsensitive] };
    }
  }

  // If model returned something slightly different, try partial match.
  const raw = (predictions.calorie_level || "").toLowerCase();
  if (raw) {
    const partial = dietKeys.find((key) => key.toLowerCase().includes(raw));
    if (partial) return { dietCategory: partial, diet: dietsObj[partial] };
  }

  return pickDefault();
}

export function generateDietPlan(
  input: DietPlanInput,
  prediction?: DietPredictionResult | null,
): DietPlan {
  const now = new Date().toISOString();
  const calorieLevel = prediction?.calorie_level || null;
  const dietType = prediction?.diet_type || null;
  const foodCategory = prediction?.food_category || null;

  // Find matching diet from knowledge base
  const matched = findMatchingDiet(input.breed, prediction);

  const plan: DietPlan = {
    petId: input.id,
    generatedAt: now,
    petName: input.name,
    breed: input.breed || null,
    weightKg: input.weightKg,
    ageYears: input.ageYears ?? null,
    bcs: input.bcs ?? null,
    bcsCategory: bcsCategoryFromScore(input.bcs) || undefined,

    // ML Predictions
    calorieLevel,
    dietType,
    foodCategory,
  };

  // Populate plan from matched diet (new KB structure)
  if (matched?.diet) {
    const matchedDiet = matched.diet;
    plan.dietCategory = matched.dietCategory || null;
    plan.dietary_recommendations =
      typeof matchedDiet.dietary_recommendations === "string"
        ? matchedDiet.dietary_recommendations
        : null;
    plan.nutrition_targets =
      matchedDiet.nutrition_targets &&
      typeof matchedDiet.nutrition_targets === "object" &&
      !Array.isArray(matchedDiet.nutrition_targets)
        ? matchedDiet.nutrition_targets
        : null;
    plan.meals_per_day =
      matchedDiet.meals_per_day !== undefined && matchedDiet.meals_per_day !== null
        ? String(matchedDiet.meals_per_day)
        : null;
    plan.feeding_plan = Array.isArray(matchedDiet.feeding_plan)
      ? matchedDiet.feeding_plan
          .filter((row: any) => row && typeof row.food_item === "string")
          .map((row: any) => ({
            food_item: row.food_item,
            amount_g:
              typeof row.amount_g === "number" ? row.amount_g : row.amount_g != null ? Number(row.amount_g) : null,
            calories:
              typeof row.calories === "number" ? row.calories : row.calories != null ? Number(row.calories) : null,
          }))
      : null;
    plan.hydration = typeof matchedDiet.hydration === "string" ? matchedDiet.hydration : null;
    plan.energy_kcal = typeof matchedDiet.energy_kcal === "string" ? matchedDiet.energy_kcal : null;
    plan.micronutrient_profile =
      matchedDiet.micronutrient_profile &&
      typeof matchedDiet.micronutrient_profile === "object" &&
      !Array.isArray(matchedDiet.micronutrient_profile)
        ? matchedDiet.micronutrient_profile
        : null;
    plan.commercial_food_options = Array.isArray(matchedDiet.commercial_food_options)
      ? matchedDiet.commercial_food_options.filter((x: any) => typeof x === "string")
      : null;
    plan.homemade_food_options = Array.isArray(matchedDiet.homemade_food_options)
      ? matchedDiet.homemade_food_options.filter((x: any) => typeof x === "string")
      : null;

    // Legacy aliases
    plan.Diet_Type = plan.dietCategory;
    const parsedMeals = plan.meals_per_day ? parseInt(plan.meals_per_day, 10) : NaN;
    plan.Feeding_Guidelines = {
      Meals_Per_Day: Number.isFinite(parsedMeals) ? parsedMeals : null,
      Portion_Control_Advice: plan.dietary_recommendations,
      Treat_Allowance: null,
    };
    plan.Recommended_Foods = Array.isArray(plan.commercial_food_options)
      ? plan.commercial_food_options
      : null;
    plan.Foods_to_Avoid = null;
    plan.Exercise_Recommendation = null;
    plan.Notes = null;
  }

  return plan;
}

const diet = {
  calculateRER,
  generateDietPlan,
  TOXIC_FOODS,
  bcsCategoryFromScore,
};

export default diet;
