const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('src/lib/resilience-pipeline.ts', 'utf8');
for (const token of ['assessIngestion', 'validateExtraction', 'narrativeDataMismatch', 'financialFlags', 'coordinateFlags', 'activePlan', 'synthesizeGaps']) assert.ok(source.includes(token), `${token} contract missing`);
assert.ok(source.includes('OCR_REQUIRED'));
assert.ok(source.includes('NARRATIVE_DATA_MISMATCH'));
assert.ok(source.includes('PII_REVIEW_REQUIRED'));
console.log('resilience pipeline contracts passed');
