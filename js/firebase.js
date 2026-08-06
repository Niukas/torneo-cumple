const firebaseConfig = {
  apiKey: "AIzaSyB8uBpoCTOK6bI70OO2BCINuVaB_h3e_Pk",
  authDomain: "torneo-cumple.firebaseapp.com",
  databaseURL: "https://torneo-cumple-default-rtdb.firebaseio.com",
  projectId: "torneo-cumple",
  storageBucket: "torneo-cumple.firebasestorage.app",
  messagingSenderId: "55589143006",
  appId: "1:55589143006:web:d9156ce62c12980fa85d4f",
  measurementId: "G-Z1TBWV235W",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function dbSet(path, value) {
  return db.ref(path).set(value);
}
function dbUpdate(path, value) {
  return db.ref(path).update(value);
}
function dbOn(path, cb) {
  db.ref(path).on("value", (s) => cb(s.val()));
}
function dbOnce(path, cb) {
  db.ref(path)
    .once("value")
    .then((s) => cb(s.val()));
}
function dbRemove(path) {
  return db.ref(path).remove();
}
function dbTransaction(path, fn) {
  return db.ref(path).transaction(fn);
}

function getMyId() {
  let id = localStorage.getItem("torneo_uid");
  if (!id) {
    id = "p_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    localStorage.setItem("torneo_uid", id);
  }
  return id;
}

// ════════════════════════════════════════════════════════════
// AVATAR HELPERS (DiceBear notionists-neutral via HTTP-API)
//
// Formato guardado en Firebase: "dicebear:<seed>"  ->  <img>
// Cualquier otro string se interpreta como emoji viejo -> texto
// (backward-compat con los jugadores ya unidos antes de este cambio).
// ════════════════════════════════════════════════════════════
const DICEBEAR_BASE =
  "https://api.dicebear.com/10.x/notionists-neutral/svg";
// Fondo del panel crema — el body del theme es rayado/oscuro y sin fondo
// el avatar queda "flotando". Con este hex combina como tarjeta limpia.
// OJO: la API NO acepta "transparent" como valor (devuelve 400).
const DICEBEAR_BG = "f7f4ea";

// Devuelve true si el campo avatar es formato DiceBear.
function isDicebear(avatar) {
  return typeof avatar === "string" && avatar.indexOf("dicebear:") === 0;
}

// Extrae la seed del string guardado.
function dicebearSeed(avatar) {
  return avatar.slice("dicebear:".length);
}

// Devuelve la URL pública de la imagen DiceBear para una seed.
function avatarUrl(seed) {
  return (
    DICEBEAR_BASE +
    "?seed=" +
    encodeURIComponent(String(seed)) +
    "&backgroundColor=" +
    DICEBEAR_BG +
    "&radius=8"
  );
}

// Devuelve una seed random legible (para el botón "rascar").
// Mix de adj + sust para que sean memorables y no choquen entre jugadores.
const _SEED_ADJ = [
  "luffy", "zoro", "nami", "sanji", "robin", "chopper", "goku", "vegeta",
  "piccolo", "gohan", "freezer", "cell", "broly", "trunks", "shanks",
  "ace", "sabo", "law", "kid", "katakuri", "doflamingo", "kaido",
  "roger", "whitebeard", "krilin", "yamcha", "ten", "bulma", "chichi",
  "naruto", "sasuke", "sakura", "kakashi", "itachi", "deku", "todoroki",
  "bakugo", "levi", "eren", "mikasa", "tanjiro", "nezuko", "inosuke",
  "zenitsu", "chichi", "videl", "gamma", "omega", "delta", "sigma",
];
function randomSeed(exclude) {
  let s;
  do {
    const a = _SEED_ADJ[Math.floor(Math.random() * _SEED_ADJ.length)];
    const n = Math.floor(Math.random() * 9999);
    s = a + "-" + n;
  } while (exclude && exclude.indexOf(s) !== -1);
  return s;
}

// Renderiza el avatar como <img> si es DiceBear, o como span con el emoji.
// Devuelve un string HTML (para inyectar en template literals).
// sizePx: tamaño en pixels (default 28). cls: clase extra para el wrapper.
function renderAvatarHTML(avatar, sizePx, cls) {
  sizePx = sizePx == null ? 28 : sizePx;
  cls = cls ? " " + cls : "";
  if (isDicebear(avatar)) {
    const url = avatarUrl(dicebearSeed(avatar));
    return (
      '<img class="avatar-img' + cls + '" src="' + url +
      '" alt="avatar" width="' + sizePx + '" height="' + sizePx + '" loading="lazy">'
    );
  }
  // emoji viejo o sin avatar: mostrar como texto
  return (
    '<span class="avatar-emoji' + cls + '" style="font-size:' +
    Math.round(sizePx * 0.95) + 'px;line-height:1">' +
    (avatar || "❓") + "</span>"
  );
}
