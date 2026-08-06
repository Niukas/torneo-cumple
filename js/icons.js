// ════════════════════════════════════════════════════════════
// ICONS — SVG inline custom (pixel-arc, stroke=currentColor)
// Set temático: One Piece + Dragon Ball + retro console
//
// Cómo se usa:
//   • Cargar este script en <head> o antes que host.js/play.js
//   • Llama icons.inject()  -> inyecta un <svg> sprite escondido
//     al inicio del <body> con todos los símbolos.
//   • Luego usa icons.get("dragon", 22, "ic-title") donde quieras
//     un ícono. Devuelve un string HTML tipo
//     <svg class="ic ic-title"><use href="#i-dragon"/></svg>
//
// Los símbolos heredan currentColor → se pintan desde CSS.
// ════════════════════════════════════════════════════════════
(function (global) {
  "use strict";

  // Definición de símbolos. viewBox 24x24 salvo donde hace falta otro.
  // Stroke/fill usa currentColor para pintarse desde CSS.
  const SYMBOLS = {
    /* DRAGON BALL */
    dragon:
      '<path d="M3 14c0-3 2-6 6-6 1 0 2 0 3 1l2-2c1-1 3-1 3 1 0 1-1 2-2 2l-2 2c1 2 0 4-2 5-3 1-6 0-7-3z" fill="currentColor"/>' +
      '<circle cx="8" cy="11" r="1" fill="#0A0A16"/>' +
      '<path d="M16 6l2-2 2 1-1 2-3 1z" fill="currentColor"/>' +
      '<path d="M20 12l2-1v2h-2z" fill="currentColor"/>',
    kiBlast:
      '<path d="M5 12h2l2-2 3 6 2-7 3 3h2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="6" cy="12" r="1.6" fill="currentColor"/>',
    kiOrb:
      '<circle cx="12" cy="12" r="7" fill="currentColor"/>' +
      '<path d="M12 6v4M12 14v4M9 12h2M13 12h2" stroke="#0A0A16" stroke-width="1.4" stroke-linecap="round"/>',
    lightning:
      '<path d="M13 3L6 13h4l-1 8 7-11h-4z" fill="currentColor"/>',
    starBurst:
      '<path d="M12 3l1.6 5.5L19 10l-5 2.2L12 18l-2-5.8L5 10l5-1.5z" fill="currentColor"/>',

    /* ONE PIECE */
    jolly:
      '<path d="M4 11h13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M4 13c-1 0-1 2 0 2h11c-1 2-3 3-4 3l1 3M8 13c1 2 2 3 4 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="6" cy="7.5" r="2" fill="currentColor"/>' +
      '<circle cx="9" cy="7.5" r="2" fill="currentColor"/>' +
      '<path d="M8 9v1M5 9.5h1M10 9.5h1" stroke="#0A0A16" stroke-width=".8"/>',
    anchor:
      '<circle cx="12" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M12 9v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M6 14a6 6 0 0 0 12 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M5 9h4M15 9h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    sword:
      '<path d="M14 3l1 9-4 7-3-3z" fill="currentColor"/>' +
      '<path d="M7 16l-3 3 2 2 3-3z" fill="currentColor"/>' +
      '<path d="M11 11l3 3" stroke="#0A0A16" stroke-width="1.2"/>',
    flag:
      '<path d="M5 3v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M5 4h13l-3 3 3 4H5z" fill="currentColor"/>',

    /* CONSOLE / GENERAL */
    coin:
      '<rect x="4" y="5" width="16" height="14" fill="currentColor"/>' +
      '<rect x="6" y="7" width="12" height="10" fill="#0A0A16"/>' +
      '<path d="M12 8v8M9 10v4M15 10v4" stroke="currentColor" stroke-width="1.6"/>',
    infinite:
      '<path d="M6 12a3 3 0 1 1 0 6 3 3 0 0 1 0-6c3 0 4 6 6 6a3 3 0 1 1 0-6c-3 0-4 6-6 6z" fill="none" stroke="currentColor" stroke-width="2"/>',
    save:
      '<path d="M4 4h12l4 4v12H4z" fill="currentColor"/>' +
      '<rect x="7" y="14" width="10" height="6" fill="#0A0A16"/>' +
      '<rect x="8" y="5" width="8" height="6" fill="#0A0A16"/>' +
      '<rect x="14" y="6" width="3" height="4" fill="currentColor"/>',
    list:
      '<path d="M5 6h2v2H5zM5 10h2v2H5zM5 14h2v2H5z" fill="currentColor"/>' +
      '<path d="M9 6h10v2H9zM9 10h10v2H9zM9 14h10v2H9z" fill="currentColor"/>',
    scroll:
      '<rect x="6" y="5" width="13" height="15" fill="currentColor"/>' +
      '<rect x="8" y="7" width="9" height="11" fill="#0A0A16"/>' +
      '<path d="M9 9h6M9 12h6M9 15h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M3 7l3-1v12l3-1z" fill="currentColor"/>' +
      '<path d="M22 7l-3-1v12l3-1z" fill="currentColor"/>',
    skull:
      '<path d="M5 11a7 7 0 1 1 14 0v6h-3v2h-8v-2H5z" fill="currentColor"/>' +
      '<circle cx="9" cy="11" r="2" fill="#0A0A16"/>' +
      '<circle cx="15" cy="11" r="2" fill="#0A0A16"/>' +
      '<path d="M11 16h2v2h-2z" fill="#0A0A16"/>',
    trophy:
      '<path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/>' +
      '<path d="M5 5h2v3a3 3 0 0 1-3-3zM19 5h-2v3a3 3 0 0 0 3-3z" fill="currentColor"/>' +
      '<path d="M12 11v4M9 18h6M11 15h2v3h-2z" fill="currentColor"/>',
    crown:
      '<path d="M3 8l4 3 5-5 5 5 4-3-2 9H5z" fill="currentColor"/>',
    swordCross:
      '<path d="M9 3l1 8-5 9-2-2 5-9z" fill="currentColor"/>' +
      '<path d="M15 3l-1 8 5 9 2-2-5-9z" fill="currentColor"/>' +
      '<path d="M5 14h14v2H5z" fill="currentColor"/>',

    /* PODIO / MEDALLAS — dibujadas con número dentro */
    medal1:
      '<circle cx="12" cy="9" r="6" fill="currentColor"/>' +
      '<path d="M9 6l3 6 3-6-3 1z" fill="#0A0A16"/>' +
      '<path d="M9 18l3-3 3 3-3 4z" fill="currentColor"/>',
    medal2:
      '<circle cx="12" cy="9" r="6" fill="currentColor"/>' +
      '<path d="M9 7h6v2l-3 4h3v1H9v-2l3-4H9z" fill="#0A0A16"/>' +
      '<path d="M9 18l3-3 3 3-3 4z" fill="currentColor"/>',
    medal3:
      '<circle cx="12" cy="9" r="6" fill="currentColor"/>' +
      '<path d="M9 7h6v1l-4 4h4v1H9v-1l4-4H9z" fill="#0A0A16"/>' +
      '<path d="M9 18l3-3 3 3-3 4z" fill="currentColor"/>',

    /* ACCIONES */
    check:
      '<path d="M4 12l5 5L20 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    cross:
      '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    hourglass:
      '<path d="M6 4h12v3l-5 5 5 5v3H6v-3l5-5-5-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M9 7h6l-3 4z" fill="currentColor"/>',
    play:
      '<path d="M6 4l14 8-14 8z" fill="currentColor"/>',
    skip:
      '<path d="M5 4l10 8-10 8zM17 4h3v16h-3z" fill="currentColor"/>',
    restart:
      '<path d="M19 12a7 7 0 1 1-2-4.9M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    close:
      '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    drink:
      '<path d="M5 4h14l-3 10H8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M8 14l2 4 1-2-1-2z" fill="currentColor"/>',
    bowl:
      '<path d="M3 11h18v1a9 9 0 0 1-18 0z" fill="currentColor"/>' +
      '<path d="M3 9c3-2 5-2 6 0M9 9c2-2 4-2 5 0M14 9c2-2 4-2 5 0" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    dot:
      '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  };

  // Crea (o reemplaza) el sprite <svg> escondido al inicio del <body>.
  function inject() {
    if (document.getElementById("ic-sprite")) return;
    const wrap = document.createElement("svg");
    wrap.setAttribute("id", "ic-sprite");
    wrap.setAttribute("aria-hidden", "true");
    wrap.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden;");
    let inner = "";
    Object.entries(SYMBOLS).forEach(([name, body]) => {
      inner += `<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`;
    });
    wrap.innerHTML = inner;
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  // Devuelve markup para <use> en una posición del DOM.
  // name: clave del símbolo. size: px (default 22). cls: clase(s) extra.
  function get(name, size, cls) {
    if (!SYMBOLS[name]) return "";
    size = size == null ? 22 : size;
    cls = cls ? " " + cls : "";
    return (
      '<svg class="ic' + cls + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" shape-rendering="crispEdges">' +
      '<use href="#i-' + name + '"/></svg>'
    );
  }

  global.icons = { inject: inject, get: get, names: Object.keys(SYMBOLS) };

  // auto-inyectar el sprite apenas el <body> exista
  if (document.body) inject();
  else
    document.addEventListener("DOMContentLoaded", inject, { once: true });
})(window);
