/**
 * Quick test: run the Claude export validator against the sample file
 * Usage: npx tsx scripts/test-claude-validator.ts
 */
import fs from 'fs';
import path from 'path';
import { validateClaudeExport, isClaudeExportFilename } from '../src/functions/parsers/claude_export_validator';

const sampleFile = 'compass_artifact_wf-1ce3e11f-5554-4177-983b-b38e8d069774_text_markdown.md';
const samplePath = path.join(process.cwd(), 'extraction_logs', sampleFile);

if (!fs.existsSync(samplePath)) {
  console.error('Sample file not found:', samplePath);
  process.exit(1);
}

const content = fs.readFileSync(samplePath, 'utf-8');

console.log('=== Claude Export Validator Test ===\n');

// Test 1: Filename check
console.log('1. Filename check:', isClaudeExportFilename(sampleFile) ? 'PASS' : 'FAIL');

// Test 2: Full validation with filename
const result = validateClaudeExport(content, sampleFile);
console.log('\n2. Full validation (with filename):');
console.log('   Valid:', result.isValid);
console.log('   Confidence:', (result.confidence * 100).toFixed(1) + '%');
console.log('   Summary:', result.summary);
console.log('\n   Signals:');
for (const s of result.signals) {
  console.log(`     ${s.passed ? '✓' : '✗'} ${s.name} (weight ${s.weight}): ${s.detail}`);
}

// Test 3: Content-only validation (no filename)
const contentOnly = validateClaudeExport(content);
console.log('\n3. Content-only validation (no filename):');
console.log('   Valid:', contentOnly.isValid);
console.log('   Confidence:', (contentOnly.confidence * 100).toFixed(1) + '%');
console.log('   Summary:', contentOnly.summary);

// Test 4: Should reject non-Claude content
const fakeContent = 'Hello world\nThis is just some random text.';
const fakeResult = validateClaudeExport(fakeContent, 'notes.md');
console.log('\n4. Fake content rejection:');
console.log('   Valid:', fakeResult.isValid, fakeResult.isValid ? '(UNEXPECTED)' : '(correct)');
console.log('   Confidence:', (fakeResult.confidence * 100).toFixed(1) + '%');

// Test 5: Wrong filename, right content
const wrongFilename = validateClaudeExport(content, 'my_research.md');
console.log('\n5. Wrong filename, real content:');
console.log('   Valid:', wrongFilename.isValid);
console.log('   Confidence:', (wrongFilename.confidence * 100).toFixed(1) + '%');

console.log('\n=== Done ===');
