// app/api/admin/upload-image/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const dirPath = path.join(process.cwd(), 'public', 'email');
    const filePath = path.join(dirPath, filename);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });
    
    // Write file
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      name: filename,
      url: `/email/${filename}`
    });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}