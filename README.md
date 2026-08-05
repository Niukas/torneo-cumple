# 🕹️ Torneo Cumple

## Setup (10 minutos)

### 1. Firebase
1. Andá a https://console.firebase.google.com
2. **Crear proyecto** → poné cualquier nombre
3. Panel izquierdo → **Realtime Database** → Crear base de datos → **Modo test**
4. Panel izquierdo → Configuración (⚙️) → **Configuración del proyecto** → pestaña **General** → bajá hasta "Tu app" → **Agregar app** → Web (`</>`)
5. Copiá el objeto `firebaseConfig` y pegalo en `js/firebase.js`

### 2. Hostear los archivos
**Opción A — GitHub Pages (gratis, recomendado):**
1. Crear repo en github.com → subir todos los archivos
2. Settings → Pages → Branch: main → Save
3. Tu URL: `https://TU_USUARIO.github.io/torneo-cumple/`

**Opción B — VS Code + Live Server (para probar local):**
1. Instalar extensión "Live Server"
2. Click derecho en `host.html` → Open with Live Server

### 3. El día del evento
- **Vos** abrís `host.html` en la TV/notebook
- **Todos** abren `play.html` (mandalo por WhatsApp)

---

## Agregar preguntas

Formato en el editor del host:
```
Pregunta | Opción A | Opción B | Opción C | Opción D | Letra correcta
```

Ejemplo:
```
¿Quién siempre llega tarde? | Martín | Lucas | Juli | Fer | A
¿Cuál es la comida favorita? | Pizza | Sushi | Asado | Pasta | C
```

---

## Estructura de archivos
```
torneo/
├── host.html       ← TV/notebook (solo vos)
├── play.html       ← celulares (todos)
├── css/
│   └── style.css
├── js/
│   ├── firebase.js   ← ⚠️ ESTE hay que editar con tu config
│   ├── host.js
│   └── play.js
└── README.md
```

---

## Flujo del juego
```
Jugadores entran a play.html → escriben nombre y eligen avatar
           ↓
Host ve todos conectados en lobby → aprieta EMPEZAR
           ↓
Countdown 3..2..1
           ↓
Pregunta en pantalla + 4 opciones en los celulares (30 segundos)
           ↓
Todos responden → puntos automáticos (más rápido = más puntos)
           ↓
Pantalla de resultados con ranking parcial
           ↓
Host aprieta SIGUIENTE → loop hasta la última pregunta
           ↓
🏆 Podio final
```

---

## Próximos pasos (cuando quieras escalar)
- [ ] Sonidos con Web Audio API
- [ ] Ronda final doble o nada
- [ ] Tipos de pregunta: imagen, verdadero/falso
- [ ] QR code para unirse
- [ ] Animaciones de entrada al podio
