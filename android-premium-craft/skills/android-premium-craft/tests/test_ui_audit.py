import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from ui_audit import (RULES, as_markdown, contrast_ratio, lint, lint_markdown, lint_sarif, lint_text,  # noqa: E402
                      palette, parse_color, parse_hex_color, summarize)

FIXTURE = ROOT / 'evals' / 'fixtures' / 'sloppy-app'


class ContrastTests(unittest.TestCase):
    def test_white_black(self):
        self.assertAlmostEqual(contrast_ratio('#ffffff', '#000000'), 21.0, places=5)

    def test_same_color(self):
        self.assertAlmostEqual(contrast_ratio('#123456', '#123456'), 1.0, places=6)

    def test_shorthand(self):
        self.assertEqual(parse_hex_color('#fff'), parse_hex_color('#ffffff'))

    def test_invalid(self):
        for bad in ('#12345', 'blue', '#GGGGGG'):
            with self.assertRaises(ValueError):
                parse_color(bad)

    def test_symmetry_opaque(self):
        self.assertAlmostEqual(contrast_ratio('#FAFAFA', '#151515'), contrast_ratio('#151515', '#FAFAFA'))

    def test_alpha_is_composited(self):
        # 50% white over black is mid gray, far below pure white contrast.
        half = contrast_ratio('#80FFFFFF', '#000000')
        self.assertLess(half, 21.0)
        self.assertAlmostEqual(half, contrast_ratio('#808080', '#000000'), places=1)

    def test_kotlin_hex_form(self):
        self.assertEqual(parse_color('0xFF006A6A'), parse_color('#006A6A'))

    def test_translucent_background_rejected(self):
        with self.assertRaises(ValueError):
            contrast_ratio('#FFFFFF', '#80000000')


class LintTests(unittest.TestCase):
    def setUp(self):
        self.report = lint(FIXTURE)
        self.ids = {f['rule'] for f in self.report['findings']}

    def test_fixture_triggers_core_rules(self):
        expected = {'A001', 'A003', 'C001', 'C004', 'D002', 'D010', 'L001', 'L004', 'L005', 'L007', 'M001',
                    'N001', 'N004', 'P001', 'P002', 'P005', 'T001', 'X001', 'X003', 'X005'}
        self.assertTrue(expected <= self.ids, f'missing: {sorted(expected - self.ids)}')

    def test_rule_ids_unique_and_documented(self):
        ids = [r.id for r in RULES]
        self.assertEqual(len(ids), len(set(ids)))
        for r in RULES:
            self.assertTrue((ROOT / r.doc).is_file(), f'{r.id} points to missing {r.doc}')

    def test_sorted_by_severity(self):
        order = {'high': 3, 'medium': 2, 'low': 1}
        sev = [order[f['severity']] for f in self.report['findings']]
        self.assertEqual(sev, sorted(sev, reverse=True))

    def test_suppression_comment(self):
        code = 'val c = Color(0xFF112233) // craft-lint: ignore C001\nval d = Color(0xFF112233)\n'
        hits = [f.line for f in lint_text(code, 'ui/Screen.kt', '.kt') if f.rule == 'C001']
        self.assertEqual(hits, [2])

    def test_theme_files_may_define_colors(self):
        self.assertFalse([f for f in lint_text('val c = Color(0xFF112233)', 'ui/theme/Color.kt', '.kt') if f.rule == 'C001'])

    def test_small_target_only_when_interactive(self):
        self.assertFalse(lint_text('Icon(x, null, Modifier.size(24.dp))', 'a.kt', '.kt'))
        self.assertTrue([f for f in lint_text('Box(Modifier.size(24.dp).clickable { })', 'a.kt', '.kt') if f.rule == 'A003'])
        self.assertFalse([f for f in lint_text('Box(Modifier.size(48.dp).clickable { })', 'a.kt', '.kt') if f.rule == 'A003'])

    def test_keyed_items_not_flagged(self):
        self.assertFalse([f for f in lint_text('items(list, key = { it.id }) { }', 'a.kt', '.kt') if f.rule == 'P001'])

    def test_short_tween_not_flagged(self):
        self.assertFalse([f for f in lint_text('tween(200)', 'a.kt', '.kt') if f.rule == 'P005'])

    def test_comments_ignored(self):
        self.assertFalse(lint_text('// override fun onBackPressed() {', 'a.kt', '.kt'))

    def test_outputs(self):
        self.assertIn('does **not**', lint_markdown(lint(Path(tempfile.mkdtemp()))))
        sarif = lint_sarif(self.report)
        self.assertEqual(sarif['version'], '2.1.0')
        self.assertEqual(len(sarif['runs'][0]['results']), len(self.report['findings']))
        json.dumps(sarif)


class PaletteTests(unittest.TestCase):
    def test_template_theme_passes(self):
        report = palette(ROOT / 'assets' / 'compose')
        names = {s['name'] for s in report['schemes']}
        self.assertTrue({'LightColors', 'DarkColors', 'LightExtended', 'DarkExtended'} <= names)
        self.assertTrue(all(s['failures'] == 0 for s in report['schemes']))

    def test_detects_failing_pair_and_resolves_named_colors(self):
        with tempfile.TemporaryDirectory() as td:
            Path(td, 'Theme.kt').write_text(
                'val Brand = Color(0xFF9E9E9E)\n'
                'val Light = lightColorScheme(primary = Brand, onPrimary = Color(0xFFFFFFFF))\n', encoding='utf-8')
            scheme = palette(Path(td))['schemes'][0]
            self.assertEqual(scheme['roles']['primary'], '#FF9E9E9E')
            self.assertEqual(scheme['failures'], 1)


class LegacyScanTests(unittest.TestCase):
    def test_reports_hints_not_assertions(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            src = root / 'app' / 'src' / 'main'
            src.mkdir(parents=True)
            (src / 'Main.kt').write_text('@Composable fun Main() {\n LazyColumn { }\n Text("Hi", fontSize = 10.sp)\n}',
                                         encoding='utf-8')
            report = summarize(root)
            ids = {f['code'] for f in report['findings']}
            self.assertIn('small_text_literals', ids)
            self.assertIn('window_insets', ids)
            self.assertIn('não', as_markdown(report).lower())

    def test_ignores_build_folder(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'build').mkdir()
            (root / 'build' / 'Fake.kt').write_text('@Composable fun Wrong() {}')
            self.assertEqual(summarize(root)['summary']['source_files'], 0)


if __name__ == '__main__':
    unittest.main()
