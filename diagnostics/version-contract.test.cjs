const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const properties = fs.readFileSync(path.join(root, 'gradle.properties'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app', 'build.gradle.kts'), 'utf8');
const wear = fs.readFileSync(path.join(root, 'wear', 'build.gradle.kts'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

const code = /^CORE_FLOW_VERSION_CODE=(\d+)$/m.exec(properties)?.[1];
const name = /^CORE_FLOW_VERSION_NAME=([^\r\n]+)$/m.exec(properties)?.[1];
assert.ok(code, 'gradle.properties must define CORE_FLOW_VERSION_CODE');
assert.ok(name, 'gradle.properties must define CORE_FLOW_VERSION_NAME');
for (const [moduleName, source] of [['app', app], ['wear', wear]]) {
  assert.match(source, /providers\.gradleProperty\("CORE_FLOW_VERSION_CODE"\)/, `${moduleName} must read the shared version code`);
  assert.match(source, /providers\.gradleProperty\("CORE_FLOW_VERSION_NAME"\)/, `${moduleName} must read the shared version name`);
  assert.match(source, /require\(\(buildVersionCode == null\) == \(buildVersionName == null\)\)/, `${moduleName} must reject a partial BUILD_VERSION_* override`);
}
assert.match(readme, new RegExp('`' + name.replace('.', '\\.') + '` \\(`versionCode ' + code + '`\\)'), 'README must describe the shared current version');
console.log(`Version contract: ${name} (code ${code}) shared by phone, Wear, and README.`);
