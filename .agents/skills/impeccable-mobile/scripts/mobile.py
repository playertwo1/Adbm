#!/usr/bin/env python3
"""Local-only Android screenshot, UI inspection, visual diff and Maestro runner.

Python 3.10+. No network calls, accounts or cloud services.
"""
from __future__ import annotations

import argparse
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

DEFAULT_DIR = Path('.impeccable-mobile')


def command(args: list[str], timeout: int = 30, text: bool = True, cwd: Path | None = None):
    # CreateProcess does not resolve PATHEXT like shutil.which does.
    executable = shutil.which(args[0]) or args[0]
    argv = [executable, *args[1:]]
    # Windows can run batch files through cmd.exe even with shell=False.
    # Reject shell syntax instead of pretending list arguments make batches safe.
    if os.name == 'nt' and Path(executable).suffix.lower() in ('.bat', '.cmd'):
        if any(re.search(r'[&|<>^()%!"\r\n]', arg) for arg in argv):
            raise ValueError('Launcher batch no Windows não aceita metacaracteres de shell nos argumentos/caminhos. Use seletores simples ou um launcher executável nativo.')
    try:
        return subprocess.run(argv, capture_output=True, check=False, timeout=timeout,
                              text=text, cwd=str(cwd) if cwd else None)
    except FileNotFoundError as ex:
        raise RuntimeError(f'Executável ausente: {args[0]}') from ex
    except subprocess.TimeoutExpired as ex:
        raise RuntimeError(f'Tempo limite excedido ao executar: {args[0]}') from ex


def must_succeed(proc, label: str):
    if proc.returncode != 0:
        output = proc.stderr or proc.stdout
        if isinstance(output, bytes):
            output = output.decode('utf-8', 'replace')
        raise RuntimeError(f'{label} falhou ({proc.returncode}): {str(output)[:1200]}')
    return proc


def adb(serial: str | None = None) -> list[str]:
    return ['adb'] + (['-s', serial] if serial else [])


def safe_name(raw: str) -> str:
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,70}', raw):
        raise ValueError('Nome permitido: letras, numeros, _ e - (1 a 70).')
    return raw


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def dump_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def protect_outputs(paths: list[Path], overwrite: bool = False):
    for path in paths:
        if path.is_symlink():
            raise RuntimeError(f'Saída não pode ser link simbólico: {path}')
        if path.exists() and (not overwrite or not path.is_file()):
            raise RuntimeError(f'Saída já existe: {path}. Use outro destino ou --overwrite.')


def device_info(serial: str | None) -> dict:
    ret = {'serial': serial, 'collected_utc': utc_now()}
    props = {'model': 'ro.product.model', 'sdk': 'ro.build.version.sdk', 'android_release':'ro.build.version.release'}
    for key, prop in props.items():
        try:
            p = command(adb(serial) + ['shell','getprop',prop], timeout=10)
            ret[key] = p.stdout.strip() if p.returncode == 0 else None
        except RuntimeError:
            ret[key] = None
    for key, cmd in [('wm_size',['shell','wm','size']), ('wm_density',['shell','wm','density'])]:
        try:
            p=command(adb(serial)+cmd,timeout=10)
            ret[key]=p.stdout.strip() if p.returncode == 0 else None
        except RuntimeError:
            ret[key]=None
    return ret


def screenshot(path: Path, serial: str | None) -> dict:
    # adb exec-out emits unmodified PNG bytes, including on Windows.
    p = must_succeed(command(adb(serial) + ['exec-out','screencap','-p'], timeout=40,text=False), 'ADB screenshot')
    if not p.stdout.startswith(b'\x89PNG\r\n\x1a\n'):
        raise RuntimeError('ADB não retornou um PNG válido.')
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as ex:
        raise RuntimeError('Pillow indisponível. Rode pip install -r requirements.txt') from ex
    try:
        with Image.open(io.BytesIO(p.stdout)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError) as ex:
        raise RuntimeError('ADB retornou um PNG incompleto ou corrompido.') from ex
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(p.stdout)
    info = device_info(serial)
    info.update({'image':str(path), 'bytes':len(p.stdout)})
    dump_json(path.with_suffix('.json'), info)
    return info


def cmd_devices(args):
    p=must_succeed(command(['adb','devices','-l']), 'adb devices')
    print(p.stdout)
    print('Se houver mais de um aparelho, use --serial SERIAL.')


def cmd_capture(args):
    name=safe_name(args.name)
    path=Path(args.output).absolute() if args.output else (DEFAULT_DIR/'captures'/f'{name}.png').absolute()
    if path.suffix.lower()!='.png':
        raise ValueError('A captura deve usar extensão .png')
    protect_outputs([path, path.with_suffix('.json')], args.overwrite)
    info=screenshot(path,args.serial)
    print(f'Captura PNG salva: {path} ({info["bytes"]} bytes)')
    print('Atenção: a imagem pode conter dados pessoais. Não compartilhe sem revisar.')


def cmd_inspect(args):
    name=safe_name(args.name)
    out=Path(args.output_dir).absolute() if args.output_dir else (DEFAULT_DIR/'inspections'/name).absolute()
    img=out/f'{name}.png'
    # Protect XML even if this invocation does not collect it: avoid mixing runs.
    protect_outputs([img, img.with_suffix('.json'), img.with_suffix('.xml')], args.overwrite)
    if img.with_suffix('.xml').exists() and not args.include_xml:
        raise RuntimeError('XML anterior existe. Use outro nome para não misturar evidências.')
    out.mkdir(parents=True,exist_ok=True)
    screenshot(img,args.serial)
    print(f'Screenshot salvo: {img}')
    if args.include_xml:
        remote=f'/sdcard/__impeccable_mobile_{uuid4().hex}.xml'
        try:
            must_succeed(command(adb(args.serial)+['shell','uiautomator','dump',remote],timeout=45), 'uiautomator')
            p=must_succeed(command(adb(args.serial)+['exec-out','cat',remote],timeout=20,text=False), 'UI hierarchy')
            if b'<hierarchy' not in p.stdout:
                raise RuntimeError('Dump XML sem elemento hierarchy. Refaça a captura.')
            xml=out/f'{name}.xml'
            xml.write_bytes(p.stdout)
            print(f'Dump XML salvo: {xml}')
        finally:
            try:
                cleanup = command(adb(args.serial)+['shell','rm','-f',remote],timeout=15)
                must_succeed(cleanup, 'Limpeza XML temporário')
            except RuntimeError as ex:
                print(f'AVISO: {ex}; temporário no dispositivo: {remote}', file=sys.stderr)
    else:
        print('Dump XML omitido por privacidade. Use --include-xml para habilitar conscientemente.')
    print('Screenshots e XML podem conter dados sensíveis; mantenha-os fora do Git.')


def compute_visual_diff(before_path: Path, after_path: Path, output: Path,
                        tolerance: int = 16, ignore_regions: list[tuple[int,int,int,int]] | None = None,
                        overwrite: bool = False) -> dict:
    try:
        from PIL import Image, ImageChops, ImageStat, ImageDraw
    except ImportError as ex:
        raise RuntimeError('Pillow indisponível. Rode pip install -r requirements.txt') from ex

    if not 0 <= tolerance <= 255:
        raise ValueError('Tolerância precisa estar entre 0 e 255.')
    inputs = {before_path.resolve(), after_path.resolve()}
    outputs = [output / name for name in ('difference.png', 'highlighted.png', 'comparison.json')]
    if any(path.resolve() in inputs or (path.exists() and any(path.samefile(source) for source in inputs)) for path in outputs):
        raise ValueError('Destino do diff sobrescreveria uma imagem de entrada.')
    protect_outputs(outputs, overwrite)
    for region in ignore_regions or []:
        if len(region) != 4 or region[2] <= 0 or region[3] <= 0:
            raise ValueError('Regiões ignoradas precisam ter largura e altura positivas.')
    with Image.open(before_path) as a, Image.open(after_path) as b:
        before=a.convert('RGB'); after=b.convert('RGB')
    report={'before':str(before_path.resolve()), 'after':str(after_path.resolve()),
            'size_before':list(before.size), 'size_after':list(after.size),
            'tolerance_channel':tolerance, 'ignored_rectangles':ignore_regions or [],
            'collected_utc':utc_now()}
    if before.size!=after.size:
        if overwrite and any(path.exists() for path in outputs[:2]):
            raise RuntimeError('Dimensões diferentes; use um novo destino para não misturar resultados antigos.')
        report.update({'comparable':False,'reason':'Dimensões diferentes. Capture no mesmo viewport/escala.'})
        dump_json(output/'comparison.json',report)
        return report

    diff=ImageChops.difference(before,after)
    w,h=before.size
    ignored = Image.new('L', (w, h), 0)
    ignored_draw = ImageDraw.Draw(ignored)
    for x,y,ww,hh in (ignore_regions or []):
        l,t,r,bot=max(0,x),max(0,y),min(w,x+ww),min(h,y+hh)
        if r>l and bot>t:
            diff.paste((0,0,0),(l,t,r,bot))
            ignored_draw.rectangle((l,t,r-1,bot-1), fill=255)
    ignored_pixels = ignored.histogram()[255]
    compared_pixels = w * h - ignored_pixels
    report.update({'ignored_pixels': ignored_pixels, 'compared_pixels': compared_pixels})
    if not compared_pixels:
        raise ValueError('Todas as áreas foram ignoradas; não existe conteúdo para comparar.')
    r,g,b=diff.split()
    mask=ImageChops.lighter(ImageChops.lighter(r,g),b).point(lambda p: 255 if p>tolerance else 0)
    count=mask.histogram()[255]
    covered=mask.size[0]*mask.size[1]
    stat=ImageStat.Stat(diff)
    overlay=Image.blend(after, Image.new('RGB', after.size, (255,40,60)), 0.48)
    visual=after.copy(); visual.paste(overlay,(0,0),mask)
    output.mkdir(parents=True,exist_ok=True)
    diff.save(output/'difference.png')
    visual.save(output/'highlighted.png')
    report.update({'comparable':True, 'changed_pixels':count,
                   'changed_percent':round(count/covered*100,4),
                   'changed_percent_compared':round(count/compared_pixels*100,4),
                   'rms_per_channel': [round(v,4) for v in stat.rms],
                   'diff_png':str((output/'difference.png').resolve()),
                   'highlighted_png':str((output/'highlighted.png').resolve()),
                   'interpretation':'Métrica visual objetiva; não é nota estética/UX.'})
    dump_json(output/'comparison.json',report)
    return report


def parse_region(value: str) -> tuple[int,int,int,int]:
    parts=value.split(',')
    if len(parts)!=4:
        raise argparse.ArgumentTypeError('Use x,y,largura,altura')
    try: nums=tuple(int(x.strip()) for x in parts)
    except ValueError as ex:raise argparse.ArgumentTypeError('Quatro inteiros esperados') from ex
    if nums[2]<=0 or nums[3]<=0:
        raise argparse.ArgumentTypeError('Largura e altura devem ser positivas')
    return nums


def cmd_compare(args):
    if not (0<=args.tolerance<=255):raise ValueError('Tolerância precisa estar entre 0 e 255.')
    before=Path(args.before)
    after=Path(args.after)
    for path in [before,after]:
        if not path.is_file():raise RuntimeError(f'Arquivo não encontrado: {path}')
    output=Path(args.output)
    report=compute_visual_diff(before,after,output,args.tolerance,args.ignore_region,args.overwrite)
    print(json.dumps(report,indent=2,ensure_ascii=False))
    if not report['comparable']:
        return 2
    return 0


def cmd_test(args):
    flow=Path(args.flow).resolve()
    if not flow.is_file() or flow.suffix.lower() not in ('.yml','.yaml'):
        raise RuntimeError('Flow YAML local não encontrado.')
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+',args.app_id):
        raise ValueError('app-id deve ser um package ID válido (ex.: com.example.app).')
    if not shutil.which('maestro'):
        raise RuntimeError('Maestro CLI ausente. Veja docs/INSTALL-WINDOWS.md')
    argv=['maestro','test','-e',f'APP_ID={args.app_id}']
    if args.target_text:
        argv+=['-e',f'TARGET_TEXT={args.target_text}']
    argv.append(str(flow))
    print('Executando teste Maestro LOCAL, sem serviço Cloud...',flush=True)
    workdir = Path(args.workdir).resolve() if args.workdir else Path.cwd()
    if not workdir.is_dir():
        raise RuntimeError(f'Diretório de trabalho não encontrado: {workdir}')
    p=command(argv,timeout=args.timeout,cwd=workdir)
    if p.stdout: print(p.stdout)
    if p.stderr: print(p.stderr,file=sys.stderr)
    if p.returncode:
        raise RuntimeError(f'Fluxo Maestro falhou ({p.returncode})')
    print('Flow Maestro finalizado com sucesso (não equivale a aprovação estética).')


def cmd_preview(args):
    if not shutil.which('scrcpy'):
        raise RuntimeError('scrcpy não encontrado. Obtenha no GitHub oficial Genymobile/scrcpy.')
    argv=['scrcpy']+(['--serial',args.serial] if args.serial else [])
    print('Abrindo espelhamento Android LOCAL (scrcpy). Feche a janela para finalizar.',flush=True)
    try:
        return subprocess.call(argv)
    except FileNotFoundError as ex:
        raise RuntimeError('scrcpy não instalado ou fora do PATH') from ex


def cmd_doctor(args):
    statuses={
        'python':sys.version.split()[0],
        'pillow': bool(importlib.util.find_spec('PIL')),
        'adb':shutil.which('adb'),
        'maestro':shutil.which('maestro'),
        'scrcpy_live_preview':shutil.which('scrcpy'),
        'java':shutil.which('java'),
        'npx_for_official_impeccable':shutil.which('npx'),
    }
    print(json.dumps(statuses,indent=2,ensure_ascii=False))
    print('Aviso: detectar binário NÃO significa que app/emulador ou Impeccable estão funcionando.')


def positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as ex:
        raise argparse.ArgumentTypeError('Informe um inteiro positivo.') from ex
    if number <= 0:
        raise argparse.ArgumentTypeError('Informe um inteiro positivo.')
    return number


def parser():
    p=argparse.ArgumentParser(description='Impeccable Mobile Studio — ferramentas locais Android / Maestro')
    sub=p.add_subparsers(dest='action',required=True)
    q=sub.add_parser('doctor',help='Check local tooling');q.set_defaults(func=cmd_doctor)
    q=sub.add_parser('devices',help='List ADB devices');q.set_defaults(func=cmd_devices)
    q=sub.add_parser('capture',help='Capture PNG with adb')
    q.add_argument('--name',required=True);q.add_argument('--serial');q.add_argument('--output');q.add_argument('--overwrite',action='store_true');q.set_defaults(func=cmd_capture)
    q=sub.add_parser('inspect',help='Capture screen and optionally dump UI XML')
    q.add_argument('--name',required=True);q.add_argument('--serial');q.add_argument('--output-dir');q.add_argument('--include-xml',action='store_true');q.add_argument('--overwrite',action='store_true');q.set_defaults(func=cmd_inspect)
    q=sub.add_parser('compare',help='Compute offline pixel difference')
    q.add_argument('--before',required=True);q.add_argument('--after',required=True);q.add_argument('--output',required=True)
    q.add_argument('--tolerance',type=int,default=16);q.add_argument('--ignore-region',type=parse_region,action='append',default=[],help='x,y,width,height; repeatable')
    q.add_argument('--overwrite',action='store_true',help='Replace previous comparison outputs explicitly')
    q.set_defaults(func=cmd_compare)
    q=sub.add_parser('preview',help='Mirror Android screen live with optional scrcpy')
    q.add_argument('--serial');q.set_defaults(func=cmd_preview)
    q=sub.add_parser('test',help='Run Maestro flow LOCALLY')
    q.add_argument('--flow',required=True);q.add_argument('--app-id',required=True);q.add_argument('--target-text')
    q.add_argument('--timeout',type=positive_int,default=240)
    q.add_argument('--workdir',help='Working directory for Maestro (default: current directory)');q.set_defaults(func=cmd_test)
    return p


def main(argv=None):
    args=parser().parse_args(argv)
    try:
        return args.func(args) or 0
    except (RuntimeError,ValueError,PermissionError,OSError) as ex:
        print(f'ERRO: {ex}',file=sys.stderr)
        return 2

if __name__=='__main__':
    sys.exit(main())
