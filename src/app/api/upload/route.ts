import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileUploadSchema, sanitizeText } from '@/lib/validation';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth();
    if (isApiError(session)) return session;

    // Validate request size (10MB max for uploads)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return apiError('Request too large. Maximum file size is 10MB.', 413);
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return apiError('No file uploaded', 400);
    }

    // Validate file using schema
    const validationResult = fileUploadSchema.safeParse({
      file,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain',
        'text/markdown'
      ]
    });

    if (!validationResult.success) {
      return apiError('Invalid file: ' + validationResult.error.errors[0]?.message, 400);
    }

    // Additional security checks
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ];

    if (!allowedTypes.includes(file.type)) {
      return apiError('File type not allowed. Allowed types: images, PDF, text files.', 400);
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      return apiError('File size must be less than 5MB', 400);
    }

    // Sanitize filename
    const originalName = sanitizeText(file.name);
    const extension = originalName.split('.').pop()?.toLowerCase();

    // Validate extension matches MIME type
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'text/markdown': ['md', 'markdown']
    };

    const validExtensions = mimeToExt[file.type];
    if (!extension || !validExtensions?.includes(extension)) {
      return apiError('File extension does not match file type', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Additional security: Check file headers for common file types
    if (file.type.startsWith('image/')) {
      const header = buffer.subarray(0, 4);
      const isValidImage =
        (header[0] === 0xFF && header[1] === 0xD8) || // JPEG
        (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) || // PNG
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) || // GIF
        (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46); // WebP (RIFF)

      if (!isValidImage) {
        return apiError('Invalid image file format', 400);
      }
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}_${randomSuffix}.${extension}`;

    // Save to public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Return the public URL
    const imageUrl = `/uploads/${filename}`;

    return apiSuccess({
      imageUrl,
      filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Don't expose internal errors to client
    return apiError('Failed to upload file. Please try again.', 500);
  }
}

// OPTIONS handler - CORS is handled by middleware, no per-route overrides needed
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
