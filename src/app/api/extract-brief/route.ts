import { NextRequest } from 'next/server';
import { extractBriefFromUrlServer } from '@/lib/extraction/server';
import { apiSuccess, apiError } from '@/lib/api-response';

// SECURITY: Block requests to private/internal IP ranges (SSRF prevention)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local / AWS metadata
  /^0\./,                      // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // Carrier-grade NAT
  /^198\.18\./,                // Benchmark testing
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  'kubernetes.default',
];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block known internal hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // Block private/internal IP addresses
    if (BLOCKED_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
      return false;
    }

    // Block URLs with credentials (user:pass@host)
    if (parsed.username || parsed.password) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url || !isValidUrl(url)) {
      return apiError('Please provide a valid URL', 400);
    }

    const brief = await extractBriefFromUrlServer(url);
    return apiSuccess({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown extraction error';
    return apiError(message, 500);
  }
}
