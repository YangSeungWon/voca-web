/**
 * Update test expectations to match IPA-faithful output
 */
import { formatPronunciation } from './src/lib/ipa-to-korean';
import * as fs from 'fs';

interface TestCase {
  word: string;
  ipa: string;
  expected?: string;
}

// Read current test file
const testFile = fs.readFileSync('test-pronunciation.ts', 'utf-8');

// Extract test cases
const testCasesMatch = testFile.match(/const testCases: TestCase\[\] = \[([\s\S]*?)\];/);
if (!testCasesMatch) {
  console.error('Could not find test cases');
  process.exit(1);
}

// Parse test cases (simple regex-based parsing)
const testCaseLines = testCasesMatch[1].split('\n');
const updates: { word: string; ipa: string; oldExpected: string; newExpected: string }[] = [];

for (const line of testCaseLines) {
  const match = line.match(/\{\s*word:\s*'([^']+)',\s*ipa:\s*'([^']+)',\s*expected:\s*'([^']+)'\s*\}/);
  if (match) {
    const [, word, ipa, oldExpected] = match;
    const { korean } = formatPronunciation(ipa);
    const cleanKorean = korean.replace(/<\/?strong>/g, '');

    if (cleanKorean !== oldExpected) {
      updates.push({ word, ipa, oldExpected, newExpected: cleanKorean });
    }
  }
}

console.log(`Found ${updates.length} test cases that need updating:\n`);

for (const update of updates) {
  console.log(`${update.word.padEnd(20)} ${update.oldExpected.padEnd(15)} → ${update.newExpected}`);
}

console.log('\nUpdate test file? (y/n)');
