// 과목 데이터 검사: node _source/validate.js <과목폴더>   예) node _source/validate.js public/aibasic
// data/unit*.js, data/bank*.js 를 순서대로 불러와 SCHEMA.md · BANK_SCHEMA.md 규칙을 확인한다.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = process.argv[2];
if (!dir) { console.error('사용법: node _source/validate.js public/<과목>'); process.exit(2); }
const dataDir = path.join(dir, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js')).sort((a, b) => (a.startsWith('unit') ? 0 : 1) - (b.startsWith('unit') ? 0 : 1) || a.localeCompare(b));
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(dataDir, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.error('✗ ' + f + ' 문법/실행 오류: ' + e.message); process.exit(1); }
}
const units = (ctx.window.DS_DATA && ctx.window.DS_DATA.units) || [];
const bank = ctx.window.DS_BANK || {};
const errs = [], warns = [];
const ids = new Set();
const BAD_RUN = /\b(tensorflow|keras|torch|folium|google\.colab|input\s*\(|read_csv\s*\(\s*['"](?!data:)|fetch_|urllib|requests)\b/;

function checkQ(q, where) {
  if (!q || typeof q.q !== 'string' || !q.q.trim()) errs.push(where + ': 문제 문장 없음');
  if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(where + ': 선택지는 4개');
  if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) errs.push(where + ': answer는 0~3');
  if (!q.explain) errs.push(where + ': 해설 없음');
  if (q.options && q.options.some(o => /^\s*[①②③④⑤]/.test(o))) warns.push(where + ': 선택지 앞 번호 기호');
  if (q.options && new Set(q.options).size !== q.options.length) errs.push(where + ': 같은 선택지 중복');
}
function checkRun(code, where) {
  if (code && code.run && BAD_RUN.test(code.src)) errs.push(where + ': run:true 코드에 브라우저에서 안 되는 내용(' + code.src.match(BAD_RUN)[0] + ')');
}

let lessonN = 0, bankN = 0;
for (const u of units) {
  for (const k of ['id', 'roman', 'title', 'icon', 'desc', 'chapters']) if (!u[k]) errs.push('단원 ' + u.id + ': ' + k + ' 없음');
  for (const c of u.chapters || []) {
    for (const l of c.lessons || []) {
      lessonN++;
      const w = '레슨 ' + l.id;
      if (ids.has(l.id)) errs.push(w + ': id 중복'); ids.add(l.id);
      for (const k of ['title', 'storyTitle', 'pages', 'goals', 'story', 'steps', 'summary', 'terms', 'test']) if (!l[k]) errs.push(w + ': ' + k + ' 없음');
      if (l.story && (!Array.isArray(l.story.paragraphs) || l.story.paragraphs.length < 4)) warns.push(w + ': 이야기 문단 4개 미만');
      if (!l.steps || l.steps.length < 4 || l.steps.length > 5) errs.push(w + ': 계단은 4~5개 (현재 ' + (l.steps || []).length + ')');
      (l.steps || []).forEach((s, i) => {
        if (!s.title || !Array.isArray(s.body) || !s.body.length) errs.push(w + ' 계단' + (i + 1) + ': title/body 없음');
        if (!s.check) errs.push(w + ' 계단' + (i + 1) + ': check 없음'); else checkQ(s.check, w + ' 계단' + (i + 1) + ' check');
        checkRun(s.code, w + ' 계단' + (i + 1));
      });
      if (!l.test || l.test.length !== 10) errs.push(w + ': test는 10문제 (현재 ' + (l.test || []).length + ')');
      (l.test || []).forEach((q, i) => checkQ(q, w + ' test' + (i + 1)));
      if (!l.terms || l.terms.length < 6 || l.terms.length > 8) warns.push(w + ': 용어 6~8개 (현재 ' + (l.terms || []).length + ')');
      if (l.lab) {
        if (!l.lab.title || !Array.isArray(l.lab.tasks) || !l.lab.tasks.length) errs.push(w + ' lab: title/tasks 없음');
        (l.lab.tasks || []).forEach((t, i) => { if (!t.title) errs.push(w + ' lab' + (i + 1) + ': title 없음'); checkRun(t.code, w + ' lab' + (i + 1)); });
      }
      const b = bank[l.id];
      if (!b) { warns.push(w + ': 문제 은행 없음'); continue; }
      bankN += b.length;
      if (b.length < 25) errs.push(w + ': 문제 은행 25개 미만 (' + b.length + ')');
      const per = {};
      b.forEach((q, i) => {
        checkQ(q, w + ' bank' + (i + 1));
        if (!(Number.isInteger(q.step) && q.step >= 0 && q.step < l.steps.length)) errs.push(w + ' bank' + (i + 1) + ': step 범위 밖 (' + q.step + ')');
        per[q.step] = (per[q.step] || 0) + 1;
      });
      l.steps.forEach((s, i) => { if ((per[i] || 0) < 4) errs.push(w + ': 계단' + (i + 1) + ' 은행 문제 4개 미만 (' + (per[i] || 0) + ')'); });
    }
  }
}
for (const id of Object.keys(bank)) if (!ids.has(id)) errs.push('문제 은행 ' + id + ': 해당 레슨 없음');

warns.forEach(x => console.log('△ ' + x));
errs.forEach(x => console.log('✗ ' + x));
console.log(`단원 ${units.length}개 · 레슨 ${lessonN}개 · 은행 ${bankN}문제 · 오류 ${errs.length} · 경고 ${warns.length}`);
process.exit(errs.length ? 1 : 0);
