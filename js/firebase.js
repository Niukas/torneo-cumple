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
