const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
for (const relativePath of ['app/build.gradle.kts', 'wear/build.gradle.kts']) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert.doesNotMatch(source, /signingConfigs\.getByName\("debug"\)/, `${relativePath} must never sign a release with the debug key`);
  assert.match(source, /missingReleaseSigningVariables/, `${relativePath} must identify absent release signing variables`);
  assert.match(source, /KEYSTORE_PATH/, `${relativePath} must require KEYSTORE_PATH`);
  assert.match(source, /KEYSTORE_PASSWORD/, `${relativePath} must require KEYSTORE_PASSWORD`);
  assert.match(source, /KEY_ALIAS/, `${relativePath} must require KEY_ALIAS`);
  assert.match(source, /KEY_PASSWORD/, `${relativePath} must require KEY_PASSWORD`);
}
console.log('Release-signing policy: no debug fallback and all persistent-key variables required.');
