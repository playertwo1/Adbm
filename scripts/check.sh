#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${JAVA_HOME:?Defina JAVA_HOME para um JDK compatível.}"
: "${ANDROID_HOME:?Defina ANDROID_HOME para o Android SDK.}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

for test_file in diagnostics/*.test.cjs; do
  node "$test_file"
done

cmp -s index.html app/src/main/assets/index.html
./gradlew :app:testDebugUnitTest :app:assembleDebug :wear:assembleDebug --console=plain

echo "CHECK PASS: diagnostics, equivalência HTML e builds debug passaram."
