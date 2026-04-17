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

  // Knowledge Base (new schema)
  kbBreed?: string | null;
  kbDietType?: string | null;
  dietary_recommendations?: string | null;
  nutrition_targets?: Record<string, string> | null;
  meals_per_day?: string | null;
  feeding_plan?: Array<{
    food_item?: string | null;
    amount_g?: number | null;
    calories?: number | null;
  }> | null;
  hydration?: string | null;
  energy_kcal?: string | null;
  micronutrient_profile?: Record<string, string> | null;
  commercial_food_options?: string[] | null;
  homemade_food_options?: string[] | null;
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

  input: DietPlanInput,
  predictions: DietPredictionResult | null | undefined,
): { breedData: any; dietType: string; diet: any } | null {
  if (!breed) return null;

  const normalizedBreed = breed.toLowerCase();

  // Find breed in knowledge base
  const breedData = (knowledgeBase as any).breeds?.find((b: any) => {
    const kbBreed = String(b?.breed || "").toLowerCase();
    if (!kbBreed) return false;
    return (
      kbBreed === normalizedBreed ||
      normalizedBreed.includes(kbBreed) ||
      kbBreed.includes(normalizedBreed)
    );
  });

  const diets = breedData?.diets;
  if (!breedData || !diets || typeof diets !== "object") return null;

  const mappedCalorieLevel = mapCalorieLevel(predictions?.calorie_level || null);

  const inferredLifeStage = input.lifeStage || estimateLifeStage(input.ageYears);
  const bcsCategory = bcsCategoryFromScore(input.bcs);

  const inferredDietType =
    mappedCalorieLevel ||
    (inferredLifeStage === "puppy"
      ? "Puppy Diet"
      : inferredLifeStage === "senior"
        ? "Senior Diet"
        : bcsCategory === "Underweight"
          ? "Weight Gain"
          : bcsCategory === "Overweight" || bcsCategory === "Obese"
            ? "Weight Loss"
            : "Maintenance");

  const dietFromInference = diets[inferredDietType];
  if (dietFromInference) {
    return { breedData, dietType: inferredDietType, diet: dietFromInference };
  }

  // Fallback to Maintenance then to first available diet
  if (diets.Maintenance) {
    return { breedData, dietType: "Maintenance", diet: diets.Maintenance };
  }

  const firstDietType = Object.keys(diets)[0];
  if (firstDietType) {
    return { breedData, dietType: firstDietType, diet: diets[firstDietType] };
  }

  return null;
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
  const matched = findMatchingDiet(input.breed, input, prediction);

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

  // Populate plan from matched diet (new KB schema)
  if (matched?.diet) {
    plan.kbBreed = matched.breedData?.breed || null;
    plan.kbDietType = matched.dietType || null;
    plan.dietary_recommendations = matched.diet.dietary_recommendations || null;
    plan.nutrition_targets = matched.diet.nutrition_targets || null;
    plan.meals_per_day = matched.diet.meals_per_day || null;
    plan.feeding_plan = matched.diet.feeding_plan || null;
    plan.hydration = matched.diet.hydration || null;
    plan.energy_kcal = matched.diet.energy_kcal || null;
    plan.micronutrient_profile = matched.diet.micronutrient_profile || null;
    plan.commercial_food_options = matched.diet.commercial_food_options || null;
    plan.homemade_food_options = matched.diet.homemade_food_options || null;
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
