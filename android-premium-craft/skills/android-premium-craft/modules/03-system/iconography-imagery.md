# Iconography and imagery

## Contents
- Icons
- App icon, splash and system surfaces
- Images
- Illustration and empty-state art

## Icons

- One icon family per app. Material Symbols is the default (variable axes: fill, weight, grade, optical size). Match icon weight to text weight; use fill for the selected state (navigation, toggles).
- Sizes: 24dp standard, 20dp dense, 40-48dp for prominent; the **touch target stays 48dp** whatever the glyph size.
- Use vector drawables (import with Android Studio's Vector Asset or the Material Symbols downloads). The legacy `material-icons-extended` artifact is large; prefer importing only the icons you use.
- Icons that act need a TalkBack label (`contentDescription`) unless an adjacent visible text already names the action; decorative icons get `contentDescription = null`.
- Directional icons (back, forward, send, list bullets) mirror in RTL: `autoMirrored` icons in Compose, `android:autoMirrored="true"` in vectors.
- Do not use emoji as UI icons; they change per OEM and cannot be themed.

## App icon, splash and system surfaces

- Adaptive icon with foreground, background **and monochrome** layers (themed icons, Android 13+). Keep the logo within the 66dp safe zone of the 108dp canvas.
- Splash: `androidx.core:core-splashscreen`, icon + background color only, dismissed as soon as the first meaningful frame is ready (`setKeepOnScreenCondition` only while loading essentials). Do not add a second custom splash screen.
- Notification small icon: monochrome silhouette; color via `setColor`.
- Shortcuts, widgets and Quick Settings tiles are part of the product's face; give them the same icon family.

## Images

- Load with an image library that handles lifecycle, caching and downsampling (Coil 3 for Compose is the common choice); always request the displayed size.
- Reserve space with a fixed aspect ratio (`Modifier.aspectRatio`) so layout does not jump when images arrive.
- Placeholder = surface tone or a blurred/dominant-color preview, never a spinner per image. Error state = icon + neutral surface, not a broken image.
- Text over images needs a scrim or a gradient scrim limited to the text area; check contrast on the lightest plausible image.
- Crop intentionally (`ContentScale.Crop` with a focal point when available); faces and products must not be cut by rounded corners or system bars.
- Provide `contentDescription` for informative images; decorative images get null.
- Dark theme: avoid large pure-white images; dim or provide dark variants.

## Illustration and empty-state art

- Illustration is optional; a precise sentence and one action beat a generic drawing. If used, one consistent style, few colors from the theme roles, and tinted for dark theme.
- Size illustrations so the action stays above the fold at 200% font scale.
- Lottie/animated illustrations: only with a static fallback, reduced-motion respect and a file-size budget.
