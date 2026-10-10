# 레슨 데이터 스키마 (public/<과목>/data/unitN.js)

각 대단원은 파일 하나: `public/<과목>/data/unit1.js` ~ `unit4.js`.
파일 형식(그대로 지킬 것, 순수 JS, import/export 없음):

```js
window.DS_DATA = window.DS_DATA || { units: [] };
window.DS_DATA.units.push({
  id: "1",                      // 대단원 번호 문자열 "1"~"4"
  roman: "Ⅰ",
  title: "데이터 과학의 이해",
  icon: "🧭",                    // 이모지 1개
  desc: "한두 문장 학생용 소개 (쉬운 말)",
  question: "대단원 핵심 질문 (교과서 도입 질문)",
  chapters: [                   // 중단원
    {
      id: "1-1",                // 대단원-중단원
      title: "데이터 과학과 데이터",
      lessons: [                // 레슨 (소단원 하나를 내용량에 따라 1~3개 레슨으로 나눔)
        {
          id: "1-1-1",          // 대단원-중단원-레슨순번 (전역 유일)
          title: "데이터 과학이란 무엇일까?",   // 질문형 제목
          storyTitle: "마시멜로 실험의 함정",   // 부제(이야기 제목)
          pages: "p.14–17",     // 교과서 쪽수
          goals: ["...할 수 있다.", "..."],    // 2~3개
          story: {
            title: "📖 이야기 제목",
            paragraphs: ["문단1", "문단2", "..."],   // 2~3문단, 합계 250~350자. 고등학생 주인공 1인칭 짧은 이야기. 핵심 궁금증 하나만 만들고 답은 주지 않음.
            question: "🤔 이야기 끝 질문"
          },
          steps: [              // 정확히 4~5개 (계단)
            {
              title: "계단 제목",
              body: ["<p>HTML 문단</p>", "<p>...</p>"],  // PPT처럼: 첫 줄 <p> 한 문장 + <ul><li><b>핵심어</b> — 짧은 설명</li> 3~6개 (긴 문단 금지, _source/CONDENSE_BRIEF.md 참고). 허용 태그: p, b, strong, em, ul, ol, li, br, code, span, sub, sup
              table: { head: ["열1","열2"], rows: [["a","b"]] },   // 선택
              code: { lang: "python", src: "print(1)" },          // 선택 (교과서에 코드가 있을 때)
              tip: "💡 알아두기 내용 (선택)",
              remember: ["꼭 기억할 문장", "..."],  // 2~3개
              check: { q: "확인문제", options: ["①","②","③","④"], answer: 0, explain: "해설" } // answer는 0부터 시작하는 정답 인덱스
            }
          ],
          summary: ["한 줄 정리1", "...", "..."],   // 4~6개
          terms: [ { term: "데이터 과학", def: "짧은 정의(40자 이내)" } ],   // 6~8개 (용어 카드 게임)
          test: [ { q: "문제", options: ["","","",""], answer: 2, explain: "해설" } ]  // 정확히 10문제, 4지선다, 정답 위치를 고르게 분산
        }
      ]
    }
  ]
});
```

## 작성 원칙
- 교과서 내용에 충실하되 고등학생이 혼자 읽어도 이해되는 쉬운 말(해요체)로 다시 쓴다. 교과서 문장을 길게 그대로 베끼지 않는다.
- 교과서의 예시·사례·데이터·코드(파이썬 pandas 등)는 핵심을 살려 활용한다.
- 교사용 교과서의 '지도 Tip', '교수·학습 자료', 답안 예시, 선택지 문항은 문제 출제와 해설에 참고한다.
- 문자열 안의 큰따옴표는 이스케이프하거나 작은따옴표/「」를 사용. 유효한 JS여야 한다 (`node -e "require('./unit1.js')"` 대신 `node --check` 로 문법 검사).
- 정답 index는 0~3으로 고르게 분산.

## 코딩 실습 `lab` (선택, 레슨에 하나)
레슨 객체에 `lab`을 넣으면 계단 아래에 "🧪 실습" 칸이 생긴다(잠금 없음, 선택 활동). 실습 칸마다 첫 실행 성공 시 +5 XP.

```js
lab: {
  title: "붓꽃을 분류하는 모델 만들기",
  worksheet: "부록 활동지 2 · 교과서 74쪽",   // 선택: 연결된 활동지
  intro: ["<p>무엇을 할지 1~2문단</p>"],
  tasks: [                                   // 3~6개, 노트북 셀처럼 위에서부터 차례로 실행
    {
      title: "데이터 불러오기",
      body: ["<p>이 칸에서 할 일 설명</p>"],
      code: { lang: "python", src: "...", run: true },   // run:true → 브라우저에서 바로 실행(Pyodide)
      ask: "생각해 볼 질문 (선택)"
    }
  ]
}
```
- `run: true` 코드 조건: 파이썬 표준 라이브러리, numpy, pandas, scikit-learn, matplotlib만. 파일 읽기·인터넷 내려받기·input() 금지. 데이터는 코드 안에 직접 만들거나(`pd.DataFrame`, `io.StringIO`) scikit-learn 내장 데이터(`load_iris`, `load_digits`, `load_breast_cancer`, `load_wine`, `load_diabetes`)를 쓴다. `fetch_*` 금지. 그래프 글자는 영어(한글 글꼴 없음). 마지막 줄이 식이면 그 값이 출력된다(주피터처럼). 앞 칸의 변수는 뒤 칸에서 그대로 쓸 수 있다.
- 텐서플로·케라스·folium·코랩 파일 업로드처럼 브라우저에서 안 되는 코드는 `run` 없이 넣는다 → 복사 버튼 + "코랩에 붙여 넣어 실행" 안내가 나온다.
- 계단 `steps[].code`에도 `run: true`를 쓸 수 있다.
