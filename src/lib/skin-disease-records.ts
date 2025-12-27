"use client";

export interface SkinDiseaseRecord {
  id: string;
  petId: string;
  ownerId: string | null;
  disease: string;
  confidence: number | null;
  allProbabilities: Record<string, number> | null;
  imageUrl: string | null;
  createdAt: string | null;
}

export async function listSkinDiseaseRecords(
  petId: string,
): Promise<SkinDiseaseRecord[]> {
  if (!petId) {
    return [];
  }

  try {
    const res = await fetch(`/api/pets/${petId}/skin-disease`);
    if (!res.ok) {
      // Don't log 404 errors as they're expected when a pet is deleted
      if (res.status !== 404) {
        console.error("listSkinDiseaseRecords: API responded with", res.status);
      }
      return [];
    }
    const data = await res.json();
    return data.records || [];
  } catch (e) {
    // Don't log errors if it's likely due to navigation/redirect
    console.error("listSkinDiseaseRecords error", e);
    return [];
  }
}

export async function createSkinDiseaseRecord(
  petId: string,
  payload: {
    file: File;
    disease: string;
    confidence?: number | null;
    allProbabilities?: Record<string, number> | null;
  },
): Promise<SkinDiseaseRecord | null> {
  const formData = new FormData();
  formData.append("image", payload.file);
  formData.append("disease", payload.disease);
  if (payload.confidence != null)
    formData.append("confidence", String(payload.confidence));
  if (payload.allProbabilities)
    formData.append(
      "allProbabilities",
      JSON.stringify(payload.allProbabilities),
    );

  const res = await fetch(`/api/pets/${petId}/skin-disease`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`createSkinDiseaseRecord failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.record || null;
}

export async function clearSkinDiseaseHistory(petId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/pets/${petId}/skin-disease`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `clearSkinDiseaseHistory failed: ${res.status} ${errText}`,
      );
    }

    return true;
  } catch (e) {
    console.error("clearSkinDiseaseHistory error", e);
    throw e;
  }
}
