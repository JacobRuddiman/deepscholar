// Simple test using existing extractors
import { extractBriefFromUrl } from './src/app/components/extract_brief';

const url = process.argv[2];

if (!url) {
  console.log('Usage: node simple_test.js <url>');
  process.exit(1);
}

console.log(`Testing: ${url}\n`);

extractBriefFromUrl(url)
  .then(result => {
    console.log('✅ SUCCESS\n');
    console.log('Title:', result.title);
    console.log('Content length:', result.content.length);
    console.log('Abstract length:', result.abstract?.length || 0);
    console.log('Sources:', result.sources.length);
    console.log('\nContent preview:');
    console.log(result.content.substring(0, 300) + '...');
  })
  .catch(error => {
    console.log('❌ FAILED\n');
    console.log('Error:', error.message);
    console.log('\nStack:');
    console.log(error.stack);
  });
