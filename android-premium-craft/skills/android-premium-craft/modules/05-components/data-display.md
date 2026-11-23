# Data display: dashboards, charts, tables

Data UI is judged on two things: can the user find the number they need, and can they trust it.

## Contents
- Dashboards
- Numbers
- Charts
- Tables on mobile
- Accessibility of data

## Dashboards

- One hero metric that answers the job ("Cash available today"), then supporting metrics smaller. Equal-weight tile grids are slop.
- Every metric has a label, unit, period and freshness ("Revenue - Oct - updated 14:32").
- Comparisons say against what: "+12% vs Sep", with sign and direction icon, not color alone.
- Drill-down: tapping a metric opens its detail; the tile shows that it is tappable.
- On expanded widths, add columns and side-by-side comparisons instead of stretching tiles.

## Numbers

- Tabular figures, right-aligned, locale formatting, explicit sign for deltas.
- Never animate counting up balances or amounts the user acts on; a quick crossfade is enough. Count-up animations are for celebratory, non-critical stats only.
- Precision fits the decision: "R$ 1,2 mi" in an overview, exact cents in the statement.
- Placeholder vs zero vs unknown are visually distinct.

## Charts

| Question | Chart |
|---|---|
| Change over time | Line (continuous) or bars (discrete periods) |
| Compare categories | Horizontal bars, sorted |
| Part of a whole (<= 5 parts) | Stacked bar or donut with labels; avoid pies with many slices |
| Distribution | Histogram / box |
| Progress to goal | Linear/circular progress with the numeric value |

- Start bar axes at zero; label axes with units; at most 5-6 gridlines in `outlineVariant`.
- Direct labels beat legends; if a legend is needed, put it above the chart in the same order as the data.
- Color: one highlight color against neutral series; categorical palettes checked for color-vision deficiency; never red/green only.
- Touch: tap or drag to inspect points with a tooltip; targets for points are 48dp even when marks are small.
- Implement with `Canvas` or a maintained chart library (e.g., Vico for Compose); keep drawing in the draw phase and avoid recomposing on every pointer move.

## Tables on mobile

- Compact width: turn rows into list items (primary value + 1-2 key fields), with the full table on detail or landscape.
- Wider: real tables with sticky header and first column, horizontal scroll inside the table only, sortable headers with sort state announced.
- Numeric columns right-aligned; text left (start) aligned.

## Accessibility of data

- Each chart has a text summary ("Revenue grew from R$ 80k in July to R$ 120k in October") and an accessible data table or list on demand.
- Chart semantics: `Modifier.semantics { contentDescription = summary }` on the chart, and per-point descriptions when the user can explore.
- Status badges combine icon + text; tooltips are reachable by TalkBack (or the info is elsewhere).
