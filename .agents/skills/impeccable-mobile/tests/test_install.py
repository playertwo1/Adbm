"""Run the actual installer only against disposable, isolated projects."""
import shutil
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POWERSHELL = os.environ.get('IMS_TEST_POWERSHELL') or shutil.which('pwsh') or shutil.which('powershell')


@unittest.skipUnless(POWERSHELL, 'PowerShell is not available')
class InstallerSafety(unittest.TestCase):
    def invoke(self, source, project, *options, prefix=''):
        def quoted(value):
            return "'" + str(value).replace("'", "''") + "'"
        command = prefix + f"& {quoted(source / 'scripts/install.ps1')} -ProjectPath {quoted(project)}"
        i = 0
        while i < len(options):
            if options[i] == '-Providers':
                command += ' -Providers @(' + ','.join(quoted(v) for v in options[i + 1].split(',')) + ')'
                i += 2
            else:
                command += ' ' + options[i]
                i += 1
        return subprocess.run([POWERSHELL, '-NoProfile', '-Command', command], capture_output=True, text=True)

    def fixture(self, base):
        source = base / 'kit'
        source.mkdir()
        for name in ['SKILL.md', 'README.md', 'CHANGELOG.md', 'requirements.txt', 'LICENSE', '.gitignore', '.gitattributes', 'manifest.json', 'SHA256SUMS.txt']:
            shutil.copy2(ROOT / name, source / name)
        for name in ['references', 'workflows', 'scripts', 'maestro', 'templates', 'docs', 'tests']:
            shutil.copytree(ROOT / name, source / name, ignore=shutil.ignore_patterns('__pycache__'))
        project = base / 'app with spaces'
        project.mkdir()
        return source, project

    def test_invalid_provider_is_rejected_before_any_installation(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            result = self.invoke(source, project, '-Providers', 'codex,invalid')
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((project / '.agents').exists())

    def test_missing_source_does_not_destroy_existing_install(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            target = project / '.agents/skills/impeccable-mobile'
            target.mkdir(parents=True)
            (target / 'custom.txt').write_text('keep me')
            (source / 'README.md').unlink()
            result = self.invoke(source, project, '-Force')
            self.assertNotEqual(result.returncode, 0)
            self.assertTrue((target / 'custom.txt').is_file())

    def test_failed_activation_restores_previous_install(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            target = project / '.agents/skills/impeccable-mobile'
            target.mkdir(parents=True)
            (target / 'custom.txt').write_text('keep me')
            failure = "function Move-Item { param([string]$LiteralPath,[string]$Destination) if ($LiteralPath -like '*install-staging*') { throw 'simulated activation failure' }; Microsoft.PowerShell.Management\\Move-Item -LiteralPath $LiteralPath -Destination $Destination }; "
            result = self.invoke(source, project, '-Force', prefix=failure)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('simulated activation failure', result.stdout + result.stderr)
            self.assertEqual((target / 'custom.txt').read_text(), 'keep me')
            self.assertFalse((target / 'SKILL.md').exists())

    def test_install_copies_ignore_rules_and_manifest(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            result = self.invoke(source, project)
            self.assertEqual(result.returncode, 0, result.stderr)
            target = project / '.agents/skills/impeccable-mobile'
            self.assertTrue((target / '.gitignore').is_file())
            self.assertTrue((target / 'manifest.json').is_file())
            (target / 'custom.txt').write_text('keep me')
            result = self.invoke(source, project)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((target / 'custom.txt').read_text(), 'keep me')

    def test_force_preserves_previous_install_as_backup(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            target = project / '.agents/skills/impeccable-mobile'
            target.mkdir(parents=True)
            (target / 'custom.txt').write_text('keep me')
            result = self.invoke(source, project, '-Force')
            self.assertEqual(result.returncode, 0, result.stderr)
            backups = list((project / '.impeccable-mobile/install-backups').glob('codex-*'))
            self.assertEqual(len(backups), 1)
            self.assertEqual((backups[0] / 'custom.txt').read_text(), 'keep me')
            self.assertEqual([p.name for p in target.parent.iterdir()], ['impeccable-mobile'])

    def test_all_providers_install_in_expected_locations(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            result = self.invoke(source, project, '-Providers', 'codex,claude,antigravity,gemini')
            self.assertEqual(result.returncode, 0, result.stderr)
            for folder in ['.agents', '.claude', '.agent', '.gemini']:
                self.assertTrue((project / folder / 'skills/impeccable-mobile/SKILL.md').is_file())

    def test_installer_refuses_to_overwrite_itself(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            result = self.invoke(source, project)
            self.assertEqual(result.returncode, 0, result.stderr)
            target = project / '.agents/skills/impeccable-mobile'
            original = (target / 'SKILL.md').read_bytes()
            result = self.invoke(target, project, '-Force')
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((target / 'SKILL.md').read_bytes(), original)

    def test_whatif_does_not_create_directories(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            result = self.invoke(source, project, '-WhatIf')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(list(project.iterdir()), [])

    @unittest.skipUnless(os.name == 'nt', 'Windows junction regression')
    def test_junction_cannot_redirect_installation_outside_project(self):
        with tempfile.TemporaryDirectory() as td:
            source, project = self.fixture(Path(td))
            outside = Path(td) / 'outside'
            outside.mkdir()
            junction = project / '.agents'
            def quoted(value):
                return "'" + str(value).replace("'", "''") + "'"
            result = subprocess.run([POWERSHELL, '-NoProfile', '-Command', f"New-Item -ItemType Junction -Path {quoted(junction)} -Target {quoted(outside)} | Out-Null"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            result = self.invoke(source, project, '-Force')
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(list(outside.iterdir()), [])
