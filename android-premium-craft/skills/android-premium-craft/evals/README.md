# Evals

`evals.json` holds scenarios in the Anthropic evaluation format (`query`, `files`, `expected_behavior`). There is no built-in runner; use this protocol.

1. Pick a model. Open a fresh session in a copy of this repo **without** the skill installed. Run each `query`, attaching `files`. Save the transcript.
2. Repeat in a fresh session **with** the skill installed.
3. For each `expected_behavior`, mark met / not met in both runs. A reviewer who did not write the skill scores it.
4. Record results in `RESULTS.md`: model, date, skill version, met counts with vs without, and notable failures.
5. Change the skill only to fix observed failures; re-run. Test every model you support.

The negative scenario checks that the skill does **not** trigger on unrelated work.
`fixtures/sloppy-app/` is a deliberately poor app used by evals and by `tests/` (lint expectations).
