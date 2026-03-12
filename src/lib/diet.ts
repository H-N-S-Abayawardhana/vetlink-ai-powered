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
