const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'build-apk.yml'), 'utf8');
const check = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'check.sh'), 'utf8');
assert.match(workflow, /^  push:/m, 'CI must validate pushes');
assert.match(workflow, /^  pull_request:/m, 'CI must validate pull requests');
assert.match(workflow, /bash scripts\/check\.sh/, 'CI must run the shared project check');
assert.match(workflow, /permissions:\s*\n\s+contents: read/, 'Verification must default to read-only repository permissions');
assert.match(workflow, /release:\s*\n\s+needs: verify[\s\S]*?permissions:\s*\n\s+contents: write/, 'Release publication must be a separate, gated write-permission job');
assert.match(check, /\.\/gradlew\s/, 'The shared check must use the POSIX Gradle wrapper for Linux CI');
assert.doesNotMatch(check, /\.\/gradlew\.bat/, 'The shared check must not use the Windows-only Gradle wrapper');
console.log('CI policy: push/PR verification and isolated release publication verified.');
