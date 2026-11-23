#!/usr/bin/env python3
"""Capture the current screen across stress configurations with adb, then restore the device.

Open the target screen first. Each profile changes a few settings, waits, captures a PNG
(and optionally the uiautomator view tree), and restores those settings before the next one.
Originals are saved to <out>/original_settings.json first, so --restore-only can recover
after a hard kill. Use --dry-run on a personal phone to see every command first.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

NAV_OVERLAYS = {  # settings secure navigation_mode value -> overlay package
    '0': 'com.android.internal.systemui.navbar.threebutton',
    '1': 'com.android.internal.systemui.navbar.twobutton',
    '2': 'com.android.internal.systemui.navbar.gestural',
}

# knob -> (kind, details). Values are applied in profile order.
PROFILES: dict[str, dict] = {
    'baseline': {'set': [], 'about': 'current state, reference image'},
    'dark': {'set': [('night', 'yes')], 'about': 'dark theme'},
    'light': {'set': [('night', 'no')], 'about': 'light theme'},
    'font130': {'set': [('setting:system:font_scale', '1.3')], 'about': 'font scale 130%'},
    'font200': {'set': [('setting:system:font_scale', '2.0')], 'about': 'font scale 200% (nonlinear on Android 14+)', 'min_api': 34},
    'display_large': {'set': [('density', 'x1.25')], 'about': 'display size +25%'},
    'bold': {'set': [('setting:secure:font_weight_adjustment', '300')], 'about': 'bold text', 'min_api': 31},
    'high_contrast_text': {'set': [('setting:secure:high_text_contrast_enabled', '1')], 'about': 'high contrast text'},
    'motion_off': {'set': [('setting:global:animator_duration_scale', '0'), ('setting:global:transition_animation_scale', '0'),
                           ('setting:global:window_animation_scale', '0')], 'about': 'animations off'},
    'nav_3button': {'set': [('nav', '0')], 'about': '3-button navigation'},
    'nav_gesture': {'set': [('nav', '2')], 'about': 'gesture navigation'},
    'rtl': {'set': [('locale', 'ar')], 'about': 'Arabic per-app locale (RTL)', 'min_api': 33, 'needs_package': True},
    'pseudo_long': {'set': [('locale', 'en-XA')], 'about': 'pseudo-locale text expansion (debug build with pseudo-locales)',
                    'min_api': 33, 'needs_package': True},
    'landscape': {'set': [('setting:system:accelerometer_rotation', '0'), ('setting:system:user_rotation', '1')],
                  'about': 'landscape rotation'},
}
GROUPS = {
    'core': ['baseline', 'dark', 'font200', 'rtl', 'landscape', 'nav_3button'],
    'font': ['font130', 'font200', 'bold'],
    'nav': ['nav_3button', 'nav_gesture'],
    'motion': ['motion_off'],
    'all': list(PROFILES),
}


class Adb:
    """Thin adb wrapper. In dry-run mode it records commands and returns placeholders."""

    def __init__(self, serial: str | None = None, dry_run: bool = False, runner=None):
        self.base = ['adb'] + (['-s', serial] if serial else [])
        self.dry_run = dry_run
        self.runner = runner or self._run
        self.log: list[str] = []

    @staticmethod
    def _run(cmd: list[str], binary: bool) -> bytes:
        done = subprocess.run(cmd, capture_output=True, timeout=60, check=False)
        if done.returncode != 0:
            raise RuntimeError(f"{' '.join(cmd)} failed: {done.stderr.decode(errors='replace').strip()}")
        return done.stdout

    def shell(self, *args: str) -> str:
        cmd = self.base + ['shell', *args]
        self.log.append(' '.join(cmd))
        if self.dry_run:
            return ''
        return self.runner(cmd, False).decode(errors='replace').strip()

    def exec_out(self, *args: str) -> bytes:
        cmd = self.base + ['exec-out', *args]
        self.log.append(' '.join(cmd))
        if self.dry_run:
            return b''
        return self.runner(cmd, True)


class Device:
    def __init__(self, adb: Adb, package: str | None):
        self.adb = adb
        self.package = package

    # --- read current values (string form that write() accepts back)
    def read(self, knob: str) -> str:
        if knob.startswith('setting:'):
            _, ns, key = knob.split(':')
            return self.adb.shell('settings', 'get', ns, key) or 'null'
        if knob == 'night':
            out = self.adb.shell('cmd', 'uimode', 'night')
            m = re.search(r'Night mode:\s*(\w+)', out)
            return m.group(1) if m else 'no'
        if knob == 'density':
            out = self.adb.shell('wm', 'density')
            override = re.search(r'Override density:\s*(\d+)', out)
            physical = re.search(r'Physical density:\s*(\d+)', out)
            return f"{override.group(1) if override else 'reset'}|{physical.group(1) if physical else ''}"
        if knob == 'nav':
            return self.adb.shell('settings', 'get', 'secure', 'navigation_mode') or '2'
        if knob == 'locale':
            out = self.adb.shell('cmd', 'locale', 'get-app-locales', self.package)
            m = re.search(r'\[(.*?)\]', out)
            return m.group(1).replace(' ', '') if m else ''
        raise ValueError(f'unknown knob {knob}')

    def write(self, knob: str, value: str, original: str | None = None) -> None:
        if knob.startswith('setting:'):
            _, ns, key = knob.split(':')
            if value == 'null':
                self.adb.shell('settings', 'delete', ns, key)
            else:
                self.adb.shell('settings', 'put', ns, key, value)
        elif knob == 'night':
            self.adb.shell('cmd', 'uimode', 'night', value)
        elif knob == 'density':
            if value.startswith('x'):
                physical = (original or '|').split('|')[1]
                if not physical and self.adb.dry_run:
                    physical = '420'
                self.adb.shell('wm', 'density', str(round(int(physical) * float(value[1:]))))
            else:
                override = value.split('|')[0]
                self.adb.shell('wm', 'density', override if override != 'reset' else 'reset')
        elif knob == 'nav':
            self.adb.shell('cmd', 'overlay', 'enable-exclusive', '--category', NAV_OVERLAYS.get(value, NAV_OVERLAYS['2']))
        elif knob == 'locale':
            # shortcut: restoring "no per-app locale" sends an empty list; verify on very old/new API levels.
            self.adb.shell('cmd', 'locale', 'set-app-locales', self.package, '--locales', value or "''")
        else:
            raise ValueError(f'unknown knob {knob}')


def expand(names: str) -> list[str]:
    out: list[str] = []
    for name in (n.strip() for n in names.split(',') if n.strip()):
        for item in GROUPS.get(name, [name]):
            if item not in PROFILES:
                raise ValueError(f'Unknown profile "{item}". Use --list.')
            if item not in out:
                out.append(item)
    return out


def run(device: Device, profiles: list[str], out: Path, settle: float, dump: bool, api: int | None) -> dict:
    originals: dict[str, str] = {}
    results = []
    orig_file = out / 'original_settings.json'

    def save_originals():
        if not device.adb.dry_run:
            orig_file.write_text(json.dumps({'package': device.package, 'originals': originals}, indent=2), encoding='utf-8')

    def restore(knobs):
        for knob in knobs:
            if knob in originals:
                device.write(knob, originals[knob])

    try:
        for name in profiles:
            spec = PROFILES[name]
            entry = {'profile': name, 'about': spec['about']}
            if spec.get('needs_package') and not device.package:
                results.append({**entry, 'status': 'not_run', 'reason': 'needs --package'})
                continue
            if api is not None and api < spec.get('min_api', 0):
                results.append({**entry, 'status': 'not_run', 'reason': f"needs API {spec['min_api']}+, device is {api}"})
                continue
            touched = []
            for knob, value in spec['set']:
                if knob not in originals:
                    originals[knob] = device.read(knob)
                    save_originals()
                device.write(knob, value, originals[knob])
                touched.append(knob)
            if not device.adb.dry_run:
                time.sleep(settle)
            png = out / f'{name}.png'
            data = device.adb.exec_out('screencap', '-p')
            if not device.adb.dry_run:
                png.write_bytes(data)
            entry.update(status='captured', png=png.name)
            if dump:
                device.adb.shell('uiautomator', 'dump', '/sdcard/craft_ui.xml')
                xml = device.adb.exec_out('cat', '/sdcard/craft_ui.xml')
                if not device.adb.dry_run:
                    (out / f'{name}.xml').write_bytes(xml)
                entry['xml'] = f'{name}.xml'
            restore(touched)
            results.append(entry)
    finally:
        restore(list(originals))
    return {'profiles': results, 'originals': originals, 'restored': True}


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--out', type=Path, help='Output folder (new or empty)')
    p.add_argument('--profiles', default='core', help='Comma list of profiles or groups (core, font, nav, motion, all)')
    p.add_argument('--package', help='App package (needed for rtl / pseudo_long per-app locale)')
    p.add_argument('--serial', help='adb device serial')
    p.add_argument('--settle', type=float, default=2.5, help='Seconds to wait after a change (activity recreation)')
    p.add_argument('--dump', action='store_true', help='Also save uiautomator view trees with bounds')
    p.add_argument('--dry-run', action='store_true', help='Print commands without touching the device')
    p.add_argument('--list', action='store_true', help='List profiles and groups')
    p.add_argument('--restore-only', type=Path, metavar='OUT', help='Restore settings saved in OUT/original_settings.json')
    a = p.parse_args(argv)

    if a.list:
        for name, spec in PROFILES.items():
            print(f"{name:<20} {spec['about']}")
        for g, items in GROUPS.items():
            print(f"group {g:<14} {', '.join(items)}")
        return 0
    if not a.dry_run and not shutil.which('adb'):
        p.error('adb not found on PATH (install Android platform-tools)')
    adb = Adb(a.serial, a.dry_run)

    if a.restore_only:
        saved = json.loads((a.restore_only / 'original_settings.json').read_text(encoding='utf-8'))
        device = Device(adb, saved.get('package'))
        for knob, value in saved['originals'].items():
            device.write(knob, value)
        print('Restored:', ', '.join(saved['originals']) or 'nothing')
        return 0

    if not a.out:
        p.error('--out is required')
    try:
        profiles = expand(a.profiles)
    except ValueError as exc:
        p.error(str(exc))
    if not a.dry_run:
        if a.out.exists() and any(a.out.iterdir()):
            p.error('Output folder is not empty; choose a new one')
        a.out.mkdir(parents=True, exist_ok=True)
    device = Device(adb, a.package)
    info = {}
    api = None
    if not a.dry_run:
        info = {'model': adb.shell('getprop', 'ro.product.model'), 'api': adb.shell('getprop', 'ro.build.version.sdk'),
                'density': adb.shell('wm', 'density'), 'size': adb.shell('wm', 'size')}
        api = int(info['api']) if info['api'].isdigit() else None
    try:
        result = run(device, profiles, a.out, a.settle, a.dump, api)
    except (RuntimeError, ValueError) as exc:
        print(f'Error: {exc}. Settings touched so far were restored; check {a.out}/original_settings.json.', file=sys.stderr)
        return 1
    manifest = {'device': info, 'package': a.package, **result, 'commands': adb.log}
    if a.dry_run:
        print('\n'.join(adb.log))
        print(f'\n(dry run) {len(profiles)} profiles, nothing changed.')
    else:
        (a.out / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
        captured = sum(1 for r in result['profiles'] if r['status'] == 'captured')
        print(f'Captured {captured}/{len(profiles)} profiles into {a.out}. Settings restored. Review images side by side.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
