"""'먼저 읽어 봐요' 이야기 삽화 만들기 (Google Gemini 이미지 모델 '나노 바나나')

준비: 환경 변수 GEMINI_API_KEY 에 API 키 (결제가 연결된 키, 무료 등급 없음)
장면 설명: _source/story_scenes.json  ("aibasic/1-1-1": "영어 장면 설명", "_cast_aibasic": "등장인물 설명")
결과: public/<과목>/img/story-<레슨id>.webp  (원본 PNG는 _source/img_raw/ — 저장소에 올리지 않음)

사용 예:
  python _source/gen_story_images.py --cast                      # 인공지능 기초 등장인물 기준 그림 먼저 만들기
  python _source/gen_story_images.py --only aibasic/1-1-1        # 한 장만 시험
  python _source/gen_story_images.py                             # 없는 그림 모두 (이미 있는 것은 건너뜀)
  python _source/gen_story_images.py --only aibasic/1-1-1 --force   # 다시 그리기
  python _source/gen_story_images.py --dry-run                   # 프롬프트만 보기
"""
import argparse
import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SCENES = ROOT / '_source' / 'story_scenes.json'
RAW = ROOT / '_source' / 'img_raw'
CAST_REF = RAW / 'cast_aibasic.png'
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'

STYLE = ('Soft, warm anime-style illustration with a hand-drawn picture-book feel: clean line art, gentle cel shading, '
         'pastel watercolor textures, expressive friendly characters, cozy natural lighting, suitable for a high school '
         'textbook. Landscape 4:3 composition showing one clear scene. Absolutely no text, letters, numbers, captions, '
         'speech bubbles, logos or watermarks anywhere in the image.')


def call(model, parts, key, tries=3):
    body = json.dumps({
        'contents': [{'parts': parts}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '4:3', 'imageSize': '1K'}},
    }).encode()
    for t in range(tries):
        req = urllib.request.Request(API.format(model=model), data=body, method='POST',
                                     headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                res = json.load(r)
            for c in res.get('candidates', []):
                for p in c.get('content', {}).get('parts', []):
                    d = p.get('inlineData') or p.get('inline_data')
                    if d and d.get('data'):
                        return base64.b64decode(d['data'])
            raise RuntimeError('그림이 오지 않았어요: ' + json.dumps(res, ensure_ascii=False)[:300])
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:300]
            if e.code in (429, 500, 503) and t < tries - 1:
                time.sleep(15 * (t + 1)); continue
            raise RuntimeError(f'HTTP {e.code}: {msg}')
        except (urllib.error.URLError, TimeoutError) as e:
            if t < tries - 1:
                time.sleep(10); continue
            raise RuntimeError(str(e))


def save(png, subject, lid):
    raw = RAW / subject / f'{lid}.png'
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_bytes(png)
    out = ROOT / 'public' / subject / 'img' / f'story-{lid}.webp'
    out.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if im.width > 800:
        im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=80, method=6)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='gemini-nano-banana-2.1')
    ap.add_argument('--only', nargs='*', help='예: aibasic/1-1-1 datascience/2-1-1')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--cast', action='store_true', help='인공지능 기초 등장인물 기준 그림 만들기')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--workers', type=int, default=3)
    a = ap.parse_args()

    scenes = json.loads(SCENES.read_text(encoding='utf-8'))
    cast = scenes.get('_cast_aibasic', '')
    key = os.environ.get('GEMINI_API_KEY', '')
    if not key and not a.dry_run:
        sys.exit('GEMINI_API_KEY 환경 변수가 없어요.')

    if a.cast:
        prompt = (STYLE + ' Character reference sheet: the five members of a Korean high school AI club standing side by side, '
                  'full body, front view, plain light background. ' + cast)
        if a.dry_run:
            print(prompt); return
        png = call(a.model, [{'text': prompt}], key)
        CAST_REF.parent.mkdir(parents=True, exist_ok=True)
        CAST_REF.write_bytes(png)
        print('등장인물 기준 그림:', CAST_REF)
        return

    jobs = [k for k in scenes if not k.startswith('_')]
    if a.only:
        jobs = [k for k in jobs if k in a.only]
    if not a.force:
        jobs = [k for k in jobs if not (ROOT / 'public' / k.split('/')[0] / 'img' / f'story-{k.split("/")[1]}.webp').exists()]
    print(f'{len(jobs)}장 만들 차례')

    ref = None
    if CAST_REF.exists():
        ref = {'inlineData': {'mimeType': 'image/png', 'data': base64.b64encode(CAST_REF.read_bytes()).decode()}}

    def one(k):
        subject, lid = k.split('/')
        prompt = STYLE + ' Scene: ' + scenes[k]
        parts = [{'text': prompt}]
        if subject == 'aibasic':
            prompt += (' The recurring characters must look exactly like this character sheet'
                       + (' (attached reference image)' if ref else '') + ': ' + cast)
            parts = [{'text': prompt}] + ([ref] if ref else [])
        if a.dry_run:
            return f'--- {k}\n{prompt}'
        try:
            out = save(call(a.model, parts, key), subject, lid)
            return f'✓ {k} → {out.relative_to(ROOT)} ({out.stat().st_size // 1024}KB)'
        except Exception as e:
            return f'✗ {k}: {e}'

    with ThreadPoolExecutor(max_workers=1 if a.dry_run else a.workers) as ex:
        for line in ex.map(one, jobs):
            print(line, flush=True)


if __name__ == '__main__':
    main()
