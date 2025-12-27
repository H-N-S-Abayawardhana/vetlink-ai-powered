import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GaitApiService, { LimpingDetectionResult } from "@/services/gaitApi";

// POST /api/limping/analyze - Analyze video for limping detection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!videoFile.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 },
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (videoFile.size > MAX_FILE_SIZE) {
      const fileSizeMB = (videoFile.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `Video file is too large (${fileSizeMB} MB). Maximum file size is 50 MB.`,
        },
        { status: 400 },
      );
    }

    // Call Hugging Face limping detection API
    const result: LimpingDetectionResult =
      await GaitApiService.detectLimping(videoFile);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: {
        class: result.class,
        confidence: result.confidence,
        SI_front: result.SI_front,
        SI_back: result.SI_back,
        SI_overall: result.SI_overall,
      },
    });
  } catch (error) {
    console.error("Error analyzing limping:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze video",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
