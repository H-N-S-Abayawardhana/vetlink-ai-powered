import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/pose/detect - Deprecated: Pose detection is now handled by the limping API
// The limping API (NEXT_PUBLIC_LIMPING_API_URL) includes pose detection (best.pt model) built-in
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Pose detection API is deprecated",
        message:
          "Pose detection is now integrated into the limping detection API. Please use /api/limping/analyze for video analysis, which includes pose detection (best.pt model) built-in.",
      },
      { status: 410 }, // 410 Gone - indicates the resource is no longer available
    );
  } catch (error) {
    console.error("Error in pose detection endpoint:", error);
    return NextResponse.json(
      {
        error: "Pose detection API is deprecated",
        message:
          "Pose detection is now integrated into the limping detection API. Please use /api/limping/analyze for video analysis.",
      },
      { status: 410 },
    );
  }
}



