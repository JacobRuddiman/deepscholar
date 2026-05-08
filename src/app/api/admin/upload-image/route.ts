// app/api/admin/upload-image/route.ts
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('No file provided', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return apiError('Invalid file type. Only images are allowed.', 400);
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return apiError('File too large. Maximum size is 5MB.', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename: extract extension, strip non-alphanumeric chars, generate safe name
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dirPath = path.join(process.cwd(), 'public', 'email');
    const filePath = path.join(dirPath, safeName);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    return apiSuccess({ name: safeName, url: `/email/${safeName}` });
  } catch (error) {
    console.error('Failed to upload image:', String(error));
    return apiError('Failed to upload image', 500);
  }
}
