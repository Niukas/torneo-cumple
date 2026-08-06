const pwd = prompt("Contraseña del host:");
if (pwd !== "cumple2026") {
  document.body.innerHTML = "";
  location.href = "play.html";
}

// ─── constantes ────────────────────────────────
const QUESTION_TIME = 30; // segundos por pregunta
const MAX_POINTS = 1000;
const LABELS = ["A", "B", "C", "D"];
const OPT_COLORS = { A: "#E8212A", B: "#1565C0", C: "#F9A825", D: "#2E7D32" };

// ─── estado local ───────────────────────────────
let questions = []; // [{ text, options:[str,str,str,str], correct:0..3 }]
let players = {}; // uid → { name, avatar, score }
let gamePhase = "lobby";
let currentQ = 0;
let timerInterval = null;
let timerLeft = QUESTION_TIME;
let answersThisRound = {}; // uid → { option, ts, pts }

// ─── init ───────────────────────────────────────
dbOn("party/meta", (meta) => onMeta(meta));
dbOn("party/players", (p) => onPlayers(p));
dbOn("party/questions", (q) => onQuestions(q));
dbOn("party/answers", (a) => onAnswers(a));

// ─── listeners de Firebase ──────────────────────
function onMeta(meta) {
  if (!meta) return;
  gamePhase = meta.phase || "lobby";
  currentQ = meta.questionIndex || 0;
  document.getElementById("lobbyTitle").textContent =
    meta.title || "Copa de Cumple";
  document.getElementById("joinTitle") &&
    (document.getElementById("joinTitle").textContent =
      meta.title || "Copa de Cumple");
  renderPhase(meta);
}

function onPlayers(p) {
  players = p || {};
  renderPlayers();
  updateStartBtn();
}

function onQuestions(q) {
  questions = q || [];
  document.getElementById("questionCount").textContent =
    `${questions.length} preguntas cargadas`;
  // pre-cargar en el editor
  const editor = document.getElementById("questionsEditor");
  if (editor && questions.length) {
    editor.value = questions
      .map((q) => `${q.text} | ${q.options.join(" | ")} | ${LABELS[q.correct]}`)
      .join("\n");
  }
  updateStartBtn();
}

function onAnswers(a) {
  answersThisRound = a || {};
  const count = Object.keys(answersThisRound).length;
  const total = Object.keys(players).length;
  const el = document.getElementById("answerCount");
  if (el) el.textContent = `${count} / ${total} respondieron`;

  // si todos respondieron, cerrar ronda automáticamente
  if (total > 0 && count >= total && gamePhase === "question") {
    clearInterval(timerInterval);
    setTimeout(() => closeQuestion(), 800);
  }
}

// ─── renderizar fases ───────────────────────────
function renderPhase(meta) {
  ["Lobby", "Question", "Results", "Podio"].forEach((p) =>
    document.getElementById("phase" + p).classList.add("hidden"),
  );
  if (gamePhase === "lobby") {
    document.getElementById("phaseLobby").classList.remove("hidden");
  }
  if (gamePhase === "question") {
    document.getElementById("phaseQuestion").classList.remove("hidden");
    renderQuestion();
  }
  if (gamePhase === "results") {
    document.getElementById("phaseResults").classList.remove("hidden");
    renderResults();
  }
  if (gamePhase === "podio") {
    document.getElementById("phasePodio").classList.remove("hidden");
    renderPodio();
  }
}

function renderPlayers() {
  const el = document.getElementById("playerChips");
  const list = Object.values(players);
  el.innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<div class="player-chip">${p.avatar} ${escHtml(p.name)}</div>`,
        )
        .join("")
    : '<span style="color:var(--dim);font-size:17px;">Esperando jugadores...</span>';
  const cntEl = document.getElementById("playerCount");
  if (cntEl)
    cntEl.textContent = `${list.length} jugador${list.length === 1 ? "" : "es"}`;
}

function renderQuestion() {
  const q = questions[currentQ];
  if (!q) return;
  const total = questions.length;
  document.getElementById("qLabel").textContent =
    `PREGUNTA ${currentQ + 1} / ${total}`;
  document.getElementById("questionText").textContent = q.text;
  const img = document.getElementById("questionImg");
  if (q.image) {
    img.src = q.image;
    img.style.display = "block";
  } else {
    img.style.display = "none";
    img.src = "";
  }
  // opciones (solo display, host no interactúa)
  const grid = document.getElementById("hostOptions");
  grid.innerHTML = LABELS.map(
    (l, i) => `
    <div class="opt-btn ${l}" style="cursor:default;">
      <span style="opacity:.6;">${l})</span> ${escHtml(q.options[i])}
    </div>`,
  ).join("");
  startTimer();
}

function renderResults() {
  const q = questions[currentQ];
  if (!q) return;
  document.getElementById("resultQuestion").textContent = q.text;
  document.getElementById("resultAnswer").textContent =
    `✅ ${LABELS[q.correct]}) ${escHtml(q.options[q.correct])}`;
  renderPartialLb("partialLb");
}

function renderPodio() {
  renderFullLb("finalLb");
  const sorted = sortedPlayers();
  const podio = document.getElementById("podioDisplay");
  const top3 = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const classes = ["p2", "p1", "p3"];
  const medals = ["🥈", "🥇", "🥉"];
  podio.innerHTML = top3
    .map(
      (p, i) => `
    <div class="podio-col">
      <div class="podio-name">${p.avatar} ${escHtml(p.name)}</div>
      <div class="podio-block ${classes[i]}">${medals[i]}</div>
      <div class="podio-score">${p.score} PTS</div>
    </div>`,
    )
    .join("");
}

function renderPartialLb(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const sorted = sortedPlayers();
  el.innerHTML = sorted
    .map((p, i) => {
      const cls =
        i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      const pts = answersThisRound[p.uid]?.pts ?? 0;
      const mark =
        pts > 0 ? `<span style="color:var(--lime);">+${pts}</span>` : "";
      return `<div class="lb-row ${cls}">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${p.avatar} ${escHtml(p.name)} ${mark}</div>
      <div class="lb-score">${p.score}</div>
    </div>`;
    })
    .join("");
}

function renderFullLb(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const sorted = sortedPlayers();
  el.innerHTML = sorted
    .map((p, i) => {
      const cls =
        i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      return `<div class="lb-row ${cls}">
      <div class="lb-rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
      <div class="lb-name">${p.avatar} ${escHtml(p.name)}</div>
      <div class="lb-score">${p.score}</div>
    </div>`;
    })
    .join("");
}

// ─── timer ──────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerLeft = QUESTION_TIME;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timerLeft--;
    updateTimerUI();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      closeQuestion();
    }
  }, 1000);
}

function updateTimerUI() {
  const el = document.getElementById("timerDisplay");
  const bar = document.getElementById("timerBar");
  if (!el || !bar) return;
  el.textContent = timerLeft;
  const pct = (timerLeft / QUESTION_TIME) * 100;
  bar.style.width = pct + "%";
  el.className =
    "timer-big" +
    (timerLeft <= 5 ? " danger" : timerLeft <= 10 ? " warning" : "");
  bar.className =
    "bar-fill" +
    (timerLeft <= 5 ? " danger" : timerLeft <= 10 ? " warning" : "");
}

// ─── lógica del juego ───────────────────────────
function closeQuestion() {
  clearInterval(timerInterval);
  // calcular puntos para cada respuesta
  const q = questions[currentQ];
  const updates = {};
  Object.entries(answersThisRound).forEach(([uid, ans]) => {
    if (ans.option === q.correct) {
      // pts en función de velocidad: entre 500 y MAX_POINTS según qué tan rápido respondió
      const elapsed = Math.min(
        QUESTION_TIME * 1000,
        ans.ts - (ans.questionStartTs || ans.ts),
      );
      const timePct = 1 - elapsed / (QUESTION_TIME * 1000);
      const pts = Math.round(500 + 500 * Math.max(0, timePct));
      updates[`party/players/${uid}/score`] = (players[uid]?.score || 0) + pts;
      updates[`party/answers/${uid}/pts`] = pts;
      updates[`party/answers/${uid}/correct`] = true;
    } else {
      updates[`party/answers/${uid}/pts`] = 0;
      updates[`party/answers/${uid}/correct`] = false;
    }
  });
  // jugadores que no respondieron
  Object.keys(players).forEach((uid) => {
    if (!answersThisRound[uid]) {
      updates[`party/answers/${uid}/pts`] = 0;
      updates[`party/answers/${uid}/correct`] = false;
      updates[`party/answers/${uid}/option`] = null;
    }
  });
  dbUpdate("/", updates).then(() => {
    dbSet("party/meta/phase", "results");
  });
}

async function nextQuestion() {
  const next = currentQ + 1;
  await dbRemove("party/answers");
  if (next >= questions.length) {
    dbSet("party/meta/phase", "podio");
  } else {
    await dbUpdate("party/meta", {
      phase: "question",
      questionIndex: next,
      questionStartTs: Date.now(),
    });
  }
}

function sortedPlayers() {
  return Object.entries(players)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

// ─── countdown ──────────────────────────────────
function showCountdown(n, cb) {
  const ov = document.getElementById("countdownOverlay");
  ov.classList.remove("hidden");
  ov.textContent = n;
  if (n <= 0) {
    ov.classList.add("hidden");
    cb();
    return;
  }
  setTimeout(() => showCountdown(n - 1, cb), 900);
}

// ─── eventos de botones ─────────────────────────
document.getElementById("startGameBtn").addEventListener("click", async () => {
  if (!questions.length) return;
  await dbUpdate("party/meta", {
    phase: "question",
    questionIndex: 0,
    questionStartTs: Date.now(),
  });
  await dbRemove("party/answers");
  showCountdown(3, () => {});
});

document.getElementById("skipQuestionBtn").addEventListener("click", () => {
  clearInterval(timerInterval);
  closeQuestion();
});

document
  .getElementById("nextQuestionBtn")
  .addEventListener("click", nextQuestion);

document.getElementById("restartBtn").addEventListener("click", async () => {
  // resetear scores
  const updates = {};
  Object.keys(players).forEach((uid) => {
    updates[`party/players/${uid}/score`] = 0;
  });
  await dbUpdate("/", updates);
  await dbRemove("party/answers");
  await dbUpdate("party/meta", { phase: "lobby", questionIndex: 0 });
});

document.getElementById("saveQuestionsBtn").addEventListener("click", () => {
  const raw = document.getElementById("questionsEditor").value.trim();
  const parsed = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      if (parts.length < 6) return null;
      const correct = LABELS.indexOf(parts[5].toUpperCase());
      if (correct === -1) return null;
      return {
        text: parts[0],
        options: [parts[1], parts[2], parts[3], parts[4]],
        correct,
        image: parts[6] || null,
      };
    })
    .filter(Boolean);
  if (!parsed.length) {
    alert("No se encontraron preguntas válidas. Revisá el formato.");
    return;
  }
  dbSet("party/questions", parsed);
});

function updateStartBtn() {
  const btn = document.getElementById("startGameBtn");
  if (!btn) return;
  const ok = questions.length > 0 && Object.keys(players).length > 0;
  btn.disabled = !ok;
}

// ─── helpers ────────────────────────────────────
function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ─── set meta inicial si no existe ──────────────
dbOnce("party/meta", (meta) => {
  if (!meta)
    dbSet("party/meta", {
      title: "Copa de Cumple",
      phase: "lobby",
      questionIndex: 0,
    });
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  if (!confirm("¿Cerrar la lobby? Se desconectan todos los jugadores.")) return;
  await dbSet("party/meta/phase", "closed");
  setTimeout(async () => {
    await dbRemove("party");
    location.reload();
  }, 1500); // espera que los celu reaccionen antes de borrar todo
});

document.getElementById("forceEndBtn")?.addEventListener("click", async () => {
  await dbSet("party/meta/phase", "lobby");
  await dbRemove("party/answers");
  // resetear scores
  const updates = {};
  Object.keys(players).forEach(
    (uid) => (updates[`party/players/${uid}/score`] = 0),
  );
  await dbUpdate("/", updates);
});
