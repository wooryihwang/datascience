/* 첫 화면(과목 고르기)에 보이는 과목 목록
   status: 'open'(공개) | 'building'(만드는 중, 들어갈 수 있음) | 'soon'(준비 중, 링크 없음)
   storageKey: 과목 config.js의 storageKey와 같게 — 첫 화면 카드에 학습 기록을 보여 줘요 */
window.SUBJECTS = [
  {
    id: 'datascience', path: 'datascience/', status: 'open',
    icon: '📊', name: '데이터 과학', tag: '고등 진로선택 · 단원별 학습',
    desc: '데이터를 모으고, 정리하고, 분석해서 모델까지. 4개 대단원 32레슨을 이야기와 계단 문제로 공부해요.',
    lessons: 32, storageKey: 'ds-progress-v1'
  },
  {
    id: 'aibasic', path: 'aibasic/', status: 'open',
    icon: '🤖', name: '인공지능 기초', tag: '고등 진로선택 · 단원별 학습',
    desc: '탐색과 추론, 기계학습과 딥러닝, AI 윤리, 프로젝트까지. 4개 대단원 39레슨을 이야기와 계단 문제, 브라우저 파이썬 실습으로 공부해요.',
    lessons: 39, storageKey: 'aibasic-progress-v1'
  },
  {
    id: 'info', path: 'info/', status: 'soon',
    icon: '💻', name: '정보', tag: '고등 일반선택 · 단원별 학습',
    desc: '컴퓨팅 사고력, 자료와 정보, 알고리즘과 프로그래밍을 계단식으로 익혀요.',
    storageKey: 'info-progress-v1'
  }
];
