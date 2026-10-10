// 계단 설명(body)을 PPT처럼 줄이는 작업 도구
//   덤프: node _source/condense.js dump  public/<과목> <unit파일이름>            → 계단마다 설명 + 그 계단 문제(정답)를 보여 줌
//   적용: node _source/condense.js apply public/<과목> <unit파일이름> <고친내용.json>
//   길이: node _source/condense.js stat  public/<과목> <unit파일이름>
// 고친내용.json 형식: { "레슨id": { "story": { "paragraphs": [...], "question": "..." }, "계단번호(0부터)": { "body": [...], "table": {...} 또는 null(지움), "tip": "..." 또는 null(지움), "remember": [...] } } }
//   적은 항목만 바뀐다. 계단 제목·코드·확인문제·이야기·시험·실습은 바꾸지 않는다.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const [cmd, dir, name, patchFile] = process.argv.slice(2);
if (!cmd || !dir || !name) { console.error('사용법: node _source/condense.js dump|apply|stat public/<과목> unit1 [patch.json]'); process.exit(2); }
const file = path.join(dir, 'data', name.replace(/\.js$/, '') + '.js');
const src = fs.readFileSync(file, 'utf8');
const chapterMode = /chapters\.push\(/.test(src) && !/DS_DATA\.units\.push\(/.test(src);

function load() {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.DS_DATA.units;
}
function loadBank() {
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(dir, 'data')).filter(f => /^bank.*\.js$/.test(f))) vm.runInContext(fs.readFileSync(path.join(dir, 'data', f), 'utf8'), ctx);
  return ctx.window.DS_BANK || {};
}
const units = load();
const lessons = [];
units.forEach(u => u.chapters.forEach(c => c.lessons.forEach(l => lessons.push(l))));
const text = h => String(h).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const stepLen = s => (s.body || []).map(text).join('').length + (s.tip ? text(s.tip).length : 0) +
  (s.table ? [s.table.head].concat(s.table.rows).flat().join('').length : 0) + (s.remember || []).join('').length;

if (cmd === 'dump') {
  const bank = loadBank();
  for (const l of lessons) {
    console.log('\n######## 레슨 ' + l.id + ' ' + l.title);
    console.log('[story] ' + l.story.title + '  (현재 ' + l.story.paragraphs.join('').length + '자)');
    l.story.paragraphs.forEach(p => console.log('  ' + p));
    console.log('  [question] ' + l.story.question);
    l.steps.forEach((s, i) => {
      console.log('\n=== ' + l.id + ' 계단 ' + i + ' : ' + s.title + '  (현재 ' + stepLen(s) + '자)');
      console.log('[body]'); (s.body || []).forEach(b => console.log('  ' + b));
      if (s.table) console.log('[table] ' + JSON.stringify(s.table));
      if (s.code) console.log('[code 있음 — 바꾸지 않음]');
      if (s.tip) console.log('[tip] ' + s.tip);
      if (s.remember) console.log('[remember] ' + JSON.stringify(s.remember));
      const qs = [s.check].concat((bank[l.id] || []).filter(q => q.step === i)).filter(Boolean);
      console.log('[이 계단 문제 ' + qs.length + '개 — 정답]');
      qs.forEach(q => console.log('  - ' + q.q + '  ⇒ ' + q.options[q.answer]));
    });
  }
} else if (cmd === 'stat') {
  let tot = 0;
  let st = 0;
  for (const l of lessons) { const n = l.steps.reduce((a, s) => a + stepLen(s), 0), m = l.story.paragraphs.join('').length; tot += n; st += m; console.log(l.id + ' 이야기 ' + m + '자 · 계단 ' + n + '자 (' + l.steps.map(stepLen).join(', ') + ')'); }
  console.log('합계 이야기 ' + st + '자 · 계단 ' + tot + '자');
} else if (cmd === 'apply') {
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  let n = 0;
  for (const [id, steps] of Object.entries(patch)) {
    const l = lessons.find(x => x.id === id);
    if (!l) throw new Error('레슨 없음: ' + id);
    for (const [si, ch] of Object.entries(steps)) {
      if (si === 'story') {
        if (!Array.isArray(ch.paragraphs) || !ch.paragraphs.length) throw new Error(id + ' story: paragraphs가 비었음');
        l.story.paragraphs = ch.paragraphs;
        if (ch.question) l.story.question = ch.question;
        if (ch.title) l.story.title = ch.title;
        n++; continue;
      }
      const s = l.steps[Number(si)];
      if (!s) throw new Error(id + ' 계단 없음: ' + si);
      for (const k of ['body', 'table', 'tip', 'remember']) {
        if (!(k in ch)) continue;
        if (ch[k] === null) delete s[k]; else s[k] = ch[k];
      }
      if (!Array.isArray(s.body) || !s.body.length) throw new Error(id + ' 계단 ' + si + ': body가 비었음');
      n++;
    }
  }
  const head = (src.match(/^(\s*\/\/[^\n]*\n)+/) || [''])[0];
  let out;
  if (chapterMode) {
    const u = units[0], c = u.chapters[0];
    out = head + '(function () {\n  var D = window.DS_DATA = window.DS_DATA || { units: [] };\n' +
      '  var u = D.units.filter(function (x) { return x.id === ' + JSON.stringify(u.id) + '; })[0];\n' +
      '  if (!u) { u = ' + JSON.stringify({ id: u.id, roman: u.roman, title: u.title, icon: u.icon, desc: '', chapters: [] }) + '; D.units.push(u); }\n' +
      '  u.chapters.push(' + JSON.stringify(c, null, 1) + ');\n})();\n';
  } else {
    out = head + 'window.DS_DATA = window.DS_DATA || { units: [] };\nwindow.DS_DATA.units.push(' + JSON.stringify(units[0], null, 1) + ');\n';
  }
  fs.writeFileSync(file, out, 'utf8');
  console.log(file + ': 계단 ' + n + '개 바꿈');
} else { console.error('알 수 없는 명령: ' + cmd); process.exit(2); }
