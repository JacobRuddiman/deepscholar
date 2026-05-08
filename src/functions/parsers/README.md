# Content Parser for DeepScholar

A robust parsing system for extracting structured data from AI-generated research content into the Brief model format.

## Overview

This parser takes raw extracted content (from ChatGPT, Claude, Perplexity, etc.) and intelligently separates it into distinct fields required by the Brief database model:

- **title**: Main heading
- **prompt**: Original user question
- **response**: Main content body
- **abstract**: Summary/conclusion
- **thinking**: AI reasoning process
- **references**: Bibliography text
- **sources**: Parsed citation objects

## Files

### Core Parser Module
- **`content_parser.ts`** - Main parsing logic with field extraction functions
  - `parseContent()` - Primary entry point
  - Individual extractors for each field type
  - Source parsing from references
  - Content cleanup utilities

### Configuration
- **`parsing_patterns.json`** - Centralized configuration for:
  - Section headers (100+ common variants)
  - Regex patterns for flexible matching
  - Citation format definitions
  - Structural markers (headings, lists, code blocks)
  - Cleanup patterns

### Testing
- **`scripts/test-parser.ts`** - Comprehensive test suite
- **`parser_test_data/`** - Sample files in various formats
  - ChatGPT research format
  - Perplexity Q&A format
  - Claude with thinking
  - Minimal format

## Usage

### Basic Parsing

```typescript
import { parseContent } from '@/functions/parsers/content_parser';

const rawContent = `
# Research on Quantum Computing

Question: What are the latest developments?

Quantum computing has made significant progress...

## Summary

Recent breakthroughs include...

## References

1. Nature Physics - https://nature.com/...
`;

const parsed = parseContent(rawContent);

console.log(parsed.title);      // "Research on Quantum Computing"
console.log(parsed.prompt);     // "What are the latest developments?"
console.log(parsed.response);   // Main content (excluding abstract/refs)
console.log(parsed.abstract);   // "Recent breakthroughs include..."
console.log(parsed.sources);    // [{ title: "Nature Physics", url: "..." }]
```

### With Configuration

```typescript
const parsed = parseContent(rawContent, optionalTitle, {
  preserveMarkdown: true,     // Keep markdown formatting
  extractSources: true,       // Parse sources from references
  minContentLength: 100,      // Minimum content validation
  maxAbstractLength: 5000     // Maximum abstract length
});

// Check what was successfully parsed
console.log(parsed.parsedSections);  // ['title', 'prompt', 'abstract', 'references', 'sources']

// Check for warnings
if (parsed.warnings.length > 0) {
  console.warn('Parsing warnings:', parsed.warnings);
}
```

### Converting to Brief Format

```typescript
import { toBriefFormat } from '@/functions/parsers/content_parser';

const briefData = toBriefFormat(parsed);
// Returns Partial<BriefData> ready for database insertion
```

## Pattern Matching

### Section Detection

The parser uses multiple strategies to identify sections:

1. **Markdown headings**: `## Summary`, `# References`
2. **Standalone headers**: Text on its own line
3. **Inline labels**: `Bottom Line: text continues...`
4. **With punctuation**: `Conclusion:`, `Summary)`

### Supported Headers

Configured in `parsing_patterns.json`:

**Prompt/Question** (15+ variants):
- Question, Prompt, Query, User Asked, Research Question, You said, Human, etc.

**Thinking/Reasoning** (9+ variants):
- Thinking, Thought Process, Reasoning, Analysis, Chain of Thought, etc.

**Abstract/Summary** (20+ variants):
- Abstract, Summary, Conclusion, Key Takeaways, TL;DR, Bottom Line, etc.

**References/Sources** (16+ variants):
- References, Sources, Citations, Bibliography, Further Reading, etc.

### Citation Formats

Automatically parses multiple citation styles:

**Markdown links**:
```
[Nature Physics](https://nature.com/article)
```

**Numbered citations**:
```
1. Article Title - https://example.com
2. Another Source https://example.com
```

**Bullet citations**:
```
- **Source Name**: Description - https://example.com
* Source Name - https://example.com
```

**Plain URLs**:
```
https://example.com (extracts domain as title)
```

## Testing

Run the test suite:

```bash
npm run test:parser
```

Expected output:
```
================================================================================
Content Parser Test Suite
================================================================================

Testing: ChatGPT Research Format
✓ Title matched
✓ Prompt found as expected
✓ Abstract found as expected
✓ References found as expected
✓ Found 6 sources (minimum 5)
✓ All checks passed

[... 3 more test cases ...]

Test Summary
Total tests: 4
Passed: 4
Failed: 0

🎉 All tests passed!
```

### Adding Test Cases

1. Create sample file in `parser_test_data/`
2. Add test case to `scripts/test-parser.ts`:

```typescript
{
  name: 'Your Format Name',
  file: 'your_sample.txt',
  expectedFields: {
    title: 'Expected Title',  // Optional: exact match
    hasPrompt: true,
    hasAbstract: true,
    hasThinking: false,
    hasReferences: true,
    minSourceCount: 3,
    minContentLength: 500
  }
}
```

## Architecture

### Parsing Pipeline

```
Raw Content
    ↓
Extract Title (from first heading or page title)
    ↓
Extract Prompt (find "Question:", etc. and remove)
    ↓
Extract Thinking (find "Thinking:", etc. and remove)
    ↓
Extract References (find "References:", etc. and separate)
    ↓
Extract Abstract (find "Summary:", etc. and separate)
    ↓
Clean Main Content (remaining text after extractions)
    ↓
Parse Sources (from references section)
    ↓
Validate & Return ParsedContent
```

### Field Separation Strategy

The parser processes sections in this order to avoid conflicts:

1. **Prompt** - Removed from content first (usually at start)
2. **Thinking** - Often appears before main content
3. **References** - Always at the end, separated completely
4. **Abstract** - Near end but before references
5. **Response** - Everything that remains

This ensures sections don't "steal" content from each other.

## Integration with Brief Upload

### Current Flow

```typescript
// In brief upload handler
const extractionResult = await extractWithLogging(url, config);

// Parse the extracted content
const parsed = parseContent(
  extractionResult.response,
  extractionResult.title
);

// Create brief in database
await createBrief({
  title: parsed.title,
  prompt: parsed.prompt,
  response: parsed.response,  // Note: response, not content
  abstract: parsed.abstract,
  thinking: parsed.thinking,
  // ... other fields
});

// Create sources
for (const source of parsed.sources) {
  await createOrLinkSource(brief.id, source);
}
```

### Field Mapping: Parser → Database

| Parser Output | Database Field | Notes |
|--------------|----------------|-------|
| `title` | `Brief.title` | Direct |
| `prompt` | `Brief.prompt` | Direct |
| `response` | `Brief.response` | **Name difference!** |
| `abstract` | `Brief.abstract` | Direct |
| `thinking` | `Brief.thinking` | Direct |
| `references` (text) | Parse to `BriefReference[]` | Needs processing |
| `sources` | `Source[]` relation | Create/link records |

## Best Practices

### When to Parse

Parse content **after** extraction but **before** database insertion:

```typescript
// ✓ GOOD
const extracted = await extractWithLogging(url, config);
const parsed = parseContent(extracted.response);
await saveBrief(parsed);

// ✗ BAD - Don't store unparsed content
await saveBrief(extracted);  // Missing field separation
```

### Handling Warnings

```typescript
const parsed = parseContent(content);

if (parsed.warnings.length > 0) {
  // Log for debugging
  console.warn('Parsing issues:', parsed.warnings);

  // Check critical fields
  if (!parsed.title || parsed.response.length < 100) {
    throw new Error('Insufficient content extracted');
  }
}
```

### Adding Custom Headers

Edit `parsing_patterns.json`:

```json
{
  "sections": {
    "abstract": {
      "headers": [
        "Summary",
        "Conclusion",
        "Your Custom Header"  // Add here
      ]
    }
  }
}
```

No code changes needed - configuration is loaded dynamically.

## Common Issues & Solutions

### Issue: Abstract Not Found

**Symptom**: `parsed.abstract === ''` but summary exists

**Solutions**:
1. Check if header matches patterns in `parsing_patterns.json`
2. Verify heading format (markdown vs plain text)
3. Add custom header to configuration
4. Check if inline format: `"Summary: text..."` vs standalone header

### Issue: Sources Not Parsed

**Symptom**: `parsed.sources.length === 0` but URLs present

**Solutions**:
1. Ensure references section detected (check `parsed.references`)
2. Verify citation format matches supported patterns
3. Check URLs are valid (start with http:// or https://)
4. Add custom citation format to `parsing_patterns.json`

### Issue: Content Too Short

**Symptom**: Warning about short content

**Cause**: Too much extracted into other sections

**Solutions**:
1. Review which sections were parsed: `console.log(parsed.parsedSections)`
2. Check if abstract or thinking is too large
3. Adjust min/max length constraints
4. Verify section boundaries are correct

## Performance

- **Typical parse time**: <10ms for 5000-character content
- **Memory usage**: Minimal, operates on string slices
- **No async operations**: Synchronous parsing for simplicity

## Future Enhancements

Potential additions:

- **Multi-language support**: Detect language and use appropriate patterns
- **Table extraction**: Parse structured data from markdown tables
- **Citation validation**: Verify URLs are accessible
- **Semantic analysis**: ML-based section detection
- **Auto-categorization**: Suggest categories from content
- **Quality scoring**: Rate completeness and structure

## Related Documentation

- **Brief Model**: See `BRIEF_MODEL_DOCUMENTATION.md` for field definitions
- **Extraction**: See `src/functions/extractors/` for content extraction
- **Validation**: See `src/lib/validation.ts` for sanitization

## Contributing

When adding new patterns or features:

1. Add test case to `parser_test_data/`
2. Update `parsing_patterns.json` if needed
3. Run `npm run test:parser` to verify
4. Document new patterns in this README

---

Built for DeepScholar - Intelligent parsing for AI-generated research content
