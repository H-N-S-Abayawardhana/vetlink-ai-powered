<<<<<<< HEAD
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

  // Original KB payload (for UI rendering aligned to knowledge base)
  kb?: {
    dietary_recommendations?: string | null;
    nutrition_targets?: Record<string, unknown> | null;
    feeding_amount_g_per_kg?: string | null;
    meals_per_day?: string | number | null;
    feeding_plan?:
      | Array<{
          food_item?: string;
          amount_g?: number;
          calories?: number;
        }>
      | null;
    hydration?: string | null;
    energy_kcal?: string | null;
    macronutrient_profile?: Record<string, unknown> | null;
    micronutrient_profile?: Record<string, unknown> | null;
    commercial_food_options?: string[] | null;
    homemade_food_options?: string[] | null;
  };

  // ML Predictions
  calorieLevel?: string | null;
  dietType?: string | null;
  foodCategory?: string | null;

  // Knowledge Base - Exact Structure Only
  Diet_Type?: string | null;
  Nutrition_Profile?: {
    Protein_Level?: string | null;
    Fat_Level?: string | null;
    Carb_Level?: string | null;
  } | null;
  Nutrition_Profile_Percent?: {
    Protein?: string | null;
    Fat?: string | null;
    Carbohydrate?: string | null;
  } | null;
  Nutrition_Profile_g_per_kg?: {
    Protein_g_per_kg?: number | null;
    Fat_g_per_kg?: number | null;
    Carb_g_per_kg?: number | null;
  } | null;
  Feeding_g_per_kg_bodyweight_day?: Record<string, number | string | null> | null;
  Mineral_spec_per_1000kcal?: Record<string, number | string | null> | null;
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
function extractFeedingAmount(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;

  // Prefer extracting a numeric or numeric-range value so the UI can append units consistently.
  const rangeMatch = text.match(
    /(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?)/,
  );
  if (rangeMatch?.[1]) return rangeMatch[1].replace(/\s+/g, "");

  return text;
}

function normalizeKbDiet(dietKey: string, diet: any): any {
  if (!diet || typeof diet !== "object") {
    return { Diet_Type: dietKey, kb: null };
  }

  const nutritionTargets = diet.nutrition_targets || {};
  const macro = diet.macronutrient_profile || {};
  const recommendedFoods: string[] = [];
  if (Array.isArray(diet.commercial_food_options)) {
    recommendedFoods.push(...diet.commercial_food_options);
  }
  if (Array.isArray(diet.homemade_food_options)) {
    recommendedFoods.push(...diet.homemade_food_options);
  }

  const mealsPerDayRaw = diet.meals_per_day;
  const mealsPerDayParsed =
    typeof mealsPerDayRaw === "number"
      ? mealsPerDayRaw
      : Number.parseInt(String(mealsPerDayRaw || ""), 10);

  return {
    Diet_Type: dietKey,

    kb: {
      dietary_recommendations: diet.dietary_recommendations || null,
      nutrition_targets:
        diet.nutrition_targets && typeof diet.nutrition_targets === "object"
          ? diet.nutrition_targets
          : null,
      feeding_amount_g_per_kg:
        typeof diet.feeding_amount_g_per_kg === "string"
          ? diet.feeding_amount_g_per_kg
          : diet.feeding_amount_g_per_kg != null
            ? String(diet.feeding_amount_g_per_kg)
            : null,
      meals_per_day: diet.meals_per_day ?? null,
      feeding_plan: Array.isArray(diet.feeding_plan) ? diet.feeding_plan : null,
      hydration: diet.hydration || null,
      energy_kcal: diet.energy_kcal || null,
      macronutrient_profile:
        diet.macronutrient_profile && typeof diet.macronutrient_profile === "object"
          ? diet.macronutrient_profile
          : null,
      micronutrient_profile:
        diet.micronutrient_profile && typeof diet.micronutrient_profile === "object"
          ? diet.micronutrient_profile
          : null,
      commercial_food_options: Array.isArray(diet.commercial_food_options)
        ? diet.commercial_food_options
        : null,
      homemade_food_options: Array.isArray(diet.homemade_food_options)
        ? diet.homemade_food_options
        : null,
    },

    Nutrition_Profile: {
      Protein_Level: macro.protein || nutritionTargets.protein || null,
      Fat_Level: macro.fat || nutritionTargets.fat || null,
      Carb_Level: macro.carbohydrates || nutritionTargets.carbohydrates || null,
    },

    Nutrition_Profile_Percent: {
      Protein: nutritionTargets.protein || null,
      Fat: nutritionTargets.fat || null,
      Carbohydrate: macro.carbohydrates || null,
    },

    Nutrition_Profile_g_per_kg: {
      Protein_g_per_kg:
        typeof nutritionTargets.protein_g_per_kg === "number"
          ? nutritionTargets.protein_g_per_kg
          : null,
      Fat_g_per_kg:
        typeof nutritionTargets.fat_g_per_kg === "number"
          ? nutritionTargets.fat_g_per_kg
          : null,
      Carb_g_per_kg:
        typeof nutritionTargets.carbohydrates_g_per_kg === "number"
          ? nutritionTargets.carbohydrates_g_per_kg
          : null,
    },

    Feeding_g_per_kg_bodyweight_day: diet.feeding_amount_g_per_kg
      ? { Recommended: extractFeedingAmount(diet.feeding_amount_g_per_kg) }
      : null,

    Feeding_Guidelines: {
      Meals_Per_Day: Number.isFinite(mealsPerDayParsed) ? mealsPerDayParsed : null,
      Portion_Control_Advice: diet.dietary_recommendations || null,
      Treat_Allowance: null,
    },

    Recommended_Foods: recommendedFoods.length > 0 ? recommendedFoods : null,
    Foods_to_Avoid: null,
    Exercise_Recommendation: null,
    Notes: null,
  };
}

function findMatchingDiet(
  breed: string | null | undefined,
  predictions: DietPredictionResult | null | undefined,
): any {
  if (!breed) return null;

  // Find breed in knowledge base
  const breedData = (knowledgeBase as any).breeds.find(
    (b: any) =>
      b.breed.toLowerCase() === breed.toLowerCase() ||
      breed.toLowerCase().includes(b.breed.toLowerCase()) ||
      b.breed.toLowerCase().includes(breed.toLowerCase()),
  );

  if (!breedData || !breedData.diets) return null;

  const dietsRaw = breedData.diets;

  // Legacy schema: diets is an array of objects with Diet_Type etc.
  if (Array.isArray(dietsRaw)) {
    if (dietsRaw.length === 0) return null;

    // If no predictions, return the first diet (usually Maintenance)
    if (!predictions) {
      return dietsRaw[0] || null;
    }

    const mappedCalorieLevel = mapCalorieLevel(predictions.calorie_level);

    // Try to find exact match based on Diet_Type field (matches JSON structure)
    let matchedDiet = dietsRaw.find((diet: any) => {
      return (
        diet.Diet_Type === mappedCalorieLevel ||
        diet.Diet_Type?.toLowerCase() ===
          predictions.calorie_level?.toLowerCase() ||
        // Also check legacy Calorie Level field if exists
        diet["Calorie Level"] === mappedCalorieLevel ||
        diet["Calorie Level"]?.toLowerCase() ===
          predictions.calorie_level?.toLowerCase()
      );
    });

    // If no exact match, try to find based on diet type or food category
    if (!matchedDiet && (predictions.diet_type || predictions.food_category)) {
      matchedDiet = dietsRaw.find((diet: any) => {
        const dietTypeMatch =
          predictions.diet_type &&
          (diet.Diet_Type?.toLowerCase().includes(
            predictions.diet_type.toLowerCase(),
          ) ||
            diet["Food Type"]
              ?.toLowerCase()
              .includes(predictions.diet_type.toLowerCase()));
        const foodCatMatch =
          predictions.food_category &&
          diet["Food Category"]
            ?.toLowerCase()
            .includes(predictions.food_category.toLowerCase());
        return dietTypeMatch || foodCatMatch;
      });
    }

    // Fallback to first diet (Maintenance)
    return matchedDiet || dietsRaw[0] || null;
  }

  // Current schema: diets is an object keyed by diet type (e.g., "Maintenance", "Weight Loss").
  if (dietsRaw && typeof dietsRaw === "object") {
    const dietKeys = Object.keys(dietsRaw);
    if (dietKeys.length === 0) return null;

    if (!predictions) {
      const key = dietKeys[0];
      return normalizeKbDiet(key, dietsRaw[key]);
    }

    const mappedCalorieLevel = mapCalorieLevel(predictions.calorie_level);

    const normalizedTarget = String(
      mappedCalorieLevel || predictions.calorie_level || "",
    )
      .toLowerCase()
      .trim();

    const matchByKey = (key: string) => key.toLowerCase().trim() === normalizedTarget;
    const includesTarget = (key: string) =>
      normalizedTarget && key.toLowerCase().includes(normalizedTarget);

    let selectedKey =
      dietKeys.find(matchByKey) ||
      dietKeys.find(includesTarget) ||
      (predictions.diet_type
        ? dietKeys.find((key) =>
            key.toLowerCase().includes(predictions.diet_type!.toLowerCase()),
          )
        : undefined) ||
      dietKeys[0];

    return normalizeKbDiet(selectedKey, dietsRaw[selectedKey]);
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
  const matchedDiet = findMatchingDiet(input.breed, prediction);

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

  // Populate plan from matched diet (Knowledge Base structure only)
  if (matchedDiet) {
    // Full KB payload (when available)
    if (matchedDiet.kb) {
      plan.kb = matchedDiet.kb;
    }

    // Diet_Type
    plan.Diet_Type = matchedDiet.Diet_Type || null;

    // Nutrition_Profile
    if (matchedDiet.Nutrition_Profile) {
      plan.Nutrition_Profile = {
        Protein_Level: matchedDiet.Nutrition_Profile.Protein_Level || null,
        Fat_Level: matchedDiet.Nutrition_Profile.Fat_Level || null,
        Carb_Level: matchedDiet.Nutrition_Profile.Carb_Level || null,
      };
    }

    if (matchedDiet.Nutrition_Profile_Percent) {
      plan.Nutrition_Profile_Percent = {
        Protein: matchedDiet.Nutrition_Profile_Percent.Protein || null,
        Fat: matchedDiet.Nutrition_Profile_Percent.Fat || null,
        Carbohydrate:
          matchedDiet.Nutrition_Profile_Percent.Carbohydrate || null,
      };
    }

    if (matchedDiet.Nutrition_Profile_g_per_kg) {
      plan.Nutrition_Profile_g_per_kg = {
        Protein_g_per_kg:
          matchedDiet.Nutrition_Profile_g_per_kg.Protein_g_per_kg ?? null,
        Fat_g_per_kg: matchedDiet.Nutrition_Profile_g_per_kg.Fat_g_per_kg ?? null,
        Carb_g_per_kg:
          matchedDiet.Nutrition_Profile_g_per_kg.Carb_g_per_kg ?? null,
      };
    }

    if (matchedDiet.Feeding_g_per_kg_bodyweight_day) {
      plan.Feeding_g_per_kg_bodyweight_day =
        matchedDiet.Feeding_g_per_kg_bodyweight_day;
    }

    if (matchedDiet.Mineral_spec_per_1000kcal) {
      plan.Mineral_spec_per_1000kcal = matchedDiet.Mineral_spec_per_1000kcal;
    }

    // Feeding_Guidelines
    if (matchedDiet.Feeding_Guidelines) {
      plan.Feeding_Guidelines = {
        Meals_Per_Day: matchedDiet.Feeding_Guidelines.Meals_Per_Day || null,
        Portion_Control_Advice:
          matchedDiet.Feeding_Guidelines.Portion_Control_Advice || null,
        Treat_Allowance: matchedDiet.Feeding_Guidelines.Treat_Allowance || null,
      };
    }

    // Recommended_Foods
    if (
      matchedDiet.Recommended_Foods &&
      Array.isArray(matchedDiet.Recommended_Foods)
    ) {
      plan.Recommended_Foods = matchedDiet.Recommended_Foods;
    }

    // Foods_to_Avoid
    if (
      matchedDiet.Foods_to_Avoid &&
      Array.isArray(matchedDiet.Foods_to_Avoid)
    ) {
      plan.Foods_to_Avoid = matchedDiet.Foods_to_Avoid;
    }

    // Exercise_Recommendation
    plan.Exercise_Recommendation = matchedDiet.Exercise_Recommendation || null;

    // Notes
    plan.Notes = matchedDiet.Notes || null;
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
=======
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

  // Knowledge Base - Exact Structure Only
  Diet_Type?: string | null;
  Nutrition_Profile?: {
    Protein_Level?: string | null;
    Fat_Level?: string | null;
    Carb_Level?: string | null;
  } | null;
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
): any {
  if (!breed) return null;

  // Find breed in knowledge base
  const breedData = (knowledgeBase as any).breeds.find(
    (b: any) =>
      b.breed.toLowerCase() === breed.toLowerCase() ||
      breed.toLowerCase().includes(b.breed.toLowerCase()) ||
      b.breed.toLowerCase().includes(breed.toLowerCase()),
  );

  if (!breedData || !breedData.diets) return null;

  // If no predictions, return the first diet (usually Maintenance)
  if (!predictions) {
    return breedData.diets[0] || null;
  }

  const mappedCalorieLevel = mapCalorieLevel(predictions.calorie_level);

  // Try to find exact match based on Diet_Type field (matches JSON structure)
  let matchedDiet = breedData.diets.find((diet: any) => {
    return (
      diet.Diet_Type === mappedCalorieLevel ||
      diet.Diet_Type?.toLowerCase() ===
        predictions.calorie_level?.toLowerCase() ||
      // Also check legacy Calorie Level field if exists
      diet["Calorie Level"] === mappedCalorieLevel ||
      diet["Calorie Level"]?.toLowerCase() ===
        predictions.calorie_level?.toLowerCase()
    );
  });

  // If no exact match, try to find based on diet type or food category
  if (!matchedDiet && (predictions.diet_type || predictions.food_category)) {
    matchedDiet = breedData.diets.find((diet: any) => {
      const dietTypeMatch =
        predictions.diet_type &&
        (diet.Diet_Type?.toLowerCase().includes(
          predictions.diet_type.toLowerCase(),
        ) ||
          diet["Food Type"]
            ?.toLowerCase()
            .includes(predictions.diet_type.toLowerCase()));
      const foodCatMatch =
        predictions.food_category &&
        diet["Food Category"]
          ?.toLowerCase()
          .includes(predictions.food_category.toLowerCase());
      return dietTypeMatch || foodCatMatch;
    });
  }

  // Fallback to first diet (Maintenance)
  return matchedDiet || breedData.diets[0] || null;
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
  const matchedDiet = findMatchingDiet(input.breed, prediction);

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

  // Populate plan from matched diet (Knowledge Base structure only)
  if (matchedDiet) {
    // Diet_Type
    plan.Diet_Type = matchedDiet.Diet_Type || null;

    // Nutrition_Profile
    if (matchedDiet.Nutrition_Profile) {
      plan.Nutrition_Profile = {
        Protein_Level: matchedDiet.Nutrition_Profile.Protein_Level || null,
        Fat_Level: matchedDiet.Nutrition_Profile.Fat_Level || null,
        Carb_Level: matchedDiet.Nutrition_Profile.Carb_Level || null,
      };
    }

    // Feeding_Guidelines
    if (matchedDiet.Feeding_Guidelines) {
      plan.Feeding_Guidelines = {
        Meals_Per_Day: matchedDiet.Feeding_Guidelines.Meals_Per_Day || null,
        Portion_Control_Advice:
          matchedDiet.Feeding_Guidelines.Portion_Control_Advice || null,
        Treat_Allowance: matchedDiet.Feeding_Guidelines.Treat_Allowance || null,
      };
    }

    // Recommended_Foods
    if (
      matchedDiet.Recommended_Foods &&
      Array.isArray(matchedDiet.Recommended_Foods)
    ) {
      plan.Recommended_Foods = matchedDiet.Recommended_Foods;
    }

    // Foods_to_Avoid
    if (
      matchedDiet.Foods_to_Avoid &&
      Array.isArray(matchedDiet.Foods_to_Avoid)
    ) {
      plan.Foods_to_Avoid = matchedDiet.Foods_to_Avoid;
    }

    // Exercise_Recommendation
    plan.Exercise_Recommendation = matchedDiet.Exercise_Recommendation || null;

    // Notes
    plan.Notes = matchedDiet.Notes || null;
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
>>>>>>> d95edf6d3d05d354033436e12422e274d5577f55
