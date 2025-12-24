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
  try {
    const res = await fetch(`/api/pets/${petId}/skin-disease`);
    if (!res.ok) {
      console.error("listSkinDiseaseRecords: API responded with", res.status);
      return [];
    }
    const data = await res.json();
    return data.records || [];
  } catch (e) {
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
