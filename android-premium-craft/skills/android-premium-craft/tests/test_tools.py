import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / 'evals' / 'fixtures' / 'sloppy-app'


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


probe = load('project_probe')
gate = load('review_gate')
matrix = load('device_matrix')
install = load('install_skill')
capture = load('reference_capture')
validator = load('validate_skill')


class ProbeTests(unittest.TestCase):
    def test_unknown_is_unknown(self):
        with tempfile.TemporaryDirectory() as td:
            report = probe.probe(Path(td))
            self.assertEqual(report['screenshot_advice'], 'unknown_agp_check_manually')
            self.assertEqual(report['versions']['targetSdk'], 'unknown')
            self.assertIn('unknown', report['mandates'][0])

    def test_old_agp_no_upgrade(self):
        with tempfile.TemporaryDirectory() as td:
            Path(td, 'build.gradle.kts').write_text('id("com.android.application") version "8.9.0"', encoding='utf-8')
            self.assertIn('no_forced_agp_upgrade', probe.probe(Path(td))['screenshot_advice'])

    def test_agp_95_alpha03(self):
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / 'gradle').mkdir()
            (Path(td) / 'gradle' / 'libs.versions.toml').write_text('agp = "9.5.0-alpha03"\ntargetSdk = "37"', encoding='utf-8')
            report = probe.probe(Path(td))
            self.assertIn('experimental', report['screenshot_advice'])
            self.assertEqual(report['versions']['targetSdk'], [37])
            self.assertTrue(any('SDK 37+' in m for m in report['mandates']))

    def test_conflicting_version_candidates(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / 'build.gradle.kts').write_text('id("com.android.application") version "8.9.0"')
            (root / 'app').mkdir()
            (root / 'app' / 'build.gradle.kts').write_text('id("com.android.library") version "9.5.0-alpha03"')
            self.assertEqual(probe.probe(root)['screenshot_advice'], 'multiple_agp_candidates_verify_manually')

    def test_fixture_recon(self):
        report = probe.probe(FIXTURE)
        self.assertEqual(report['versions']['targetSdk'], [36])
        self.assertEqual(report['versions']['compose_bom'], '2026.09.00')
        self.assertEqual(report['toolkit']['verdict'], 'hybrid')
        self.assertTrue(report['libraries']['roborazzi'])
        self.assertTrue(report['manifest']['resizeableActivity_false'])
        self.assertTrue(any('SDK 36+' in m for m in report['mandates']))


class GateTests(unittest.TestCase):
    def sample(self):
        return json.loads((ROOT / 'assets' / 'REVIEW_EVIDENCE_TEMPLATE.json').read_text(encoding='utf-8'))

    def passing(self):
        report = self.sample()
        for name in report['required_checks']:
            report['checks'][name] = {'status': 'pass', 'evidence': 'Ran on Pixel 8 emulator, see shots/core/'}
        return report

    def test_template_valid_but_incomplete(self):
        result = gate.analyze(self.sample())
        self.assertTrue(result['valid'])
        self.assertFalse(result['ready'])
        self.assertEqual(result['decision'], 'incomplete')
        self.assertIn('build: not_run', result['blockers'])

    def test_all_required_pass_is_verified(self):
        result = gate.analyze(self.passing())
        self.assertTrue(result['ready'])
        self.assertEqual(result['decision'], 'verified_for_scope')
        self.assertIn('Documentation-only', result['warning'])

    def test_build_pass_rest_pending_is_ready_for_visual_review(self):
        report = self.sample()
        report['checks']['build'] = {'status': 'pass', 'evidence': './gradlew assembleDebug passed'}
        self.assertEqual(gate.analyze(report)['decision'], 'ready_for_visual_review')

    def test_speedup_requires_performance(self):
        report = self.passing()
        report['claims_of_speedup'] = True
        result = gate.analyze(report)
        self.assertIn('performance: not_run', result['blockers'])
        self.assertFalse(result['ready'])

    def test_fail_blocks(self):
        report = self.passing()
        report['checks']['accessibility']['status'] = 'fail'
        self.assertEqual(gate.analyze(report)['decision'], 'blocked')

    def test_p1_issue_blocks_p3_does_not(self):
        report = self.passing()
        report['open_issues'] = [{'severity': 'P3', 'title': 'icon weight'}]
        self.assertTrue(gate.analyze(report)['ready'])
        report['open_issues'].append({'severity': 'P1', 'title': 'CTA under IME'})
        self.assertEqual(gate.analyze(report)['decision'], 'blocked')

    def test_missing_evidence_invalid(self):
        report = self.sample()
        report['checks']['visual']['evidence'] = ''
        self.assertFalse(gate.analyze(report)['valid'])

    def test_v1_report_still_accepted(self):
        v1 = self.sample()
        del v1['schema'], v1['checks']['states'], v1['checks']['adaptive'], v1['open_issues']
        v1['required_checks'] = ['build']
        v1['critical_open_issues'] = ['Primary CTA hidden behind IME']
        result = gate.analyze(v1)
        self.assertTrue(result['valid'])
        self.assertIn('1 critical open issue(s)', result['blockers'])


class FakeRunner:
    """Simulates adb: settings store + canned outputs."""

    def __init__(self):
        self.settings = {('system', 'font_scale'): '1.0'}
        self.night = 'no'
        self.calls = []

    def __call__(self, cmd, binary):
        args = cmd[cmd.index('shell') + 1:] if 'shell' in cmd else cmd[cmd.index('exec-out') + 1:]
        self.calls.append(args)
        if args[:2] == ['settings', 'get']:
            return self.settings.get((args[2], args[3]), 'null').encode()
        if args[:2] == ['settings', 'put']:
            self.settings[(args[2], args[3])] = args[4]
        if args[:2] == ['settings', 'delete']:
            self.settings.pop((args[2], args[3]), None)
        if args[:3] == ['cmd', 'uimode', 'night']:
            if len(args) == 4:
                self.night = args[3]
            return f'Night mode: {self.night}'.encode()
        if args[:1] == ['screencap']:
            return b'\x89PNG fake'
        return b''


class MatrixTests(unittest.TestCase):
    def test_expand_groups(self):
        self.assertEqual(matrix.expand('core')[0], 'baseline')
        self.assertEqual(matrix.expand('font200,font'), ['font200', 'font130', 'bold'])
        with self.assertRaises(ValueError):
            matrix.expand('nope')

    def test_settings_restored_after_capture(self):
        fake = FakeRunner()
        device = matrix.Device(matrix.Adb(runner=fake), package=None)
        with tempfile.TemporaryDirectory() as td:
            result = matrix.run(device, ['font200', 'dark', 'high_contrast_text', 'rtl'], Path(td), 0, False, 34)
            self.assertTrue((Path(td) / 'font200.png').is_file())
            saved = json.loads((Path(td) / 'original_settings.json').read_text(encoding='utf-8'))
            self.assertEqual(saved['originals']['setting:system:font_scale'], '1.0')
        self.assertEqual(fake.settings[('system', 'font_scale')], '1.0')
        self.assertEqual(fake.night, 'no')
        self.assertNotIn(('secure', 'high_text_contrast_enabled'), fake.settings)  # was unset -> deleted again
        self.assertEqual(result['profiles'][3]['status'], 'not_run')  # rtl needs --package

    def test_api_gate(self):
        device = matrix.Device(matrix.Adb(runner=FakeRunner()), package='com.x')
        with tempfile.TemporaryDirectory() as td:
            result = matrix.run(device, ['font200'], Path(td), 0, False, 30)
        self.assertEqual(result['profiles'][0]['status'], 'not_run')

    def test_dry_run_touches_nothing(self):
        adb = matrix.Adb(dry_run=True, runner=lambda *a: self.fail('runner called in dry run'))
        with tempfile.TemporaryDirectory() as td:
            matrix.run(matrix.Device(adb, 'com.x'), matrix.expand('all'), Path(td), 0, True, None)
            self.assertEqual(list(Path(td).iterdir()), [])
        self.assertTrue(any('font_scale 2.0' in c for c in adb.log))


class MiscTests(unittest.TestCase):
    def test_install_targets(self):
        project = Path('/tmp/demo')
        paths = install.targets_for(project, ['codex', 'antigravity', 'claude'])
        self.assertEqual(paths, [project / '.agents' / 'skills' / 'android-premium-craft',
                                 project / '.claude' / 'skills' / 'android-premium-craft'])

    def test_reference_capture_command(self):
        args = capture.build_ffmpeg_command(Path('test.mp4'), Path('frames'), 2, 24)
        self.assertIn('fps=1/2', args)
        with self.assertRaises(ValueError):
            capture.build_ffmpeg_command(Path('test.mp4'), Path('frames'), 0, 24)

    def test_skill_validates(self):
        self.assertEqual(validator.validate(ROOT), [])


if __name__ == '__main__':
    unittest.main()
