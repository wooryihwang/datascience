# AI·데이터 교육 학습사이트 — 작업 안내

고등학교 교과서(데이터 과학, 인공지능 기초, 정보 …)를 고등학생용 계단식 학습 사이트로 재구성한 프로젝트. 첫 화면에서 과목을 고르고, 과목마다 하위 폴더에 들어 있다. 참고 모델: https://penedu.web.app/ (과목 모음 첫 화면) · https://penedu.web.app/aimath/ (과목 페이지)

- 배포 주소: https://ai-data-edu.web.app (Firebase 프로젝트 `pen-datascience`, 호스팅 타깃 `main` → 사이트 `ai-data-edu`)
- 저장소: https://github.com/wooryihwang/datascience (공개)
- 빌드 과정 없는 정적 사이트. `public/` 폴더가 그대로 배포된다. `firebase.json`의 `trailingSlash: true`로 `/datascience` → `/datascience/`.

## 구조
- `public/index.html` + `public/subjects.js`: 첫 화면(과목 카드). 과목 상태 `open`/`building`/`soon`. 예전 주소(`/#/lesson/…`)는 `/datascience/#/…`로 넘긴다.
- `public/common/app.js`: 과목 공통 엔진. 해시 라우터(#/, #/unit/N, #/lesson/ID, #/glossary, #/changelog), localStorage 진도(XP·레벨·배지), 계단 해제, 용어 카드 게임, 시험. 과목 이름·레벨 이름·버전·업데이트 기록은 `window.SUBJECT`(과목의 `config.js`)에서 읽는다.
- `public/common/style.css`: 공통 스타일
- `public/<과목>/index.html`, `config.js`, `data/unitN.js`, `data/bankN.js`: 과목별 페이지·설정·데이터
  - `datascience/`: 데이터 과학 — 4개 대단원 × 8레슨 = 32레슨, 문제 은행 레슨당 약 40문제. `storageKey: 'ds-progress-v1'`은 기존 학생 기록 때문에 바꾸지 않는다.
  - `aibasic/`: 인공지능 기초 — 4개 대단원 39레슨, 문제 은행 978문제(레슨당 25 + test 10 + 계단 확인문제). 대단원 Ⅱ는 두 파일: `unit2.js`(단원 + 중단원 2-1 기계학습) → `unit2b.js`(중단원 2-2 딥러닝을 이어 붙임), 은행도 `bank2.js`·`bank2b.js`. `index.html`의 script 순서를 지킬 것.
  - 정보(`info/`): 아직 폴더 없음, `subjects.js`에 `soon`으로만 있음
- 데이터 형식: `_source/SCHEMA.md`(레슨), `_source/BANK_SCHEMA.md`(문제 은행). 모든 과목이 같은 형식(`window.DS_DATA`, `window.DS_BANK`)을 쓴다.
- 코딩 실습: 레슨의 `lab`(SCHEMA.md 끝 참고)과 `code.run: true` 코드는 브라우저에서 Pyodide(v0.26.4, cdn.jsdelivr)로 실행된다. 버튼을 처음 누를 때만 내려받는다. numpy·pandas·scikit-learn·matplotlib만 가능, 브라우저 메인 스레드에서 돌아가므로 한 칸이 몇 초 안에 끝나야 한다. 실습 칸 첫 실행 성공 +5 XP, 실습 5칸이면 '코딩 실습가' 배지(실습이 있는 과목에만 보임).
- `public/sw.js`, `public/manifest.webmanifest`: 사이트 전체 PWA(폰 홈 화면 설치, 네트워크 우선 캐시)

## 새 과목 추가하기
전체 과정(원자료 추출 → 집필 에이전트 → 코딩 실습 검증 → 삽화 → 배포)은 `_source/PLAYBOOK.md`. 개인 스킬 `textbook-study-site`도 같은 과정을 따른다.
1. `public/aibasic/`을 복사해 `public/<과목id>/` 만들기 → `config.js`의 `id`, `name`, `storageKey`(과목마다 다르게), 문구, `levels` 고치기, `index.html`의 제목·아이콘·로고 고치기
2. `data/unitN.js`, `data/bankN.js` 작성 후 `index.html`의 `config.js`와 `../common/app.js` 사이에 `<script>`로 추가
3. `public/subjects.js`에 카드 추가(또는 상태를 `building` → `open`으로), `storageKey`는 config와 같게, 레슨 수는 `lessons`
4. 교과서 원문 등 원자료는 `_source/<과목id>/`에 두고 저작권 있는 원문은 .gitignore에 추가

## 학습 규칙 (사용자 요구사항, 모든 과목 공통)
- 계단 확인문제: 해당 계단(step) 문제 묶음에서 무작위 출제. 틀리면 해설 후 다른 문제로 재도전
- 마무리 시험: 레슨 문제 은행 전체에서 무작위 10문제, 80점 이상 통과
- 80점 미만이면 그 레슨 계단 진도를 0으로 초기화 → 1계단부터 다시

## 작업 이력
- 데이터 과학 v1.0 1차: 전체 단원 32레슨 작성 / v1.1 2차: 교과서 대조 내용 검수 + PWA / v1.2 3차: 문제 은행(1,283문제) 무작위 출제와 재시작 규칙 / v1.3: 여러 과목 사이트로 개편
- 두 과목 글 줄이기(데이터 과학 v1.4, 인공지능 기초 v1.1): 계단 설명은 PPT식 글머리, 이야기는 2~3문단. 도구 `_source/condense.js`, 지침 `_source/CONDENSE_BRIEF.md`
- 이야기 삽화(데이터 과학 v1.5, 인공지능 기초 v1.2): `public/<과목>/img/story-<레슨id>.webp`(800×600). 엔진이 있으면 이야기 오른쪽에 보여 주고 없으면 글만. 캔바 AI(generate-image)로 생성 — 장면 설명 `_source/story_scenes.json`, 인공지능 기초는 등장인물 기준 그림(캔바 미디어 `MAHXmGwf1_U`)을 참조 이미지로 넣어 인물 일관성 유지. 캔바 디자인 '학습사이트 이야기 삽화'(DAHXmFJzy1M)에 페이지별로 모아 JPG 내보내기 → WebP 변환. 나노 바나나 API 대안 스크립트 `_source/gen_story_images.py`(GEMINI_API_KEY 필요)
- 인공지능 기초 v1.0: 전체 39레슨 + 문제 은행 + 브라우저 파이썬 실습(부록 활동지 1~7 연결)
- 버전을 올리면 그 과목 `config.js`의 `version`과 `changelog`(사이트의 업데이트 기록 페이지)를 함께 고친다.
- 엔진(`common/app.js`)이나 `sw.js`를 고치면 모든 과목에 영향이 간다. 캐시 구조를 바꾸면 `sw.js`의 `CACHE` 이름을 올린다.

## 작업 방법
- 로컬 미리보기: `python -m http.server 5173 --directory public` → http://localhost:5173/
- 배포: `firebase deploy --only hosting:main`
- 데이터 파일 검사: `node _source/validate.js public/<과목>` (구조·문제 수·정답 범위·은행 계단 배정·실행 불가 코드 검사). 문법만 볼 때는 `node --check`
- 실습 코드는 데스크톱 파이썬과 Pyodide 버전(pandas·sklearn이 더 오래됨)이 달라서, 바꾸면 브라우저에서 직접 실행해 확인한다.
- Claude Code 안에서 Firebase 로그인하면 AI 에이전트로 감지되어 원격 로그인 방식으로 바뀐다. 사용자가 직접 터미널에서 `firebase login --interactive`로 로그인하게 안내할 것.
- 인공지능 기초 원자료: `_source/aibasic/textbook.txt`(교사용 교과서, PDF 쪽 = 교과서 쪽), `worksheets.txt`(부록 활동지) — 저작권 때문에 .gitignore. 집필 지침은 `_source/aibasic/BRIEF.md`.
- 교과서 원문 텍스트(`_source/textbook.txt`)는 저작권 때문에 저장소에 올리지 않는다(.gitignore). 필요하면 교과서 PDF에서 PyMuPDF로 다시 추출한다.
