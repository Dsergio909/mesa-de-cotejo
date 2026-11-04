// ==== IDIOMAS: español, inglés y portugués ====
// La mesa se escribe en español. Esta capa traduce lo que aparece en pantalla usando plantillas:
// los datos variables (radicados, fechas, montos, nombres, comercios, números) se reemplazan por
// marcadores, se busca la plantilla traducida y los datos vuelven a su lugar con formato del idioma.

const IDIOMAS = { es: 'Español', en: 'English', pt: 'Português' };
const CLAVE_IDIOMA = 'mesa-cotejo.idioma';
// Solo es, en y pt (no «constructor» ni otras propiedades heredadas de Object)
const esIdioma = x => typeof x === 'string' && Object.prototype.hasOwnProperty.call(IDIOMAS, x);
let IDIOMA = 'es';
const TRAD = { en: {}, pt: {} };          // plantilla en español → traducción (idioma-en.js, idioma-pt.js)
let RECOLECTAR = null;                    // Set de plantillas vistas (solo para preparar traducciones)

const MESES_ES = MESES_CORTOS;
const MESES_LOC = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
};
const escaparRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let PATRONES = null;
function patrones() {
  if (PATRONES) return PATRONES;
  const lista = arr => new RegExp(arr.slice().sort((a, b) => b.length - a.length).map(escaparRe).join('|'), 'g');
  const mes = MESES_ES.join('|');
  PATRONES = [
    ['r', /SUP-2026-\d{6}/g],
    ['f', new RegExp(`\\b\\d{1,2} (?:${mes}) \\d{4}\\b`, 'g')],
    ['fc', new RegExp(`\\b\\d{1,2} (?:${mes})\\b`, 'g')],
    ['m', /\$\d{1,3}(?:\.\d{3})*(?:,\d+)?(?: M)?/g],
    ['e', /[\p{L}\d]{2}•••@[a-z.]+/gu],
    ['p', lista(NOMBRES)],
    ['c', lista(COMERCIOS)],
    ['ci', lista([...CIUDADES, 'Soacha'])],
    ['a', /\bA-\d{3,4}\b/g],
    ['d', /\bDV-[0-9A-F]{4}\b/g],
    ['h', /\b[0-9a-f]{10,64}\b/g],
    ['n', /\d+(?:,\d+)?/g]
  ];
  return PATRONES;
}

// «Faltan 3 días hábiles para el 22 dic 2026» → «Faltan {nA} días hábiles para el {fA}»
function normalizar(s) {
  const valores = {};
  let t = s;
  for (const [tipo, re] of patrones()) {
    let i = 0;
    t = t.replace(re, m => { const k = tipo + LETRAS[Math.min(i++, 25)]; valores[k] = m; return `{${k}}`; });
  }
  return { plantilla: t, valores };
}

// Formato regional de lo que quedó en español dentro del texto traducido
function formatoLocal(s) {
  if (IDIOMA === 'es') return s;
  const mes = MESES_ES.join('|');
  s = s.replace(new RegExp(`\\b(\\d{1,2}) (${mes})(?: (\\d{4}))?\\b`, 'g'), (m, d, me, a) => {
    const nombre = MESES_LOC[IDIOMA][MESES_ES.indexOf(me)];
    if (IDIOMA === 'en') return a ? `${nombre} ${d}, ${a}` : `${nombre} ${d}`;
    return a ? `${d} ${nombre} ${a}` : `${d} ${nombre}`;
  });
  s = s.replace(/(\d) %/g, '$1%');
  if (IDIOMA === 'en') {
    s = s.replace(/\$(\d{1,3}(?:\.\d{3})+)/g, (m, n) => `COP ${n.replace(/\./g, ',')}`)
      .replace(/\$(\d+),(\d) M\b/g, 'COP $1.$2M')
      .replace(/\b(\d+),(\d+) ?%/g, '$1.$2%')
      .replace(/\$(\d{1,3})(?![\d.,])/g, 'COP $1')
      .replace(/\b(\d),(\d{2})\b/g, '$1.$2')
      .replace(/\b(\d+),(\d+)\b(?= (?:days|business days)\b)/g, '$1.$2');
  }
  return s;
}

function traducirTexto(s) {
  const recorte = s.trim();
  if (!recorte || !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(recorte)) return IDIOMA === 'es' ? s : formatoLocal(s);
  const ini = s.slice(0, s.indexOf(recorte)), fin = s.slice(s.indexOf(recorte) + recorte.length);
  let r = null;
  if (RECOLECTAR) RECOLECTAR.add(normalizar(recorte).plantilla);
  if (IDIOMA === 'es') return s;
  const dic = TRAD[IDIOMA] || {};
  if (dic[recorte] !== undefined) r = dic[recorte];
  else {
    const { plantilla, valores } = normalizar(recorte);
    if (dic[plantilla] !== undefined) r = dic[plantilla].replace(/\{([a-z]+[A-Z])\}/g, (m, k) => valores[k] !== undefined ? valores[k] : m);
  }
  if (r === null) return ini + formatoLocal(recorte) + fin;   // sin traducción: queda en español con formato local
  return ini + formatoLocal(r) + fin;
}

// Traducción en vivo del DOM: guarda el original en español de cada nodo
const ORIGINAL = new WeakMap(), ESCRITO = new WeakMap();
const ATRIBUTOS = ['placeholder', 'aria-label', 'title'];
const ORIG_ATR = new WeakMap();
const excluido = el => el && el.closest && el.closest('[data-sin-traducir], script, style, textarea');

function traducirNodo(n) {
  if (n.nodeType === 3) {
    if (excluido(n.parentElement)) return;
    if (!ORIGINAL.has(n) || n.data !== ESCRITO.get(n)) ORIGINAL.set(n, n.data);
    const nuevo = traducirTexto(ORIGINAL.get(n));
    if (nuevo !== n.data) n.data = nuevo;
    ESCRITO.set(n, n.data);
  } else if (n.nodeType === 1) {
    if (excluido(n)) return;
    const guardado = ORIG_ATR.get(n) || {};
    ATRIBUTOS.forEach(a => {
      if (!n.hasAttribute(a)) return;
      const actual = n.getAttribute(a);
      if (guardado[a] === undefined || actual !== guardado[`_${a}`]) guardado[a] = actual;
      const nuevo = traducirTexto(guardado[a]);
      guardado[`_${a}`] = nuevo;
      if (nuevo !== actual) n.setAttribute(a, nuevo);
    });
    ORIG_ATR.set(n, guardado);
    n.childNodes.forEach(traducirNodo);
  }
}

let OBSERVADOR = null;
function activarTraduccion() {
  traducirNodo(document.body);
  if (OBSERVADOR) return;
  OBSERVADOR = new MutationObserver(cambios => {
    cambios.forEach(c => {
      if (c.type === 'childList') c.addedNodes.forEach(traducirNodo);
      else if (c.type === 'characterData') traducirNodo(c.target);
      else if (c.type === 'attributes') traducirNodo(c.target);
    });
  });
  OBSERVADOR.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
}

function cambiarIdioma(id) {
  if (!esIdioma(id)) id = 'es';
  IDIOMA = id;
  document.documentElement.lang = id === 'pt' ? 'pt-BR' : id;
  try { localStorage.setItem(CLAVE_IDIOMA, id); } catch (e) { /* queda en memoria */ }
  const sel = document.getElementById('selector-idioma');
  if (sel) sel.value = id;
  traducirNodo(document.body);
}

// Texto que la página arma en JS y no pasa por el DOM (por ejemplo, instrucciones a la IA)
function tr(s) { return traducirTexto(s); }
function nombreIdiomaParaIA() { return { es: 'español', en: 'inglés', pt: 'portugués de Brasil' }[IDIOMA]; }

function iniciarIdioma() {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_IDIOMA); } catch (e) { guardado = null; }
  // Español por defecto (la ley y los datos son colombianos); se recuerda el idioma que elija cada persona.
  // Un enlace que termina en #en o #pt abre la demo en ese idioma (para compartirla con evaluadores de otros países).
  const ancla = location.hash.slice(1);
  IDIOMA = esIdioma(ancla) ? ancla : esIdioma(guardado) ? guardado : 'es';
  if (esIdioma(ancla)) { try { localStorage.setItem(CLAVE_IDIOMA, ancla); } catch (e) { /* nada */ } }
  document.documentElement.lang = IDIOMA === 'pt' ? 'pt-BR' : IDIOMA;
  const sel = document.getElementById('selector-idioma');
  if (sel) {
    sel.value = IDIOMA;
    sel.addEventListener('change', () => cambiarIdioma(sel.value));
  }
  activarTraduccion();
}
