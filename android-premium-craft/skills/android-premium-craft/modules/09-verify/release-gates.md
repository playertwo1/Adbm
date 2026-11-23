# Release gates: honest status per check

No magic "premium score". A release review documents a **specific scope**, what was actually checked, how, and what remains.

## Contents
- Checks and what counts as evidence
- Decision levels
- Filling the evidence JSON
- Running the gate

## Checks and what counts as evidence

| Check | Verified when | Otherwise |
|---|---|---|
| `build` | Task + variant + result recorded (`./gradlew :app:assembleRelease` passed) | not_run |
| `interaction` | Critical journey executed on device/emulator or UI test (taps, back, keyboard) | not_run |
| `visual` | Before/after screenshots in identical conditions, reviewed against the rubric | not_run |
| `states` | Loading/empty/error/offline rendered and reviewed | not_run / partial |
| `accessibility` | TalkBack script + 200% text + targets; automated checks listed separately | partial / not_run |
| `navigation` | Back, predictive back, deep link/up, IME, insets in both nav modes | not_run |
| `adaptive` | Compact + expanded widths (and landscape) rendered or run | not_run / n/a with reason |
| `regression` | Existing tests pass; screenshot diffs reviewed | not_run |
| `performance` | Same-device before/after measurement (required if claiming faster/smoother) | not_run |

Status values: `pass`, `fail`, `partial`, `not_run`, `not_applicable` (needs a reason).

## Decision levels

- `blocked`: any required check failed, or a P0/P1 remains open.
- `incomplete`: nothing failed, but required evidence (including the build) is missing.
- `ready_for_visual_review`: build and code evidence exist, device/screenshot checks pending. Never call this production-ready.
- `verified_for_scope`: every required check `pass` with evidence, no open P0/P1. Performance is required only when the change claims speed or smoothness.

## Filling the evidence JSON

Copy [REVIEW_EVIDENCE_TEMPLATE.json](../../assets/REVIEW_EVIDENCE_TEMPLATE.json). Rules:
- `evidence` is a factual sentence with a pointer (command, file, screenshot, test name) - at least 12 characters.
- `not_run` and `not_applicable` explain why.
- `claims_of_speedup: true` makes `performance` required automatically.
- `open_issues` lists remaining findings with severity; any `P0`/`P1` blocks.

## Running the gate

```bash
python scripts/review_gate.py evidence.json                 # prints analysis JSON, exit 2 if malformed
python scripts/review_gate.py evidence.json --require-ready  # exit 1 unless verified_for_scope
```

The gate lints the report's completeness and consistency. It does **not** verify that the evidence is true; it never builds, runs or looks at the app.
