// Arma el video: cuadros 1920x1080 (captura + subtítulo) renderizados con Edge sin ventana,
// audio de la voz de Windows, y todo unido con ffmpeg en CPU (sin GPU).
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const BASE = __dirname;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30;
const guion = JSON.parse(fs.readFileSync(path.join(BASE, 'guion.json'), 'utf8'));
const SUF = process.env.VERSION ? '_' + process.env.VERSION : '';
const dir = n => { const d = path.join(BASE, n + SUF); fs.mkdirSync(d, { recursive: true }); return d; };
const D_REC = dir('audio_rec'), D_SEG = dir('audio_seg'), D_HTML = dir('cuadros_html'), D_CUA = dir('cuadros'), D_CLIP = dir('clips');
const url = p => 'file:///' + p.replace(/\\/g, '/');
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'pipe' });
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TOTAL_PASOS = Math.max(...guion.filter(s => s.paso).map(s => s.paso));

// ---- 1. Audio: quitar silencios de los bordes y calcular la duración de cada tramo ----
const tramos = [];
guion.forEach((s, i) => {
  const rec = path.join(D_REC, `${s.id}.wav`);
  ff(['-i', path.join(BASE, 'audio' + SUF, `${s.id}.wav`), '-af',
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse',
    '-ar', '48000', '-ac', '1', rec]);
  const d = dur(rec);
  const sig = guion[i + 1];
  let antes = 0.12, despues = 0.3;
  if (s.tipo === 'titulo') { antes = 0.6; despues = 0.7; }
  else if (s.tipo === 'cierre') { antes = 0.4; despues = 1.6; }
  else if (!sig || sig.paso !== s.paso) despues = 0.55;
  const cuadros = Math.ceil((antes + d + despues) * FPS);
  const D = cuadros / FPS;
  const seg = path.join(D_SEG, `${s.id}.wav`);
  ff(['-i', rec, '-af', `adelay=${Math.round(antes * 1000)},apad,atrim=0:${D.toFixed(6)}`, '-ar', '48000', '-ac', '1', seg]);
  tramos.push({ ...s, d, antes, D, cuadros, seg });
});

// ---- 2. Cuadros HTML ----
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{background:#EDF0F4;color:#121C2B;font-family:"Segoe UI",system-ui,sans-serif;position:relative}
.cab{position:absolute;left:240px;right:240px;top:26px;height:54px;display:flex;align-items:center;justify-content:space-between}
.marca{display:flex;align-items:center;gap:14px;font-size:27px;font-weight:600;color:#4D5A6B}
.sello{width:34px;height:34px;border-radius:50%;border:3px solid #22408C;display:grid;place-items:center}
.sello::after{content:"";width:18px;height:18px;border-radius:50%;border:3px solid #22408C}
.paso{font-size:27px;font-weight:600;color:#fff;background:#22408C;border-radius:999px;padding:7px 22px}
.paso b{font-weight:400;opacity:.85;margin-right:10px}
.captura{position:absolute;left:240px;top:96px;width:1440px;height:810px;border-radius:14px;border:1px solid #CBD2DC;box-shadow:0 10px 30px rgba(18,28,43,.12);overflow:hidden;background:#fff}
.captura img{width:100%;height:100%;display:block}
.sub{position:absolute;left:80px;right:80px;top:920px;height:148px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:46px;line-height:1.24;font-weight:600;color:#121C2B;text-wrap:balance}
.tarjeta{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:30px}
.tarjeta .sello{width:96px;height:96px;border-width:7px}
.tarjeta .sello::after{width:50px;height:50px;border-width:7px}
.t1{font-size:96px;font-weight:700;letter-spacing:-1px}
.t2{font-size:42px;color:#4D5A6B;font-weight:400}
.linea{width:120px;height:6px;border-radius:3px;background:#22408C}
`;
const pagina = cuerpo => `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${cuerpo}</body></html>`;

function htmlTramo(t) {
  if (t.tipo === 'titulo') return pagina(`<div class="tarjeta"><span class="sello"></span><h1 class="t1">Mesa de Cotejo: cómo funciona</h1><span class="linea"></span><p class="t2">Te explico el programa paso a paso, en dos minutos</p></div>`);
  if (t.tipo === 'cierre') return pagina(`<div class="tarjeta"><span class="sello"></span><h1 class="t1">Datos ficticios · demo para entrevista</h1><span class="linea"></span><p class="t2">Mesa de Cotejo</p></div>`);
  const img = url(path.join(BASE, 'capturas' + SUF, `${t.img}.png`));
  return pagina(`
    <div class="cab"><span class="marca"><span class="sello"></span>Mesa de Cotejo · cómo funciona</span><span class="paso"><b>Paso ${t.paso} de ${TOTAL_PASOS} ·</b>${esc(t.escena)}</span></div>
    <div class="captura"><img src="${img}"></div>
    <p class="sub">${esc(t.sub)}</p>`);
}

// ---- Edge sin ventana por el protocolo de depuración (solo 127.0.0.1) ----
const espera = ms => new Promise(r => setTimeout(r, ms));
async function abrirEdge(perfil, puerto) {
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, `--remote-debugging-port=${puerto}`, '--remote-debugging-address=127.0.0.1', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
  let lista = null;
  for (let i = 0; i < 50 && !lista; i++) { await espera(200); try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); } catch (e) { } }
  const ws = new WebSocket(lista.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
  let n = 0; const pend = new Map(); const oy = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else if (m.method) oy.forEach(f => f(m)); };
  const cdp = (method, params = {}) => new Promise(ok => { const id = ++n; pend.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
  const evento = nombre => new Promise(ok => { const f = m => { if (m.method === nombre) { oy.splice(oy.indexOf(f), 1); ok(m); } }; oy.push(f); });
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  return { proc, cdp, evento, ws };
}

(async () => {
  const e = await abrirEdge(path.join(BASE, 'perfil_cuadros' + SUF), 9335);
  for (const t of tramos) {
    const h = path.join(D_HTML, `${t.id}.html`);
    fs.writeFileSync(h, htmlTramo(t), 'utf8');
    const cargada = e.evento('Page.loadEventFired');
    await e.cdp('Page.navigate', { url: url(h) });
    await cargada;
    await espera(400);
    // Si un subtítulo no cabe en dos líneas, se achica la letra de a 2 px (mínimo 36 px)
    await e.cdp('Runtime.evaluate', { expression: `(() => { const s = document.querySelector('.sub'); if (!s) return; const rg = document.createRange(); rg.selectNodeContents(s); let f = 46; while ((rg.getClientRects().length > 2 || rg.getBoundingClientRect().height > 140) && f > 36) { f -= 2; s.style.fontSize = f + 'px'; } return f; })()` });
    // Comprueba que el subtítulo quepa en su franja (máximo 2 líneas)
    const chk = await e.cdp('Runtime.evaluate', { expression: `(() => { const s = document.querySelector('.sub'); if (!s) return 'tarjeta'; const r = s.scrollHeight; const lineas = Math.round(s.firstChild ? (()=>{const rg=document.createRange();rg.selectNodeContents(s);return rg.getClientRects().length})() : 0); return 'alto ' + r + ' · rects ' + lineas; })()` });
    const r = await e.cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(D_CUA, `${t.id}.png`), Buffer.from(r.result.data, 'base64'));
    console.log(t.id, `voz ${t.d.toFixed(2)} s · tramo ${t.D.toFixed(2)} s ·`, chk.result.result.value);
  }
  e.ws.close(); e.proc.kill();

  // ---- 3. Un clip de video por tramo (cuadros exactos) y el audio completo en un solo WAV ----
  const lista = [], listaA = [];
  for (const t of tramos) {
    const clip = path.join(D_CLIP, `${t.id}.mp4`);
    ff(['-loop', '1', '-framerate', String(FPS), '-i', path.join(D_CUA, `${t.id}.png`), '-frames:v', String(t.cuadros),
      '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '4', '-r', String(FPS), clip]);
    lista.push(`file '${clip.replace(/\\/g, '/')}'`);
    listaA.push(`file '${t.seg.replace(/\\/g, '/')}'`);
  }
  fs.writeFileSync(path.join(BASE, 'lista_video' + SUF + '.txt'), lista.join('\n'));
  fs.writeFileSync(path.join(BASE, 'lista_audio' + SUF + '.txt'), listaA.join('\n'));
  const vid = path.join(BASE, 'solo_video' + SUF + '.mp4'), aud = path.join(BASE, 'voz_completa' + SUF + '.wav');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(BASE, 'lista_video' + SUF + '.txt'), '-c', 'copy', vid]);
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(BASE, 'lista_audio' + SUF + '.txt'), '-c', 'pcm_s16le', aud]);
  const total = tramos.reduce((s, t) => s + t.cuadros, 0) / FPS;
  const final = path.join(BASE, 'como_funciona_mesa_cotejo' + SUF + '.mp4');
  ff(['-i', vid, '-i', aud,
    '-vf', `fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.6).toFixed(3)}:d=0.6`,
    '-af', `loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,afade=t=out:st=${(total - 0.5).toFixed(3)}:d=0.5`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-threads', '4',
    '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-ar', '48000', '-movflags', '+faststart', '-t', total.toFixed(3), final]);
  // Tabla de tiempos para el guion
  let t0 = 0;
  const tiempos = tramos.map(t => { const ini = t0 + t.antes; t0 += t.D; return { id: t.id, inicio: ini, fin: ini + t.d, tramoIni: t0 - t.D, tramoFin: t0 }; });
  fs.writeFileSync(path.join(BASE, 'tiempos' + SUF + '.json'), JSON.stringify(tiempos, null, 1));
  console.log('total', total.toFixed(2), 's ->', final);
})();
