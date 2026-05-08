'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';

/**
 * Server actions for exporting content
 */

/** Shape of brief data fetched from Prisma for export */
interface BriefForExport {
  id: string;
  title: string;
  slug: string | null;
  abstract: string | null;
  prompt: string;
  response: string;
  thinking: string | null;
  accuracy: number | null;
  readTime: number | null;
  createdAt: Date;
  author: { name: string | null; email?: string | null };
  model: { name: string; provider: string };
  categories: Array<{ name: string }>;
  sources: Array<{ id: string; title: string; url: string; createdAt: Date; updatedAt: Date }>;
  reviews: Array<{
    rating: number;
    content: string;
    author: { name: string | null };
  }>;
}

/**
 * Generate Markdown export of a brief
 */
export async function exportBriefAsMarkdown(briefId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        model: {
          select: {
            name: true,
            provider: true,
          },
        },
        categories: true,
        sources: true,
        reviews: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    // SECURITY: Only allow export of published briefs or user's own briefs
    if (!brief.published && brief.userId !== session.user.id) {
      return { success: false, error: 'Not authorized to export this brief' };
    }

    // Generate markdown content
    const markdown = generateMarkdown(brief);

    return {
      success: true,
      data: {
        content: markdown,
        filename: `${brief.slug || briefId}.md`,
      },
    };
  } catch (error) {
    console.error('[Export] Failed to export brief as markdown:', error);
    return {
      success: false,
      error: 'Failed to export brief',
    };
  }
}

/**
 * Generate markdown string from brief data
 */
function generateMarkdown(brief: BriefForExport): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${brief.title}\n`);

  // Metadata
  lines.push(`**Author:** ${brief.author.name || 'Anonymous'}`);
  lines.push(`**Created:** ${new Date(brief.createdAt).toLocaleDateString()}`);
  lines.push(`**AI Model:** ${brief.model.name} (${brief.model.provider})`);

  if (brief.categories && brief.categories.length > 0) {
    lines.push(`**Categories:** ${brief.categories.map((c) => c.name).join(', ')}`);
  }

  if (brief.accuracy) {
    lines.push(`**Accuracy:** ${brief.accuracy.toFixed(1)}/5.0`);
  }

  if (brief.readTime) {
    lines.push(`**Read Time:** ${brief.readTime} minutes`);
  }

  lines.push('\n---\n');

  // Abstract
  if (brief.abstract) {
    lines.push(`## Abstract\n`);
    lines.push(`${brief.abstract}\n`);
  }

  // Prompt
  lines.push(`## Prompt\n`);
  lines.push('```');
  lines.push(brief.prompt);
  lines.push('```\n');

  // Response
  lines.push(`## Response\n`);
  lines.push(brief.response);
  lines.push('');

  // Thinking (if available)
  if (brief.thinking) {
    lines.push(`## AI Reasoning\n`);
    lines.push(brief.thinking);
    lines.push('');
  }

  // Sources
  if (brief.sources && brief.sources.length > 0) {
    lines.push(`## Sources\n`);
    brief.sources.forEach((source, index: number) => {
      lines.push(`${index + 1}. [${source.title || 'Source'}](${source.url})`);
    });
    lines.push('');
  }

  // Reviews
  if (brief.reviews && brief.reviews.length > 0) {
    lines.push(`## Reviews (${brief.reviews.length})\n`);
    brief.reviews.forEach((review) => {
      lines.push(`### ${review.author.name || 'Anonymous'} - ${review.rating}/5`);
      lines.push(`${review.content}\n`);
    });
  }

  // Footer
  lines.push('---\n');
  lines.push(`*Generated from DeepScholar on ${new Date().toLocaleDateString()}*`);
  lines.push(`*View online: ${process.env.NEXTAUTH_URL || 'https://deepscholar.ai'}/briefs/${brief.slug || brief.id}*`);

  return lines.join('\n');
}

/**
 * Generate HTML for PDF export
 */
export async function exportBriefAsHTML(briefId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        model: {
          select: {
            name: true,
            provider: true,
          },
        },
        categories: true,
        sources: true,
        reviews: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    // SECURITY: Only allow export of published briefs or user's own briefs
    if (!brief.published && brief.userId !== session.user.id) {
      return { success: false, error: 'Not authorized to export this brief' };
    }

    const html = generateHTML(brief);

    return {
      success: true,
      data: {
        content: html,
        filename: `${brief.slug || briefId}.html`,
      },
    };
  } catch (error) {
    console.error('[Export] Failed to export brief as HTML:', error);
    return {
      success: false,
      error: 'Failed to export brief',
    };
  }
}

/**
 * Generate HTML string for PDF printing
 */
function generateHTML(brief: BriefForExport): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brief.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #1a202c;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2d3748;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    h3 {
      color: #4a5568;
      margin-top: 20px;
    }
    .metadata {
      background-color: #f7fafc;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin-bottom: 30px;
    }
    .metadata p {
      margin: 5px 0;
    }
    .prompt {
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .response {
      margin: 20px 0;
    }
    .sources {
      background-color: #f7fafc;
      padding: 15px;
      border-radius: 8px;
    }
    .sources ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    .sources li {
      margin: 10px 0;
    }
    .review {
      border-left: 3px solid #cbd5e0;
      padding-left: 15px;
      margin: 15px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <h1>${brief.title}</h1>

  <div class="metadata">
    <p><strong>Author:</strong> ${brief.author.name || 'Anonymous'}</p>
    <p><strong>Created:</strong> ${new Date(brief.createdAt).toLocaleDateString()}</p>
    <p><strong>AI Model:</strong> ${brief.model.name} (${brief.model.provider})</p>
    ${brief.categories && brief.categories.length > 0 ? `<p><strong>Categories:</strong> ${brief.categories.map((c) => c.name).join(', ')}</p>` : ''}
    ${brief.accuracy ? `<p><strong>Accuracy:</strong> ${brief.accuracy.toFixed(1)}/5.0</p>` : ''}
    ${brief.readTime ? `<p><strong>Read Time:</strong> ${brief.readTime} minutes</p>` : ''}
  </div>

  ${brief.abstract ? `
  <h2>Abstract</h2>
  <p>${brief.abstract}</p>
  ` : ''}

  <h2>Prompt</h2>
  <div class="prompt">${brief.prompt}</div>

  <h2>Response</h2>
  <div class="response">${brief.response}</div>

  ${brief.thinking ? `
  <h2>AI Reasoning</h2>
  <div>${brief.thinking}</div>
  ` : ''}

  ${brief.sources && brief.sources.length > 0 ? `
  <h2>Sources</h2>
  <div class="sources">
    <ol>
      ${brief.sources.map((source) => `
        <li>
          <a href="${source.url}">${source.title || 'Source'}</a>
        </li>
      `).join('')}
    </ol>
  </div>
  ` : ''}

  ${brief.reviews && brief.reviews.length > 0 ? `
  <h2>Reviews (${brief.reviews.length})</h2>
  ${brief.reviews.map((review) => `
    <div class="review">
      <h3>${review.author.name || 'Anonymous'} - ${review.rating}/5</h3>
      <p>${review.content}</p>
    </div>
  `).join('')}
  ` : ''}

  <div class="footer">
    <p>Generated from DeepScholar on ${new Date().toLocaleDateString()}</p>
    <p>View online: ${process.env.NEXTAUTH_URL || 'https://deepscholar.ai'}/briefs/${brief.slug || brief.id}</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Track export for analytics
 */
async function trackExport(briefId: string, format: string, filename: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.exportHistory.create({
      data: {
        userId: session.user.id,
        exportType: 'brief',
        exportFormat: format,
        targetId: briefId,
        filename,
      },
    });
  } catch (error) {
    console.error('[Export] Failed to track export:', error);
  }
}
