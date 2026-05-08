/**
 * Test the full extraction and parsing pipeline
 * Shows: Raw HTML → Extracted Content → Parsed Content
 *
 * Usage: npx tsx scripts/test-extraction-pipeline.ts <url>
 */

import { extractBriefFromUrlServer } from '../src/lib/extraction/server';
import { extractWithLogging } from '../src/functions/extractors/unified_extractor';
import { getConfigForPlatform } from '../src/functions/extractors/configs';
import { parseContent } from '../src/functions/parsers/content_parser';
import { detectPlatform } from '../src/lib/extraction/platform';
import * as fs from 'fs';
import * as path from 'path';

async function testPipeline(url: string) {
  console.log('\n' + '='.repeat(100));
  console.log('EXTRACTION AND PARSING PIPELINE TEST');
  console.log('='.repeat(100));
  console.log(`\nURL: ${url}\n`);

  const platform = detectPlatform(url);
  console.log(`Platform detected: ${platform}\n`);

  try {
    // Step 1: Extract with unified extractor
    console.log('━'.repeat(100));
    console.log('STEP 1: RAW EXTRACTION (Unified Extractor)');
    console.log('━'.repeat(100));

    const config = getConfigForPlatform(platform);
    const extractionResult = await extractWithLogging(url, config);

    console.log(`\n✓ Title: ${extractionResult.title}`);
    console.log(`✓ Response Length: ${extractionResult.response.length} chars`);
    console.log(`✓ Abstract Length: ${extractionResult.abstract?.length || 0} chars`);
    console.log(`✓ Sources Found: ${extractionResult.sources.length}`);
    console.log(`✓ Confidence: ${extractionResult.confidence}`);
    console.log(`✓ Warnings: ${extractionResult.warnings.length}`);

    if (extractionResult.warnings.length > 0) {
      console.log('\n  Warnings:');
      extractionResult.warnings.forEach(w => console.log(`  - ${w}`));
    }

    // Show first 500 chars of extracted response
    console.log('\n📄 EXTRACTED RESPONSE (first 500 chars):');
    console.log('-'.repeat(100));
    console.log(extractionResult.response.substring(0, 500));
    console.log('-'.repeat(100));

    // Step 2: Parse the extracted content
    console.log('\n━'.repeat(100));
    console.log('STEP 2: CONTENT PARSING');
    console.log('━'.repeat(100));

    const parsed = parseContent(extractionResult.response, extractionResult.title, {
      preserveMarkdown: true,
      extractSources: true,
      minContentLength: 50
    });

    console.log(`\n✓ Parsed Title: ${parsed.title}`);
    console.log(`✓ Parsed Response Length: ${parsed.response.length} chars`);
    console.log(`✓ Parsed Abstract Length: ${parsed.abstract?.length || 0} chars`);
    console.log(`✓ Parsed Prompt Length: ${parsed.prompt?.length || 0} chars`);
    console.log(`✓ Parsed Thinking Length: ${parsed.thinking?.length || 0} chars`);
    console.log(`✓ Parsed References Length: ${parsed.references?.length || 0} chars`);
    console.log(`✓ Parsed Sources: ${parsed.sources.length}`);
    console.log(`✓ Sections Found: ${parsed.parsedSections.join(', ')}`);
    console.log(`✓ Parser Warnings: ${parsed.warnings.length}`);

    if (parsed.warnings.length > 0) {
      console.log('\n  Parser Warnings:');
      parsed.warnings.forEach(w => console.log(`  - ${w}`));
    }

    // Show parsed sections
    console.log('\n📝 PARSED SECTIONS:');
    console.log('-'.repeat(100));

    if (parsed.prompt) {
      console.log('\n[PROMPT]');
      console.log(parsed.prompt.substring(0, 200));
    }

    if (parsed.thinking) {
      console.log('\n[THINKING]');
      console.log(parsed.thinking.substring(0, 200));
    }

    if (parsed.abstract) {
      console.log('\n[ABSTRACT]');
      console.log(parsed.abstract.substring(0, 300));
    }

    console.log('\n[MAIN RESPONSE] (first 500 chars)');
    console.log(parsed.response.substring(0, 500));

    if (parsed.references) {
      console.log('\n[REFERENCES] (first 300 chars)');
      console.log(parsed.references.substring(0, 300));
    }

    console.log('-'.repeat(100));

    // Step 3: Compare lengths
    console.log('\n━'.repeat(100));
    console.log('STEP 3: LENGTH COMPARISON');
    console.log('━'.repeat(100));

    const extractedTotal = extractionResult.response.length;
    const parsedTotal =
      parsed.response.length +
      (parsed.abstract?.length || 0) +
      (parsed.prompt?.length || 0) +
      (parsed.thinking?.length || 0) +
      (parsed.references?.length || 0);

    console.log(`\nExtracted Response: ${extractedTotal} chars`);
    console.log(`Parsed Total (all sections): ${parsedTotal} chars`);
    console.log(`  - Response: ${parsed.response.length} chars`);
    console.log(`  - Abstract: ${parsed.abstract?.length || 0} chars`);
    console.log(`  - Prompt: ${parsed.prompt?.length || 0} chars`);
    console.log(`  - Thinking: ${parsed.thinking?.length || 0} chars`);
    console.log(`  - References: ${parsed.references?.length || 0} chars`);

    const diff = extractedTotal - parsedTotal;
    const percentLost = ((diff / extractedTotal) * 100).toFixed(2);

    console.log(`\nDifference: ${diff} chars (${percentLost}% ${diff > 0 ? 'lost' : 'gained'})`);

    if (Math.abs(diff) > 100) {
      console.log(`\n⚠️  WARNING: Significant content difference detected!`);
      if (diff > 0) {
        console.log(`   ${diff} characters were lost during parsing.`);
      } else {
        console.log(`   ${Math.abs(diff)} extra characters appeared during parsing.`);
      }
    }

    // Step 4: Full pipeline (extractBriefFromUrl)
    console.log('\n━'.repeat(100));
    console.log('STEP 4: FULL PIPELINE (extractBriefFromUrl)');
    console.log('━'.repeat(100));

    const finalBrief = await extractBriefFromUrlServer(url);

    console.log(`\n✓ Final Title: ${finalBrief.title}`);
    console.log(`✓ Final Response Length: ${finalBrief.response.length} chars`);
    console.log(`✓ Final Abstract Length: ${finalBrief.abstract?.length || 0} chars`);
    console.log(`✓ Final Prompt: ${finalBrief.prompt?.length || 0} chars`);
    console.log(`✓ Final Thinking: ${finalBrief.thinking?.length || 0} chars`);
    console.log(`✓ Final Sources: ${finalBrief.sources.length}`);
    console.log(`✓ Model: ${finalBrief.model}`);
    console.log(`✓ Confidence: ${finalBrief.confidence || 'N/A'}`);

    // Save detailed logs
    const timestamp = Date.now();
    const logDir = path.join(process.cwd(), 'extraction_logs');

    const detailedLog = {
      timestamp,
      url,
      platform,
      extraction: {
        title: extractionResult.title,
        responseLength: extractionResult.response.length,
        response: extractionResult.response,
        abstract: extractionResult.abstract,
        sources: extractionResult.sources.length,
        confidence: extractionResult.confidence,
        warnings: extractionResult.warnings
      },
      parsing: {
        title: parsed.title,
        responseLength: parsed.response.length,
        response: parsed.response,
        abstract: parsed.abstract,
        prompt: parsed.prompt,
        thinking: parsed.thinking,
        references: parsed.references,
        sources: parsed.sources.length,
        parsedSections: parsed.parsedSections,
        warnings: parsed.warnings
      },
      final: {
        title: finalBrief.title,
        responseLength: finalBrief.response.length,
        response: finalBrief.response,
        abstract: finalBrief.abstract,
        prompt: finalBrief.prompt,
        thinking: finalBrief.thinking,
        sources: finalBrief.sources.length,
        model: finalBrief.model
      },
      comparison: {
        extractedLength: extractedTotal,
        parsedTotalLength: parsedTotal,
        finalLength: finalBrief.response.length,
        difference: diff,
        percentLost: parseFloat(percentLost)
      }
    };

    const logFile = path.join(logDir, `pipeline_test_${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(detailedLog, null, 2));

    console.log(`\n✓ Detailed logs saved to: ${logFile}`);

    console.log('\n' + '='.repeat(100));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Main execution
const url = process.argv[2];

if (!url) {
  console.error('Usage: npx tsx scripts/test-extraction-pipeline.ts <url>');
  console.error('\nExample:');
  console.error('  npx tsx scripts/test-extraction-pipeline.ts https://chatgpt.com/share/...');
  process.exit(1);
}

testPipeline(url).catch(console.error);
