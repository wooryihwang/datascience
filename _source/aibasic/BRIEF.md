# 인공지능 기초 — 집필 공통 지침 (작성 에이전트용)

프로젝트: `C:\Users\user\Documents\datascience-site` (정적 학습 사이트). 고등학교 『인공지능 기초』(2022 개정) 교사용 교과서를 고등학생이 혼자 공부하는 계단식 학습 사이트로 재구성한다. 먼저 `CLAUDE.md`를 읽는다.

## 원자료 (저장소에 올리지 않는 파일, 읽기만)
- 교과서 텍스트: `_source/aibasic/textbook.txt` — `=== PDF p.N ===` 줄로 쪽이 나뉘고, **PDF 쪽 번호 = 교과서 쪽 번호**. 교사용이라 본문 사이에 지도 Tip·예시 답안·평가 자료가 섞여 있다(문제·해설 만들 때 참고). 쪽 찾기: `grep -n "=== PDF p.59 ===" _source/aibasic/textbook.txt` 후 그 줄부터 Read(offset/limit).
- 부록 활동지: `_source/aibasic/worksheets.txt` (활동 1~7, 오렌지 활용 활동지). 코딩 실습 설계에 쓴다.
- 대단원 평가 문제: 교과서 p.240~ (textbook.txt 끝부분) — 문제 은행에 참고.
- 각 대단원 앞 '짧은 이야기로 만나는 인공지능', 중단원 정리, 단원 정리, 협력적 창의·융합 활동도 참고.

## 형식 (반드시 지킬 것)
- 레슨 데이터: `_source/SCHEMA.md` (코딩 실습 `lab` 포함). 문제 은행: `_source/BANK_SCHEMA.md`.
- 문체·분량 본보기: `public/datascience/data/unit1.js`의 첫 레슨 하나, `public/datascience/data/bank1.js`의 앞부분을 읽고 같은 수준·분량으로 쓴다 (레슨 하나에 대략 15~25KB).
- `pages`는 "p.17–19" 형식 (교과서 쪽).
- 이야기 등장인물(모든 단원 공통): 한빛고등학교 2학년 AI 동아리 '딥러너스' — 서준, 지아, 민호, 하린, 그리고 지도 교사 강 선생님. 화자는 동아리원 중 한 명(1인칭, 레슨마다 바꿔도 됨). 이야기는 궁금증만 만들고 답은 주지 않는다.
- 교과서 문장을 길게 그대로 베끼지 말고 쉬운 해요체로 다시 쓴다. 교과서 예시·사례·코드는 핵심을 살려 활용한다. 교과서에 없는 사실을 지어내지 않는다.

## 코딩 실습 (lab)
- 교과서에 파이썬/코랩 코드가 나오는 레슨, 부록 활동지와 연결되는 레슨에는 `lab`을 넣는다. 개념 위주 레슨에도 간단한 파이썬으로 체험할 수 있으면 넣어도 좋다(예: 탐색 알고리즘, 규칙 기반 추론).
- `run: true` 코드는 브라우저(Pyodide)에서 돌아가야 한다: 표준 라이브러리, numpy, pandas, scikit-learn, matplotlib만. 파일·인터넷 금지, `fetch_*` 금지, input() 금지, 그래프 글자는 영어. 캐글 CSV처럼 구할 수 없는 데이터는 ① 코드 안에서 작은 연습용 데이터를 만들거나(numpy 난수 + 규칙, `np.random.seed` 고정) ② scikit-learn 내장 데이터로 대신하고, 그 사실을 body에 밝힌다 ("연습용으로 만든 데이터예요" 등). 원래 활동지 코드(캐글 파일, 텐서플로, folium 등)는 `run` 없이 별도 칸으로 넣어 코랩에서 해 보게 한다.
- `run: true` 코드는 **직접 실행해 검증**한다: 파이썬과 numpy/pandas/scikit-learn/matplotlib이 이 PC에 있으면(`python -c "import sklearn, pandas, matplotlib"`) 태스크 코드들을 순서대로 이어 붙인 파일을 스크래치 폴더에 만들어 `MPLBACKEND=Agg python 파일` 로 오류 없이 도는지 확인한다(없으면 `pip install -q scikit-learn pandas matplotlib`). 실행 시간은 칸마다 몇 초 이내로.
- 실습 칸은 3~6개, 노트북 셀처럼 위에서부터 이어진다. 설명(body)은 코드가 무엇을 하는지 학생 눈높이로. `ask`로 결과를 해석하는 질문을 던진다.

## 검사 (끝내기 전에 꼭)
1. `node --check` 로 각 파일 문법 검사
2. `node _source/validate.js public/aibasic` — 내가 맡은 레슨에 오류(✗)가 없어야 한다. 다른 에이전트 파일이 아직 없거나 미완성이어서 생기는 오류는 무시.
3. 정답 위치 분산(각 레슨 test·은행에서 0~3이 고르게), 해설의 정확성 직접 검산.

## 하지 말 것
- 내가 맡지 않은 파일 수정 금지 (`public/aibasic/index.html`, `config.js`, `common/*`, 다른 단원 파일). git 명령 금지.
