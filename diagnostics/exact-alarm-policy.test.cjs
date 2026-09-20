const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'main', 'java', 'com', 'example', 'ReminderScheduler.kt'),
  'utf8'
);
const start = source.indexOf('fun scheduleMindSmartReminder');
const end = source.indexOf('\n    fun showMindSmartNotification', start);
assert(start >= 0 && end > start, 'Smart mindfulness reminder function must exist');
const smartReminder = source.slice(start, end);

assert.match(
  smartReminder,
  /Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.S && alarmManager\.canScheduleExactAlarms\(\)/,
  'Android S+ must request exact alarms only when the user has authorized them'
);
assert.match(
  smartReminder,
  /setAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP, trigger\.timeInMillis, pendingIntent\)/,
  'The smart reminder must fall back to an inexact idle-safe alarm'
);
assert.doesNotMatch(
  smartReminder,
  /if \(Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.M\) \{\s*alarmManager\.setExactAndAllowWhileIdle/,
  'The smart reminder must not schedule exact alarms without checking permission'
);

console.log('Exact-alarm policy: authorization and fallback verified.');
