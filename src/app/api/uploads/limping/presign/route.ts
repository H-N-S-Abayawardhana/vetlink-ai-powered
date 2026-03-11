import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLimpingVideoPresignedUpload } from "@/lib/s3";

export const runtime = "nodejs";

function sanitizeFilename(filename: string): string {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || `limping-${Date.now()}.mp4`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const originalFilename = String(body?.filename || "").trim();
    const contentType = String(body?.contentType || "").trim();

    if (!originalFilename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 },
      );
    }

    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { error: "A valid video content type is required" },
        { status: 400 },
      );
    }

    const safeFilename = sanitizeFilename(originalFilename);
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    const upload = await createLimpingVideoPresignedUpload(
      uniqueFilename,
      contentType,
    );

    return NextResponse.json(upload);
  } catch (error) {
    console.error("Error creating limping upload URL:", error);
    return NextResponse.json(
      {
        error: "Failed to create upload URL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
