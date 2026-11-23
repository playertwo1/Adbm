#!/usr/bin/env python3
"""Safe local video frame sampling using installed ffmpeg (optional).
Does not process audio, auto-analyze motion or send data anywhere.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import shutil
import subprocess


def build_ffmpeg_command(video: Path, output_dir: Path, interval: float, maximum: int) -> list[str]:
    if interval <= 0 or maximum < 1 or maximum > 200:
        raise ValueError('Use --interval > 0 and 1 <= --max-frames <= 200')
    # fps filter creates regular time samples, limited by -frames:v.
    return ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', str(video),
            '-vf', f'fps=1/{interval:g}', '-frames:v', str(maximum),
            str(output_dir/'frame_%03d.png')]


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description='Sample authorized local recording into timestamp-approximate frames')
    parser.add_argument('video', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--interval', type=float, default=2.0, help='Seconds per sample')
    parser.add_argument('--max-frames', type=int, default=24)
    args = parser.parse_args(argv)
    if not args.video.is_file():
        parser.error('Video file not found')
    if args.output.exists() and any(args.output.iterdir()):
        parser.error('Output directory is non-empty; choose a new directory to avoid clobbering assets')
    if not shutil.which('ffmpeg'):
        parser.error('ffmpeg not available; install separately or manually capture reference frames')
    try:
        cmd = build_ffmpeg_command(args.video.resolve(), args.output.resolve(), args.interval, args.max_frames)
    except ValueError as e:
        parser.error(str(e))
    args.output.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print(result.stderr)
        return result.returncode
    frames = sorted(args.output.glob('frame_*.png'))
    manifest = {'source': str(args.video.resolve()), 'approximate_interval_seconds': args.interval,
                'frames': [{'file': f.name, 'sample_index': i,
                            'approximate_timestamp_seconds': round((i + .5)*args.interval, 3)}
                            for i, f in enumerate(frames)],
                'note': 'Sampling offsets depend on ffmpeg fps filter; verify exact events/timing from original video. Audio not transcribed.'}
    (args.output/'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'Created {len(frames)} frames. Visual inspection required.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
