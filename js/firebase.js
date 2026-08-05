// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8uBpoCTOK6bI70OO2BCINuVaB_h3e_Pk",
  authDomain: "torneo-cumple.firebaseapp.com",
  databaseURL: "https://torneo-cumple-default-rtdb.firebaseio.com",
  projectId: "torneo-cumple",
  storageBucket: "torneo-cumple.firebasestorage.app",
  messagingSenderId: "55589143006",
  appId: "1:55589143006:web:d9156ce62c12980fa85d4f",
  measurementId: "G-Z1TBWV235W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ─── helpers ───────────────────────────────────
function dbSet(path, value)       { return db.ref(path).set(value); }
function dbUpdate(path, value)    { return db.ref(path).update(value); }
function dbPush(path, value)      { return db.ref(path).push(value); }
function dbOn(path, cb)           { db.ref(path).on('value', s => cb(s.val())); }
function dbOnce(path, cb)         { db.ref(path).once('value').then(s => cb(s.val())); }
function dbTransaction(path, fn)  { return db.ref(path).transaction(fn); }
function dbRemove(path)           { return db.ref(path).remove(); }

// genera un id de sesión único por navegador (persiste en localStorage)
function getMyId() {
  let id = localStorage.getItem('torneo_uid');
  if (!id) { id = 'p_' + Date.now() + '_' + Math.floor(Math.random() * 9999); localStorage.setItem('torneo_uid', id); }
  return id;
}
