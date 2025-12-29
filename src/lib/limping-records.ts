"use client";

export interface LimpingRecord {
  id: string;
  petId: string;
  ownerId: string | null;
  // Limping detection results
  limpingClass: string;
  limpingConfidence: number | null;
  limpingSiFront: number | null;
  limpingSiBack: number | null;
  limpingSiOverall: number | null;
  // Form data
  ageYears: number | null;
  weightCategory: string;
  limpingDetected: number | null;
  painWhileWalking: number | null;
  difficultyStanding: number | null;
  reducedActivity: number | null;
  jointSwelling: number | null;
  // Disease prediction results
  predictedDisease: string;
  diseaseConfidence: number | null;
  riskLevel: string;
  symptomScore: number | null;
  painSeverity: number | null;
  recommendations: string[] | null;
  // Video URL
  videoUrl: string | null;
  createdAt: string | null;
}

export async function listLimpingRecords(
  petId: string,
): Promise<LimpingRecord[]> {
  if (!petId) {
    return [];
  }

  try {
    const res = await fetch(`/api/pets/${petId}/limping`);
    if (!res.ok) {
      // Don't log 404 errors as they're expected when a pet is deleted
      if (res.status !== 404) {
        console.error("listLimpingRecords: API responded with", res.status);
      }
      return [];
    }
    const data = await res.json();
    return data.records || [];
  } catch (e) {
    // Don't log errors if it's likely due to navigation/redirect
    console.error("listLimpingRecords error", e);
    return [];
  }
}

export async function clearLimpingHistory(petId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/pets/${petId}/limping`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`clearLimpingHistory failed: ${res.status} ${errText}`);
    }

    return true;
  } catch (e) {
    console.error("clearLimpingHistory error", e);
    throw e;
  }
}
