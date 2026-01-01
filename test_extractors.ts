import { extractWithLogging } from './src/functions/extractors/unified_extractor';
import { getConfigForPlatform } from './src/functions/extractors/configs';

interface TestCase {
  url: string;
  platform: string;
  expectedTitle?: string;
  expectedMinContentLength?: number;
  expectedMinSources?: number;
}

/**
 * Test a single URL
 */
async function testExtractor(testCase: TestCase) {
  console.log('\n' + '='.repeat(100));
  console.log(`TESTING: ${testCase.platform.toUpperCase()}`);
  console.log(`URL: ${testCase.url}`);
  console.log('='.repeat(100) + '\n');

  try {
    const config = getConfigForPlatform(testCase.platform);
    const result = await extractWithLogging(testCase.url, config);

    console.log('\n' + '='.repeat(100));
    console.log('EXTRACTION RESULTS');
    console.log('='.repeat(100));

    console.log(`\n📋 TITLE: ${result.title}`);
    console.log(`\n📄 CONTENT: ${result.content.length} characters`);
    console.log(`Preview: ${result.content.substring(0, 200)}...`);

    console.log(`\n📝 ABSTRACT: ${result.abstract?.length || 0} characters`);
    if (result.abstract) {
      console.log(`Preview: ${result.abstract.substring(0, 150)}...`);
    }

    console.log(`\n🔗 SOURCES: ${result.sources.length} found`);
    if (result.sources.length > 0) {
      console.log(`First 5 sources:`);
      result.sources.slice(0, 5).forEach((source, i) => {
        console.log(`  ${i + 1}. ${source.title}`);
        console.log(`     ${source.url}`);
      });
    }

    console.log(`\n📚 REFERENCES: ${result.references?.length || 0} characters`);

    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`  Navigation: ${(result.diagnostics.navigationTime / 1000).toFixed(2)}s`);
    console.log(`  Extraction: ${(result.diagnostics.extractionTime / 1000).toFixed(2)}s`);
    console.log(`  Total: ${(result.diagnostics.totalTime / 1000).toFixed(2)}s`);

    console.log(`\n🎯 QUALITY:`);
    console.log(`  Confidence: ${result.confidence.toUpperCase()}`);
    console.log(`  Warnings: ${result.warnings.length}`);
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }

    console.log(`\n🔍 SELECTORS TESTED:`);
    console.log(`  Content selectors:`);
    result.diagnostics.selectorsTestedForContent.forEach(s => {
      const status = s.found ? '✓' : '✗';
      console.log(`    ${status} ${s.selector} ${s.found ? `(${s.count} found)` : ''}`);
      if (s.found && s.textPreview) {
        console.log(`      Preview: ${s.textPreview.substring(0, 60)}...`);
      }
    });

    console.log(`\n  Wait selectors:`);
    result.diagnostics.selectorsTestedForWait.forEach(s => {
      const status = s.found ? '✓' : '✗';
      console.log(`    ${status} ${s.selector}`);
    });

    console.log(`\n  Modals closed: ${result.diagnostics.modalsClosed}`);

    // Validate against expectations
    console.log(`\n✅ VALIDATION:`);
    let passed = true;

    if (testCase.expectedTitle && !result.title.toLowerCase().includes(testCase.expectedTitle.toLowerCase())) {
      console.log(`  ✗ Title mismatch (expected to contain "${testCase.expectedTitle}")`);
      passed = false;
    } else if (testCase.expectedTitle) {
      console.log(`  ✓ Title matches expectation`);
    }

    if (testCase.expectedMinContentLength && result.content.length < testCase.expectedMinContentLength) {
      console.log(`  ✗ Content too short (expected >= ${testCase.expectedMinContentLength}, got ${result.content.length})`);
      passed = false;
    } else if (testCase.expectedMinContentLength) {
      console.log(`  ✓ Content length meets expectation`);
    }

    if (testCase.expectedMinSources && result.sources.length < testCase.expectedMinSources) {
      console.log(`  ✗ Not enough sources (expected >= ${testCase.expectedMinSources}, got ${result.sources.length})`);
      passed = false;
    } else if (testCase.expectedMinSources) {
      console.log(`  ✓ Source count meets expectation`);
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log(`RESULT: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(100));

    return { testCase, result, passed };

  } catch (error) {
    console.log('\n' + '='.repeat(100));
    console.log('ERROR OCCURRED');
    console.log('='.repeat(100));
    console.log(`\n❌ ${error.message}`);
    if (error.stack) {
      console.log(`\nStack trace:`);
      console.log(error.stack);
    }
    console.log(`\n${'='.repeat(100)}`);
    console.log(`RESULT: ❌ FAIL`);
    console.log('='.repeat(100));

    return { testCase, error, passed: false };
  }
}

/**
 * Run test suite
 */
async function runTestSuite(testCases: TestCase[]) {
  console.log('\n' + '╔' + '='.repeat(98) + '╗');
  console.log('║' + ' '.repeat(98) + '║');
  console.log('║' + '  🧪 EXTRACTOR TEST SUITE'.padEnd(98) + '║');
  console.log('║' + `  Testing ${testCases.length} URLs`.padEnd(98) + '║');
  console.log('║' + ' '.repeat(98) + '║');
  console.log('╚' + '='.repeat(98) + '╝');

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    console.log(`\n[${i + 1}/${testCases.length}] Starting test...`);
    const result = await testExtractor(testCases[i]);
    results.push(result);

    // Wait between tests
    if (i < testCases.length - 1) {
      console.log(`\nWaiting 5 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log('\n\n' + '╔' + '='.repeat(98) + '╗');
  console.log('║' + ' '.repeat(98) + '║');
  console.log('║' + '  📊 TEST SUMMARY'.padEnd(98) + '║');
  console.log('║' + ' '.repeat(98) + '║');
  console.log('╚' + '='.repeat(98) + '╝\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  console.log(`\nResults by test:`);
  results.forEach((r, i) => {
    const status = r.passed ? '✅' : '❌';
    const confidence = r.result?.confidence ? `[${r.result.confidence}]` : '';
    console.log(`  ${status} ${i + 1}. ${r.testCase.platform}: ${r.testCase.url.substring(0, 60)}... ${confidence}`);
  });

  console.log(`\n📁 Logs and screenshots saved to: ./extraction_logs/`);

  return results;
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: npx tsx test_extractors.ts <url1> [url2] [url3] ...

Example:
  npx tsx test_extractors.ts "https://chat.openai.com/share/abc123"

Platform auto-detection:
  - chatgpt.com or chat.openai.com → ChatGPT
  - perplexity.ai → Perplexity
  - claude.ai or anthropic.com → Anthropic/Claude
  - google.com → Google
  - Others → Generic

You can also specify platform:
  npx tsx test_extractors.ts chatgpt:https://chat.openai.com/share/abc123
  `);
  process.exit(1);
}

// Parse URLs and detect platforms
const testCases: TestCase[] = args.map(arg => {
  let url = arg;
  let platform = 'generic';

  // Check if platform is specified (platform:url format)
  if (arg.includes(':http')) {
    const parts = arg.split(':');
    platform = parts[0];
    url = parts.slice(1).join(':');
  } else {
    // Auto-detect platform
    const lowerUrl = arg.toLowerCase();
    if (lowerUrl.includes('chat.openai.com') || lowerUrl.includes('chatgpt.com')) {
      platform = 'chatgpt';
    } else if (lowerUrl.includes('perplexity.ai')) {
      platform = 'perplexity';
    } else if (lowerUrl.includes('claude.ai') || lowerUrl.includes('anthropic.com')) {
      platform = 'anthropic';
    } else if (lowerUrl.includes('google.com')) {
      platform = 'google';
    }
  }

  return { url, platform };
});

// Run tests
runTestSuite(testCases).then(results => {
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error running test suite:', error);
  process.exit(1);
});
