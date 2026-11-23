# Critique rubric

A shared vocabulary for reviews. The rubric structures judgment; it is not a measurement, and its scores are never presented as scientific.

## Contents
- The ten dimensions
- Scoring anchors
- Severity
- Critique report format

## The ten dimensions

| # | Dimension | Question |
|---|---|---|
| 1 | Hierarchy | Is the job's primary item and action obvious in 3 seconds? |
| 2 | Layout and rhythm | Keylines, spacing scale, alignment, density appropriate to the job? |
| 3 | Typography | Clear levels, legible sizes, good line length, scales to 200%? |
| 4 | Color | Roles used correctly, accent spent well, contrast met, no color-only meaning? |
| 5 | System consistency | Same components, shapes, icons and patterns everywhere; tokens not literals? |
| 6 | States | Loading, empty, error, offline, long content designed? |
| 7 | Touch and ergonomics | Targets >= 48dp, reach, feedback, gesture alternatives? |
| 8 | Accessibility | TalkBack names/roles/states, order, focus, text scaling? |
| 9 | Platform fit | Edge-to-edge, insets, predictive back, adaptive, Android conventions? |
| 10 | Motion and performance | Purposeful, interruptible motion; responsive, no visible jank? |

## Scoring anchors

Score each 0-4 only from evidence you have (screenshot, code, measurement). Mark `n/a` or `not-run` otherwise.

| Score | Meaning |
|---|---|
| 0 | Broken: blocks the task or excludes users |
| 1 | Poor: works with effort; obvious defects |
| 2 | Acceptable: default-quality, generic, minor defects |
| 3 | Good: intentional, consistent, few nits |
| 4 | Excellent: distinctive and flawless for this job, holds under stress profiles |

"Premium" means: no dimension below 3, and dimensions 1, 6, 7, 8 at 3+ under the `core` device matrix.

Quick critiques present the scores as a profile (e.g., `H3 L3 T2 C3 S2 St1 To3 A2 P3 M3`). Full critiques turn them into the **Craft Score (0-100)** with `scripts/critique_score.py`: published weights, caps for open P0/P1, and a confidence level from how much was judged from pixels. Never compute the number by hand and never present it as a measurement. Procedure: [master-critique.md](master-critique.md).

## Severity

| Level | Definition | Examples |
|---|---|---|
| P0 | Blocks task, data loss, inaccessible core, security/privacy leak | Primary CTA under IME; unlabeled pay button for TalkBack; wrong totals |
| P1 | Core task degraded or broken in a common configuration | Clipping at 200%; broken back; content under nav bar; no error state |
| P2 | Confusing, inconsistent or slow | Two primary buttons; off-grid spacing; janky list; weak empty state |
| P3 | Cosmetic polish | Icon weight mismatch; 2dp misalignment |

Prioritize by user impact x frequency, not by how easy the fix is.

## Critique report format

```markdown
## Critique - <screen> (<device/preview>, <theme>, font <scale>)

**Direction check:** anchor <name>; reads as <one sentence>.
**Rubric:** H3 L2 T2 C3 S2 St1 To3 A2 P3 M3 (evidence: shots/core/*.png, Home.kt)

**Strengths**
1. ...
2. ...

**Findings (max 5, highest impact first)**
| # | Sev | Finding | Evidence | Fix | Type |
|---|---|---|---|---|---|
| 1 | P1 | Balance clips at 200% text | shots/font200.png | Allow wrap; stack label/value | defect |
| 2 | P2 | Accent used on 6 elements; primary action not dominant | shots/baseline.png | Primary only on Pay; others tonal | taste+hierarchy |

**Proposed direction:** one paragraph.
**Not verified:** TalkBack (no device), performance (no benchmark).
**Next action:** `redesign` of the header region.
```

Types: `defect`, `platform-requirement`, `research-hypothesis`, `taste`. Keep taste findings honest and few.
