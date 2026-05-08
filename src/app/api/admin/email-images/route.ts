// app/api/admin/email-images/route.ts
import fs from 'fs/promises';
import path from 'path';

import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const imagesDir = path.join(process.cwd(), 'public', 'email');

    try {
      const files = await fs.readdir(imagesDir);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/email/${file}`
        }));

      return apiSuccess({ images });
    } catch {
      // Directory doesn't exist, return empty array
      return apiSuccess({ images: [] });
    }
  } catch (error) {
    console.error('Failed to fetch images:', String(error));
    return apiError('Failed to fetch images', 500);
  }
}
