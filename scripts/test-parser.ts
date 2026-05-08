/**
 * Parser Testing Script
 *
 * Tests the content parser against various sample formats to validate
 * correct extraction of brief fields (title, prompt, response, abstract, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseContent, ParsedContent } from '../src/functions/parsers/content_parser';

interface TestCase {
  name: string;
  file: string;
  expectedFields: {
    title?: string;
    hasPrompt: boolean;
    hasAbstract: boolean;
    hasThinking: boolean;
    hasReferences: boolean;
    minSourceCount: number;
    minContentLength: number;
  };
}

const TEST_CASES: TestCase[] = [
  {
    name: 'ChatGPT Research Format',
    file: 'chatgpt_research_sample.txt',
    expectedFields: {
      title: 'Xylia Wood: Comprehensive Research Analysis',
      hasPrompt: true,
      hasAbstract: true,
      hasThinking: false,
      hasReferences: true,
      minSourceCount: 5,
      minContentLength: 1000
    }
  },
  {
    name: 'Perplexity Q&A Format',
    file: 'perplexity_sample.txt',
    expectedFields: {
      hasPrompt: true,
      hasAbstract: true,
      hasThinking: false,
      hasReferences: true,
      minSourceCount: 4,
      minContentLength: 800
    }
  },
  {
    name: 'Claude with Thinking',
    file: 'claude_with_thinking.txt',
    expectedFields: {
      hasPrompt: true,
      hasAbstract: true,
      hasThinking: true,
      hasReferences: true,
      minSourceCount: 4,
      minContentLength: 1000
    }
  },
  {
    name: 'Minimal Format',
    file: 'minimal_format_sample.txt',
    expectedFields: {
      title: 'Neural Plasticity in Adult Brains',
      hasPrompt: false,
      hasAbstract: true,
      hasThinking: false,
      hasReferences: false,
      minSourceCount: 0,
      minContentLength: 200
    }
  }
];

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text: string) {
  console.log('\n' + colorize('='.repeat(80), 'cyan'));
  console.log(colorize(text, 'cyan'));
  console.log(colorize('='.repeat(80), 'cyan'));
}

function printSection(text: string) {
  console.log('\n' + colorize(text, 'blue'));
  console.log(colorize('-'.repeat(text.length), 'blue'));
}

function printSuccess(text: string) {
  console.log(colorize('✓ ', 'green') + text);
}

function printError(text: string) {
  console.log(colorize('✗ ', 'red') + text);
}

function printWarning(text: string) {
  console.log(colorize('⚠ ', 'yellow') + text);
}

function printInfo(key: string, value: any) {
  console.log(colorize(`  ${key}: `, 'gray') + value);
}

/**
 * Run a single test case
 */
function runTest(testCase: TestCase, testDataDir: string): boolean {
  printSection(`Testing: ${testCase.name}`);

  const filePath = path.join(testDataDir, testCase.file);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    printError(`File not found: ${filePath}`);
    return false;
  }

  // Read content
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  printInfo('File size', `${rawContent.length} characters`);

  // Parse content
  let parsed: ParsedContent;
  try {
    parsed = parseContent(rawContent);
  } catch (error) {
    printError(`Parsing failed: ${error.message}`);
    return false;
  }

  // Display results
  printInfo('Parsed sections', parsed.parsedSections.join(', '));
  if (parsed.warnings.length > 0) {
    parsed.warnings.forEach(w => printWarning(w));
  }

  console.log();

  // Validate results
  let allPassed = true;

  // Check title
  if (testCase.expectedFields.title) {
    if (parsed.title === testCase.expectedFields.title) {
      printSuccess(`Title matched: "${parsed.title}"`);
    } else {
      printError(`Title mismatch. Expected: "${testCase.expectedFields.title}", Got: "${parsed.title}"`);
      allPassed = false;
    }
  } else {
    printInfo('Title', `"${parsed.title}" (${parsed.title.length} chars)`);
  }

  // Check prompt
  const hasPrompt = parsed.prompt.length > 0;
  if (hasPrompt === testCase.expectedFields.hasPrompt) {
    printSuccess(`Prompt ${hasPrompt ? 'found' : 'not found'} as expected`);
    if (hasPrompt) {
      printInfo('Prompt', `"${parsed.prompt.substring(0, 100)}${parsed.prompt.length > 100 ? '...' : ''}"`);
    }
  } else {
    printError(`Prompt ${hasPrompt ? 'found' : 'not found'}, expected ${testCase.expectedFields.hasPrompt ? 'found' : 'not found'}`);
    allPassed = false;
  }

  // Check abstract
  const hasAbstract = parsed.abstract.length > 0;
  if (hasAbstract === testCase.expectedFields.hasAbstract) {
    printSuccess(`Abstract ${hasAbstract ? 'found' : 'not found'} as expected`);
    if (hasAbstract) {
      printInfo('Abstract length', `${parsed.abstract.length} chars`);
      printInfo('Abstract preview', `"${parsed.abstract.substring(0, 100)}..."`);
    }
  } else {
    printError(`Abstract ${hasAbstract ? 'found' : 'not found'}, expected ${testCase.expectedFields.hasAbstract ? 'found' : 'not found'}`);
    allPassed = false;
  }

  // Check thinking
  const hasThinking = parsed.thinking.length > 0;
  if (hasThinking === testCase.expectedFields.hasThinking) {
    printSuccess(`Thinking ${hasThinking ? 'found' : 'not found'} as expected`);
    if (hasThinking) {
      printInfo('Thinking length', `${parsed.thinking.length} chars`);
    }
  } else {
    printError(`Thinking ${hasThinking ? 'found' : 'not found'}, expected ${testCase.expectedFields.hasThinking ? 'found' : 'not found'}`);
    allPassed = false;
  }

  // Check references
  const hasReferences = parsed.references.length > 0;
  if (hasReferences === testCase.expectedFields.hasReferences) {
    printSuccess(`References ${hasReferences ? 'found' : 'not found'} as expected`);
    if (hasReferences) {
      printInfo('References length', `${parsed.references.length} chars`);
    }
  } else {
    printError(`References ${hasReferences ? 'found' : 'not found'}, expected ${testCase.expectedFields.hasReferences ? 'found' : 'not found'}`);
    allPassed = false;
  }

  // Check sources
  if (parsed.sources.length >= testCase.expectedFields.minSourceCount) {
    printSuccess(`Found ${parsed.sources.length} sources (minimum ${testCase.expectedFields.minSourceCount})`);
    parsed.sources.slice(0, 3).forEach((source, i) => {
      printInfo(`  Source ${i + 1}`, `${source.title} - ${source.url.substring(0, 50)}...`);
    });
    if (parsed.sources.length > 3) {
      printInfo('  ...', `and ${parsed.sources.length - 3} more`);
    }
  } else {
    printError(`Found ${parsed.sources.length} sources, expected at least ${testCase.expectedFields.minSourceCount}`);
    allPassed = false;
  }

  // Check content length
  if (parsed.response.length >= testCase.expectedFields.minContentLength) {
    printSuccess(`Main content length: ${parsed.response.length} chars (minimum ${testCase.expectedFields.minContentLength})`);
  } else {
    printError(`Main content too short: ${parsed.response.length} chars, expected at least ${testCase.expectedFields.minContentLength}`);
    allPassed = false;
  }

  // Summary
  console.log();
  if (allPassed) {
    printSuccess(`All checks passed for "${testCase.name}"`);
  } else {
    printError(`Some checks failed for "${testCase.name}"`);
  }

  return allPassed;
}

/**
 * Main test runner
 */
async function main() {
  printHeader('Content Parser Test Suite');

  const testDataDir = path.join(process.cwd(), 'parser_test_data');

  console.log(colorize(`\nTest data directory: ${testDataDir}`, 'gray'));
  console.log(colorize(`Running ${TEST_CASES.length} test cases\n`, 'gray'));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const result = runTest(testCase, testDataDir);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // Final summary
  printHeader('Test Summary');
  console.log();
  console.log(colorize(`Total tests: ${TEST_CASES.length}`, 'cyan'));
  console.log(colorize(`Passed: ${passed}`, 'green'));
  console.log(colorize(`Failed: ${failed}`, failed > 0 ? 'red' : 'gray'));
  console.log();

  if (failed === 0) {
    console.log(colorize('🎉 All tests passed!', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('❌ Some tests failed', 'red'));
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error(colorize('Fatal error:', 'red'), error);
  process.exit(1);
});
