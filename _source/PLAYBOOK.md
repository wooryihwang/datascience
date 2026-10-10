# 교과서 → 계단식 학습 사이트 만들기 플레이북

교과서(PDF) 한 권을 이 사이트(https://ai-data-edu.web.app)의 새 과목으로 만드는 전체 과정. 『데이터 과학』(32레슨)과 『인공지능 기초』(39레슨, 코딩 실습·삽화 포함)를 만들며 정리했다. 새 과목도 이 순서대로 하면 된다.

> 형식 문서: [SCHEMA.md](SCHEMA.md)(레슨·실습) · [BANK_SCHEMA.md](BANK_SCHEMA.md)(문제 은행) · [CONDENSE_BRIEF.md](CONDENSE_BRIEF.md)(PPT식 짧은 글) · [aibasic/BRIEF.md](aibasic/BRIEF.md)(집필 지침 본보기)
> 도구: [validate.js](validate.js) · [condense.js](condense.js) · [gen_story_images.py](gen_story_images.py)

---

## 0. 준비물
- 교사용 교과서 PDF (지도 Tip·예시 답안·평가 문제가 있어 문제 만들기에 좋다)
- 부록 활동지 PDF (있으면 → 코딩 실습)
- 과목 id(영문 소문자, 예: `info`), 과목 이름, 아이콘

## 1. 원자료 뽑기 (저작권 — 저장소에 올리지 않음)
```bash
pip install -q pymupdf
```
```python
import pymupdf
d = pymupdf.open(r"교과서.pdf")
with open("_source/<id>/textbook.txt", "w", encoding="utf-8") as f:
    for i, p in enumerate(d):
        f.write(f"\n\n=== PDF p.{i+1} ===\n" + p.get_text())
```
- 활동지도 같은 방식으로 `_source/<id>/worksheets.txt`
- `.gitignore`에 `_source/<id>/*.txt` 추가
- **PDF 쪽 = 교과서 쪽인지 확인**: 몇 쪽을 열어 아래 쪽번호와 비교 (`grep -n "=== PDF p.59 ===" ...`)
- "차례"를 grep해서 대단원·중단원·소단원과 시작 쪽을 표로 정리

## 2. 과목 자리 만들기
1. `public/aibasic/`을 복사해 `public/<id>/` → `config.js`의 `id`, `name`, `storageKey`(과목마다 다르게!), 문구, `levels`, `version`, `changelog` / `index.html`의 제목·아이콘·로고
2. `index.html`에 `data/unitN.js`, `data/bankN.js` script를 **unit 먼저, bank 나중**, `config.js`와 `../common/app.js` 사이에
3. `public/subjects.js`에 카드 추가(만드는 동안 `building`)

## 3. 레슨 설계
- 대단원 = `unitN.js` 하나, 소단원 하나를 내용량에 따라 1~3레슨. 대단원당 7~9레슨이 적당
- 레슨 id `대단원-중단원-순번` (예 `2-1-3`), 중단원 id `대단원-중단원`
- 대단원이 크면(레슨 12개 이상) 두 파일로 나눔: `unit2.js`(단원+첫 중단원) → `unit2b.js`(다음 중단원을 기존 단원에 push). 은행도 `bank2.js`/`bank2b.js`. 래퍼는 aibasic의 `unit2b.js` 참고
- 레슨 흐름: 이야기(2~3문단 250~350자) → 계단 4~5개(PPT식: 한 문장 + 글머리 3~6개) → 정리 → 용어 카드 6~8개 → 시험 10문제, 계단마다 확인문제
- 이야기 등장인물은 과목 공통으로 고정(예: 딥러너스 동아리 서준·지아·민호·하린·강 선생님) — 삽화 인물 일관성에도 필요

## 4. 집필 (병렬 에이전트)
1. `_source/<id>/BRIEF.md` 작성 — aibasic/BRIEF.md를 복사해 과목에 맞게. **처음부터 PPT식 짧은 글**(CONDENSE_BRIEF 기준)로 쓰게 하면 나중에 줄이는 작업이 필요 없다
2. 대단원(또는 큰 중단원)마다 에이전트 1개를 백그라운드로 동시에 실행. 프롬프트에 넣을 것: 맡은 단원·쪽 범위·레슨 id 규칙·쓸 파일 이름·활동지 연결·실습 지침·검사 명령·"다른 파일 건드리지 말 것, git 금지"
3. **스크래치 파일 충돌 주의**: 에이전트마다 자기 하위 폴더와 고유 파일 이름(`<과목>_<unit>_p1.json`)을 쓰게 지시. 과목끼리 레슨 id가 겹치므로(2-1-1 등) 내용으로 확인
4. 문제 은행: 레슨당 새 문제 25개, 계단마다 4개 이상, 정답 위치 고르게, 계단 설명만 읽고 풀 수 있어야 함

## 5. 코딩 실습 (lab)
- 교과서 코드·활동지가 있는 레슨에 `lab`. `run: true`는 브라우저(Pyodide 0.26.4)에서 실행: numpy·pandas·scikit-learn·matplotlib만, 파일·인터넷·input() 금지, 그래프 글자는 영어
- 캐글 CSV 등은 코드 안에서 만든 **연습용 데이터**(seed 고정, 원래 열 이름) + 원본 코드는 `run` 없이 코랩용 칸으로
- **반드시 Pyodide에서 직접 실행 검증** — 데스크톱 파이썬과 버전이 달라 결과·오류가 다를 수 있다. 사이트를 로컬 서버로 띄우고 브라우저 콘솔에서 모든 run 칸을 순서대로 실행하는 검사(아래 9번)
- 한 칸이 5~6초를 넘으면 화면이 멈춘다 → 반복 횟수·층 크기 줄이고 "코랩에서는 원래대로" 안내

## 6. 검사
```bash
node _source/validate.js public/<id>     # 오류 0이어야 함
for f in public/<id>/data/*.js; do node --check $f; done
```
- 글을 고친 뒤(줄이기 등)에는 git HEAD와 비교해 주제가 바뀐 계단이 없는지 확인(글자 2-gram 겹침 비교)

## 7. 이야기 삽화
1. 에이전트로 `_source/story_scenes.json` 작성: `"<과목>/<레슨id>": "영어 장면 설명(40~80단어)"`, 고정 인물은 이름으로, 글자·브랜드·실존 인물 금지. 고정 인물이 있으면 `_cast_<과목>` 키에 외모 설명
2. **캔바 MCP**(연결되어 있으면):
   - `generate-image`로 등장인물 기준 그림(16:9) 먼저 → 그 media id를 이후 그림의 `imageReferences`로
   - 장면마다 `generate-image`(LANDSCAPE_4_3, 공통 화풍 문장 + 인물 설명 + 장면 + "no text"). 여러 개 동시에 요청 → `get-generate-image-job`으로 media id 수집, `_source/img_raw/canva_media.json`에 바로 기록
   - 큰 파일 받기: `create-design`(Presentation 4:3 빈 페이지) → `read-design open_transaction` → `edit-design`에서 `add_page`(1024×768, title=키)를 한 번에 → 페이지 id 읽기 → `update_fill`(페이지 locator, media id)을 **한 번의 호출로 여러 페이지** → `commit`(사용자 승인 후) → `export-design` jpg 800×600 → 페이지 순서대로 내려받아 WebP(q78) `public/<id>/img/story-<레슨id>.webp`
   - 캔바 AI 사용량을 장수만큼 쓴다(먼저 샘플 1~2장으로 화풍 승인받기)
3. 대안: 나노 바나나 API — `GEMINI_API_KEY` 환경 변수(사용자가 직접 `setx`) 후 `python _source/gen_story_images.py --cast` → `--only <키>`로 샘플 → 전체
4. 엔진은 그림 파일이 있으면 이야기 오른쪽(폰은 위)에 자동으로 보여 줌

## 8. 공개
1. `subjects.js` 상태 `open`, `lessons` 수 / `config.js` `version`·`changelog` / `CLAUDE.md` 작업 이력
2. 로컬 확인: `python -m http.server 5173 --directory public`
3. 커밋(이 PC는 git 사용자 설정이 없으므로 `git -c user.name=wooryihwang -c user.email=wooryihwang@gmail.com commit ...`)
4. `firebase deploy --only hosting:main` → `git push origin main`
5. 실제 사이트에서 레슨·실습 실행·삽화 확인

## 9. Pyodide 실습 일괄 검사 (브라우저 콘솔)
로컬 서버에서 `http://localhost:5173/<id>/`를 열고 실행:
```js
const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }); // 없으면 script 태그로 pyodide.js 먼저
await py.loadPackage(['numpy','pandas','scikit-learn','matplotlib']);
py.runPython("import warnings\nwarnings.filterwarnings('ignore')\nimport matplotlib\nmatplotlib.use('AGG')");
const res = [];
for (const u of DS_DATA.units) for (const c of u.chapters) for (const l of c.lessons) {
  const g = py.toPy({});
  for (const t of (l.lab ? l.lab.tasks : [])) if (t.code && t.code.run) {
    const t0 = performance.now();
    try { await py.loadPackagesFromImports(t.code.src); await py.runPythonAsync(t.code.src, { globals: g }); res.push(l.id + ' ok ' + Math.round(performance.now() - t0) + 'ms'); }
    catch (e) { res.push('FAIL ' + l.id + ': ' + String(e.message).split('\n').slice(-2).join(' ')); }
  }
}
res.filter(x => x.startsWith('FAIL') || +(x.match(/(\d+)ms/)||[0,0])[1] > 5000)
```

## 배운 점 (함정)
- Windows Git Bash에서 `python - <<'EOF'` 안의 `"\\n"`은 실제 줄바꿈이 되어 패턴이 안 맞는다 → 복잡한 수정은 Edit 도구나 스크립트 파일로
- 병렬 에이전트가 스크래치 폴더의 같은 파일 이름을 쓰면 서로 덮어쓴다 → 고유 이름 필수
- 글을 줄일 때 확인문제·은행 문제의 근거(이름·연도·숫자·공식)가 사라지지 않게 문제 목록과 함께 보며 줄인다(`condense.js dump`)
- 기존 과목의 `storageKey`는 바꾸지 않는다(학생 기록이 사라짐)
