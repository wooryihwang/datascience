# 고등학교 데이터 과학 학습사이트

고등학교 『데이터 과학』 교과서 내용을 고등학생이 혼자서도 공부할 수 있도록 쉬운 말로 다시 쓴 계단식 학습 사이트입니다.

## 구성
- Ⅰ. 데이터 과학의 이해
- Ⅱ. 데이터 준비와 분석
- Ⅲ. 데이터 모델링과 평가
- Ⅳ. 데이터 과학 프로젝트

레슨마다 다음 순서로 학습합니다: 이야기 → 계단(확인문제를 맞히면 다음 계단이 열림) → 한 줄 정리 → 용어 카드 맞추기 → 10문제 시험(80점 이상 통과). 학습 기록(XP, 레벨, 배지)은 브라우저에만 저장됩니다.

## 구조
- `public/index.html`, `public/app.js`, `public/style.css`: 사이트 본체 (빌드 과정 없는 정적 사이트)
- `public/data/unit1.js` ~ `unit4.js`: 대단원별 레슨 데이터 (형식은 `_source/SCHEMA.md` 참고)

## 로컬 실행
```bash
python -m http.server 5173 --directory public
```

## 배포
```bash
firebase deploy --only hosting
```
