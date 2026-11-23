# Layout and hierarchy

## Contents
- Attention budget
- The first viewport
- Grouping without boxes
- Canonical layouts
- Scroll behavior
- Review questions

## Attention budget

Every screen gets **one** dominant element (the job's key fact or action), **a few** supporting elements, and **details on demand**. Tools to rank them, strongest first: size, color/contrast, position (top-start), shape/containment, motion, weight. Spend the strong tools on the dominant element only.

## The first viewport

On a 360x800dp phone at default font scale:
- The job's key fact and the primary action are visible without scrolling.
- Chrome (status + top bar + banners + bottom bar) uses at most ~35% of height. Large or medium collapsing top app bars are for content screens with long scrolls, not dashboards that need space.
- No empty hero, greeting banner or promotional block above the user's data unless that *is* the job.
- Re-check at 200% font scale: what falls below the fold, and is the primary action still reachable (sticky bottom action, or near the top)?

## Grouping without boxes

Prefer, in order: proximity and spacing -> headings -> tonal surface change -> dividers (`outlineVariant`) -> cards. A card is right when its content is a self-contained unit that is tapped, moved, or compared as one (a product, a message thread, a media item). Never nest cards; flatten the inner level into a list or section.

List anatomy (Material): leading element (icon 24dp, avatar 40dp, image 56dp), headline (`bodyLarge`), supporting text (`bodyMedium`, `onSurfaceVariant`, max 2 lines), trailing meta or control; one/two/three-line heights 56/72/88dp minimum.

## Canonical layouts

| Layout | When | Compose |
|---|---|---|
| Feed | Browsing many similar items | `LazyColumn` (compact), `LazyVerticalGrid(GridCells.Adaptive(minSize))` (wider) |
| List-detail | Inbox, settings, catalogs | `ListDetailPaneScaffold` (material3-adaptive) or Nav3 list-detail scene |
| Supporting pane | Main content + related tools/info | `SupportingPaneScaffold` |
| Dashboard | Monitoring several metrics | One hero metric, then a responsive grid; no equal-weight tiles |
| Form | Data entry | Single column, max ~560dp wide, sticky primary action |
| Detail/reader | Long content | Constrained text width, hero media, collapsing top bar |

Adaptive behavior of these layouts: [adaptive.md](adaptive.md).

## Scroll behavior

- Only one vertical scroll container per axis; nested scrolls need `nestedScroll` connections (e.g., top app bar scroll behavior).
- Sticky headers for long grouped lists; keep the primary action sticky when the form is longer than a viewport.
- Hide bars on scroll only on content screens, and always reveal on scroll up.
- Preserve scroll position across navigation and configuration changes (`rememberLazyListState` survives via `rememberSaveable` internally; keys must be stable).
- Pull-to-refresh (`PullToRefreshBox`) only where data can be stale; also offer a refresh action for accessibility.

## Review questions

1. Can a first-time user say what this screen is for in three seconds?
2. Is the dominant element the one the brief named?
3. Does every container earn its border?
4. Does the layout still read at 200% text and in landscape?
5. What is the smallest change that removes one level of nesting?
