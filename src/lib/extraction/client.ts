import { normalizeExtractedBriefData } from './normalize';
import { detectPlatform, extractGoogleDocId, mapPlatformToModel } from './platform';
import type { BriefData, BriefSource } from '@/functions/types';

function extractSourcesFromDocument(document: Document, baseUrl: string): BriefSource[] {
  const seen = new Set<string>();
  const sources: BriefSource[] = [];

  const anchors = Array.from(document.querySelectorAll('a[href]'));
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) {
      continue;
    }

    try {
      const url = new URL(href, baseUrl).toString();
      if (!/^https?:/i.test(url) || seen.has(url)) {
        continue;
      }

      seen.add(url);
      sources.push({
        title: anchor.textContent?.trim() || new URL(url).hostname.replace(/^www\./, ''),
        url,
      });
    } catch {
      continue;
    }
  }

  return sources;
}

function buildBriefFromHtml(html: string, url: string, platform: string): BriefData | null {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const response = document.body?.textContent?.trim() || '';

  if (response.length < 50) {
    return null;
  }

  return normalizeExtractedBriefData(
    {
      title:
        document.title ||
        document.querySelector('h1')?.textContent?.trim() ||
        'Untitled Brief',
      response,
      abstract: '',
      sources: extractSourcesFromDocument(document, url),
      thinking: '',
      prompt: '',
      model: mapPlatformToModel(platform),
      rawHtml: html,
      references: '',
      warnings: ['Used client-side direct HTML extraction'],
    },
    { platform }
  );
}

async function tryFetchHtmlDirectly(url: string, platform: string): Promise<BriefData | null> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    const html = await response.text();
    return buildBriefFromHtml(html, response.url || url, platform);
  } catch {
    return null;
  }
}

async function tryFetchGoogleDocsText(url: string): Promise<BriefData | null> {
  const docId = extractGoogleDocId(url);
  if (!docId) {
    return null;
  }

  try {
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const response = await fetch(exportUrl, {
      credentials: 'include',
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/plain')) {
      return null;
    }

    const text = await response.text();
    if (text.trim().length < 50) {
      return null;
    }

    return normalizeExtractedBriefData(
      {
        title: 'Google Docs Export',
        response: text,
        abstract: '',
        sources: [],
        thinking: '',
        prompt: '',
        model: 'other',
        rawHtml: text,
        references: '',
        warnings: ['Used client-side Google Docs text export'],
      },
      { platform: 'google-docs' }
    );
  } catch {
    return null;
  }
}

async function tryClientSideExtraction(url: string): Promise<BriefData | null> {
  const platform = detectPlatform(url);

  if (platform === 'google-docs') {
    const docsResult = await tryFetchGoogleDocsText(url);
    if (docsResult) {
      return docsResult;
    }
  }

  return tryFetchHtmlDirectly(url, platform);
}

export async function extractBriefFromUrl(url: string): Promise<BriefData> {
  const directResult = await tryClientSideExtraction(url);
  if (directResult) {
    return directResult;
  }

  const response = await fetch('/api/extract-brief', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const payload = (await response.json()) as { brief?: BriefData; error?: string };

  if (!response.ok || !payload.brief) {
    throw new Error(payload.error || 'Failed to extract brief data');
  }

  return payload.brief;
}
