import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// POST /api/pets/:id/avatar
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> } ) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { params } = context;
    const { id } = (await params) as { id: string };
    const body = await request.json();
    const { dataUrl } = body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 });
    }

    // Validate owner or vet/admin - quick check by querying DB could be added.

    // Parse data URL: data:[<mediatype>][;base64],<data>
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
    }

    const mime = match[1];
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const base64Data = match[3];

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `pet-${id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
