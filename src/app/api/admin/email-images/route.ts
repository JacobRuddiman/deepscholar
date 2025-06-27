// app/api/admin/email-images/route.ts
import { NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    
    const imagesDir = path.join(process.cwd(), 'public', 'email');
    
    try {
      const files = await fs.readdir(imagesDir);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/email/${file}`
        }));

      return NextResponse.json({ images });
    } catch (error) {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ images: [] });
    }
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}