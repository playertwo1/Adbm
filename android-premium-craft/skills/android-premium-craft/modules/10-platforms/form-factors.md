# Form factors and system surfaces

Each surface has its own ergonomics. Reuse the brand and tokens, not the phone layout.

## Contents
- Tablets, foldables, Chromebooks, desktop windowing
- Wear OS
- TV
- Cars
- XR and display glasses
- Widgets
- Notifications and Quick Settings tiles
- Official skills to hand off to

## Tablets, foldables, Chromebooks, desktop windowing

See [adaptive.md](../04-layout/adaptive.md). Extra rules: support free resizing and multi-window, keyboard/mouse, drag and drop between apps (`dragAndDropSource`/`dragAndDropTarget`) where content is draggable, and never letterbox at targetSdk 36+.

## Wear OS

- Glanceable anchor: one primary fact or action per screen, large type, high contrast on black.
- Use Wear Compose Material 3 (`androidx.wear.compose:compose-material3`), not phone Material: `ScalingLazyColumn`/`TransformingLazyColumn`, `ScreenScaffold`, `EdgeButton`, time text, rotary input support.
- Round screens: content inset from the curve; test small (192dp) and large round devices.
- Tiles and complications for the most frequent glance; app for depth.
- Battery: no ambient animation; ambient mode reduces color and updates.

## TV

- 10-foot UI: D-pad focus is the interaction; every focusable element has a clear focus state (scale + border/glow), predictable focus movement, no touch-only controls.
- Compose for TV (`androidx.tv:tv-material`) components; overscan-safe margins (~48dp horizontal, 27dp vertical).
- Text from ~14sp equivalent at 10-foot distance in larger sizes; avoid thin weights.
- Rows of content with immersive backgrounds; back returns to the previous row/screen.

## Cars

- Driver distraction rules dominate: use templates (Android for Cars App Library) for driving use; parked-only apps (video, games, browsers) follow parked-app guidance.
- Large targets, minimal text, no complex forms while driving; day/night themes.

## XR and display glasses

- Android XR spatial panels: keep 2D Compose layouts adaptive; spatial elevation and orbiters for controls; comfortable distance and size.
- Display glasses (Jetpack Compose Glimmer): minimal, high-contrast, glanceable overlays; follow the official Glimmer skill.

## Widgets

- Jetpack Glance; canonical layouts (follow the official `glance-canonical-layouts` skill).
- Show the one thing the user checks most, tap opens exactly that place in the app.
- Respect the system's widget corner radius, dynamic color, and resizing; provide a preview (`previewLayout`/generated previews).
- Update sparingly (WorkManager); show freshness.

## Notifications and Quick Settings tiles

- Notifications: correct channel and importance, actionable buttons with verbs, `MessagingStyle` for conversations, progress-centric/live updates where supported for ongoing tasks; small icon monochrome.
- Do not use notifications for marketing that users did not opt into.
- Quick Settings tiles for frequent toggles; label and state clear; tile icon matches the app icon family.

## Official skills to hand off to

| Surface | Skill |
|---|---|
| Wear OS UI | `wear-compose-m3` |
| Wear widgets/tiles | `wear-widgets` |
| TV migration | `leanback-to-compose-tv-migration` |
| Parked car apps | `android-for-cars-parked-apps` |
| Display glasses | `display-glasses-with-jetpack-compose-glimmer` |
| Home-screen widgets | `glance-canonical-layouts` |
