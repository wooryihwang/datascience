# 데이터 과학 학습사이트 — 작업 안내

고등학교 『데이터 과학』 교사용 교과서(2026용 1쇄)를 고등학생용 계단식 학습 사이트로 재구성한 프로젝트. 참고 모델: https://penedu.web.app/aibasic/

- 배포 주소: https://ai-data-edu.web.app (Firebase 프로젝트 `pen-datascience`, 호스팅 타깃 `main` → 사이트 `ai-data-edu`)
- 저장소: https://github.com/wooryihwang/datascience (공개)
- 빌드 과정 없는 정적 사이트. `public/` 폴더가 그대로 배포된다.

## 구조
- `public/app.js`: 해시 라우터(#/, #/unit/N, #/lesson/ID, #/glossary, #/changelog), localStorage 진도(XP·레벨·배지), 계단 해제, 용어 카드 게임, 시험
- `public/data/unit1~4.js`: 대단원별 레슨 데이터 (형식: `_source/SCHEMA.md`). 4개 대단원 × 8레슨 = 32레슨
- `public/data/bank1~4.js`: 레슨별 추가 문제 은행 (형식: `_source/BANK_SCHEMA.md`). 레슨당 약 40문제(계단 확인문제 + 기존 시험 10 + 은행 25)
- `public/sw.js`, `manifest.webmanifest`: PWA(폰 홈 화면 설치, 네트워크 우선 캐시)

## 학습 규칙 (사용자 요구사항)
- 계단 확인문제: 해당 계단(step) 문제 묶음에서 무작위 출제. 틀리면 해설 후 다른 문제로 재도전
- 마무리 시험: 레슨 문제 은행 전체에서 무작위 10문제, 80점 이상 통과
- 80점 미만이면 그 레슨 계단 진도를 0으로 초기화 → 1계단부터 다시

## 작업 이력
- v1.0 1차: 전체 단원 32레슨 작성 / v1.1 2차: 교과서 대조 내용 검수 + PWA / v1.2 3차: 문제 은행(1,283문제) 무작위 출제와 재시작 규칙
- 버전을 올리면 `app.js`의 `VERSION`과 `CHANGELOG`(사이트의 업데이트 기록 페이지)를 함께 고친다.

## 작업 방법
- 로컬 미리보기: `python -m http.server 5173 --directory public`
- 배포: `firebase deploy --only hosting:main`
- 데이터 파일 검사: `node --check public/data/unitN.js`
- Claude Code 안에서 Firebase 로그인하면 AI 에이전트로 감지되어 원격 로그인 방식으로 바뀐다. 사용자가 직접 터미널에서 `firebase login --interactive`로 로그인하게 안내할 것.
- 교과서 원문 텍스트(`_source/textbook.txt`)는 저작권 때문에 저장소에 올리지 않는다(.gitignore). 필요하면 교과서 PDF에서 PyMuPDF로 다시 추출한다.
