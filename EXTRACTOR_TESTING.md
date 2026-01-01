# Extractor Testing Guide

This guide explains how to test the brief extractor system with real URLs.

## Quick Start

Test a URL:

```bash
npx tsx test_extractors.ts "https://perplexity.ai/search/your-url-here"
```

Test multiple URLs:

```bash
npx tsx test_extractors.ts \
  "https://chat.openai.com/share/abc123" \
  "https://www.perplexity.ai/search/xyz789" \
  "https://claude.ai/chat/def456"
```

## Platform Auto-Detection

The script automatically detects the platform:

- `chatgpt.com` or `chat.openai.com` → ChatGPT extractor
- `perplexity.ai` → Perplexity extractor
- `claude.ai` or `anthropic.com` → Anthropic/Claude extractor
- `google.com` → Google extractor
- Others → Generic extractor

## Manual Platform Selection

You can manually specify the platform:

```bash
npx tsx test_extractors.ts chatgpt:https://example.com/some-url
npx tsx test_extractors.ts perplexity:https://example.com/another-url
```

## What Gets Tested

For each URL, the extractor tests:

1. **Browser Launch** - Can we start a headless browser?
2. **Navigation** - Can we reach the URL?
3. **Modal Detection** - Are there any login/signup popups?
4. **Content Selectors** - Which selectors find content?
5. **Title Extraction** - Can we get the page title?
6. **Content Extraction** - Can we extract the main text?
7. **Section Parsing** - Can we find abstract/conclusion?
8. **Source Extraction** - Can we find reference links?
9. **Validation** - Is the quality acceptable?

## Output

The test script provides:

### Console Output

- Real-time logs with timestamps
- Color-coded messages (info/warn/error)
- Step-by-step progress
- Final results summary

### Saved Files

All diagnostic files are saved to `./extraction_logs/`:

- `{platform}_{timestamp}_log.json` - Complete log history
- `{platform}_{timestamp}_initial_page.html` - HTML before modal close
- `{platform}_{timestamp}_after_modal_close.html` - HTML after modal close
- `{platform}_{timestamp}_after_navigation.png` - Screenshot after page load
- `{platform}_{timestamp}_before_extraction.png` - Screenshot before extraction
- `{platform}_{timestamp}_error_state.png` - Screenshot if error occurs (if applicable)

## Reading the Results

### Confidence Levels

- **HIGH**: Extraction was successful, all key data found
- **MEDIUM**: Extraction worked but some issues (e.g., no sources, short content)
- **LOW**: Extraction likely failed, missing critical data

### Warnings

Common warnings:
- `Title is missing or too short` - Couldn't extract a valid title
- `Content is too short` - Extracted less than 100 characters
- `Content seems short` - Extracted 100-500 characters (may be incomplete)
- `No sources found` - No reference links detected
- `No abstract/conclusion found` - Couldn't identify summary section

### Selector Results

The test shows which selectors worked:

```
✓ [data-testid="copilot_answer"] (1 found)
  Preview: This is the main content that was found...
✗ .prose
✗ .answer-content
```

This helps diagnose selector issues when extraction fails.

## Common Issues

### 1. Cloudflare Challenge

```
[WARN] [CLOUDFLARE] Detected Cloudflare challenge
```

**Solution**: The extractor waits 30s for the challenge to complete. If it still fails, the site may require a real browser.

### 2. Authentication Required

```
[WARN] [AUTH] Detected auth requirement or private content
```

**Solution**: The URL may be private or require login. Try a public URL instead.

### 3. No Content Found

```
[WARN] [WAIT_CONTENT] No content selectors matched
```

**Solution**: The page structure may have changed. Check the saved HTML files to see what selectors exist.

### 4. Navigation Timeout

```
[ERROR] [NAVIGATION] All navigation attempts failed
```

**Solution**: The site may be slow or blocking automated browsers. Increase timeout in config.

## Debugging Failed Extractions

When an extraction fails:

1. **Check the logs**: `extraction_logs/{platform}_{timestamp}_log.json`
2. **Review screenshots**: See what the page looked like
3. **Inspect HTML**: Look for actual selectors in the saved HTML
4. **Check warnings**: See what specific issues occurred

## Adding Test Expectations

You can add expectations to validate results:

```bash
# In test_extractors.ts, add to testCases:
{
  url: "https://example.com",
  platform: "perplexity",
  expectedTitle: "AI Trends",              // Title should contain this
  expectedMinContentLength: 1000,          // At least 1000 chars
  expectedMinSources: 5                    // At least 5 sources
}
```

## Example Session

```bash
$ npx tsx test_extractors.ts "https://www.perplexity.ai/search/ai-trends"

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🧪 EXTRACTOR TEST SUITE                                                     ║
║  Testing 1 URLs                                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

[1/1] Starting test...

════════════════════════════════════════════════════════════════════════════════
TESTING: PERPLEXITY
URL: https://www.perplexity.ai/search/ai-trends
════════════════════════════════════════════════════════════════════════════════

[0.05s] [INFO] [INIT] Starting extraction for perplexity
[0.12s] [INFO] [BROWSER_LAUNCH] Launching headless browser...
[1.34s] [INFO] [BROWSER_LAUNCH] Browser launched successfully
[1.35s] [INFO] [NAVIGATION] Navigating to https://www.perplexity.ai/search/ai-trends
[1.35s] [INFO] [NAVIGATION] Attempt 1/3...
[3.87s] [INFO] [NAVIGATION] Page loaded successfully in 2521ms
[3.89s] [INFO] [WAIT] Waiting for JavaScript to load...
[6.90s] [INFO] [MODAL_CLOSE] Attempting to close modals...
[6.92s] [INFO] [MODAL_CLOSE] Closed 0 modals
[6.93s] [INFO] [WAIT_CONTENT] Waiting for content selectors...
[7.01s] [INFO] [WAIT_CONTENT] ✓ Found content with: [data-testid="copilot_answer"]
[7.02s] [INFO] [TEST_SELECTORS] Testing 10 content selectors...
[7.05s] [INFO] [TEST_SELECTORS] ✓ [data-testid="copilot_answer"]
[7.08s] [INFO] [EXTRACT_CONTENT] Extracting main content...
[7.10s] [INFO] [EXTRACT_CONTENT] ✓ Extracted 3421 chars using: [data-testid="copilot_answer"]
[7.15s] [INFO] [EXTRACT_SOURCES] Found 12 unique source URLs
[7.17s] [INFO] [VALIDATION] Confidence: high
[7.19s] [INFO] [COMPLETE] Extraction completed in 7.14s

════════════════════════════════════════════════════════════════════════════════
EXTRACTION RESULTS
════════════════════════════════════════════════════════════════════════════════

📋 TITLE: AI Trends 2026 - Perplexity

📄 CONTENT: 3421 characters
Preview: Artificial Intelligence continues to evolve at an unprecedented pace...

📝 ABSTRACT: 234 characters
Preview: In conclusion, the AI landscape in 2026 is characterized by...

🔗 SOURCES: 12 found

⚡ PERFORMANCE:
  Navigation: 2.52s
  Extraction: 3.21s
  Total: 7.14s

🎯 QUALITY:
  Confidence: HIGH
  Warnings: 0

════════════════════════════════════════════════════════════════════════════════
RESULT: ✅ PASS
════════════════════════════════════════════════════════════════════════════════
```

## Next Steps

After testing:

1. Review logs and screenshots in `extraction_logs/`
2. Note which selectors worked/failed
3. Update platform configs if needed
4. Report issues with specific URLs
5. Iterate on extractor improvements
