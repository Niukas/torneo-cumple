// ─── constantes ────────────────────────────────
const AVATARS = ['🐶','🐱','🦊','🐸','🐼','🐨','🦁','🐯','🐧','🦉','🦋','🐲','👾','🤖','👻','🎃'];
const LABELS  = ['A','B','C','D'];

// ─── estado local ───────────────────────────────
const myId   = getMyId();
let myName   = '';
let myAvatar = AVATARS[0];
let myScore  = 0;
let hasAnsweredThisRound = false;
let timerInterval = null;
let currentPhase = 'lobby';
let currentQ = 0;
let questions = [];

// ─── render avatar picker ───────────────────────
const avatarGrid = document.getElementById('avatarGrid');
AVATARS.forEach((av, i) => {
  const div = document.createElement('div');
  div.className = 'av' + (i === 0 ? ' sel' : '');
  div.textContent = av;
  div.addEventListener('click', () => {
    myAvatar = av;
    avatarGrid.querySelectorAll('.av').forEach(d => d.classList.remove('sel'));
    div.classList.add('sel');
  });
  avatarGrid.appendChild(div);
});

// ─── unirse ─────────────────────────────────────
document.getElementById('joinBtn').addEventListener('click', async () => {
  myName = document.getElementById('inpName').value.trim();
  const errEl = document.getElementById('joinError');
  if (!myName) { errEl.textContent = 'Escribí tu nombre primero.'; return; }
  errEl.textContent = '';
  await dbSet(`party/players/${myId}`, { name: myName, avatar: myAvatar, score: 0 });
  showScreen('wait');
  document.getElementById('myNameBadge').textContent = `${myAvatar} ${myName}`;
});

// ─── listeners de Firebase ──────────────────────
dbOn('party/meta', meta => {
  if (!meta) return;
  currentPhase = meta.phase || 'lobby';
  currentQ     = meta.questionIndex || 0;

  document.getElementById('joinTitle') && (document.getElementById('joinTitle').textContent = meta.title || 'Copa de Cumple');

  if (currentPhase === 'question') {
    hasAnsweredThisRound = false;
    showScreen('play');
    showSub('question');
  }
  if (currentPhase === 'results') {
    showScreen('play');
    showSub('results');
  }
  if (currentPhase === 'podio') {
    showScreen('play');
    showSub('podio');
  }
});

dbOn('party/questions', q => {
  questions = q || [];
  if (currentPhase === 'question') renderQuestion();
});

dbOn(`party/players/${myId}`, p => {
  if (!p) return;
  myScore = p.score || 0;
  document.getElementById('myScoreTop').textContent = myScore + ' PTS';
  document.getElementById('myNameTop').textContent   = (p.avatar || '') + ' ' + (p.name || '');
});

dbOn('party/answers', answers => {
  if (currentPhase === 'results') renderResultsLb(answers);
  if (currentPhase === 'podio')   renderPodio();

  // si ya tengo mi respuesta en firebase, mostrar feedback
  if (answers && answers[myId] && answers[myId].correct !== undefined && hasAnsweredThisRound) {
    const myAns = answers[myId];
    showFeedback(myAns.correct, myAns.pts || 0);
  }
});

dbOn('party/players', players => {
  if (currentPhase === 'results') renderResultsLb(null, players);
  if (currentPhase === 'podio')   renderPodio(players);
});

// ─── renderizar pregunta ─────────────────────────
function renderQuestion() {
  const q = questions[currentQ];
  if (!q) return;
  clearInterval(timerInterval);

  document.getElementById('qLabelPlay').textContent = `PREGUNTA ${currentQ + 1} / ${questions.length}`;
  document.getElementById('questionTextPlay').textContent = q.text;

  const grid = document.getElementById('optionsPlay');
  grid.innerHTML = '';
  LABELS.forEach((l, i) => {
    const btn = document.createElement('button');
    btn.className = `opt-btn ${l}`;
    btn.innerHTML = `<span style="opacity:.6;">${l})</span> ${escHtml(q.options[i])}`;
    btn.addEventListener('click', () => submitAnswer(i, btn));
    grid.appendChild(btn);
  });

  // timer
  let left = 30;
  updateTimerUI(left);
  timerInterval = setInterval(() => {
    left--;
    updateTimerUI(left);
    if (left <= 0) {
      clearInterval(timerInterval);
      if (!hasAnsweredThisRound) showFeedback(false, 0, true);
    }
  }, 1000);
}

function updateTimerUI(left) {
  const el  = document.getElementById('timerPlay');
  const bar = document.getElementById('timerBarPlay');
  if (!el || !bar) return;
  el.textContent = left;
  bar.style.width = (left / 30 * 100) + '%';
  el.className  = 'timer-big' + (left <= 5 ? ' danger' : left <= 10 ? ' warning' : '');
  bar.className = 'bar-fill'  + (left <= 5 ? ' danger' : left <= 10 ? ' warning' : '');
}

// ─── responder ───────────────────────────────────
function submitAnswer(optionIndex, btn) {
  if (hasAnsweredThisRound) return;
  hasAnsweredThisRound = true;
  clearInterval(timerInterval);

  // deshabilitar todos los botones y marcar seleccionado
  document.querySelectorAll('.opt-btn').forEach(b => {
    b.disabled = true;
    b.style.opacity = '.5';
  });
  btn.classList.add('selected');
  btn.style.opacity = '1';

  // guardar en Firebase con timestamp
  dbSet(`party/answers/${myId}`, {
    option: optionIndex,
    ts: Date.now()
  });

  // mostrar "esperando resultado..."
  showSub('feedback');
  document.getElementById('feedbackEmoji').textContent = '⏳';
  document.getElementById('feedbackMsg').textContent   = 'Esperando resultado...';
  document.getElementById('feedbackPts').textContent   = '';
}

function showFeedback(correct, pts, timeout = false) {
  showSub('feedback');
  if (timeout) {
    document.getElementById('feedbackEmoji').textContent = '⌛';
    document.getElementById('feedbackMsg').textContent   = '¡Se acabó el tiempo!';
    document.getElementById('feedbackPts').textContent   = '+0 PTS';
    return;
  }
  document.getElementById('feedbackEmoji').textContent = correct ? '✅' : '❌';
  document.getElementById('feedbackMsg').textContent   = correct ? '¡Correcto!' : 'Eso no era...';
  document.getElementById('feedbackPts').textContent   = correct ? `+${pts} PTS` : '+0 PTS';
}

// ─── resultados de ronda ────────────────────────
function renderResultsLb(answers, players) {
  // si no tenemos ambos, esperar al siguiente evento
  if (!players) {
    dbOnce('party/players', p => renderResultsLb(answers, p));
    return;
  }
  if (!answers) {
    dbOnce('party/answers', a => renderResultsLb(a, players));
    return;
  }
  const sorted = Object.entries(players)
    .map(([uid, p]) => ({ uid, ...p, pts: answers[uid]?.pts || 0, correct: answers[uid]?.correct }))
    .sort((a,b) => (b.score||0) - (a.score||0));

  const el = document.getElementById('resultsLb');
  el.innerHTML = sorted.map((p,i) => {
    const cls  = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const mark = p.correct ? `<span style="color:var(--lime);">+${p.pts}</span>` : '';
    const me   = p.uid === myId ? ' ← vos' : '';
    return `<div class="lb-row ${cls}">
      <div class="lb-rank">${i+1}</div>
      <div class="lb-name">${p.avatar} ${escHtml(p.name)}${me} ${mark}</div>
      <div class="lb-score">${p.score}</div>
    </div>`;
  }).join('');

  const myPos = sorted.findIndex(p => p.uid === myId) + 1;
  const badge = document.getElementById('myRankBadge');
  if (badge) badge.textContent = `Tu posición: #${myPos}`;
}

// ─── podio ───────────────────────────────────────
function renderPodio(players) {
  if (!players) { dbOnce('party/players', p => renderPodio(p)); return; }
  const sorted = Object.entries(players)
    .map(([uid,p]) => ({ uid,...p }))
    .sort((a,b)=>(b.score||0)-(a.score||0));

  const podio   = document.getElementById('podioPlay');
  const top3    = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const classes = ['p2','p1','p3'];
  const medals  = ['🥈','🥇','🥉'];
  podio.innerHTML = top3.map((p,i) => `
    <div class="podio-col">
      <div class="podio-name">${p.avatar} ${escHtml(p.name)}</div>
      <div class="podio-block ${classes[i]}">${medals[i]}</div>
      <div class="podio-score">${p.score} PTS</div>
    </div>`).join('');

  const myPos = sorted.findIndex(p => p.uid === myId) + 1;
  const final = document.getElementById('myFinalRank');
  if (final) final.textContent = `Terminaste en el puesto #${myPos}`;
}

// ─── helpers de pantalla ────────────────────────
function showScreen(screen) {
  ['joinScreen','waitScreen','playScreen'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );
  document.getElementById(screen + 'Screen').classList.remove('hidden');
}

function showSub(sub) {
  ['question','feedback','results','podio'].forEach(s =>
    document.getElementById('sub' + cap(s)).classList.add('hidden')
  );
  document.getElementById('sub' + cap(sub)).classList.remove('hidden');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escHtml(s) {
  const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML;
}

// ─── si el jugador ya se había unido antes, saltar join screen ──
dbOnce(`party/players/${myId}`, p => {
  if (p) {
    myName   = p.name;
    myAvatar = p.avatar;
    myScore  = p.score || 0;
    showScreen('wait');
    document.getElementById('myNameBadge').textContent = `${myAvatar} ${myName}`;
  }
});
