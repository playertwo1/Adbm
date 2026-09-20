const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'test', 'java', 'com', 'example', 'GreetingScreenshotTest.kt'),
  'utf8'
);
assert.doesNotMatch(source, /src\/test\/screenshots/, 'Screenshot tests must not write to tracked source directories');
assert.match(source, /build\/outputs\/roborazzi/, 'Screenshot output must be isolated under build outputs');
console.log('Screenshot test policy: generated output is isolated from tracked sources.');
