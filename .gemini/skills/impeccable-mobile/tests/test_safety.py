"""Regression tests for evidence preservation; no Android device required."""
import importlib.util
import io
import os
import subprocess
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import patch

from PIL import Image

spec = importlib.util.spec_from_file_location('mobile_safety', Path(__file__).resolve().parents[1] / 'scripts/mobile.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class EvidenceSafety(unittest.TestCase):
    def test_valid_png_is_saved_with_device_metadata(self):
        stream = io.BytesIO()
        Image.new('RGB', (4, 5)).save(stream, format='PNG')
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / 'capture.png'
            proc = subprocess.CompletedProcess([], 0, stream.getvalue(), b'')
            with patch.object(m, 'command', return_value=proc), patch.object(m, 'device_info', return_value={'serial': 'test-device'}):
                m.screenshot(path, 'test-device')
            self.assertEqual(path.read_bytes(), stream.getvalue())
            self.assertIn('test-device', path.with_suffix('.json').read_text())

    def test_diff_cannot_overwrite_hardlinked_input(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            Image.new('RGB', (2, 2)).save(d / 'a.png')
            Image.new('RGB', (2, 2), 'white').save(d / 'b.png')
            (d / 'out').mkdir()
            os.link(d / 'a.png', d / 'out/difference.png')
            with self.assertRaises(ValueError):
                m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out', overwrite=True)

    def test_maestro_accepts_explicit_workdir(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            flow = d / 'flow.yaml'
            flow.write_text('appId: ${APP_ID}\n---\n- launchApp\n')
            args = m.parser().parse_args(['test', '--flow', str(flow), '--app-id', 'com.example.app', '--workdir', td])
            with patch.object(m.shutil, 'which', return_value='maestro'), patch.object(m, 'command', return_value=subprocess.CompletedProcess([], 0, '', '')) as run:
                m.cmd_test(args)
                self.assertEqual(run.call_args.kwargs['cwd'], d.resolve())

    def test_overwrite_replaces_comparison_only_when_requested(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            Image.new('RGB', (2, 2)).save(d / 'a.png')
            Image.new('RGB', (2, 2)).save(d / 'b.png')
            m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out')
            Image.new('RGB', (2, 2), 'white').save(d / 'b.png')
            result = m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out', overwrite=True)
            self.assertEqual(result['changed_percent'], 100)

    def test_capture_preserves_orphan_json(self):
        with tempfile.TemporaryDirectory() as td:
            image = Path(td) / 'home.png'
            image.with_suffix('.json').write_text('previous evidence')
            args = m.parser().parse_args(['capture', '--name', 'home', '--output', str(image)])
            with patch.object(m, 'screenshot') as capture:
                with self.assertRaises(RuntimeError):
                    m.cmd_capture(args)
                capture.assert_not_called()

    def test_inspect_preserves_orphan_xml(self):
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / 'home.xml').write_text('previous hierarchy')
            args = m.parser().parse_args(['inspect', '--name', 'home', '--output-dir', td, '--include-xml'])
            with patch.object(m, 'screenshot') as capture:
                with self.assertRaises(RuntimeError):
                    m.cmd_inspect(args)
                capture.assert_not_called()

    def test_png_signature_alone_is_not_a_valid_capture(self):
        with tempfile.TemporaryDirectory() as td:
            image = Path(td) / 'broken.png'
            proc = subprocess.CompletedProcess([], 0, b'\x89PNG\r\n\x1a\ntruncated', b'')
            with patch.object(m, 'command', return_value=proc), patch.object(m, 'device_info', return_value={}):
                with self.assertRaises(RuntimeError):
                    m.screenshot(image, None)
            self.assertFalse(image.exists())

    def test_cleanup_failure_does_not_replace_dump_error(self):
        with tempfile.TemporaryDirectory() as td:
            args = m.parser().parse_args(['inspect', '--name', 'home', '--output-dir', td, '--include-xml'])
            def fake_command(argv, **kwargs):
                if 'rm' in argv:
                    raise RuntimeError('cleanup timeout')
                if 'dump' in argv:
                    raise RuntimeError('original dump error')
                raise AssertionError(argv)
            with patch.object(m, 'screenshot'), patch.object(m, 'command', side_effect=fake_command) as run, redirect_stderr(io.StringIO()):
                with self.assertRaisesRegex(RuntimeError, 'original dump error'):
                    m.cmd_inspect(args)
                self.assertTrue(any('rm' in call.args[0] for call in run.call_args_list))

    def test_diff_cannot_overwrite_input_even_when_named_like_output(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            before = d / 'difference.png'
            after = d / 'after.png'
            Image.new('RGB', (3, 3), 'black').save(before)
            Image.new('RGB', (3, 3), 'white').save(after)
            original = before.read_bytes()
            with self.assertRaises(ValueError):
                m.compute_visual_diff(before, after, d)
            self.assertEqual(before.read_bytes(), original)

    def test_diff_preserves_existing_results(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            Image.new('RGB', (3, 3)).save(d / 'a.png')
            Image.new('RGB', (3, 3)).save(d / 'b.png')
            (d / 'out').mkdir()
            (d / 'out/comparison.json').write_text('previous result')
            with self.assertRaises(RuntimeError):
                m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out')
            self.assertEqual((d / 'out/comparison.json').read_text(), 'previous result')

    def test_diff_counts_overlapping_ignored_regions_once(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            Image.new('RGB', (10, 10), 'black').save(d / 'a.png')
            Image.new('RGB', (10, 10), 'white').save(d / 'b.png')
            result = m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out', ignore_regions=[(0, 0, 5, 10), (0, 0, 5, 10)])
            self.assertEqual(result['ignored_pixels'], 50)
            self.assertEqual(result['compared_pixels'], 50)
            self.assertEqual(result['changed_percent_compared'], 100)

    def test_all_ignored_is_not_a_successful_comparison(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            Image.new('RGB', (2, 2)).save(d / 'a.png')
            Image.new('RGB', (2, 2)).save(d / 'b.png')
            with self.assertRaisesRegex(ValueError, 'Todas as áreas'):
                m.compute_visual_diff(d / 'a.png', d / 'b.png', d / 'out', ignore_regions=[(0, 0, 2, 2)])
            self.assertFalse((d / 'out').exists())

    def test_maestro_uses_explicit_working_directory(self):
        with tempfile.TemporaryDirectory() as td:
            flow = Path(td) / 'flow.yaml'
            flow.write_text('appId: ${APP_ID}\n---\n- launchApp\n')
            args = m.parser().parse_args(['test', '--flow', str(flow), '--app-id', 'com.example.app'])
            with patch.object(m.shutil, 'which', return_value='maestro'), patch.object(m, 'command', return_value=subprocess.CompletedProcess([], 0, '', '')) as run:
                m.cmd_test(args)
                self.assertEqual(run.call_args.kwargs['cwd'], Path.cwd())

    def test_timeout_must_be_positive(self):
        with redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                m.parser().parse_args(['test', '--flow', 'x.yaml', '--app-id', 'com.example.app', '--timeout', '0'])
