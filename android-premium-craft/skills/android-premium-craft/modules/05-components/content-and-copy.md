# Content and UX copy

Words are the interface most users read first. Premium copy is short, specific and calm.

## Contents
- Voice rules
- Patterns by element
- Numbers, dates and units
- Internationalization and RTL
- Accessibility of text

## Voice rules

1. Sentence case everywhere (titles, buttons, tabs).
2. Lead with the verb and the object: "Export report", "Add card".
3. Use the user's words, not the system's ("Payment failed", not "Transaction error 402").
4. One idea per sentence; cut adjectives and exclamation marks.
5. Same term for the same thing across the app (pick "Delete" or "Remove", not both).
6. Respectful and calm in errors; never blame the user.

## Patterns by element

| Element | Pattern | Example |
|---|---|---|
| Button | Verb + object, 1-3 words | "Pay invoice" |
| Destructive confirm | Question title + consequence + named action | "Delete 3 files?" / "They can't be recovered." / [Delete] [Cancel] |
| Error | What happened + what to do | "Couldn't save. Check your connection and try again." |
| Empty | Purpose + first action | "No trips yet. Plan your first trip." |
| Snackbar | Result + optional action | "Message archived" [Undo] |
| Field hint | Format, not a repeat of the label | "Use 8+ characters" |
| Permission rationale | Benefit in one line | "Allow location to show nearby stores" |
| Notification | Who/what + why it matters | "Ana paid R$ 120,00 for Invoice 34" |

## Numbers, dates and units

- Format with locale-aware APIs (`NumberFormat`, `DateTimeFormatter`/`DateFormat`, `MeasureFormat`, `RelativeDateTimeFormatter`); never concatenate strings.
- Plurals with `pluralStringResource` / `getQuantityString`.
- Relative time for recent ("2 min ago"), absolute for older or legal contexts; always absolute in finance statements.
- Always show units and currency. Distinguish 0, empty ("-"), and unknown ("Not available").
- Truncation never removes meaning from numbers: abbreviate deliberately ("1.2 M") with the full value available.

## Internationalization and RTL

- All user-visible strings in `strings.xml` [lint A005 flags literal strings in `Text(...)`]; no text in images.
- Plan for +30-40% length (German, Finnish, Portuguese) and taller scripts. Enable pseudo-locales in debug builds (`isPseudoLocalesEnabled = true` in the debug build type) and test `en-XA` (expansion) and `ar-XB` (RTL).
- Use `start`/`end`, never `left`/`right`, in Compose (`Arrangement.Start`, `padding(start=)`) and XML (`paddingStart`, `layout_gravity="start"`).
- Mirror directional icons; do not mirror logos, media controls' play icon, clocks, charts' time axis (unless the locale convention requires).
- Per-app language preferences (Android 13+): declare `locales_config.xml` so users can choose the app language in system settings.

## Accessibility of text

- Labels are what users say with Voice Access: the accessible name should start with the visible label.
- `contentDescription` describes purpose, not appearance ("Search", not "Magnifying glass icon"); do not include the role ("button") - TalkBack adds it.
- State goes in `stateDescription` ("Expanded", "Selected"), not in the label.
- Avoid directional or color-only instructions ("tap the green button on the right").
