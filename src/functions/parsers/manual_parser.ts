// @ts-nocheck - Parser utility with extensive regex match group accesses that are safe in context
import { BriefData, BriefSource } from '../types';

/**
 * Parses manually pasted content into structured BriefData
 * Intelligently extracts title, prompt, content, abstract, references, and sources
 */
export function parseManualBriefContent(rawContent: string): BriefData {
  if (!rawContent || !rawContent.trim()) {
    return {
      title: '',
      response: '',
      abstract: '',
      sources: [],
      thinking: '',
      prompt: '',
      model: 'other',
      rawHtml: '',
      references: ''
    };
  }

  const lines = rawContent.split('\n');
  let title = '';
  let prompt = '';
  let mainContent = '';
  let abstract = '';
  let references = '';
  const sources: BriefSource[] = [];

  // Step 1: Extract Title
  // Look for markdown heading (# Title) or first short line
  const firstLine = lines[0]?.trim() || '';
  if (firstLine.startsWith('# ')) {
    title = firstLine.substring(2).trim();
  } else if (firstLine.length > 0 && firstLine.length < 200) {
    // Check if second line is blank (indicates first line is title)
    if (lines.length > 1 && (!lines[1] || lines[1].trim() === '')) {
      title = firstLine;
    }
  }

  // Step 2: Detect sections using headers
  const sectionRegex = /^#{1,6}\s+(.+)$/gm;
  const sections: Array<{ level: number; title: string; start: number; end: number }> = [];

  let match;
  let lastIndex = 0;
  const fullText = rawContent;

  while ((match = sectionRegex.exec(fullText)) !== null) {
    const level = match[0].split(' ')[0].length; // Count # symbols
    const sectionTitle = match[1].toLowerCase();
    sections.push({
      level,
      title: sectionTitle,
      start: match.index,
      end: -1 // Will be set to next section start or end of content
    });
  }

  // Set end indices for sections
  for (let i = 0; i < sections.length; i++) {
    if (i < sections.length - 1) {
      sections[i].end = sections[i + 1].start;
    } else {
      sections[i].end = fullText.length;
    }
  }

  // Step 3: Find Prompt section
  const promptPatterns = [
    /^(?:question|prompt|query|research question):\s*(.+?)$/im,
    /^#{1,6}\s*(?:question|prompt|query|research question)\s*$/im
  ];

  for (const pattern of promptPatterns) {
    const promptMatch = fullText.match(pattern);
    if (promptMatch) {
      if (promptMatch[1]) {
        // Inline format: "Question: What is..."
        prompt = promptMatch[1].trim();
      } else {
        // Header format: "## Question" followed by content
        const headerIndex = promptMatch.index || 0;
        const section = sections.find(s => s.start === headerIndex);
        if (section) {
          prompt = fullText.substring(section.start, section.end)
            .replace(/^#{1,6}\s*.+$/m, '') // Remove header
            .trim();
        }
      }
      break;
    }
  }

  // Step 4: Find Abstract/Conclusion section
  const abstractSection = sections.find(s =>
    s.title.includes('conclusion') ||
    s.title.includes('summary') ||
    s.title.includes('abstract') ||
    s.title.includes('key takeaway') ||
    s.title.includes('tldr') ||
    s.title.includes('tl;dr') ||
    s.title.includes('in summary') ||
    s.title.includes('final thoughts')
  );

  if (abstractSection) {
    abstract = fullText.substring(abstractSection.start, abstractSection.end)
      .replace(/^#{1,6}\s*.+$/m, '') // Remove header
      .trim();
  }

  // Step 5: Find References section
  const referencesSection = sections.find(s =>
    s.title.includes('reference') ||
    s.title.includes('source') ||
    s.title.includes('citation') ||
    s.title.includes('bibliography') ||
    s.title.includes('further reading') ||
    s.title.includes('additional resource')
  );

  if (referencesSection) {
    references = fullText.substring(referencesSection.start, referencesSection.end)
      .replace(/^#{1,6}\s*.+$/m, '') // Remove header
      .trim();
  }

  // Step 6: Extract main content
  // Remove title, prompt, abstract, and references sections
  let contentText = fullText;

  // Remove title if it was a heading
  if (title && firstLine.startsWith('# ')) {
    contentText = contentText.substring(firstLine.length).trim();
  } else if (title && firstLine === title) {
    contentText = contentText.substring(firstLine.length).trim();
  }

  // Remove prompt section
  if (prompt) {
    for (const pattern of promptPatterns) {
      const promptMatch = contentText.match(pattern);
      if (promptMatch) {
        const section = sections.find(s =>
          contentText.substring(s.start, s.start + 100).toLowerCase().includes('prompt') ||
          contentText.substring(s.start, s.start + 100).toLowerCase().includes('question')
        );
        if (section) {
          const sectionContent = contentText.substring(section.start, section.end);
          contentText = contentText.replace(sectionContent, '');
        }
        break;
      }
    }
  }

  // Remove abstract section
  if (abstractSection) {
    const sectionContent = fullText.substring(abstractSection.start, abstractSection.end);
    contentText = contentText.replace(sectionContent, '');
  }

  // Remove references section
  if (referencesSection) {
    const sectionContent = fullText.substring(referencesSection.start, referencesSection.end);
    contentText = contentText.replace(sectionContent, '');
  }

  mainContent = contentText.trim();

  // Step 7: Extract URLs from entire content
  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  const foundUrls = new Set<string>();

  while ((linkMatch = markdownLinkRegex.exec(fullText)) !== null) {
    const linkText = linkMatch[1];
    const url = linkMatch[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!foundUrls.has(url)) {
        foundUrls.add(url);
        sources.push({
          title: linkText || url,
          url: url
        });
      }
    }
  }

  // Match plain URLs
  const urlRegex = /https?:\/\/[^\s<>"\')]+/g;
  let urlMatch;

  while ((urlMatch = urlRegex.exec(fullText)) !== null) {
    const url = urlMatch[0];
    // Clean up URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    if (!foundUrls.has(cleanUrl)) {
      foundUrls.add(cleanUrl);
      sources.push({
        title: extractDomainName(cleanUrl),
        url: cleanUrl
      });
    }
  }

  // Step 8: Set default title if none found
  if (!title || title.trim() === '') {
    // Try to extract from first heading in content
    const firstHeading = fullText.match(/^#{1,6}\s+(.+)$/m);
    if (firstHeading) {
      title = firstHeading[1].trim();
    } else {
      // Use first sentence or first 100 chars
      const firstSentence = mainContent.split(/[.!?]\s/)[0];
      title = firstSentence.length > 100
        ? firstSentence.substring(0, 100) + '...'
        : firstSentence || 'Untitled Brief';
    }
  }

  return {
    title: title.trim(),
    response: mainContent,
    abstract: abstract,
    sources: sources,
    thinking: '',
    prompt: prompt,
    model: 'other',
    rawHtml: rawContent,
    references: references
  };
}

/**
 * Extract domain name from URL for source title
 */
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
