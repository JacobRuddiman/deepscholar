# Brief Model Field Documentation

This document explains the purpose and usage of each field in the `Brief` database model and the corresponding `BriefData` type.

## Database Model (Prisma Schema)

Located in: `prisma/schema.prisma` (lines 196-231)

### Core Content Fields

#### `title` (String, required)
- **Purpose**: The main heading/title of the research brief
- **Source**: Extracted from the first major heading in the AI response or page title
- **Usage**: Displayed prominently in brief listings, search results, and detail pages
- **Constraints**: Should be concise (typically < 200 chars)
- **Example**: "Quantum Computing Error Correction: Latest Developments"

#### `prompt` (String, required)
- **Purpose**: The original user question or research request
- **Source**: Extracted from sections labeled "Question:", "Prompt:", "User asked:", etc.
- **Usage**: Shows what the user wanted to know; helps with search/discovery
- **Constraints**: Can be empty string if not found
- **Example**: "What are the latest developments in quantum computing error correction?"

#### `response` (String, required)
- **Purpose**: The main body content of the AI's research response
- **Source**: All content excluding abstract, references, thinking, and prompt sections
- **Usage**: Primary content displayed to users; searchable
- **Constraints**: Should contain substantial content (typically > 500 chars)
- **Example**: The detailed analysis sections explaining concepts, findings, etc.
- **Note**: In the database, this is the main research content. Separate from `abstract`.

#### `abstract` (String, optional)
- **Purpose**: Summary, conclusion, or key takeaways section
- **Source**: Sections labeled "Summary", "Conclusion", "Key Takeaways", "TL;DR", etc.
- **Usage**: Quick overview for users; shown in previews/cards
- **Constraints**: Typically shorter than main content (< 5000 chars ideal)
- **Example**: "Quantum error correction has made significant breakthroughs with Google's demonstration of below-threshold performance..."

#### `thinking` (String, optional)
- **Purpose**: AI's reasoning process or chain-of-thought
- **Source**: Sections labeled "Thinking:", "Reasoning:", "My approach:", etc.
- **Usage**: Educational value; transparency into AI process
- **Constraints**: May not be present in all AI platforms
- **Example**: "This requires examining multiple factors. I should structure this by looking at: 1. Direct impacts..."

### Metadata Fields

#### `modelId` (String, required, foreign key)
- **Purpose**: Links to the `ResearchAIModel` that generated this brief
- **Source**: Determined by platform (ChatGPT, Claude, Perplexity, etc.)
- **Usage**: Filtering, attribution, platform-specific features
- **Relationships**: References `ResearchAIModel.id`

#### `userId` (String, required, foreign key)
- **Purpose**: The user who created/uploaded this brief
- **Source**: Current authenticated user during upload
- **Usage**: Ownership, permissions, user profile pages
- **Relationships**: References `User.id`

#### `slug` (String, optional, unique)
- **Purpose**: URL-friendly unique identifier
- **Source**: Auto-generated from title or manually set
- **Usage**: Clean URLs like `/brief/quantum-error-correction-2024`
- **Constraints**: Must be unique across all briefs

### Engagement Metrics

#### `viewCount` (Int, default: 0)
- **Purpose**: Number of times this brief has been viewed
- **Source**: Incremented when users view the brief detail page
- **Usage**: Popularity metrics, recommendations
- **Note**: Tracked separately in `BriefView` for per-user tracking

#### `readTime` (Int, optional)
- **Purpose**: Estimated reading time in minutes
- **Source**: Calculated from content length
- **Usage**: User experience (shows "15 min read")
- **Calculation**: ~200-250 words per minute

#### `accuracy` (Float, optional)
- **Purpose**: Quality/accuracy rating (0-1 scale or 1-5 scale)
- **Source**: Calculated from reviews, AI analysis, or manual curation
- **Usage**: Quality filtering, ranking, trust signals

### Publishing & Status

#### `published` (Boolean, default: true)
- **Purpose**: Whether brief is publicly visible
- **Source**: Set by user or admin
- **Usage**: Content moderation, draft management
- **Note**: `false` means only owner/admins can see it

#### `isDraft` (Boolean, default: false)
- **Purpose**: Whether this is a work-in-progress
- **Source**: User explicitly marks as draft
- **Usage**: Separate draft view, prevent accidental publication

#### `isActive` (Boolean, default: true)
- **Purpose**: Soft delete flag
- **Source**: Admin moderation or user deletion
- **Usage**: Hide without permanently deleting (preserves relationships)

### Versioning

#### `parentBriefId` (String, optional, foreign key)
- **Purpose**: Links to the original brief if this is a revised version
- **Source**: Set when creating a new version of existing brief
- **Usage**: Version history, tracking changes over time
- **Relationships**: Self-referential to `Brief.id`

#### `versionNumber` (Int, default: 1)
- **Purpose**: Sequential version number
- **Source**: Auto-incremented when new version created
- **Usage**: Display version history, track iterations

#### `changeLog` (String, optional)
- **Purpose**: Description of what changed in this version
- **Source**: User input when creating new version
- **Usage**: Version comparison, change tracking
- **Example**: "Updated with 2024 research findings; added section on QLDPC codes"

### Timestamps

#### `createdAt` (DateTime, default: now)
- **Purpose**: When brief was first created
- **Source**: Auto-set by database
- **Usage**: Sorting, filtering by date, analytics

#### `updatedAt` (DateTime, auto-updated)
- **Purpose**: When brief was last modified
- **Source**: Auto-updated by Prisma
- **Usage**: Show freshness, track activity

## Related Models & Relationships

### `sources` (Source[], many-to-many)
- **Purpose**: Citations/references with URLs
- **Storage**: Separate `Source` table with join table
- **Usage**: Source attribution, link tracking
- **Example**: `{ title: "Nature Physics", url: "https://nature.com/..." }`

### `references` (BriefReference[])
- **Purpose**: Inline citations with highlighted text and context
- **Storage**: `BriefReference` table
- **Usage**: Precise attribution, fact-checking, hover citations
- **Structure**: `{ highlightedText: "...", sourceId: "...", context: "..." }`

### `categories` (Category[], many-to-many)
- **Purpose**: Topical classification
- **Usage**: Browsing, filtering, recommendations
- **Examples**: "Quantum Computing", "Machine Learning", "Climate Science"

### `reviews` (Review[])
- **Purpose**: User reviews and ratings
- **Usage**: Quality assessment, community feedback

### `upvotes` (BriefUpvote[])
- **Purpose**: User upvotes (Reddit-style)
- **Usage**: Ranking, popularity

### `savedBy` (SavedBrief[])
- **Purpose**: Users who bookmarked this brief
- **Usage**: Save for later, personal collections

### `viewedBy` (BriefView[])
- **Purpose**: Track individual user views
- **Usage**: "Viewed" status, analytics, recommendations

## BriefData Type (TypeScript)

Located in: `src/functions/types.ts` (lines 10-24)

This is the intermediate format used during extraction and parsing:

```typescript
export type BriefData = {
  title: string;              // → Brief.title
  response: string;           // → Brief.response
  abstract: string;           // → Brief.abstract
  sources: BriefSource[];     // → Source[] relation
  thinking?: string;          // → Brief.thinking
  prompt?: string;            // → Brief.prompt
  model: "openai" | "perplexity" | "anthropic" | "other";  // → ResearchAIModel lookup
  rawHtml?: string;           // Temporary; used for debugging
  references?: string;        // → Parsed into BriefReference[]

  // Quality metrics
  confidence?: 'high' | 'medium' | 'low';
  warnings?: string[];
};
```

### Field Mapping: BriefData → Brief Model

| BriefData Field | Brief Model Field | Notes |
|----------------|-------------------|-------|
| `title` | `title` | Direct mapping |
| `response` | `response` | Direct mapping |
| `abstract` | `abstract` | Direct mapping |
| `prompt` | `prompt` | Direct mapping |
| `thinking` | `thinking` | Direct mapping |
| `sources` | `sources` relation | Create/link Source records |
| `references` (text) | `references` relation | Parse into BriefReference records |
| `model` | `modelId` | Lookup ResearchAIModel by name |
| `confidence` | `accuracy` | Convert to numeric scale |
| `rawHtml` | - | Not stored (debugging only) |

## Content Parsing Strategy

### Parsing Pipeline

The extraction pipeline routes URLs to platform-specific or generic extractors:

```
URL → detectPlatform()
  ├─ google-docs  → extractFromGoogleDocs()      (dedicated)
  ├─ chatgpt      → extractFromChatGPTDeepResearch() (dedicated, share links)
  ├─ perplexity   → extractFromPerplexity()       (dedicated, structured DOM)
  └─ others       → extractWithLogging()          (generic, selector-based)
                      ├─ Strategy 1: headless + stealth
                      └─ Strategy 2: non-headless fallback
```

**Platform-specific extractors** read semantic DOM directly (headings, citation elements, aria-labels) to produce structured `BriefData` without relying on text-based section parsing.

**Generic extractor** collapses content to text, then runs the content parser to identify sections:

1. **Extract raw content** from webpage/API
2. **Identify sections** using headers and patterns
3. **Separate into fields**:
   - `title`: First heading or page title
   - `prompt`: "Question:" or "User asked:" sections
   - `thinking`: "Thinking:" or "Reasoning:" sections
   - `abstract`: "Summary", "Conclusion", "Key Takeaways"
   - `references`: "References", "Sources", "Citations"
   - `response`: Everything else (main content)
4. **Parse sources** from references section
5. **Validate** minimum lengths, required fields
6. **Return** structured `BriefData`

All paths feed through `normalizeExtractedBriefData()` which runs the content parser for additional field extraction and deduplication.

### Section Identification Patterns

Configured in: `src/functions/parsers/parsing_patterns.json`

**Headers** are matched case-insensitively:
- Prompt: "Question:", "Prompt:", "You asked:", etc.
- Thinking: "Thinking:", "Reasoning:", "Analysis:", etc.
- Abstract: "Summary", "Conclusion", "Key Takeaways", "TL;DR", etc.
- References: "References", "Sources", "Citations", etc.

**Patterns** use regex for flexible matching across different AI platforms.

## Testing

Test script: `scripts/test-parser.ts`

Validates parsing against sample files:
- ChatGPT research format (with references)
- Perplexity Q&A format
- Claude with thinking section
- Minimal format (just title and content)

Run tests:
```bash
npx tsx scripts/test-parser.ts
```

## Best Practices

### Content Quality
- **Title**: Should be descriptive and < 200 chars
- **Response**: Main content should be substantial (> 500 chars)
- **Abstract**: Keep under 5000 chars for readability
- **Sources**: Always extract when available for attribution

### Data Integrity
- **Validate** all required fields before saving
- **Sanitize** HTML to prevent XSS (use `sanitizeHtml` from `validation.ts`)
- **Check duplicates** by URL or content hash
- **Set defaults** for optional fields consistently

### Performance
- **Batch process** source creation (avoid N+1 queries)
- **Index** frequently queried fields (`slug`, `published`, `createdAt`)
- **Cache** computed values like `readTime`

## Future Enhancements

Potential additions to the model:
- **Language detection** for multi-lingual support
- **Fact-check status** (verified, disputed, etc.)
- **Update frequency** (how often content should be refreshed)
- **Related briefs** (automatic linking of similar content)
- **Export metadata** (PDF settings, formatting preferences)
