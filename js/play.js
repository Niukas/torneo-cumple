// ─── constantes ────────────────────────────────
const LABELS = ["A", "B", "C", "D"];

// ─── estado global ──────────────────────────────
const myId = getMyId();
let state = {
  phase: "lobby",
  questionIndex: 0,
  questions: [],
  players: {},
  answers: {},
  hasAnswered: false,
};
let timerInterval = null;

// ─── avatar picker (DiceBear notionists-neutral) ──
// Estado del avatar:
//   overrideSeed = seed "fixed" si el usuario apretó "otra" (string o null)
// Modo:
//   - si overrideSeed existe → mostrar esa seed (o placeholder si está null)
//   - si el usuario escribe → se limpia overrideSeed y se usa seed = nombre
// Al unirse: prioriza overrideSeed, si no, deriva del nombre.
const avatarPreviewEl = document.getElementById("avatarPreview");
const inpName = document.getElementById("inpName");
let overrideSeed = null; // seed "frozen" por el botón "otra"

// Restaurar override guardado de sesión previa (la seed fija que eligió)
const saved = localStorage.getItem("torneo_avatar"); // "dicebear:<seed>"
if (isDicebear(saved)) overrideSeed = dicebearSeed(saved);

function renderAvatarPreview() {
  if (!avatarPreviewEl) return;
  const name = inpName.value.trim().toLowerCase().replace(/\s+/g, "-");
  const seed = overrideSeed || (name || null);

  if (!seed) {
    // sin nombre y sin override → placeholder "?" tipo arcade
    avatarPreviewEl.innerHTML =
      '<div class="avatar-placeholder">?</div>';
    return;
  }
  avatarPreviewEl.innerHTML =
    '<img id="avatarImg" src="' + avatarUrl(seed) + '" alt="avatar" width="120" height="120">';
  avatarPreviewEl.dataset.seed = seed;
}

// El input cambia → limpiar override y refrescar
inpName.addEventListener("input", () => {
  overrideSeed = null;
  localStorage.removeItem("torneo_avatar");
  renderAvatarPreview();
});

document.getElementById("scrambleAvatarsBtn")?.addEventListener("click", () => {
  // "otra": nueva seed random como override
  const exclude = [];
  if (overrideSeed) exclude.push(overrideSeed);
  overrideSeed = randomSeed(exclude);
  localStorage.setItem("torneo_avatar", "dicebear:" + overrideSeed);
  renderAvatarPreview();
});

renderAvatarPreview();

// ─── unirse ─────────────────────────────────────
document.getElementById("joinBtn").addEventListener("click", async () => {
  const name = inpName.value.trim();
  const errEl = document.getElementById("joinError");
  if (!name) {
    errEl.textContent = "Escribí tu nombre primero.";
    return;
  }
  errEl.textContent = "";
  // Resolver la seed final:
  //   - si el jugador apretó "otra" (overrideSeed), usarla
  //   - si no, derivar determinísticamente del nombre
  let seed;
  if (overrideSeed) {
    seed = overrideSeed;
  } else {
    seed = name.toLowerCase().replace(/\s+/g, "-");
  }
  const myAvatar = "dicebear:" + seed;
  localStorage.setItem("torneo_avatar", myAvatar);
  await dbSet(`party/players/${myId}`, { name, avatar: myAvatar, score: 0 });
  showScreen("wait");
  document.getElementById("myNameBadge").innerHTML =
    renderAvatarHTML(myAvatar, 22, "ic-badge") + " " + escHtml(name);
});

// ─── listeners Firebase (todos actualizan estado y re-renderizan) ──
dbOn("party/meta", (meta) => {
  if (!meta) return;
  const prevPhase = state.phase;
  const prevQ = state.questionIndex;
  state.phase = meta.phase || "lobby";
  state.questionIndex = meta.questionIndex || 0;

  // nueva pregunta → resetear respuesta
  if (
    state.phase === "question" &&
    (prevPhase !== "question" || prevQ !== state.questionIndex)
  ) {
    state.hasAnswered = false;
    clearInterval(timerInterval);
  }
  render();
  if (meta.phase === "closed") {
    dbRemove(`party/players/${myId}`);
    localStorage.removeItem("torneo_uid");
    showScreen("join");
    document.getElementById("joinError").textContent =
      "El host cerró la partida.";
  }
});

dbOn("party/questions", (q) => {
  state.questions = q || [];
  render();
});

dbOn("party/players", (p) => {
  state.players = p || {};
  // actualizar mi puntaje en el header
  const me = state.players[myId];
  if (me) {
    document.getElementById("myScoreTop").textContent =
      (me.score || 0) + " PTS";
    document.getElementById("myNameTop").innerHTML =
      renderAvatarHTML(me.avatar, 18, "ic-topbar") + " " + escHtml(me.name || "");
  }
  render();
});

dbOn("party/answers", (a) => {
  state.answers = a || {};
  render();
});

// ─── render principal ───────────────────────────
function render() {
  const { phase } = state;

  // si no estoy en play todavía, no renderizar pantallas de juego
  const playVisible = !document
    .getElementById("playScreen")
    .classList.contains("hidden");
  if (!playVisible && phase !== "lobby") {
    // el juego empezó y yo estaba en wait → pasar a play
    if (!document.getElementById("waitScreen").classList.contains("hidden")) {
      showScreen("play");
    }
  }

  if (phase === "question") {
    if (!document.getElementById("playScreen").classList.contains("hidden")) {
      showScreen("play");
    }
    if (!state.hasAnswered) {
      showSub("question");
      renderQuestion();
    }
    // si ya respondí y tengo resultado, mostrar feedback
    const myAns = state.answers[myId];
    if (state.hasAnswered && myAns && myAns.correct !== undefined) {
      showFeedback(myAns.correct, myAns.pts || 0);
    }
  }

  if (phase === "results") {
    showScreen("play");
    showSub("results");
    renderResultsLb();
  }

  if (phase === "podio") {
    showScreen("play");
    showSub("podio");
    renderPodio();
  }
}

// ─── pregunta ───────────────────────────────────
function renderQuestion() {
  const q = state.questions[state.questionIndex];
  if (!q) return;

  document.getElementById("qLabelPlay").textContent =
    `PREGUNTA ${state.questionIndex + 1} / ${state.questions.length}`;
  document.getElementById("questionTextPlay").textContent = q.text;
  const img = document.getElementById("questionImgPlay");
  if (q.image) {
    img.src = q.image;
    img.style.display = "block";
  } else {
    img.style.display = "none";
    img.src = "";
  }

  const grid = document.getElementById("optionsPlay");
  // solo re-renderizar botones si cambiaron (evitar parpadeo)
  if (grid.dataset.qIndex === String(state.questionIndex)) return;
  grid.dataset.qIndex = state.questionIndex;
  grid.innerHTML = "";
  LABELS.forEach((l, i) => {
    const btn = document.createElement("button");
    btn.className = `opt-btn ${l}`;
    btn.innerHTML = `<span style="opacity:.6;">${l})</span> ${escHtml(q.options[i])}`;
    btn.addEventListener("click", () => submitAnswer(i, btn));
    grid.appendChild(btn);
  });

  // arrancar timer solo si no está corriendo para esta pregunta
  if (grid.dataset.timerQ === String(state.questionIndex)) return;
  grid.dataset.timerQ = state.questionIndex;
  clearInterval(timerInterval);
  let left = 30;
  updateTimerUI(left);
  timerInterval = setInterval(() => {
    left--;
    updateTimerUI(left);
    if (left <= 0) {
      clearInterval(timerInterval);
      if (!state.hasAnswered) showFeedback(false, 0, true);
    }
  }, 1000);
}

function updateTimerUI(left) {
  const el = document.getElementById("timerPlay");
  const bar = document.getElementById("timerBarPlay");
  if (!el || !bar) return;
  el.textContent = left;
  bar.style.width = (left / 30) * 100 + "%";
  el.className =
    "timer-big" + (left <= 5 ? " danger" : left <= 10 ? " warning" : "");
  bar.className =
    "bar-fill" + (left <= 5 ? " danger" : left <= 10 ? " warning" : "");
}

// ─── responder ───────────────────────────────────
function submitAnswer(optionIndex, btn) {
  if (state.hasAnswered) return;
  state.hasAnswered = true;
  clearInterval(timerInterval);

  document.querySelectorAll(".opt-btn").forEach((b) => {
    b.disabled = true;
    b.style.opacity = ".5";
  });
  btn.style.opacity = "1";
  btn.classList.add("selected");

  dbSet(`party/answers/${myId}`, { option: optionIndex, ts: Date.now() });

  // mostrar "esperando..." hasta que el host cierre la ronda
  showSub("feedback");
  document.getElementById("feedbackEmoji").textContent = "⏳";
  document.getElementById("feedbackMsg").textContent = "Esperando resultado...";
  document.getElementById("feedbackPts").textContent = "";
}

function showFeedback(correct, pts, timeout = false) {
  showSub("feedback");
  if (timeout) {
    document.getElementById("feedbackEmoji").innerHTML = icons.get("hourglass", 56, "ic-feedback ic-timeout");
    document.getElementById("feedbackMsg").textContent = "¡Se acabó el tiempo!";
    document.getElementById("feedbackPts").textContent = "+0 PTS";
    return;
  }
  document.getElementById("feedbackEmoji").innerHTML = correct
    ? icons.get("check", 56, "ic-feedback ic-correct")
    : icons.get("cross", 56, "ic-feedback ic-wrong");
  document.getElementById("feedbackMsg").textContent = correct
    ? "¡Correcto!"
    : "Eso no era...";
  document.getElementById("feedbackPts").textContent = correct
    ? `+${pts} PTS`
    : "+0 PTS";
}

// ─── resultados ──────────────────────────────────
function renderResultsLb() {
  const { players, answers } = state;
  if (!Object.keys(players).length) return;

  const sorted = Object.entries(players)
    .map(([uid, p]) => ({
      uid,
      ...p,
      pts: answers[uid]?.pts ?? 0,
      correct: answers[uid]?.correct ?? false,
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  document.getElementById("resultsLb").innerHTML = sorted
    .map((p, i) => {
      const cls =
        i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      const mark = p.correct
        ? `<span style="color:var(--lime);">+${p.pts}</span>`
        : icons.get("cross", 14, "ic-wrong-inline");
      const me =
        p.uid === myId ? ' <span style="color:var(--cyan);">← vos</span>' : "";
      return `<div class="lb-row ${cls}">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${renderAvatarHTML(p.avatar, 18)} ${escHtml(p.name)}${me} ${mark}</div>
      <div class="lb-score">${p.score || 0}</div>
    </div>`;
    })
    .join("");

  const myPos = sorted.findIndex((p) => p.uid === myId) + 1;
  const badge = document.getElementById("myRankBadge");
  if (badge) badge.textContent = myPos > 0 ? `Tu posición: #${myPos}` : "";
}

// ─── podio ───────────────────────────────────────
function renderPodio() {
  const sorted = Object.entries(state.players)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const top3 = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const classes = ["p2", "p1", "p3"];
  const medals = ["🥈", "🥇", "🥉"];

  document.getElementById("podioPlay").innerHTML = top3
    .map(
      (p, i) => `
    <div class="podio-col">
      <div class="podio-name">${renderAvatarHTML(p.avatar, 22)} ${escHtml(p.name)}</div>
      <div class="podio-block ${classes[i]}">${medals[i]}</div>
      <div class="podio-score">${p.score || 0} PTS</div>
    </div>`,
    )
    .join("");

  const myPos = sorted.findIndex((p) => p.uid === myId) + 1;
  const final = document.getElementById("myFinalRank");
  if (final)
    final.textContent = myPos > 0 ? `Terminaste en el puesto #${myPos}` : "";
}

// ─── helpers ────────────────────────────────────
function showScreen(screen) {
  ["joinScreen", "waitScreen", "playScreen"].forEach((id) =>
    document.getElementById(id).classList.add("hidden"),
  );
  document.getElementById(screen + "Screen").classList.remove("hidden");
}

function showSub(sub) {
  ["question", "feedback", "results", "podio"].forEach((s) =>
    document.getElementById("sub" + cap(s)).classList.add("hidden"),
  );
  document.getElementById("sub" + cap(sub)).classList.remove("hidden");
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ─── si ya me había unido antes, saltar join ────
dbOnce(`party/players/${myId}`, (p) => {
  if (p) {
    showScreen("wait");
    document.getElementById("myNameBadge").innerHTML =
      renderAvatarHTML(p.avatar, 22, "ic-badge") + " " + escHtml(p.name || "");
  }
});

function leaveGame() {
  dbRemove(`party/players/${myId}`);
  dbRemove(`party/answers/${myId}`);
  localStorage.removeItem("torneo_uid");
  showScreen("join");
}

document.getElementById("leaveWaitBtn")?.addEventListener("click", leaveGame);
document.getElementById("leaveGameBtn")?.addEventListener("click", () => {
  if (confirm("¿Salir de la partida?")) leaveGame();
});
