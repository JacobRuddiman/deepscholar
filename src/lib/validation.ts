import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');

export const urlSchema = z.string().url('Please enter a valid URL');

export const nonEmptyStringSchema = z.string().min(1, 'This field is required');

export const briefTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters')
  .trim();

export const briefContentSchema = z
  .string()
  .min(10, 'Content must be at least 10 characters')
  .max(50000, 'Content must be less than 50,000 characters');

export const briefAbstractSchema = z
  .string()
  .optional();

export const reviewContentSchema = z
  .string()
  .min(10, 'Review must be at least 10 characters')
  .max(2000, 'Review must be less than 2,000 characters');

export const reviewRatingSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

export const userNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .trim();

// Brief creation schema
export const createBriefSchema = z.object({
  title: briefTitleSchema,
  abstract: briefAbstractSchema,
  prompt: nonEmptyStringSchema,
  response: briefContentSchema,
  thinking: z.string().optional(),
  modelId: nonEmptyStringSchema,
  categoryIds: z.array(z.string()).optional(),
  sourceIds: z.array(z.string()).optional(),
  slug: z.string().optional(),
});

// Brief update schema
export const updateBriefSchema = z.object({
  title: briefTitleSchema.optional(),
  abstract: briefAbstractSchema,
  prompt: nonEmptyStringSchema.optional(),
  response: briefContentSchema.optional(),
  thinking: z.string().optional(),
  modelId: nonEmptyStringSchema.optional(),
  categoryIds: z.array(z.string()).optional(),
  sourceIds: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

// Review creation schema
export const createReviewSchema = z.object({
  content: reviewContentSchema,
  rating: reviewRatingSchema,
  briefId: nonEmptyStringSchema,
});

// User profile update schema
export const updateProfileSchema = z.object({
  name: userNameSchema.optional(),
  email: emailSchema.optional(),
  image: z.string().url('Please enter a valid image URL').optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  briefInterestUpdates: z.boolean(),
  promotionalNotifications: z.boolean(),
});

// Search parameters schema
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  modelFilter: z.string().optional(),
  sortBy: z.enum(['popular', 'new', 'controversial']).optional(),
  page: z.number().int().min(1).optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().optional().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).optional().default(['image/jpeg', 'image/png', 'image/webp']),
});

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove angle brackets
}

// Rate limiting helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const userRequests = requests.get(identifier) ?? [];

    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return true;
    }

    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);

    return false;
  };
}

// CSRF token validation
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // In a real implementation, you'd store and validate CSRF tokens properly
  // This is a simplified version
  return token.length > 0 && sessionToken.length > 0;
}

// Input size validation
export function validateRequestSize(data: unknown, maxSizeBytes: number = 1024 * 1024): boolean {
  const size = JSON.stringify(data).length;
  return size <= maxSizeBytes;
}

// SQL injection prevention helpers
export function escapeString(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// XSS prevention
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

export default {
  validateInput,
  sanitizeHtml,
  sanitizeText,
  createRateLimiter,
  generateCSRFToken,
  validateCSRFToken,
  validateRequestSize,
  escapeString,
  escapeHtml,
};
