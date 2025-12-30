import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GaitApiService, { PoseDetectionResult } from "@/services/gaitApi";

// POST /api/pose/detect - Detect pose from image or video
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "image"; // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    let result: PoseDetectionResult;

    if (type === "video") {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        return NextResponse.json(
          { error: "File must be a video for video pose detection" },
          { status: 400 },
        );
      }
      result = await GaitApiService.detectPoseFromVideo(file);
    } else {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File must be an image for image pose detection" },
          { status: 400 },
        );
      }
      result = await GaitApiService.detectPoseFromImage(file);
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: {
        annotated_image: result.annotated_image,
        annotated_video: result.annotated_video,
        keypoints_info: result.keypoints_info,
        frame_count: result.frame_count,
        status: result.status,
      },
    });
  } catch (error) {
    console.error("Error detecting pose:", error);
    return NextResponse.json(
      {
        error: "Failed to detect pose",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


