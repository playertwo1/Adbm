const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const htmlPaths = [
  path.join(root, 'index.html'),
  path.join(root, 'app', 'src', 'main', 'assets', 'index.html')
];
const nativeSource = fs.readFileSync(
  path.join(root, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt'),
  'utf8'
);

for (const htmlPath of htmlPaths) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.doesNotMatch(html, /https?:\/\//, `${path.relative(root, htmlPath)} must not load remote resources`);
  assert.match(html, /vendor\/tailwindcss\.js/, `${path.relative(root, htmlPath)} must use the local Tailwind bundle`);
  assert.match(html, /vendor\/fontawesome\/css\/all\.min\.css/, `${path.relative(root, htmlPath)} must use local Font Awesome CSS`);
}

assert.match(nativeSource, /allowFileAccess\s*=\s*false/, 'WebView must not grant file access');
assert.match(nativeSource, /allowContentAccess\s*=\s*false/, 'WebView must not grant content-provider access');
assert.match(nativeSource, /mixedContentMode\s*=\s*WebSettings\.MIXED_CONTENT_NEVER_ALLOW/, 'WebView must reject mixed content');
assert.match(nativeSource, /request\?\.deny\(\)/, 'WebView permission requests must be denied by default');
assert.match(nativeSource, /shouldOverrideUrlLoading/, 'WebView must block external navigation');

console.log('WebView security policy: local assets and restrictive native settings verified.');
