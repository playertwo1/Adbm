# Product brief

A screen is premium when it is obviously right for *this* user doing *this* job in *this* context. Write the brief before the first pixel. If the user cannot answer, propose answers and mark them as assumptions.

## The six questions

1. **Who** uses it, how often, and how expert are they? (daily operator vs. monthly visitor)
2. **Job**: the one thing this screen must let them do in under ten seconds.
3. **Primary action** (exactly one) and up to three secondary actions.
4. **Context of use**: one hand on a bus, glance at a watch, desk with keyboard, sunlight, gloves, low connectivity, shared tablet.
5. **Domain register** (table below): what the user must feel and what would break trust.
6. **Success signal**: what observable outcome means the redesign worked (task time, fewer errors, fewer taps, support tickets).

## Domain register

| Domain | Must feel | Breaks trust | Design implications |
|---|---|---|---|
| Finance, banking | Calm, precise, in control | Animated totals, ambiguous signs, red/green only, hidden fees | Tabular numerals, explicit +/- and currency, confirmation for money movement, no playful motion on balances |
| Health, medical | Clear, caring, safe | Alarmist color, jargon, tiny dosage text | Large type, plain language, units always visible, reversible actions |
| Productivity, B2B | Fast, dense, predictable | Decoration that costs taps, inconsistent components | Higher density with 48dp targets kept, keyboard support, bulk actions, list over cards |
| Media, entertainment | Immersive, delightful | Chrome over content, slow transitions | Edge-to-edge imagery, content-first color, shared element transitions |
| Social, messaging | Personal, lively, safe | Lost drafts, ambiguous send state | Optimistic send with clear status, expressive motion on reactions, robust IME handling |
| Commerce | Confident, trustworthy | Fake urgency, hidden totals, dark patterns | Price clarity, persistent cart total, honest scarcity only |
| Kids, education | Playful, encouraging | Small targets, text-heavy, punishing errors | 56dp+ targets, illustration, sound/haptic feedback, forgiving flows |
| Utilities, tools | Instant, invisible | Onboarding walls, ads over function | Open straight to the task, glanceable state, widgets/tiles |
| Field, industrial | Robust, legible outdoors | Low contrast, gesture-only actions | High contrast scheme, 56dp+ targets, physical-key friendly, offline-first states |
| Games-adjacent, lifestyle | Characterful, rewarding | Generic Material defaults | Custom type and shape, bolder motion, still accessible |

## Brief template (put it in the work log or `DESIGN.md`)

```
Screen: Account overview            User: SMB owner, daily, mid expertise
Job: see cash position and pay a supplier in < 10 s
Primary: Pay | Secondary: Transfer, Statements, Filter period
Context: one-handed phone, often outdoors; tablet at the office
Register: Finance -> calm, precise; no animated balances
Must survive: 200% text, TalkBack, offline (stale data badge), 0 and 9-digit balances
Success: payment started from overview in <= 2 taps; no clipped amounts at 200%
Assumptions: (list anything the user did not confirm)
```
