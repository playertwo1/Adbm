# Forms and input

## Contents
- Structure
- Text fields
- Keyboard and IME
- Autofill and credentials
- Validation and errors
- Pickers and non-text input

## Structure

- Ask only what is needed now; defer the rest. Each removed field beats any visual polish.
- One column, top-to-bottom, grouped with headings. Max width ~560dp on large screens.
- Labels always visible (Material text field label floats; never placeholder-only).
- Mark optional fields "(optional)" rather than marking every required field.
- Primary action at the end, enabled by default; show errors on submit rather than disabling with no explanation.

## Text fields

- `OutlinedTextField` or `TextField` consistently across the app.
- `supportingText` for format hints ("DD/MM/AAAA"), `isError` + `supportingText` for errors, `prefix`/`suffix` for units and currency, trailing icon for clear/show-password.
- Single-line fields `singleLine = true`; multi-line grows with content up to a max.
- Newer state-based fields (`TextFieldState`, `rememberTextFieldState`) give better IME correctness; use them when the project's Compose version supports them, with `InputTransformation`/`OutputTransformation` for masks instead of re-formatting text on every change.

## Keyboard and IME

| Data | `KeyboardOptions` |
|---|---|
| Email | `keyboardType = Email`, `autoCorrectEnabled = false` |
| Password | `Password`, plus visibility toggle |
| Numbers / money | `Number` or `Decimal`; locale decimal separator |
| Phone | `Phone` |
| Names | `capitalization = Words` |
| Search | `imeAction = Search` |

- `imeAction = Next` moves focus to the next field (`FocusManager.moveFocus`), `Done`/`Go`/`Send` submits on the last.
- Keep the focused field and the primary action visible above the IME ([edge-to-edge-insets.md](../04-layout/edge-to-edge-insets.md)).
- Hardware keyboards: Enter submits, Tab moves focus.

## Autofill and credentials

- Compose 1.8+: `Modifier.semantics { contentType = ContentType.Username }` (also `Password`, `EmailAddress`, `NewPassword`, `PhoneNumber`, `PostalCode`, credit card types). Views: `android:autofillHints`.
- Sign-in and sign-up use Credential Manager (passkeys, saved passwords, Sign in with Google); do not build custom password UIs when the platform offers it.
- One-time codes: `ContentType.SmsOtpCode` / SMS Retriever; one field that accepts paste, not six boxes that break paste and TalkBack.

## Validation and errors

- Validate on submit or when the user leaves a field (focus lost), not on every keystroke; re-validate on change after an error was shown.
- Error text says what is wrong and how to fix it: "Enter a date after 01/01/2026", not "Invalid input".
- Errors announced for TalkBack (`semantics { error("...") }` on custom fields; Material fields do it with `isError` + supporting text).
- On submit with errors: move focus to the first invalid field and scroll it into view.
- Never clear what the user typed because of an error.

## Pickers and non-text input

- Dates: Material `DatePicker` with input mode; allow typing for far dates (birth dates).
- Small choices (<5) as radio/segmented visible options; many choices as searchable lists.
- Steppers for small integer ranges; slider only with visible value and a precise alternative.
- Camera/photo inputs use the system Photo Picker (no storage permission needed).
