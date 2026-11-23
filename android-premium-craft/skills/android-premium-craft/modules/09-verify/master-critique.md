# Master critique: score an existing app and say what to improve

The `critique` mode at full depth. Act as a principal Android design engineer who has shipped Material apps at scale and reviews like a design director: direct, specific, never vague, never cruel. The user gets a **Craft Score (0-100)**, a scorecard, the issues that matter most and an action plan they can run with this skill.

## Contents
- Hard rules
- Step 1 - Resolve the target and method
- Step 2 - Capture the evidence
- Step 3 - Assessment A: design review (before any tool output)
- Step 4 - Assessment B: deterministic scan
- Step 5 - Score
- Step 6 - Write the report
- Step 7 - Ask, then plan
- Personas for Android
- Cognitive load and Nielsen cross-check
- Voice

## Hard rules

1. **Look before judging.** Score a dimension from pixels when you can (`basis: visual`); code-only scoring is allowed but lowers confidence and must say so.
2. **A before B.** Write the design review before reading lint/palette output so the detector does not anchor judgment. If a sub-agent tool exists, run Assessment B in a separate sub-agent and merge only in Step 5.
3. **Every score has evidence**: a screenshot file, `file:line`, or a measurement. No evidence, no number - use `n/a` with a reason.
4. **The number comes from the script**: fill the critique JSON and run `scripts/critique_score.py`. Never compute or round the Craft Score by hand.
5. **The report is the deliverable.** Write the full report in chat first, then archive it, then ask the questions last.
6. **Read-only.** Critique never edits app code.

## Step 1 - Resolve the target and method

- Target: the app (repo path) and the screens in scope. If the user said "my app", pick the **3-5 screens of the primary journeys** (launch screen, the main task screen, one form, one list/detail, settings if relevant) and name them.
- Method line (first line of the report), one of:
  - `Method: design review + deterministic scan (device: <model, API>)`
  - `Method: design review + deterministic scan (previews rendered)`
  - `Method: design review + deterministic scan (code only, no device) - confidence reduced`
- Read `DESIGN.md`/`PRODUCT.md` if present: judge against the product's intent, not your taste.
- Read `.craft/critique/ignore.md` if present and silently drop findings it lists.

## Step 2 - Capture the evidence

Pick the best available route from [visual-feedback-loop.md](visual-feedback-loop.md):
- Device/emulator: open each screen, `adb exec-out screencap -p > shots/<screen>.png` plus `uiautomator dump` for bounds. On the primary screen run `python scripts/device_matrix.py --out shots/matrix --profiles core --package <pkg>`.
- Maestro MCP: `inspect_screen` + `take_screenshot` per screen.
- Previews: render the existing `@Preview`s (Roborazzi/Paparazzi/preview tests).
- None: ask the user for screenshots of the screens; if none, continue code-only and say so.

Also capture: one loading, one empty and one error state if reachable; the screen at 200% font scale; dark theme.

## Step 3 - Assessment A: design review (before any tool output)

For each screen, write short notes:
1. **Three-second test**: what is this screen for, and what is the first, second, third thing seen?
2. **Squint test** (downscale to 25%): is the primary action dominant? How many competing weights?
3. **Specificity verdict**: could an unrelated product ship this screen unchanged? Which anchor does it read as (or "Material template")? Count [anti-slop](../02-direction/anti-slop.md) patterns seen.
4. **Dimension scores 0-4** with evidence, using the anchors in [critique-rubric.md](critique-rubric.md): hierarchy, layout, typography, color, consistency, states, touch, accessibility, platform, motion. Measure targets in the view dump; check text at 200%.
5. **Personas** (pick 2-3, below): walk the primary task as each and note exactly what broke.
6. **Cognitive load**: decision points with more than four visible options; information the user must remember across screens.
7. **Emotional journey**: the riskiest moment (payment, delete, submit). Is there reassurance and recovery?

## Step 4 - Assessment B: deterministic scan

```bash
python scripts/project_probe.py <app>                       # versions + platform mandates
python scripts/ui_audit.py lint <app> --format json         # 39 craft rules
python scripts/ui_audit.py palette <app>                    # theme contrast
```

Then reconcile with A: where they **agree** (strong finding), what B **caught that A missed** (add it), and B's **false positives** (say why and drop them). Lint findings are leads: a `high` rule becomes a P0/P1 only after you confirm the user impact.

## Step 5 - Score

1. Copy [CRITIQUE_TEMPLATE.json](../../assets/CRITIQUE_TEMPLATE.json) to `.craft/critique/draft.json`; fill one entry per screen (`importance: primary` for the main journeys) with `score`, `basis` (`visual`, `code`, `both`, `measured`), `evidence` and a short `key_issue`; list findings with P0-P3.
2. Run `python scripts/critique_score.py .craft/critique/draft.json --save .craft/critique`.
3. The script weights dimensions (hierarchy 14, accessibility 12, the rest 8-10), averages screens (primary counts double), applies caps (any P0 -> max 49; two or more P1 -> max 74; one P1 -> max 84), reports **confidence** from how much of the weight was judged from pixels, and prints the trend from earlier runs.

Bands: **90+ S Premium**, **80 A Polished**, **70 B Solid**, **55 C Generic**, **40 D Rough**, **below 40 E Broken**. Most real apps land between 45 and 75. A 4 on a dimension means genuinely excellent, not "fine".

## Step 6 - Write the report

Use this structure, in this order:

```markdown
Method: design review + deterministic scan (device: Pixel 8, API 36)

# Craft Score: 63/100 - C (Generic)   · confidence: high
<scorecard table printed by critique_score.py>

## Verdict
Two or three sentences: gut reaction, the single biggest opportunity, what the app could feel like.

## Design specificity
Reads as: <anchor or "Material template">. Slop patterns: <n> (<list>). Deterministic scan: <lint counts by severity, palette failures, mandates>; agreements, additions, false positives.

## What's working
2-3 specific strengths and why they work.

## Priority issues (3-5, highest impact first)
### [P1] <What, naming the exact element>
- Why it matters: <user impact, who is hurt, how often>
- Evidence: <shots/home.png, HomeScreen.kt:42, lint L001>
- Fix: <concrete change; include a short code snippet when it removes ambiguity>
- Run: `/android-premium-craft <mode> <scope>` · Effort: S/M/L · Moves: <dimensions>

## Persona red flags
**Casey (one hand, on the bus):** ...   **Sam (TalkBack, 200% text):** ...

## Quick wins (under 30 minutes each)
- ...

## Minor observations
- ...

## Not verified
- <what could not be checked and why>

Trend: 48D -> 63C (out of 100)
```

Rules: name exact elements ("the Pay button", not "some buttons"); every issue says why it matters to users; fixes are concrete (no "consider exploring"); prioritize ruthlessly; do not soften.

## Step 7 - Ask, then plan

End the turn with 2-3 targeted questions (structured question tool when available), each with 2-3 options drawn from the findings:
1. **Priority**: which area first (e.g., "accessibility blockers", "visual hierarchy of Home", "states and errors").
2. **Direction**: if the app reads as generic or off-register, offer two anchors that would fit.
3. **Scope**: "top 3 only", "all P0-P1", "everything".

Skip questions only if fewer than 3 priority issues exist, and write `Questions skipped: <n> priority issues`.

After the answers, give the **action plan**: modes in order, each with its scope from the findings, e.g.
1. `/android-premium-craft accessibility` - label the 4 icon buttons, fix 24dp targets on Home and Cart
2. `/android-premium-craft shape` - pick Tonal Calm vs Precision Pro for the dashboard
3. `/android-premium-craft redesign home` - one hero fact, one primary action
4. `/android-premium-craft harden` - empty/error/offline states for Orders
5. `/android-premium-craft polish`, then re-run `critique` to see the score move.

## Personas for Android

| Persona | Profile | Red flags to look for |
|---|---|---|
| **Casey** - one-handed commuter | Thumb only, interrupted, flaky network | Primary action at the top, targets < 48dp, lost state after app switch, spinners instead of cached content |
| **Sam** - TalkBack and 200% text | Screen reader, large font, may use Switch Access | Unlabeled icons, cards read as fragments, clipped text, color-only status, gesture-only actions |
| **Rita** - 65, first smartphone app | Reads every word, fears mistakes | Jargon, icon-only navigation, no undo, tiny text, confirmations that do not say what happens |
| **Alex** - power user on a tablet | Keyboard + mouse, multi-window | Stretched phone layout, no rail, no shortcuts, no hover/right-click, state lost on resize |
| **Riley** - stress tester | Rotates, kills the app, pastes 300 chars, goes offline | Process-death data loss, broken RTL, overflow, errors that wipe input |

| App type | Personas |
|---|---|
| Finance, commerce | Casey, Sam, Rita |
| Productivity, B2B | Alex, Sam, Riley |
| Social, media | Casey, Riley |
| Health, government, utilities | Rita, Sam, Casey |
| Kids, education | Rita (as parent), Casey |

## Cognitive load and Nielsen cross-check

- Cognitive load: flag any decision point with more than 4 visible options, any screen that asks the user to remember something from a previous one, and any screen with more than one competing primary.
- Nielsen's 10 heuristics are a lens, not a second score: before finalizing, ask whether system status, real-world language, user control (undo/back), consistency, error prevention, recognition over recall, efficiency, minimalism, error recovery and help are each covered by at least one dimension's evidence. Add a finding for any heuristic badly broken.

## Voice

Write like the best reviewer the team ever had: precise, warm about what works, unflinching about what does not, always with the fix. Use the user's language (reply in Portuguese if they wrote in Portuguese) while keeping code, file names and mode names as they are.
