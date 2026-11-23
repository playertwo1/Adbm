"""Exercise Windows batch launchers without running installed third-party tools."""
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('mobile_windows', Path(__file__).resolve().parents[1] / 'scripts/mobile.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


@unittest.skipUnless(os.name == 'nt', 'Windows batch launchers')
class WindowsLauncher(unittest.TestCase):
    def test_resolves_batch_launcher_with_spaces_from_path(self):
        with tempfile.TemporaryDirectory(prefix='mobile launcher ') as td:
            script = Path(td) / 'ims-test.cmd'
            script.write_text('@echo off\necho launcher-ok\n', encoding='ascii')
            with patch.dict(os.environ, {'PATH': td + os.pathsep + os.environ['PATH']}):
                result = m.command(['ims-test', 'hello'])
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('launcher-ok', result.stdout)

    def test_batch_metacharacters_are_rejected_before_execution(self):
        with tempfile.TemporaryDirectory() as td:
            script = Path(td) / 'ims-test.cmd'
            script.write_text('@echo off\necho invoked\n', encoding='ascii')
            with patch.object(m.subprocess, 'run') as run:
                with self.assertRaisesRegex(ValueError, 'batch'):
                    m.command([str(script), 'TARGET_TEXT=Agenda&echo'])
                run.assert_not_called()
