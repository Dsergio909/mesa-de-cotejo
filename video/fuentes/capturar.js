// Genera copias temporales de abrir_local.html (con rutas absolutas y un script al final)
// y saca una captura de cada una con Edge sin ventana. No toca C:\Trabajo\Cotejo.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = __dirname;
const ORIGEN = 'C:/Trabajo/Cotejo/abrir_local.html';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SUF = process.env.VERSION ? '_' + process.env.VERSION : '';
const DIR_PAG = path.join(BASE, 'paginas' + SUF);
const DIR_CAP = path.join(BASE, 'capturas' + SUF);
fs.mkdirSync(DIR_PAG, { recursive: true });
fs.mkdirSync(DIR_CAP, { recursive: true });

let html = fs.readFileSync(ORIGEN, 'utf8');
// Tema claro para el video
html = html.replace('<head>', `<head>\n<script>try{localStorage.setItem('mesa-cotejo.tema','claro')}catch(e){}</script>`);
// Rutas relativas a .js y .css -> absolutas
html = html.replace(/(src|href)="([a-z0-9\-]+\.(?:js|css)(?:\?v=\d+)?)"/gi, (m, a, f) => `${a}="file:///C:/Trabajo/Cotejo/${f}"`);

const CASO_RIESGO = "CASOS.find(c => c.estado === 'riesgo').id";
// Caso con exoneración grande: muestra el aviso de dos firmas
const CASO_GRANDE = CASO_RIESGO;

// id, ancla, acción (JS), selector a resaltar, modo de desplazamiento, perfil
const TOMAS = [
  { id: 'metodo', ancla: 'metodo' },
  { id: 'metodo_plazo', ancla: 'metodo', resaltar: '#vista-metodo .tabla-simple tbody tr', contiene: 'Responder de fondo', desplazar: 'center' },
  { id: 'resumen', ancla: 'resumen' },
  { id: 'resumen_kpis', ancla: 'resumen', resaltar: '#vista-resumen .kpis' },
  { id: 'resumen_pron', ancla: 'resumen', resaltar: '#vista-resumen .pronostico' },
  { id: 'bandeja', ancla: 'bandeja' },
  { id: 'bandeja_top', ancla: 'bandeja', resaltar: '#cuerpo-bandeja tr:nth-child(-n+3)' },
  { id: 'caso_reloj', ancla: 'bandeja', accion: `abrirDetalle(${CASO_RIESGO})`, resaltar: '#det-reloj' },
  { id: 'caso_oblig', ancla: 'bandeja', accion: `abrirDetalle(${CASO_RIESGO})`, resaltar: '#det-obligaciones', subir: 'section', desplazar: 'start', margen: 8 },
  { id: 'caso_docs', ancla: 'bandeja', accion: `abrirDetalle(${CASO_RIESGO}); activarPestana('cotejo')`, resaltar: '#det-documentos', desplazar: 'start' },
  { id: 'caso_cotejo', ancla: 'bandeja', accion: `abrirDetalle(${CASO_RIESGO}); activarPestana('cotejo')`, resaltar: '#det-cotejo-bloque .tabla-cotejo', desplazar: 'start' },
  { id: 'caso_puntaje', ancla: 'bandeja', accion: `abrirDetalle(${CASO_RIESGO}); activarPestana('cotejo')`, resaltar: '.puntaje-fila', subir: 'section', desplazar: 'start' },
  { id: 'decision', ancla: 'bandeja', accion: `abrirDetalle(${CASO_GRANDE})`, resaltar: '#det-decision', desplazar: 'start' },
  { id: 'decision_botones', ancla: 'bandeja', accion: `abrirDetalle(${CASO_GRANDE})`, resaltar: '#det-decision .botones', desplazar: 'center' },
  { id: 'decision_firmas', ancla: 'bandeja', accion: `abrirDetalle(${CASO_GRANDE})`, resaltar: '#det-doble-firma', desplazar: 'center' },
  { id: 'red', ancla: 'red' },
  { id: 'red_grafo', ancla: 'red', resaltar: '#svg-red' },
  { id: 'cumplimiento', ancla: 'cumplimiento', resaltar: '#vista-cumplimiento .kpis' },
  { id: 'cumplimiento_registro', ancla: 'cumplimiento', resaltar: "section[aria-labelledby='t-cum-reg']", desplazar: 'start', margen: 96 },
  { id: 'uso_fecha', ancla: 'resumen', resaltar: '#barra .grupo-fecha' },
  { id: 'uso_paleta', ancla: 'resumen', accion: 'abrirPaleta()' },
  { id: 'uso_ingles', ancla: 'en', perfil: 'perfil_en', resaltar: '#selector-idioma' },
  { id: 'uso_ficticio', ancla: 'resumen', resaltar: '#barra .etiqueta-ficticio' },
];

const soloEstas = process.argv.slice(2);

function pagina(t) {
  const sel = t.resaltar ? JSON.stringify(t.resaltar) : 'null';
  const desplazar = JSON.stringify(t.desplazar || 'nearest');
  const script = `
<style id="sin-movimiento">*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}</style>
<style>.resalte-video{position:fixed;z-index:2147483647;pointer-events:none;border:4px solid #D9480F;border-radius:10px;box-sizing:border-box}</style>
<script>
window.addEventListener('load', () => setTimeout(() => {
  try { ${t.accion || ''} } catch (e) { document.title = 'ERROR ' + e.message; }
  setTimeout(() => {
    try { if (document.activeElement && document.activeElement.blur && !${JSON.stringify(t.id)}.startsWith('uso_paleta')) document.activeElement.blur(); } catch (e) {}
    const sel = ${sel};
    if (!sel) return;
    const d = document.createElement('div');
    d.className = 'resalte-video';
    document.body.appendChild(d);
    // Se repite cada 150 ms: si la letra o las imágenes cargan tarde y el contenido se mueve, el recuadro lo sigue
    const marcar = () => {
      let els = [...document.querySelectorAll(sel)];
      if (${JSON.stringify(t.subir || '')}) els = els.map(e => e.closest(${JSON.stringify(t.subir || 'x')})).filter(Boolean);
      els = els.filter(e => e.getClientRects().length);
      if (${JSON.stringify(t.contiene || '')}) els = els.filter(e => e.textContent.includes(${JSON.stringify(t.contiene || '')}));
      if (!els.length) { document.title = 'SIN ELEMENTO ' + sel; return; }
      els[0].style.scrollMarginTop = '${t.margen || 12}px';
      els[0].scrollIntoView({ block: ${desplazar}, behavior: 'instant' });
      const rs = els.map(e => e.getBoundingClientRect());
      const r = { left: Math.min(...rs.map(x => x.left)), top: Math.min(...rs.map(x => x.top)), right: Math.max(...rs.map(x => x.right)), bottom: Math.max(...rs.map(x => x.bottom)) };
      // Recorta al área visible del contenedor que se desplaza (por ejemplo, el cuerpo del panel del caso)
      const cont = els[0].closest('.panel-cuerpo');
      const lim = cont ? cont.getBoundingClientRect() : { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
      const m = 6;
      const L = Math.max(2, lim.left + 2, r.left - m), T = Math.max(2, lim.top + 2, r.top - m);
      const R = Math.min(innerWidth - 2, lim.right - 2, r.right + m), B = Math.min(innerHeight - 2, lim.bottom - 2, r.bottom + m);
      Object.assign(d.style, { left: L + 'px', top: T + 'px', width: (R - L) + 'px', height: (B - T) + 'px' });
    };
    marcar();
    setInterval(marcar, 150);
    // Edge cambia el tamaño de la ventana justo antes de la captura: se vuelve a medir antes de pintar
    addEventListener('resize', marcar);
    const ro = new ResizeObserver(marcar);
    ro.observe(document.documentElement);
    document.querySelectorAll('.panel-cuerpo').forEach(x => ro.observe(x));
  }, 500);
}, 400));
</script>
`;
  return html.replace('</body>', script + '</body>');
}

// Captura con el protocolo de depuración de Edge (solo 127.0.0.1): la vista queda fija en 1280x720
// desde el principio, así que nada se mueve al tomar la foto, ni siquiera con la página desplazada.
const { spawn } = require('child_process');
const espera = ms => new Promise(r => setTimeout(r, ms));

async function abrirEdge(perfil, puerto) {
  const proc = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, `--remote-debugging-port=${puerto}`, '--remote-debugging-address=127.0.0.1',
    '--window-size=1280,720', 'about:blank'
  ], { stdio: 'ignore' });
  let lista = null;
  for (let i = 0; i < 50 && !lista; i++) {
    await espera(200);
    try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); } catch (e) { /* aún no */ }
  }
  const pag = lista.find(x => x.type === 'page');
  const ws = new WebSocket(pag.webSocketDebuggerUrl);
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
  let n = 0; const pendientes = new Map(); const oyentes = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); }
    else if (m.method) oyentes.forEach(f => f(m));
  };
  const cdp = (method, params = {}) => new Promise(ok => { const id = ++n; pendientes.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
  const evento = nombre => new Promise(ok => { const f = m => { if (m.method === nombre) { oyentes.splice(oyentes.indexOf(f), 1); ok(m); } }; oyentes.push(f); });
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });
  return { proc, cdp, evento, ws };
}

(async () => {
  const grupos = {};
  for (const t of TOMAS) {
    if (soloEstas.length && !soloEstas.includes(t.id)) continue;
    (grupos[t.perfil || 'perfil_es'] ||= []).push(t);
  }
  let puerto = 9333;
  for (const [perfil, tomas] of Object.entries(grupos)) {
    const e = await abrirEdge(path.join(BASE, perfil + SUF), puerto++);
    for (const t of tomas) {
      const archivo = path.join(DIR_PAG, `${t.id}.html`);
      fs.writeFileSync(archivo, pagina(t), 'utf8');
      const url = 'file:///' + archivo.replace(/\\/g, '/') + '#' + t.ancla;
      const cargada = e.evento('Page.loadEventFired');
      await e.cdp('Page.navigate', { url });
      await cargada;
      await espera(3000);
      const r = await e.cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(DIR_CAP, `${t.id}.png`), Buffer.from(r.result.data, 'base64'));
      const titulo = await e.cdp('Runtime.evaluate', { expression: 'document.title' });
      console.log('ok', t.id, titulo.result.result.value);
    }
    await e.cdp('Browser.close').catch(() => {});
    e.ws.close();
    e.proc.kill();
    await espera(1000);
  }
})();
