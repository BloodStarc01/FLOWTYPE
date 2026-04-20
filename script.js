/* ═══════════════════════════════════════════════
   TYPEQUEST — script.js
   Interactive logic merged from home-UI.zip + Index.html
   ═══════════════════════════════════════════════ */

'use strict';

/* ─── State ─── */
const S = {
  xp: 0, coins: 0, streak: 1,
  bestWpm: 0, totalAcc: [], lessonsCompleted: 0,
  unlockedBadges: new Set(),
  questProgress: {},
  wpmHistory: [],
  duelWins: 0,
  currentLesson: null,
  practice: false,
  keyAccuracy: {},
  activityLog: [],
  duelRoom: null
};

/* ─── Save / Load ─── */
function saveState() {
  try {
    const data = {
      ...S,
      unlockedBadges: [...S.unlockedBadges],
      keyAccuracy: S.keyAccuracy,
      activityLog: S.activityLog.slice(-20)
    };
    localStorage.setItem('tq_state', JSON.stringify(data));
  } catch(e) {}
}
function loadState() {
  try {
    const raw = localStorage.getItem('tq_state');
    if (!raw) return;
    const d = JSON.parse(raw);
    Object.assign(S, d);
    S.unlockedBadges = new Set(d.unlockedBadges || []);
  } catch(e) {}
}

/* ─── Screen Navigation ─── */
const SCREEN_MAP = {
  home: 'sc-home', quests: 'sc-quests', lesson: 'sc-lesson',
  duel: 'sc-duel', match: 'sc-match', dashboard: 'sc-dashboard',
  badges: 'sc-badges', leaderboard: 'sc-leaderboard', daily: 'sc-daily'
};

function nav(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(SCREEN_MAP[screenId] || screenId);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  updateAllHUD();
  if (screenId === 'dashboard')   renderDashboard();
  if (screenId === 'badges')      renderBadges();
  if (screenId === 'leaderboard') renderLeaderboard('global');
  if (screenId === 'daily')       renderDailyQuests();
  if (screenId === 'quests')      renderQuestMap();
  if (screenId === 'home')        updateHomeStats();
}

/* ─── Mobile Menu ─── */
function toggleMobileMenu() {
  const menus = document.querySelectorAll('.mobile-menu');
  const active = document.querySelector('.screen.active');
  if (!active) return;
  const menu = active.querySelector('.mobile-menu');
  if (menu) menu.classList.toggle('open');
}
function closeMobileMenu() {
  document.querySelectorAll('.mobile-menu').forEach(m => m.classList.remove('open'));
}
document.querySelectorAll('.nav-hamburger').forEach(btn => {
  btn.addEventListener('click', toggleMobileMenu);
});

/* ─── HUD Updates ─── */
function updateAllHUD() {
  // Nav pills across screens
  ['h','q','d','db','b','dq','l','m'].forEach(p => {
    const xpEl = document.getElementById(p+'-xp');
    const strEl = document.getElementById(p+'-str');
    const coiEl = document.getElementById(p+'-coi');
    if (xpEl) xpEl.textContent = fmtNum(S.xp);
    if (strEl) strEl.textContent = S.streak;
    if (coiEl) coiEl.textContent = fmtNum(S.coins);
  });
  // Floating HUD
  const hudWpm = document.getElementById('hud-wpm');
  const hudAcc = document.getElementById('hud-acc');
  const hudStr = document.getElementById('hud-str');
  const hudXp  = document.getElementById('hud-xp');
  if (hudWpm) hudWpm.textContent = S.bestWpm;
  if (hudAcc) hudAcc.textContent = (avgAcc() || 100) + '%';
  if (hudStr) hudStr.textContent = S.streak;
  if (hudXp)  hudXp.textContent  = fmtNum(S.xp);
}

function avgAcc() {
  if (!S.totalAcc.length) return 100;
  return Math.round(S.totalAcc.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,S.totalAcc.length));
}
function fmtNum(n) {
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}

/* ─── Mouse Glow ─── */
(function() {
  const glow = document.getElementById('mouse-glow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();

/* ─── Animated 3D Keyboard (Hero) ─── */
(function() {
  const container = document.getElementById('animated-keyboard');
  if (!container) return;

  const rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];

  const activeKeys = new Set();

  rows.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.forEach(key => {
      const keyEl = document.createElement('div');
      keyEl.className = 'kb-key';
      keyEl.textContent = key;
      keyEl.id = 'hk-' + key;
      rowEl.appendChild(keyEl);
    });
    container.appendChild(rowEl);
  });
  const spaceRow = document.createElement('div');
  spaceRow.className = 'kb-row';
  const space = document.createElement('div');
  space.className = 'kb-spacebar';
  space.textContent = 'SPACE';
  spaceRow.appendChild(space);
  container.appendChild(spaceRow);

  const allKeys = rows.flat();
  function flashKey() {
    const key = allKeys[Math.floor(Math.random() * allKeys.length)];
    const el = document.getElementById('hk-' + key);
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 280);
  }
  setInterval(flashKey, 380);
})();

/* ═══════════════════════════════════════════════
   HOME STATS
   ═══════════════════════════════════════════════ */
function updateHomeStats() {
  setText('hs-lessons', S.lessonsCompleted);
  setText('hs-wpm', S.bestWpm);
  setText('hs-acc', avgAcc() + '%');
  setText('hs-badges', S.unlockedBadges.size + '/30');
}

/* ═══════════════════════════════════════════════
   QUEST MAP
   ═══════════════════════════════════════════════ */
const QUESTS = [
  { id:'q1',  name:'Home Row Hero',      desc:'Master A S D F G H J K L ;',           icon:'🏠', xp:100, coins:10, keys:'ASDFGHJKL', difficulty:'Beginner', text:'asdf jkl; asdf jkl; fj fj fj fj fjdk fjdk fjdk aaaa ssss dddd ffff jjjj kkkk llll' },
  { id:'q2',  name:'Top Row Tyrant',     desc:'Conquer Q W E R T Y U I O P',           icon:'⚔️', xp:150, coins:15, keys:'QWERTYUIOP', difficulty:'Beginner', text:'quit were your type quit were your type power quite write query power' },
  { id:'q3',  name:'Bottom Row Boss',    desc:'Dominate Z X C V B N M',               icon:'🐉', xp:200, coins:20, keys:'ZXCVBNM', difficulty:'Easy', text:'zone next come back move nice zap xray cave ban vim box' },
  { id:'q4',  name:'Full Alphabet',      desc:'Type every letter from A to Z',         icon:'🔤', xp:250, coins:25, keys:'ALL', difficulty:'Easy', text:'the quick brown fox jumps over the lazy dog pack my box with five dozen liquor jugs' },
  { id:'q5',  name:'Speed Spike',        desc:'Maintain 40+ WPM for 30 seconds',       icon:'⚡', xp:350, coins:30, keys:'ALL', difficulty:'Medium', text:'fast typing needs practice every day focus on rhythm not speed the fingers learn the way through repetition' },
  { id:'q6',  name:'Accuracy Ace',       desc:'Complete with 98%+ accuracy',           icon:'🎯', xp:400, coins:40, keys:'ALL', difficulty:'Medium', text:'accuracy matters more than speed at first slow down and hit each key exactly right build the muscle memory' },
  { id:'q7',  name:'Number Ninja',       desc:'Master the number row 1-9-0',           icon:'🔢', xp:300, coins:30, keys:'NUMBERS', difficulty:'Medium', text:'123 456 789 10 25 30 47 58 96 100 2024 1337 42 77 888 999' },
  { id:'q8',  name:'Punctuation Pro',    desc:'Handle commas, periods and more',        icon:'!',  xp:350, coins:35, keys:'PUNCT', difficulty:'Hard', text:'hello, world. how are you? great! i am fine: thanks. well... let us go! ready? set, go!' },
  { id:'q9',  name:'Capital Commander',  desc:'Master Shift key for capitals',          icon:'⬆️', xp:300, coins:30, keys:'SHIFT', difficulty:'Hard', text:'The Quick Brown Fox Jumps Over The Lazy Dog Alice Bob Carol Dave Eve Frank Grace' },
  { id:'q10', name:'Code Warrior',       desc:'Type code snippets accurately',          icon:'💻', xp:500, coins:50, keys:'CODE', difficulty:'Hard', text:'const x = 42; let name = "user"; if (x > 0) { console.log(name); } return true;' },
  { id:'q11', name:'Essay Expert',       desc:'Type a 200+ character passage',          icon:'📝', xp:450, coins:45, keys:'ALL', difficulty:'Expert', text:'To be or not to be that is the question. Whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles.' },
  { id:'q12', name:'Speed Demon',        desc:'Hit 60+ WPM consistently',               icon:'🚀', xp:600, coins:60, keys:'ALL', difficulty:'Expert', text:'speed typing is a skill that improves with daily practice aim for accuracy first then speed will follow naturally' },
  { id:'q13', name:'Legend',             desc:'Complete all previous quests perfectly', icon:'👑', xp:1000, coins:100, keys:'ALL', difficulty:'Legend', text:'the journey of a thousand miles begins with a single step master the keyboard and the world becomes your instrument of creation' },
];

function renderQuestMap() {
  const container = document.getElementById('quest-map-container');
  if (!container) return;
  container.innerHTML = '';
  QUESTS.forEach((q, i) => {
    const done   = S.questProgress[q.id] === 'done';
    const locked = i > 0 && S.questProgress[QUESTS[i-1].id] !== 'done';
    const el = document.createElement('div');
    el.className = 'quest-node' + (locked ? ' locked' : '') + (done ? ' completed' : '');
    el.innerHTML = `
      <div class="qn-icon">${q.icon}</div>
      <div class="qn-info">
        <div class="qn-name">${q.name}</div>
        <div class="qn-desc">${q.desc}</div>
        <div class="qn-meta">
          <span class="qn-tag">${q.difficulty}</span>
          <span class="qn-tag">⚡ ${q.xp} XP</span>
          <span class="qn-tag">🪙 ${q.coins}</span>
        </div>
      </div>
      <div class="qn-badge">${done ? '✅' : locked ? '🔒' : '▶️'}</div>
    `;
    if (!locked) el.addEventListener('click', () => startLesson(q));
    container.appendChild(el);
  });
}

/* ═══════════════════════════════════════════════
   LESSON ENGINE
   ═══════════════════════════════════════════════ */
const KB_LAYOUT = {
  row0: ['Q','W','E','R','T','Y','U','I','O','P'],
  row1: ['A','S','D','F','G','H','J','K','L',';'],
  row2: ['Z','X','C','V','B','N','M']
};
const FINGER_MAP = {
  Q:'L-Pinky',W:'L-Ring',E:'L-Middle',R:'L-Index',T:'L-Index',
  Y:'R-Index',U:'R-Index',I:'R-Middle',O:'R-Ring',P:'R-Pinky',
  A:'L-Pinky',S:'L-Ring',D:'L-Middle',F:'L-Index',G:'L-Index',
  H:'R-Index',J:'R-Index',K:'R-Middle',L:'R-Ring',';':'R-Pinky',
  Z:'L-Pinky',X:'L-Ring',C:'L-Middle',V:'L-Index',B:'L-Index',
  N:'R-Index',M:'R-Middle',' ':'Thumbs'
};
const FINGER_EMOJI = {
  'L-Pinky':'🖐','L-Ring':'💍','L-Middle':'🖕','L-Index':'☝️',
  'R-Index':'☝️','R-Middle':'🖕','R-Ring':'💍','R-Pinky':'🤙','Thumbs':'👍'
};

let lessonState = {};

function startLesson(quest) {
  S.currentLesson = quest;
  nav('lesson');
  setText('l-title', quest.name);
  lessonState = {
    text: quest.text.trim(),
    pos: 0, errors: 0, started: false,
    startTime: null, timerInterval: null,
    practice: S.practice
  };
  renderLessonText();
  renderLessonKeyboard();
  document.getElementById('l-pf').style.width = '0%';
  document.getElementById('l-kp').style.width = '0%';
  document.getElementById('l-kpl').textContent = '0% Complete';
  document.getElementById('l-wpm').textContent = '0';
  document.getElementById('l-acc').textContent = '100';
  document.getElementById('l-time').textContent = '0';
  document.getElementById('l-earn').textContent = '0';
  document.getElementById('l-go').textContent = '▶ Start Quest';
  document.getElementById('l-ins').textContent = 'Get ready!';
  document.getElementById('l-sub').textContent = 'Click Start to begin';
  updateFingerGuide('');
  focusT();
}

function renderLessonText() {
  const el = document.getElementById('tdsp');
  if (!el) return;
  const { text, pos } = lessonState;
  let html = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (i < pos)       html += `<span class="td">${escHtml(ch)}</span>`;
    else if (i === pos) html += `<span class="tc tcursor">${escHtml(ch)}</span>`;
    else                html += `<span class="tc">${escHtml(ch)}</span>`;
  }
  el.innerHTML = html;
  // Scroll cursor into view
  const cursor = el.querySelector('.tcursor');
  if (cursor) cursor.scrollIntoView({ block:'nearest', behavior:'smooth' });
}

function renderLessonKeyboard() {
  const el = document.getElementById('lkb');
  if (!el) return;
  el.innerHTML = '';
  [KB_LAYOUT.row0, KB_LAYOUT.row1, KB_LAYOUT.row2].forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.forEach(k => {
      const keyEl = document.createElement('div');
      keyEl.className = 'kb-key';
      keyEl.id = 'lk-' + k;
      keyEl.textContent = k;
      rowEl.appendChild(keyEl);
    });
    el.appendChild(rowEl);
  });
  const spaceRow = document.createElement('div');
  spaceRow.className = 'kb-row';
  const sp = document.createElement('div');
  sp.className = 'kb-spacebar';
  sp.style.width = '200px';
  sp.style.height = '34px';
  sp.style.fontSize = '9px';
  sp.textContent = 'SPACE';
  sp.id = 'lk-SPACE';
  spaceRow.appendChild(sp);
  el.appendChild(spaceRow);
  highlightNextKey();
}

function highlightNextKey() {
  document.querySelectorAll('#lkb .kb-key.hl-target, #lkb .kb-key.hl-finger').forEach(k => {
    k.classList.remove('hl-target','hl-finger');
  });
  if (!lessonState.text) return;
  const nextChar = lessonState.text[lessonState.pos];
  if (!nextChar) return;
  const keyId = nextChar === ' ' ? 'lk-SPACE' : 'lk-' + nextChar.toUpperCase();
  const el = document.getElementById(keyId);
  if (el) el.classList.add('hl-target');
  updateFingerGuide(nextChar);
}

function updateFingerGuide(char) {
  const key = char === ' ' ? ' ' : char.toUpperCase();
  const finger = FINGER_MAP[key] || '';
  const emoji  = finger ? (FINGER_EMOJI[finger] || '👆') : '👆';
  setText('l-fg', emoji);
  setText('l-ins', finger ? `Use your ${finger} finger` : 'Type the highlighted key');
  setText('l-sub', char ? `Next key: "${char === ' ' ? 'SPACE' : char}"` : 'Quest complete!');
}

function focusT() {
  const inp = document.getElementById('hinput');
  if (inp) inp.focus();
}

function doStart() {
  if (lessonState.started) return;
  lessonState.started = true;
  lessonState.startTime = Date.now();
  document.getElementById('l-go').textContent = '⏳ Typing...';
  lessonState.timerInterval = setInterval(updateLessonTimer, 500);
  focusT();
}

function updateLessonTimer() {
  if (!lessonState.startTime) return;
  const secs = ((Date.now() - lessonState.startTime) / 1000).toFixed(0);
  setText('l-time', secs);
  const words = lessonState.text.slice(0, lessonState.pos).trim().split(/\s+/).length;
  const wpm = secs > 0 ? Math.round((words / secs) * 60) : 0;
  setText('l-wpm', wpm);
  const acc = lessonState.pos > 0 ? Math.max(0, Math.round((1 - lessonState.errors / lessonState.pos) * 100)) : 100;
  setText('l-acc', acc);
}

function doRestart() {
  if (lessonState.timerInterval) clearInterval(lessonState.timerInterval);
  startLesson(S.currentLesson);
}

function togglePractice() {
  S.practice = !S.practice;
  const bar = document.getElementById('practice-bar');
  if (bar) bar.style.display = S.practice ? 'block' : 'none';
}

// Keyboard input handler for lesson
document.addEventListener('keydown', function(e) {
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen || activeScreen.id !== 'sc-lesson') return;
  if (!lessonState.started) {
    if (e.key.length === 1 || e.key === 'Enter') {
      doStart();
      return;
    }
    return;
  }
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (lessonState.pos > 0) lessonState.pos--;
    renderLessonText();
    highlightNextKey();
    return;
  }
  if (e.key.length !== 1) return;
  e.preventDefault();

  const expected = lessonState.text[lessonState.pos];
  if (e.key === expected) {
    // Track key accuracy
    const k = e.key.toUpperCase();
    if (!S.keyAccuracy[k]) S.keyAccuracy[k] = { correct:0, wrong:0 };
    S.keyAccuracy[k].correct++;

    lessonState.pos++;
    const pct = Math.round((lessonState.pos / lessonState.text.length) * 100);
    document.getElementById('l-pf').style.width = pct + '%';
    document.getElementById('l-kp').style.width = pct + '%';
    document.getElementById('l-kpl').textContent = pct + '% Complete';

    if (lessonState.pos >= lessonState.text.length) {
      completeLesson();
      return;
    }
  } else {
    lessonState.errors++;
    const k = (expected || ' ').toUpperCase();
    if (!S.keyAccuracy[k]) S.keyAccuracy[k] = { correct:0, wrong:0 };
    S.keyAccuracy[k].wrong++;
    // Flash error on key
    const keyEl = document.getElementById('lk-' + (expected === ' ' ? 'SPACE' : expected.toUpperCase()));
    if (keyEl) {
      keyEl.style.background = 'rgba(239,68,68,0.5)';
      setTimeout(() => { keyEl.style.background = ''; }, 200);
    }
  }
  renderLessonText();
  highlightNextKey();
  updateLessonTimer();
});

function completeLesson() {
  if (lessonState.timerInterval) clearInterval(lessonState.timerInterval);
  const secs = ((Date.now() - lessonState.startTime) / 1000);
  const words = lessonState.text.trim().split(/\s+/).length;
  const wpm   = Math.round((words / secs) * 60);
  const acc   = Math.max(0, Math.round((1 - lessonState.errors / lessonState.text.length) * 100));
  const earnedXp    = lessonState.practice ? 0 : S.currentLesson.xp;
  const earnedCoins = lessonState.practice ? 0 : S.currentLesson.coins;

  if (!lessonState.practice) {
    S.xp    += earnedXp;
    S.coins += earnedCoins;
    S.questProgress[S.currentLesson.id] = 'done';
    S.lessonsCompleted++;
    S.totalAcc.push(acc);
    S.wpmHistory.push(wpm);
    if (wpm > S.bestWpm) S.bestWpm = wpm;
    S.activityLog.unshift({ name: S.currentLesson.name, wpm, acc, xp: earnedXp, date: new Date().toLocaleDateString() });
    checkBadges(wpm, acc);
    saveState();
  }

  // Show summary
  setText('ss-wpm',   wpm);
  setText('ss-acc',   acc + '%');
  setText('ss-chars', lessonState.pos);
  setText('ss-time',  Math.round(secs) + 's');

  // Render mistake analysis
  const mistakeEl = document.getElementById('mistake-items');
  if (mistakeEl) {
    if (lessonState.errors === 0) {
      mistakeEl.innerHTML = '<div class="mi">🎉 Perfect! No mistakes.</div>';
    } else {
      const weaks = Object.entries(S.keyAccuracy)
        .filter(([,v]) => v.wrong > 0)
        .sort((a,b) => b[1].wrong - a[1].wrong)
        .slice(0,5);
      mistakeEl.innerHTML = weaks.map(([k,v]) => `<div class="mi">${k}: ${v.wrong} error(s)</div>`).join('');
    }
  }

  document.getElementById('session-overlay').classList.add('visible');
  updateAllHUD();
}

function closeSummary(again) {
  document.getElementById('session-overlay').classList.remove('visible');
  if (again) startLesson(S.currentLesson);
  else nav('quests');
}

/* ═══════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════ */
const RANKS = [
  { name:'Newcomer',      icon:'🌱', min:0   },
  { name:'Apprentice',    icon:'📖', min:500 },
  { name:'Typist',        icon:'⌨️', min:1000 },
  { name:'Fast Fingers',  icon:'⚡', min:2000 },
  { name:'Speed Racer',   icon:'🏎️', min:3500 },
  { name:'Pro Typer',     icon:'💎', min:5000 },
  { name:'Legend',        icon:'👑', min:8000 },
  { name:'God Tier',      icon:'⚔️', min:12000}
];

function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (xp >= r.min) rank = r; }
  return rank;
}
function getNextRank(xp) {
  return RANKS.find(r => r.min > xp);
}

function renderDashboard() {
  setText('d-wpm', S.bestWpm);
  setText('d-acc', avgAcc() + '%');
  setText('d-str2', S.streak);
  const rank = getRank(S.xp);
  const nextRank = getNextRank(S.xp);
  setText('d-rnk', rank.icon);
  setText('d-rnk-s', rank.name);
  setText('d-rank-emblem', rank.icon);
  setText('d-rank-name', rank.name);
  setText('db-xp', fmtNum(S.xp));
  setText('db-str', S.streak);

  // Progress to next rank
  if (nextRank) {
    const pct = Math.round(((S.xp - rank.min) / (nextRank.min - rank.min)) * 100);
    document.getElementById('d-rank-pbf').style.width = pct + '%';
    setText('d-rank-pl', `${S.xp - rank.min} / ${nextRank.min - rank.min} XP to ${nextRank.name}`);
  } else {
    document.getElementById('d-rank-pbf').style.width = '100%';
    setText('d-rank-pl', 'MAX RANK ACHIEVED!');
  }

  // WPM chart
  const chart = document.getElementById('wpm-chart');
  if (chart) {
    const history = S.wpmHistory.slice(-12);
    const maxWpm  = Math.max(10, ...history);
    chart.innerHTML = history.length === 0
      ? '<div style="color:var(--mu);font-size:13px;padding:20px">No data yet — complete some quests!</div>'
      : history.map(v => `<div class="wb" data-v="${v}" style="height:${Math.round(v/maxWpm*90)}%;background:linear-gradient(180deg,var(--pu),var(--cy))"></div>`).join('');
  }

  // Accuracy rings
  const rings = document.getElementById('acc-rings');
  if (rings) {
    const sessions = S.totalAcc.slice(-5);
    rings.innerHTML = sessions.length === 0
      ? '<div style="color:var(--mu);font-size:13px">No sessions yet</div>'
      : sessions.map((a,i) => `<div class="ar"><div class="ar-num" style="color:${a>=95?'var(--gr)':a>=80?'var(--am)':'var(--rd)'}">${a}%</div><div class="ar-lbl">Run ${i+1}</div></div>`).join('');
  }

  // Weak keys
  const wkEl = document.getElementById('weak-keys');
  if (wkEl) {
    const entries = Object.entries(S.keyAccuracy)
      .filter(([,v]) => v.correct+v.wrong > 3)
      .map(([k,v]) => ({ k, rate: Math.round(v.correct/(v.correct+v.wrong)*100) }))
      .sort((a,b) => a.rate - b.rate)
      .slice(0,8);
    wkEl.innerHTML = entries.length === 0
      ? '<div style="color:var(--mu);font-size:13px">Type more to see weak keys</div>'
      : entries.map(e => `<div class="wk ${e.rate<70?'bad':e.rate<90?'med':'good'}">${e.k}<br><small>${e.rate}%</small></div>`).join('');
  }

  // Activity log
  const actEl = document.getElementById('act-list');
  if (actEl) {
    actEl.innerHTML = S.activityLog.length === 0
      ? '<div style="color:var(--mu);font-size:13px;padding:12px">No activity yet</div>'
      : S.activityLog.slice(0,8).map(a =>
          `<div class="act-item">
            <span class="act-name">${a.name}</span>
            <span class="act-stats">${a.wpm} WPM · ${a.acc}%</span>
            <span class="act-xp">+${a.xp} XP</span>
           </div>`
        ).join('');
  }
}

/* ═══════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════ */
const ALL_BADGES = [
  // Progress
  { id:'b_first',   cat:'Progress',    icon:'🌱', name:'First Step',      desc:'Complete first quest' },
  { id:'b_five',    cat:'Progress',    icon:'📚', name:'Bookworm',         desc:'Complete 5 quests' },
  { id:'b_all',     cat:'Progress',    icon:'🗺️', name:'Quest Master',     desc:'Complete all quests' },
  { id:'b_coins50', cat:'Progress',    icon:'🪙', name:'Treasure Hoarder', desc:'Earn 50 coins' },
  { id:'b_xp500',   cat:'Progress',    icon:'⭐', name:'XP Hunter',        desc:'Earn 500 XP' },
  // Skill
  { id:'b_wpm40',   cat:'Skill',       icon:'⚡', name:'Speed Surge',      desc:'Reach 40 WPM' },
  { id:'b_wpm60',   cat:'Skill',       icon:'🚀', name:'Speed Demon',      desc:'Reach 60 WPM' },
  { id:'b_wpm80',   cat:'Skill',       icon:'💨', name:'Lightning Typer',  desc:'Reach 80 WPM' },
  { id:'b_wpm100',  cat:'Skill',       icon:'⚔️', name:'Century Crusher',  desc:'Reach 100 WPM' },
  { id:'b_acc100',  cat:'Skill',       icon:'🎯', name:'Perfectionist',    desc:'100% accuracy on a quest' },
  { id:'b_acc98',   cat:'Skill',       icon:'🏹', name:'Sharpshooter',     desc:'98%+ accuracy' },
  // Multiplayer
  { id:'b_win1',    cat:'Multiplayer', icon:'🏆', name:'First Blood',      desc:'Win first duel' },
  { id:'b_win5',    cat:'Multiplayer', icon:'⚔️', name:'Duel Veteran',     desc:'Win 5 duels' },
  { id:'b_win10',   cat:'Multiplayer', icon:'👑', name:'Arena Champion',   desc:'Win 10 duels' },
  { id:'b_duel',    cat:'Multiplayer', icon:'🏟️', name:'Gladiator',        desc:'Enter the duel arena' },
  // Streak
  { id:'b_str3',    cat:'Streak',      icon:'🔥', name:'On Fire',          desc:'3-day streak' },
  { id:'b_str7',    cat:'Streak',      icon:'🌟', name:'Week Warrior',     desc:'7-day streak' },
  { id:'b_str14',   cat:'Streak',      icon:'💪', name:'Fortnight Fighter',desc:'14-day streak' },
  { id:'b_str30',   cat:'Streak',      icon:'🦁', name:'Month Legend',     desc:'30-day streak' },
  // Challenge
  { id:'b_night',   cat:'Challenge',   icon:'🌙', name:'Night Owl',        desc:'Type after midnight' },
  { id:'b_early',   cat:'Challenge',   icon:'🌅', name:'Early Bird',       desc:'Type before 6am' },
  { id:'b_binge',   cat:'Challenge',   icon:'🎮', name:'Binge Typer',      desc:'3+ sessions in one day' },
  { id:'b_noerr',   cat:'Challenge',   icon:'✨', name:'Ghost Fingers',    desc:'50 chars with no errors' },
  // Special
  { id:'b_legend',  cat:'Special',     icon:'🌈', name:'Legend',           desc:'Reach Legend rank' },
  { id:'b_godtier', cat:'Special',     icon:'🌌', name:'God Tier',         desc:'Reach God Tier rank' },
  { id:'b_allbadge',cat:'Special',     icon:'💎', name:'Badge Collector',  desc:'Unlock 20 badges' },
  { id:'b_code',    cat:'Special',     icon:'💻', name:'Code Warrior',     desc:'Complete Code quest' },
  { id:'b_blind',   cat:'Special',     icon:'🫣', name:'Blind Faith',      desc:'Win a Blind Duel' },
  { id:'b_speed6',  cat:'Special',     icon:'🏎️', name:'Speed Demon',      desc:'Win Speed Duel at 60+ WPM' },
];

function checkBadges(wpm, acc) {
  const prev = S.unlockedBadges.size;
  if (S.lessonsCompleted >= 1)  S.unlockedBadges.add('b_first');
  if (S.lessonsCompleted >= 5)  S.unlockedBadges.add('b_five');
  if (S.lessonsCompleted >= QUESTS.length) S.unlockedBadges.add('b_all');
  if (S.coins >= 50)            S.unlockedBadges.add('b_coins50');
  if (S.xp >= 500)              S.unlockedBadges.add('b_xp500');
  if (wpm >= 40)                S.unlockedBadges.add('b_wpm40');
  if (wpm >= 60)                S.unlockedBadges.add('b_wpm60');
  if (wpm >= 80)                S.unlockedBadges.add('b_wpm80');
  if (wpm >= 100)               S.unlockedBadges.add('b_wpm100');
  if (acc === 100)              S.unlockedBadges.add('b_acc100');
  if (acc >= 98)                S.unlockedBadges.add('b_acc98');
  if (S.duelWins >= 1)         S.unlockedBadges.add('b_win1');
  if (S.duelWins >= 5)         S.unlockedBadges.add('b_win5');
  if (S.duelWins >= 10)        S.unlockedBadges.add('b_win10');
  if (S.streak >= 3)           S.unlockedBadges.add('b_str3');
  if (S.streak >= 7)           S.unlockedBadges.add('b_str7');
  if (S.streak >= 14)          S.unlockedBadges.add('b_str14');
  if (S.streak >= 30)          S.unlockedBadges.add('b_str30');
  if (getRank(S.xp).name === 'Legend')   S.unlockedBadges.add('b_legend');
  if (getRank(S.xp).name === 'God Tier') S.unlockedBadges.add('b_godtier');
  if (S.unlockedBadges.size >= 20)       S.unlockedBadges.add('b_allbadge');
  const now = new Date(); const h = now.getHours();
  if (h >= 0 && h < 3)  S.unlockedBadges.add('b_night');
  if (h < 6)             S.unlockedBadges.add('b_early');
  if (S.questProgress['q10'] === 'done') S.unlockedBadges.add('b_code');
  return S.unlockedBadges.size > prev;
}

function renderBadges() {
  const container = document.getElementById('badge-container');
  if (!container) return;
  const cnt = S.unlockedBadges.size;
  document.getElementById('b-pf').style.width = (cnt/30*100) + '%';
  setText('b-cnt', cnt);
  setText('b-coi', fmtNum(S.coins));

  const cats = [...new Set(ALL_BADGES.map(b => b.cat))];
  container.innerHTML = cats.map(cat => {
    const badges = ALL_BADGES.filter(b => b.cat === cat);
    return `
      <div class="badge-cat">
        <div class="badge-cat-title">${cat.toUpperCase()}</div>
        <div class="badge-grid">
          ${badges.map(b => {
            const unlocked = S.unlockedBadges.has(b.id);
            return `<div class="badge-card ${unlocked?'unlocked':'locked'}" title="${b.desc}">
              <div class="badge-ico">${b.icon}</div>
              <div class="badge-name">${b.name}</div>
              <div class="badge-status ${unlocked?'bs-unlocked':'bs-locked'}">${unlocked?'✓ Unlocked':'🔒 Locked'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function pad(n) { return String(n).padStart(2,'0'); }
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'&nbsp;');
}

/* ─── URL param: auto-join room ─── */
(function handleUrlJoin() {
  const params = new URLSearchParams(location.search);
  const code = params.get('join');
  if (code) {
    nav('duel');
    const input = document.getElementById('join-code-input');
    if (input) input.value = code.toUpperCase();
    showJoinRoom();
  }
})();

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
loadState();
nav('home');
updateHomeStats();
