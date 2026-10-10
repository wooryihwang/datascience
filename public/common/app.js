/* 과목 공통 학습 엔진 — 해시 라우터 + localStorage 진도 관리
   과목별 설정은 각 과목 폴더의 config.js(window.SUBJECT), 레슨 데이터는 data/*.js(window.DS_DATA, window.DS_BANK) */
(function () {
  'use strict';
  var SUB = window.SUBJECT || {};
  var NAME = SUB.name || '학습';
  var VERSION = SUB.version || 'v1.0';
  var PAGES_LABEL = SUB.pagesLabel == null ? '교과서' : SUB.pagesLabel;
  function pagesText(l) { return l.pages ? (PAGES_LABEL ? PAGES_LABEL + ' ' : '') + l.pages : ''; }
  var DATA = (window.DS_DATA && window.DS_DATA.units) || [];
  DATA.sort(function (a, b) { return Number(a.id) - Number(b.id); });

  // ---------- 색인 ----------
  var LESSONS = [];           // 전체 레슨 순서
  var LESSON_MAP = {};        // id -> {lesson, unit, chapter, index}
  DATA.forEach(function (u) {
    u.chapters.forEach(function (c) {
      c.lessons.forEach(function (l) {
        LESSON_MAP[l.id] = { lesson: l, unit: u, chapter: c, index: LESSONS.length };
        LESSONS.push(l);
      });
    });
  });
  function unitLessons(u) {
    var arr = [];
    u.chapters.forEach(function (c) { arr = arr.concat(c.lessons); });
    return arr;
  }

  // ---------- 저장 ----------
  var KEY = SUB.storageKey || ('progress-' + (SUB.id || 'default'));
  function blank() { return { xp: 0, done: {}, steps: {}, terms: {}, attempts: {}, badges: {}, labs: {}, lastDay: '', streak: 0 }; }
  var S = blank();
  try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  (function touchStreak() {
    var t = today();
    if (S.lastDay === t) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    S.streak = (S.lastDay === ys) ? (S.streak || 0) + 1 : 1;
    S.lastDay = t; save();
  })();

  var LEVELS = SUB.levels || [
    { xp: 0, name: '새싹' }, { xp: 150, name: '탐색가' }, { xp: 400, name: '도전자' },
    { xp: 800, name: '실력자' }, { xp: 1300, name: '고수' }, { xp: 2000, name: '마스터' }
  ];
  function level() {
    var i = 0;
    for (var k = 0; k < LEVELS.length; k++) if (S.xp >= LEVELS[k].xp) i = k;
    var next = LEVELS[i + 1];
    var pct = next ? Math.round((S.xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp) * 100) : 100;
    return { n: i + 1, name: LEVELS[i].name, next: next, pct: pct };
  }

  var BADGES = [
    { id: 'first', icon: '🌱', name: '첫걸음', test: function () { return Object.keys(S.done).length >= 1; } },
    { id: 'oneshot', icon: '⚡', name: '한 번에 통과', test: function () { return Object.keys(S.done).some(function (k) { return S.done[k].firstTry; }); } },
    { id: 'perfect', icon: '💯', name: '만점왕', test: function () { return Object.keys(S.done).some(function (k) { return S.done[k].best === 100; }); } },
    { id: 'terms', icon: '🧩', name: '용어 박사', test: function () { return Object.keys(S.terms).length >= 5; } },
    { id: 'unit', icon: '🏔️', name: '단원 정복', test: function () { return DATA.some(function (u) { var ls = unitLessons(u); return ls.length && ls.every(function (l) { return S.done[l.id]; }); }); } },
    { id: 'streak', icon: '🔥', name: '3일 연속', test: function () { return S.streak >= 3; } },
    { id: 'grad', icon: '🎓', name: '졸업', test: function () { return LESSONS.length && LESSONS.every(function (l) { return S.done[l.id]; }); } }
  ];
  // 코딩 실습이 있는 과목에만 실습 배지를 보여 줌
  if (LESSONS.some(function (l) { return l.lab; })) {
    BADGES.splice(BADGES.length - 1, 0, { id: 'coder', icon: '🧪', name: '코딩 실습가', test: function () { return Object.keys(S.labs || {}).length >= 5; } });
  }
  function checkBadges() {
    BADGES.forEach(function (b) {
      if (!S.badges[b.id] && b.test()) { S.badges[b.id] = today(); save(); toast(b.icon + ' 배지 획득: ' + b.name); }
    });
  }
  function addXP(n, msg) {
    S.xp += n; save(); updateTop();
    toast('+' + n + ' XP' + (msg ? ' · ' + msg : ''));
  }

  // ---------- 유틸 ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  var NUMS = ['①', '②', '③', '④', '⑤'];
  function stripNum(s) { return String(s).replace(/^\s*[①②③④⑤]\s*/, ''); }

  // ---------- 상단 ----------
  function updateTop() {
    var lv = level();
    $('#lvChip').textContent = 'Lv.' + lv.n;
    $('#xpChip').textContent = S.xp + ' XP';
  }
  function renderTabs(activeUnit) {
    $('#unitTabs').innerHTML = DATA.map(function (u) {
      return '<a href="#/unit/' + u.id + '" class="' + (u.id === activeUnit ? 'on' : '') + '">' + esc(u.icon + ' ' + u.roman + '. ' + u.title) + '</a>';
    }).join('');
  }

  // ---------- 홈 ----------
  function viewHome() {
    renderTabs(null);
    var doneN = LESSONS.filter(function (l) { return S.done[l.id]; }).length;
    var next = LESSONS.filter(function (l) { return !S.done[l.id]; })[0] || LESSONS[0];
    var lv = level();
    var h = '';
    h += '<section class="hero"><div class="eyebrow">' + esc(SUB.eyebrow || '이야기로 시작해서, 계단처럼 한 칸씩') + '</div>';
    h += '<h1>' + esc(SUB.heroTitle || NAME) + '</h1>';
    h += '<p>' + esc(SUB.heroDesc || '레슨을 깰 때마다 XP를 모으고 배지를 얻어요.') + ' (' + doneN + '/' + LESSONS.length + ' 레슨 완료)</p>';
    if (next) h += '<a class="btn" href="#/lesson/' + next.id + '">' + (doneN ? '이어서 학습하기 →' : '첫 레슨 시작하기 →') + '</a>';
    h += '</section>';
    h += '<div class="how"><div><b>📖</b>① 짧은 이야기로<br>궁금증 만들기</div><div><b>🪜</b>② 계단 오르며<br>문제를 풀어요</div><div><b>🧩</b>③ 용어 카드를<br>짝지어요</div><div><b>🏁</b>④ 10문제 시험<br>80점이면 통과!</div></div>';
    h += '<section class="card"><h2>내 기록</h2><div class="stats"><span class="lv">Lv.' + lv.n + ' ' + esc(lv.name) + '</span><span class="muted">' + S.xp + ' XP · 🔥 ' + S.streak + '일 연속</span></div>';
    h += '<div class="bar" style="margin-top:10px" aria-label="다음 레벨까지 진행률"><i style="width:' + lv.pct + '%"></i></div>';
    h += '<div class="muted" style="font-size:13px;margin-top:4px">' + (lv.next ? '다음 레벨(' + esc(lv.next.name) + ')까지 ' + (lv.next.xp - S.xp) + ' XP' : '최고 레벨 달성!') + '</div>';
    h += '<div class="badges">' + BADGES.map(function (b) { return '<div class="badge ' + (S.badges[b.id] ? 'got' : '') + '"><b>' + b.icon + '</b>' + esc(b.name) + '</div>'; }).join('') + '</div></section>';
    h += '<h2 style="margin-top:24px">대단원</h2><div class="units">';
    DATA.forEach(function (u) {
      var ls = unitLessons(u); var d = ls.filter(function (l) { return S.done[l.id]; }).length;
      h += '<a class="unit-card" href="#/unit/' + u.id + '"><div class="ic">' + esc(u.icon) + '</div><h3>' + esc(u.roman + '. ' + u.title) + '</h3><p>' + esc(u.desc) + '</p>';
      h += '<div class="bar"><i style="width:' + (ls.length ? d / ls.length * 100 : 0) + '%"></i></div><div class="muted" style="font-size:13px;margin-top:4px">' + d + '/' + ls.length + ' 레슨 완료</div></a>';
    });
    h += '</div>';
    if (!DATA.length) h += '<p class="card">🛠️ 콘텐츠를 준비하고 있어요. 조금만 기다려 주세요!</p>';
    h += '<p style="text-align:center;margin-top:28px"><button class="btn ghost" id="resetBtn">기록 모두 지우기</button></p>';
    $('#app').innerHTML = h;
    $('#resetBtn').onclick = function () {
      if (confirm('XP, 배지, 레슨 기록을 모두 지울까요?')) { S = blank(); S.lastDay = today(); S.streak = 1; save(); updateTop(); viewHome(); }
    };
  }

  // ---------- 대단원 ----------
  function viewUnit(id) {
    var u = DATA.filter(function (x) { return x.id === id; })[0];
    if (!u) return notFound();
    renderTabs(u.id);
    var h = '<div class="crumb"><a href="#/">' + esc(NAME) + '</a> › ' + esc(u.roman + '. ' + u.title) + '</div>';
    h += '<h1>' + esc(u.icon + ' ' + u.roman + '. ' + u.title) + '</h1><p class="muted">' + esc(u.desc) + '</p>';
    if (u.question) h += '<div class="goals"><b>💬 핵심 질문</b><div>' + esc(u.question) + '</div></div>';
    u.chapters.forEach(function (c, ci) {
      h += '<section class="chapter"><h2>' + (ci + 1) + '. ' + esc(c.title) + '</h2>';
      c.lessons.forEach(function (l) {
        var d = S.done[l.id];
        h += '<a class="lesson-row ' + (d ? 'done' : '') + '" href="#/lesson/' + l.id + '"><span class="num">' + (d ? '✓' : (LESSON_MAP[l.id].index + 1)) + '</span>';
        h += '<span class="t">' + esc(l.title) + '<small>' + esc(l.storyTitle || '') + (pagesText(l) ? ' · ' + esc(pagesText(l)) : '') + '</small></span>';
        h += d ? '<span class="pill ok">' + d.best + '점</span>' : '<span class="pill">' + (S.steps[l.id] || 0) + '/' + l.steps.length + '계단</span>';
        h += '</a>';
      });
      h += '</section>';
    });
    $('#app').innerHTML = h;
  }

  // ---------- 레슨 ----------
  var testState = {};   // lessonId -> {qs:[], picks:{}, submitted:bool}
  var gameState = {};   // lessonId -> {terms:[], defs:[], matched:{}, sel:null}
  var stepPick = {};    // lessonId -> {stepIndex: question}
  var TEST_N = 10;

  // ---------- 문제 은행 ----------
  // 계단 확인문제(step=i) + 기존 시험 문제(step 없음) + 문제 은행(window.DS_BANK)
  var poolCache = {};
  function lessonPool(l) {
    if (poolCache[l.id]) return poolCache[l.id];
    var all = [];
    l.steps.forEach(function (s, i) { if (s.check) all.push(Object.assign({ step: i }, s.check)); });
    l.test.forEach(function (q) { all.push(q); });
    var bank = (window.DS_BANK && window.DS_BANK[l.id]) || [];
    bank.forEach(function (q) { if (q.step >= 0 && q.step < l.steps.length) all.push(q); });
    return (poolCache[l.id] = all);
  }
  function stepPool(l, i) { return lessonPool(l).filter(function (q) { return q.step === i; }); }
  function pickStepQuestion(l, i, avoid) {
    var p = stepPool(l, i);
    var choices = p.length > 1 ? p.filter(function (q) { return q !== avoid; }) : p;
    var q = choices[Math.floor(Math.random() * choices.length)];
    (stepPick[l.id] = stepPick[l.id] || {})[i] = q;
    return q;
  }
  function stepQuestion(l, i) {
    var cur = stepPick[l.id] && stepPick[l.id][i];
    return cur || (stepPool(l, i).length ? pickStepQuestion(l, i) : null);
  }

  function viewLesson(id) {
    var ref = LESSON_MAP[id];
    if (!ref) return notFound();
    var l = ref.lesson, u = ref.unit, c = ref.chapter;
    renderTabs(u.id);
    var cleared = S.steps[id] || 0;
    var allClear = cleared >= l.steps.length;
    var h = '<div class="crumb"><a href="#/">' + esc(NAME) + '</a> › <a href="#/unit/' + u.id + '">' + esc(u.roman + '. ' + u.title) + '</a></div>';
    h += '<div class="muted" style="font-weight:700;color:var(--brand)">' + esc(c.title) + '</div>';
    h += '<h1>' + esc(l.title) + '</h1>';
    h += '<div class="muted">' + esc(l.storyTitle || '') + '</div><div class="muted" style="font-size:13px">' + esc(pagesText(l)) + (S.done[id] ? ' · <span class="pill ok">완료 ' + S.done[id].best + '점</span>' : '') + '</div>';
    h += '<div class="goals"><b>🎯 이번 레슨의 목표</b><ul>' + l.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div>';

    // 이야기
    h += '<section class="card story"><h2><span class="sec-label">이야기</span>먼저 읽어 봐요</h2>';
    h += '<h3>' + esc(l.story.title) + '</h3>' + l.story.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    h += '<div class="q">' + esc(l.story.question) + '</div></section>';

    // 계단
    h += '<section class="card"><h2>' + l.steps.length + '계단 <span class="muted" style="font-size:15px;font-weight:400">한 칸씩 올라가요</span></h2><div class="stairs">';
    l.steps.forEach(function (s, i) { h += '<span class="' + (i < cleared ? 'done' : (i === cleared ? 'cur' : '')) + '">' + (i < cleared ? '✓ ' : (i === cleared ? '▲ ' : '🔒 ')) + (i + 1) + '계단</span>'; });
    h += '</div></section>';
    l.steps.forEach(function (s, i) {
      var locked = i > cleared;
      h += '<section class="card step ' + (locked ? 'locked' : '') + '" id="step-' + i + '"><div class="num">' + (i + 1) + '계단</div><h2>' + esc(s.title) + '</h2>';
      if (locked) { h += '<div class="lock-msg">🔒 앞 계단의 확인문제를 맞히면 열려요.</div></section>'; return; }
      h += (s.body || []).join('');
      if (s.table) {
        h += '<div class="tbl-wrap"><table><thead><tr>' + s.table.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>';
        h += s.table.rows.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      }
      if (s.code) h += codeBlock(s.code, id + ':s' + i);
      if (s.tip) h += '<div class="tip">' + esc(s.tip) + '</div>';
      if (s.remember && s.remember.length) h += '<div class="remember"><b>✔ 꼭 기억해요</b><ul>' + s.remember.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
      var cq = stepQuestion(l, i);
      if (cq) {
        var solved = i < cleared;
        h += '<div class="quiz" data-step="' + i + '"><div class="q">✅ 확인문제 — ' + (solved ? '해결했어요!' : '맞히면 다음 계단이 열려요') + '</div><div>' + esc(cq.q) + '</div>';
        cq.options.forEach(function (o, oi) {
          h += '<button class="opt ' + (solved && oi === cq.answer ? 'right' : '') + '" data-o="' + oi + '" ' + (solved ? 'disabled' : '') + '>' + NUMS[oi] + ' ' + esc(stripNum(o)) + '</button>';
        });
        h += '<div class="fb">' + (solved ? '<div class="feedback ok">⭕ ' + esc(cq.explain) + '</div>' : '') + '</div></div>';
      }
      h += '</section>';
    });

    // 코딩 실습 (선택, 잠금 없음)
    if (l.lab) h += renderLab(l);

    // 정리
    h += '<section class="card ' + (allClear ? '' : 'step locked') + '"><h2><span class="sec-label">정리</span>한 줄로 다시 보기</h2>';
    h += allClear ? '<ul>' + l.summary.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '<div class="lock-msg">🔒 위 계단을 모두 올라야 열려요.</div>';
    h += '</section>';
    // 게임
    h += '<section class="card ' + (allClear ? '' : 'step locked') + '" id="game"><h2><span class="sec-label">게임</span>용어 카드 맞추기</h2>';
    h += allClear ? '<div id="gameBox"></div>' : '<div class="lock-msg">🔒 위 계단을 모두 올라야 열려요.</div>';
    h += '</section>';
    // 시험
    h += '<section class="card ' + (allClear ? '' : 'step locked') + '" id="test"><h2><span class="sec-label">시험</span>마무리 10문제 — 80점이면 통과!</h2>';
    h += allClear ? '<div id="testBox"></div>' : '<div class="lock-msg">🔒 위 계단을 모두 올라야 열려요. 시험에서 80점 이상이면 이 레슨이 완료돼요.</div>';
    h += '</section>';

    // 이전/다음
    var prev = LESSONS[ref.index - 1], next = LESSONS[ref.index + 1];
    h += '<div class="nav-bottom">' + (prev ? '<a href="#/lesson/' + prev.id + '"><small>← 이전 레슨</small>' + esc(prev.title) + '</a>' : '<span></span>');
    h += (next ? '<a class="next" href="#/lesson/' + next.id + '"><small>다음 레슨 →</small>' + esc(next.title) + '</a>' : '<a class="next" href="#/"><small>모든 레슨 끝!</small>처음 화면으로</a>') + '</div>';

    $('#app').innerHTML = h;

    // 확인문제 이벤트
    $all('.quiz').forEach(function (qz) {
      var si = Number(qz.getAttribute('data-step'));
      var cq = stepQuestion(l, si);
      $all('.opt', qz).forEach(function (btn) {
        btn.onclick = function () {
          var oi = Number(btn.getAttribute('data-o'));
          var fb = $('.fb', qz);
          if (oi === cq.answer) {
            btn.classList.add('right');
            $all('.opt', qz).forEach(function (b) { b.disabled = true; });
            fb.innerHTML = '<div class="feedback ok">⭕ 정답! ' + esc(cq.explain) + '</div>';
            if ((S.steps[id] || 0) < si) { viewLesson(id); return; }  // 진도가 초기화된 뒤의 옛 화면
            if ((S.steps[id] || 0) === si) {
              S.steps[id] = si + 1; save(); addXP(10, (si + 1) + '계단 통과');
              setTimeout(function () {
                viewLesson(id);
                var target = S.steps[id] >= l.steps.length ? $('#game') : $('#step-' + (si + 1));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 1100);
            }
          } else {
            btn.classList.add('wrong');
            $all('.opt', qz).forEach(function (b) { b.disabled = true; if (Number(b.getAttribute('data-o')) === cq.answer) b.classList.add('right'); });
            fb.innerHTML = '<div class="feedback no">❌ 아쉬워요. 정답은 ' + NUMS[cq.answer] + '이에요. ' + esc(cq.explain) +
              '<div style="margin-top:8px"><button class="btn ghost" data-retry="1" style="padding:6px 14px">🔄 다른 문제로 다시 도전</button></div></div>';
            $('[data-retry]', fb).onclick = function () {
              pickStepQuestion(l, si, cq);
              viewLesson(id);
              var t = $('#step-' + si); if (t) t.querySelector('.quiz').scrollIntoView({ block: 'center' });
            };
          }
        };
      });
    });
    if (allClear) { renderGame(l); renderTest(l); }
  }

  // ---------- 코드 블록 · 코딩 실습 ----------
  // run:true 인 코드는 고쳐서 브라우저에서 바로 실행(Pyodide). 나머지는 복사해서 코랩에서 실행.
  var CODES = {};     // key -> 원래 코드
  var EDITS = {};     // key -> 학생이 고친 코드 (화면을 다시 그려도 유지)
  function codeBlock(code, key) {
    CODES[key] = code.src;
    var lang = code.lang || 'python';
    var h = '<div class="code-box" data-key="' + esc(key) + '">';
    if (code.run) {
      var src = EDITS[key] != null ? EDITS[key] : code.src;
      var rows = Math.min(24, Math.max(3, src.split('\n').length + 1));
      h += '<div class="code-edit-wrap"><span class="lang">' + esc(lang) + ' · 고쳐서 실행해 봐요</span><textarea class="code-edit" spellcheck="false" autocapitalize="off" autocomplete="off" rows="' + rows + '" aria-label="파이썬 코드 편집">' + esc(src) + '</textarea></div>';
    } else {
      h += '<pre class="code"><span class="lang">' + esc(lang) + '</span><code>' + esc(code.src) + '</code></pre>';
    }
    h += '<div class="code-actions">';
    if (code.run) h += '<button class="btn" data-run>▶ 실행</button><button class="btn ghost" data-reset>↺ 처음 코드로</button>';
    h += '<button class="btn ghost" data-copy>📋 복사</button>';
    if (!code.run && lang === 'python') h += '<span class="muted code-note">코랩(Colab)에 붙여 넣어 실행해요</span>';
    h += '</div><div class="code-out" hidden></div></div>';
    return h;
  }
  function renderLab(l) {
    var lab = l.lab;
    var h = '<section class="card lab" id="lab"><h2><span class="sec-label lab-label">실습</span>' + esc(lab.title) + '</h2>';
    if (lab.worksheet) h += '<div class="pill" style="margin-bottom:8px">📄 ' + esc(lab.worksheet) + '</div>';
    h += (lab.intro || []).join('');
    if (lab.tasks.some(function (t) { return t.code && t.code.run; })) h += '<div class="tip">💻 ▶ 실행을 누르면 이 화면에서 파이썬이 돌아가요. 처음 한 번은 준비하는 데 10~20초 걸려요. 위 칸부터 차례로 실행해요 (앞 칸에서 만든 변수를 뒤 칸에서 써요).</div>';
    lab.tasks.forEach(function (t, ti) {
      var key = l.id + ':lab' + ti;
      h += '<div class="lab-task"><h3>' + (S.labs[key] ? '✅ ' : '') + (ti + 1) + '. ' + esc(t.title) + '</h3>' + (t.body || []).join('');
      if (t.code) h += codeBlock(t.code, key);
      if (t.ask) h += '<div class="lab-ask"><b>✏️ 생각해 봐요</b> ' + esc(t.ask) + '</div>';
      h += '</div>';
    });
    return h + '</section>';
  }

  var pyReady = null;
  var PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  function getPy() {
    if (!pyReady) {
      pyReady = new Promise(function (res, rej) {
        var sc = document.createElement('script'); sc.src = PYODIDE + 'pyodide.js';
        sc.onload = function () {
          window.loadPyodide({ indexURL: PYODIDE }).then(function (py) {
            py.runPython("import warnings\nwarnings.filterwarnings('ignore')");   // 학생 화면에 경고문 숨김
            res(py);
          }, rej);
        };
        sc.onerror = function () { rej(new Error('파이썬 실행기를 불러오지 못했어요. 인터넷 연결을 확인해요.')); };
        document.head.appendChild(sc);
      });
      pyReady.catch(function () { pyReady = null; });
    }
    return pyReady;
  }
  var running = false;
  function runPython(key, src, out, btn) {
    if (running) { toast('다른 코드가 실행 중이에요'); return; }
    running = true; btn.disabled = true;
    out.hidden = false; out.className = 'code-out'; out.textContent = '⏳ 파이썬 준비 중… (처음 한 번은 10~20초)';
    var text = '';
    getPy().then(function (py) {
      out.textContent = '⏳ 실행 중…';
      py.setStdout({ batched: function (x) { text += x + '\n'; } });
      py.setStderr({ batched: function (x) { text += x + '\n'; } });
      return py.loadPackagesFromImports(src).then(function () {
        if (/matplotlib/.test(src)) py.runPython("import matplotlib\nmatplotlib.use('AGG')");
        return py.runPythonAsync(src);
      }).then(function (r) {
        if (r !== undefined && r !== null) { text += String(r) + '\n'; if (r.destroy) r.destroy(); }
        var imgs = [];
        if (py.runPython("import sys\n'matplotlib.pyplot' in sys.modules")) {
          var p = py.runPython([
            'import io, base64', 'import matplotlib.pyplot as _plt', '_imgs = []',
            'for _n in _plt.get_fignums():',
            '    _b = io.BytesIO(); _plt.figure(_n).savefig(_b, format="png", dpi=90, bbox_inches="tight"); _imgs.append(base64.b64encode(_b.getvalue()).decode())',
            "_plt.close('all')", '_imgs'].join('\n'));
          imgs = p.toJs(); p.destroy();
        }
        out.innerHTML = '<pre>' + esc(text || '(출력 없음 — 실행 완료)') + '</pre>' + imgs.map(function (b) { return '<img alt="실행 결과 그래프" src="data:image/png;base64,' + b + '">'; }).join('');
        if (key.indexOf(':lab') > 0 && !S.labs[key]) { S.labs[key] = today(); save(); addXP(5, '코딩 실습'); checkBadges(); }
      });
    }).catch(function (e) {
      var lines = String(e && e.message || e).trim().split('\n');
      out.className = 'code-out err';
      out.innerHTML = '<pre>' + esc(text) + esc(lines[lines.length - 1]) + '</pre><div class="muted" style="font-size:13px">❗ 오류가 났어요. 마지막 줄을 읽고 코드를 고쳐 봐요. 앞 칸을 먼저 실행했는지도 확인해요.</div>';
    }).then(function () { running = false; btn.disabled = false; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-run],[data-copy],[data-reset]');
    if (!b) return;
    var box = b.closest('.code-box'); if (!box) return;
    var key = box.getAttribute('data-key');
    var ta = $('.code-edit', box);
    var src = ta ? ta.value : CODES[key];
    if (b.hasAttribute('data-copy')) {
      (navigator.clipboard ? navigator.clipboard.writeText(src) : Promise.reject()).then(function () { toast('코드를 복사했어요'); }, function () { toast('복사하지 못했어요. 직접 선택해서 복사해요'); });
    } else if (b.hasAttribute('data-reset')) {
      if (ta) { ta.value = CODES[key]; delete EDITS[key]; }
    } else runPython(key, src, $('.code-out', box), b);
  });
  document.addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('code-edit')) return;
    var box = e.target.closest('.code-box'); if (box) EDITS[box.getAttribute('data-key')] = e.target.value;
  });
  document.addEventListener('keydown', function (e) {
    // 코드 칸에서 Tab은 들여쓰기(공백 4칸), Shift+Enter는 실행
    if (!e.target.classList || !e.target.classList.contains('code-edit')) return;
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault(); var t = e.target, st = t.selectionStart;
      t.value = t.value.slice(0, st) + '    ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = st + 4;
      t.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); var r = $('[data-run]', e.target.closest('.code-box')); if (r) r.click();
    }
  });

  // ---------- 용어 카드 게임 ----------
  function renderGame(l) {
    var box = $('#gameBox'); if (!box) return;
    var g = gameState[l.id];
    if (!g) g = gameState[l.id] = { terms: shuffle(l.terms.map(function (t, i) { return i; })), defs: shuffle(l.terms.map(function (t, i) { return i; })), matched: {}, sel: null };
    var all = Object.keys(g.matched).length === l.terms.length;
    var h = '<p class="muted" style="margin-top:0">왼쪽 용어를 누른 뒤, 알맞은 뜻을 오른쪽에서 골라요.' + (S.terms[l.id] ? ' (완료한 게임이에요 ✓)' : '') + '</p>';
    h += '<div class="match"><div class="col">' + g.terms.map(function (i) {
      return '<button class="tcard term ' + (g.matched[i] ? 'matched' : '') + (g.sel === i ? ' sel' : '') + '" data-t="' + i + '" ' + (g.matched[i] ? 'disabled' : '') + '>' + esc(l.terms[i].term) + '</button>';
    }).join('') + '</div><div class="col">' + g.defs.map(function (i) {
      return '<button class="tcard def ' + (g.matched[i] ? 'matched' : '') + '" data-d="' + i + '" ' + (g.matched[i] ? 'disabled' : '') + '>' + esc(l.terms[i].def) + '</button>';
    }).join('') + '</div></div>';
    if (all) h += '<div class="feedback ok" style="margin-top:12px">🎉 모든 용어를 맞혔어요! <button class="btn ghost" id="gameAgain" style="padding:4px 12px;margin-left:6px">다시 하기</button></div>';
    box.innerHTML = h;
    $all('.tcard.term', box).forEach(function (b) {
      b.onclick = function () { g.sel = Number(b.getAttribute('data-t')); renderGame(l); };
    });
    $all('.tcard.def', box).forEach(function (b) {
      b.onclick = function () {
        if (g.sel === null) { toast('먼저 왼쪽에서 용어를 골라요'); return; }
        var d = Number(b.getAttribute('data-d'));
        if (d === g.sel) {
          g.matched[d] = true; g.sel = null;
          if (Object.keys(g.matched).length === l.terms.length && !S.terms[l.id]) { S.terms[l.id] = true; save(); addXP(20, '용어 카드 완성'); checkBadges(); }
          renderGame(l);
        } else { b.classList.add('shake'); setTimeout(function () { b.classList.remove('shake'); }, 400); }
      };
    });
    var again = $('#gameAgain', box);
    if (again) again.onclick = function () { delete gameState[l.id]; renderGame(l); };
  }

  // ---------- 시험 ----------
  function renderTest(l) {
    var box = $('#testBox'); if (!box) return;
    var t = testState[l.id];
    var pool = lessonPool(l);
    if (!t) t = testState[l.id] = { qs: shuffle(pool).slice(0, TEST_N), picks: {}, submitted: false };
    var N = t.qs.length;
    var h = '';
    if (!t.submitted) h += '<p class="muted" style="margin-top:0">문제 은행 ' + pool.length + '문제 중 ' + N + '문제를 무작위로 냈어요. 80점 미만이면 <b>1계단부터 다시</b> 올라가야 해요.</p>';
    if (t.submitted) {
      var score = testScore(t), pass = score >= 80;
      h += '<div class="score ' + (pass ? 'pass' : 'fail') + '"><div class="big">' + score + '점</div><div>' + (pass ? '🎉 통과! 이 레슨을 완료했어요.' : '아쉬워요. 80점 이상이면 통과예요.<br><b>1계단부터 새 문제로 다시 올라가요.</b> 아래 해설을 먼저 읽어 보세요.') + '</div></div>';
    }
    t.qs.forEach(function (q, qi) {
      var n = qi;
      h += '<div class="tq" data-q="' + qi + '"><div class="q">' + (n + 1) + '. ' + esc(q.q) + '</div>';
      q.options.forEach(function (o, oi) {
        var cls = '';
        if (t.submitted) { if (oi === q.answer) cls = 'right'; else if (t.picks[qi] === oi) cls = 'wrong'; }
        else if (t.picks[qi] === oi) cls = 'picked';
        h += '<button class="opt ' + cls + '" data-o="' + oi + '" ' + (t.submitted ? 'disabled' : '') + '>' + NUMS[oi] + ' ' + esc(stripNum(o)) + '</button>';
      });
      if (t.submitted) h += '<div class="feedback ' + (t.picks[qi] === q.answer ? 'ok' : 'no') + '">' + (t.picks[qi] === q.answer ? '⭕ ' : '❌ 정답 ' + NUMS[q.answer] + ' · ') + esc(q.explain) + '</div>';
      h += '</div>';
    });
    var answered = Object.keys(t.picks).length;
    var passed = t.submitted && testScore(t) >= 80;
    h += '<div style="text-align:center;margin-top:16px">' + (t.submitted ? (passed ? '<button class="btn" id="retry">새 문제로 다시 풀기</button>' : '<button class="btn" id="restart">⬆ 1계단부터 다시 시작</button>') : '<button class="btn" id="submit" ' + (answered < N ? 'disabled' : '') + '>채점하기 (' + answered + '/' + N + ')</button>') + '</div>';
    box.innerHTML = h;
    if (!t.submitted) {
      $all('.tq', box).forEach(function (el) {
        var qi = Number(el.getAttribute('data-q'));
        $all('.opt', el).forEach(function (b) {
          b.onclick = function () {
            t.picks[qi] = Number(b.getAttribute('data-o'));
            $all('.opt', el).forEach(function (x) { x.classList.remove('picked'); });
            b.classList.add('picked');
            var sb = $('#submit'); var a = Object.keys(t.picks).length;
            sb.textContent = '채점하기 (' + a + '/' + N + ')'; sb.disabled = a < N;
          };
        });
      });
      $('#submit').onclick = function () { t.submitted = true; grade(l, t); renderTest(l); $('#test').scrollIntoView({ behavior: 'smooth' }); };
    } else if (passed) {
      $('#retry').onclick = function () { delete testState[l.id]; renderTest(l); $('#test').scrollIntoView({ behavior: 'smooth' }); };
    } else {
      $('#restart').onclick = function () {
        delete testState[l.id]; delete gameState[l.id];
        viewLesson(l.id);
        var t1 = $('#step-0'); if (t1) t1.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }
  }
  function testScore(t) {
    var right = t.qs.filter(function (q, qi) { return t.picks[qi] === q.answer; }).length;
    return Math.round(right / t.qs.length * 100);
  }
  function grade(l, t) {
    var score = testScore(t);
    S.attempts[l.id] = (S.attempts[l.id] || 0) + 1;
    if (score < 80) {
      // 통과 못하면 1계단부터 다시: 계단 진도 초기화 + 새 확인문제
      S.steps[l.id] = 0; delete stepPick[l.id]; save();
      toast('1계단부터 다시 도전해요!');
    }
    var prev = S.done[l.id];
    if (score >= 80) {
      if (!prev) { S.done[l.id] = { best: score, firstTry: S.attempts[l.id] === 1, date: today() }; save(); addXP(50 + (score === 100 ? 30 : 0), '레슨 완료'); }
      else if (score > prev.best) { if (score === 100) addXP(30, '만점 보너스'); prev.best = score; save(); }
    }
    save(); checkBadges();
  }

  // ---------- 용어 사전 ----------
  function viewGlossary() {
    renderTabs(null);
    var items = [];
    LESSONS.forEach(function (l) { l.terms.forEach(function (t) { items.push({ term: t.term, def: t.def, id: l.id, title: l.title }); }); });
    items.sort(function (a, b) { return a.term.localeCompare(b.term, 'ko'); });
    var h = '<div class="crumb"><a href="#/">' + esc(NAME) + '</a> › 용어 사전</div><h1>📚 용어 사전</h1><p class="muted">모든 레슨의 핵심 용어 ' + items.length + '개를 모았어요.</p>';
    h += '<input class="search" id="q" type="search" placeholder="' + esc(SUB.glossaryHint || '용어나 뜻으로 찾기') + '" aria-label="용어 검색"><div id="glist"></div>';
    $('#app').innerHTML = h;
    function draw(q) {
      q = (q || '').trim().toLowerCase();
      var f = items.filter(function (it) { return !q || it.term.toLowerCase().indexOf(q) >= 0 || it.def.toLowerCase().indexOf(q) >= 0; });
      $('#glist').innerHTML = f.map(function (it) { return '<div class="gl-item"><b>' + esc(it.term) + '</b><div>' + esc(it.def) + '</div><a href="#/lesson/' + it.id + '">→ ' + esc(it.title) + '</a></div>'; }).join('') || '<p class="muted">찾는 용어가 없어요.</p>';
    }
    $('#q').oninput = function (e) { draw(e.target.value); };
    draw('');
  }

  // ---------- 업데이트 기록 ----------
  var CHANGELOG = SUB.changelog || [];
  function viewChangelog() {
    renderTabs(null);
    var h = '<div class="crumb"><a href="#/">' + esc(NAME) + '</a> › 업데이트 기록</div><h1>🛠️ 업데이트 기록</h1>';
    if (!CHANGELOG.length) h += '<p class="muted">아직 기록이 없어요.</p>';
    CHANGELOG.forEach(function (c) {
      h += '<section class="card"><h2><span class="pill">' + esc(c.v) + '</span> ' + esc(c.title) + '</h2><ul>' + c.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></section>';
    });
    $('#app').innerHTML = h;
  }

  function notFound() { renderTabs(null); $('#app').innerHTML = '<div class="card"><h2>페이지를 찾을 수 없어요</h2><a class="btn" href="#/">처음으로</a></div>'; }

  // ---------- 라우터 ----------
  function route() {
    var hsh = location.hash.replace(/^#\/?/, '');
    var parts = hsh.split('/');
    if (!hsh) viewHome();
    else if (parts[0] === 'unit') viewUnit(parts[1]);
    else if (parts[0] === 'lesson') viewLesson(parts[1]);
    else if (parts[0] === 'glossary') viewGlossary();
    else if (parts[0] === 'changelog') viewChangelog();
    else notFound();
    window.scrollTo(0, 0);
    var on = $('.unit-tabs a.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  // ---------- 테마 ----------
  try { var th = localStorage.getItem('ds-theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) {}
  $('#themeBtn').onclick = function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    var nx = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nx);
    try { localStorage.setItem('ds-theme', nx); } catch (e) {}
  };

  // 과목 이름·로고·바닥글을 설정에서 채움
  document.title = SUB.title || (NAME + ' 학습사이트');
  if ($('#brandLogo') && SUB.logo) $('#brandLogo').textContent = SUB.logo;
  if ($('#brandName')) $('#brandName').textContent = NAME;
  if ($('#footText') && SUB.footer) $('#footText').textContent = SUB.footer + ' · ';
  $('#ver').textContent = VERSION;
  updateTop();
  window.addEventListener('hashchange', route);
  route();
  checkBadges();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
