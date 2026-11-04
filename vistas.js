// ==== VISTAS, NAVEGACIÓN Y FECHA SIMULADA ====

let FECHA = FECHA_DEFECTO;
let CASOS = [];
let DECISIONES = {};
let MES_VISTO = null; // { anio, mes }
const CLAVE_DECISIONES = 'mesa-cotejo.decisiones.v1';
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const $ = id => document.getElementById(id);

// ---- Decisiones del analista (por navegador; si el almacenamiento falla, quedan en memoria) ----
function cargarDecisiones() {
  let datos = {};
  try { datos = JSON.parse(localStorage.getItem(CLAVE_DECISIONES) || '{}'); } catch (e) { datos = {}; }
  // Lo guardado puede venir dañado o de otra versión: solo se aceptan decisiones conocidas con fecha válida
  DECISIONES = {};
  if (datos && typeof datos === 'object' && !Array.isArray(datos)) {
    for (const [id, lista] of Object.entries(datos)) {
      if (!Array.isArray(lista)) continue;
      const validas = lista.filter(d => d && typeof d === 'object' && Object.prototype.hasOwnProperty.call(NOMBRE_DECISION, d.tipo)
        && typeof d.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.fecha));
      if (validas.length) DECISIONES[id] = validas;
    }
  }
}
function guardarDecisiones() {
  try { localStorage.setItem(CLAVE_DECISIONES, JSON.stringify(DECISIONES)); } catch (e) { avisarSinGuardar(); }
}
function registrarDecision(id, tipo, nota) {
  registrarDecisionesLote([{ id, tipo, nota }]);
}
// Varias decisiones con un solo recálculo (por ejemplo, contener una red completa)
function registrarDecisionesLote(lista) {
  lista.forEach(({ id, tipo, nota }) => {
    const c = CASOS.find(x => x.id === id);
    const evento = c ? eventoIntegracion(c, tipo, nota) : null;
    (DECISIONES[id] = DECISIONES[id] || []).push({ tipo, fecha: FECHA, nota, evento });
    if (c) anotarBitacora(c, tipo, nota);
  });
  guardarDecisiones();
  actualizarTodo();
}

function recalcular() {
  CASOS = CASOS_BASE.map(b => derivarCaso(b, FECHA, DECISIONES[b.id])).filter(Boolean);
}

// ---- Textos pequeños reutilizables ----
function textoPlazo(p) {
  if (!p) return { texto: 'Sin plazo', clase: 'neutro' };
  if (p.dias === null) return { texto: 'Sin plazo', clase: 'neutro' };
  if (p.dias < 0) return { texto: `Vencido hace ${-p.dias} d`, clase: 'critico' };
  if (p.dias === 0) return { texto: 'Vence hoy', clase: 'alerta' };
  return { texto: `${p.dias === 1 ? 'Falta' : 'Faltan'} ${p.dias} d`, clase: p.dias <= 3 ? 'alerta' : 'neutro' };
}
const pill = (texto, clase) => `<span class="pill pill-${clase}">${texto}</span>`;
const fechaCorta = iso => { const p = iso.split('-'); return `${+p[2]} ${MESES_CORTOS[+p[1] - 1]}`; };

// ---- Regla de días hábiles (elemento firma) ----
function reglaSvg(caso, grande) {
  const W = grande ? 560 : 200, H = grande ? 76 : 22, mx = grande ? 18 : 5, y = grande ? 38 : 13;
  const paso = (W - 2 * mx) / 23, x = d => mx + d * paso;
  const dias = Math.max(0, Math.min(23, caso.t));
  const clase = caso.est.clase;
  const hitos = { 10: 'cotejo', 15: 'respuesta', 20: 'denuncia', 23: 'tope' };
  let s = `<svg viewBox="0 0 ${W} ${H}" class="regla ${grande ? 'regla-grande' : 'regla-mini'}" role="img" aria-label="Día hábil ${caso.t} desde la radicación; plazos en los días 10, 15, 20 y 23">`;
  s += `<line class="r-pista" x1="${mx}" y1="${y}" x2="${W - mx}" y2="${y}" stroke-width="${grande ? 6 : 4}"/>`;
  if (dias > 0) s += `<line class="r-tramo r-${clase}" x1="${mx}" y1="${y}" x2="${x(dias)}" y2="${y}" stroke-width="${grande ? 6 : 4}"/>`;
  for (let d = 0; d <= 23; d++) {
    const hito = hitos[d];
    if (!grande && !hito) continue;
    const alto = hito ? (grande ? 13 : 7) : 5;
    s += `<line class="${hito ? 'r-hito' : 'r-marca'}" x1="${x(d)}" y1="${y - alto}" x2="${x(d)}" y2="${y + (grande ? 4 : 0)}"/>`;
    if (grande && hito) s += `<text class="r-texto" x="${x(d)}" y="${y - 18}" text-anchor="${d === 23 ? 'end' : 'middle'}">${d} ${hito}</text>`;
  }
  s += `<circle class="r-punto r-${clase}" cx="${x(dias)}" cy="${y}" r="${grande ? 7 : 4.5}"/>`;
  if (grande) s += `<text class="r-texto r-hoy" x="${x(dias)}" y="${y + 26}" text-anchor="${dias < 2 ? 'start' : dias > 21 ? 'end' : 'middle'}">Hoy: día ${caso.t}</text>`;
  return s + '</svg>';
}

// ---- Arranque ----
function inicializarApp() {
  cargarDecisiones();
  $('input-fecha').addEventListener('change', e => { if (e.target.value) cambiarFecha(e.target.value); });
  $('btn-dia-anterior').addEventListener('click', () => cambiarFecha(restarHabiles(FECHA, 1)));
  $('btn-dia-siguiente').addEventListener('click', () => cambiarFecha(sumarHabiles(FECHA, 1)));
  $('btn-reiniciar').addEventListener('click', () => {
    if (TEMPORIZADOR_MES) detenerMes();
    DECISIONES = {}; guardarDecisiones(); borrarNuevos(); vaciarBitacora(); cerrarDetalle(); cambiarFecha(FECHA_DEFECTO);
    mostrarAviso('Demo reiniciada: sin decisiones ni reclamos nuevos, fecha en 22 dic 2026.');
  });
  cargarNuevos();
  $('btn-mes-anterior').addEventListener('click', () => moverMes(-1));
  $('btn-mes-siguiente').addEventListener('click', () => moverMes(1));
  prepararFiltros();
  window.addEventListener('hashchange', aplicarRuta);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented) cerrarDetalle(); });
  aplicarRuta();
  cambiarFecha(FECHA_DEFECTO);
}

// La fecha simulada se queda en el rango de la demo: fechas muy lejanas harían lentos los cálculos de días hábiles
const FECHA_MIN = '2026-11-02', FECHA_MAX = '2027-12-31';
function cambiarFecha(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || fechaAISO(parsearFechaUTC(f)) !== f) return;
  f = f < FECHA_MIN ? FECHA_MIN : f > FECHA_MAX ? FECHA_MAX : f;
  FECHA = f;
  MES_VISTO = { anio: +f.slice(0, 4), mes: +f.slice(5, 7) };
  actualizarTodo();
}

function actualizarTodo() {
  recalcular();
  $('input-fecha').value = FECHA;
  $('texto-dia').textContent = esHabil(FECHA) ? '' : 'No es día hábil';
  $('aviso-vigencia').textContent = FECHA < VIGENCIA
    ? `Ley 2573 de 2026 · faltan ${habilesEntre(FECHA, VIGENCIA)} días hábiles para su vigencia (19 nov 2026)`
    : 'Ley 2573 de 2026 · vigente desde el 19 nov 2026';
  renderizarResumen();
  renderizarBandeja();
  renderizarRed();
  renderizarCalendario();
  renderizarCumplimiento();
  renderizarTendencias();
  refrescarDetalle();
}

function aplicarRuta(evento) {
  const vistas = ['resumen', 'bandeja', 'red', 'cumplimiento', 'calendario', 'metodo'];
  const actual = vistas.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'resumen';
  vistas.forEach(v => {
    $(`vista-${v}`).hidden = v !== actual;
    $(`nav-${v}`).classList.toggle('activo', v === actual);
    if (v === actual) $(`nav-${v}`).setAttribute('aria-current', 'page'); else $(`nav-${v}`).removeAttribute('aria-current');
  });
  if (evento && evento.type === 'hashchange' && PASO_ACTUAL < 0) {
    const titulo = $(`vista-${actual}`).querySelector('h1');
    titulo.tabIndex = -1;
    titulo.focus();
  }
}

let temporizadorAviso = null;
// Si el navegador no deja guardar (ventana privada, cuota llena), se avisa una sola vez
let AVISO_SIN_GUARDAR = false;
function avisarSinGuardar() {
  if (AVISO_SIN_GUARDAR) return;
  AVISO_SIN_GUARDAR = true;
  mostrarAviso('Este navegador no deja guardar: lo que hagas dura hasta cerrar la página.');
}
let LISTA_BANDEJA = [];
// Aviso breve; si trae una acción (por ejemplo «Deshacer»), queda más tiempo en pantalla
function mostrarAviso(texto, accion) {
  const el = $('aviso-flotante'), boton = $('aviso-accion');
  $('aviso-texto').textContent = texto; el.hidden = false;
  $('anuncio-fecha').textContent = texto;
  boton.hidden = !accion;
  boton.onclick = accion ? () => { el.hidden = true; accion(); } : null;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { el.hidden = true; }, accion ? 7000 : 3200);
}
function deshacerDecision(id) {
  const lista = DECISIONES[id];
  // Solo se deshace la última decisión visible en la fecha simulada, nunca una de una fecha posterior
  const i = lista ? lista.map(d => d.fecha <= FECHA).lastIndexOf(true) : -1;
  if (i < 0) return;
  const quitada = lista.splice(i, 1)[0]; guardarDecisiones();
  const c = CASOS.find(x => x.id === id);
  if (c) anotarBitacora(c, 'deshacer', `Anuló: ${NOMBRE_DECISION[quitada.tipo]}`);
  actualizarTodo();
  mostrarAviso('Decisión deshecha. Queda registrada solo la anterior.');
}
const iniciales = nombre => nombre === 'Tú' ? 'TÚ' : nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

// ---- Resumen ----
function renderizarResumen() {
  const abiertos = CASOS.filter(c => c.abierto);
  const kpi = (id, valor, clase) => {
    $(id).textContent = valor;
    $(id).closest('.kpi').dataset.estado = clase;
  };
  const riesgo = CASOS.filter(c => c.riesgoSilencio).length;
  const hoy = CASOS.filter(c => c.estado === 'cotejo_hoy').length;
  const incumplidos = CASOS.filter(c => ESTADOS[c.estado].clase === 'critico').length;
  kpi('kpi-abiertos', abiertos.length, 'neutro');
  kpi('kpi-riesgo', riesgo, riesgo ? 'alerta' : 'neutro');
  kpi('kpi-cotejos', hoy, hoy ? 'alerta' : 'neutro');
  const suspendido = CASOS.filter(c => c.cobroSuspendido).reduce((s, c) => s + c.monto, 0);
  kpi('kpi-suspendido', suspendido >= 1e6 ? `$${(suspendido / 1e6).toFixed(1).replace('.', ',')} M` : formatearMoneda(suspendido), 'neutro');
  $('kpi-suspendido-nota').textContent = `${formatearMoneda(suspendido)} con cobro congelado`;
  kpi('kpi-incumplidos', incumplidos, incumplidos ? 'critico' : 'neutro');
  $('kpi-incumplidos-nota').textContent = incumplidos
    ? `${CASOS.filter(c => c.estado === 'silencio' || c.estado === 'silencio_acatado').length} silencio positivo · ${CASOS.filter(c => c.estado === 'cobro_activo').length} cobro activo · ${CASOS.filter(c => c.estado === 'cotejo_vencido').length} cotejo vencido`
    : 'Ningún plazo vencido';

  // Próximos vencimientos: lo vencido arriba, luego lo más cercano
  const conPlazo = abiertos.filter(c => c.proximo && c.proximo.dias !== null)
    .sort((a, b) => a.proximo.dias - b.proximo.dias).slice(0, 8);
  $('lista-vencimientos').innerHTML = conPlazo.length ? conPlazo.map(c => {
    const p = textoPlazo(c.proximo);
    return `<button type="button" class="fila-venc fila-${p.clase}" data-caso="${c.id}">
      <span class="fv-texto"><span class="fv-titulo">${c.titular}</span>
        <span class="fv-sub">${c.radicado} · ${c.proximo.nombre}</span></span>
      <span class="fv-regla">${reglaSvg(c, false)}</span>
      ${pill(p.texto, p.clase)}
    </button>`;
  }).join('') : '<p class="vacio">No hay plazos abiertos en esta fecha.</p>';

  renderizarPronostico();
  renderizarGrafica();
  renderizarComercios();

  const redes = construirRedes(CASOS);
  $('resumen-redes').innerHTML = redes.length ? redes.map(r => `
    <div class="red-mini">
      <div class="red-mini-cifras">
        <strong class="cifra">${r.casos.length}</strong><span>casos unidos</span>
        <strong class="cifra">${formatearMoneda(r.casos.reduce((s, c) => s + c.monto, 0))}</strong><span>en disputa</span>
      </div>
      <p><strong>${r.titulo}.</strong> <span>Comparten</span> ${r.entidades.map(e => e.tipo.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i).map(t => `<span>${t}</span>`).join(', ')}.</p>
    </div>`).join('') : '<p class="vacio">Todavía no hay casos unidos por datos compartidos.</p>';
}

// Si nadie actúa: los eventos planeados después de hoy no ocurren y se cuentan los silencios nuevos
function renderizarPronostico() {
  const silencioHoy = CASOS.filter(c => c.estado === 'silencio');
  const montoHoy = silencioHoy.reduce((s, c) => s + c.monto, 0);
  const dias = [];
  let d = FECHA;
  for (let k = 0; k < 5; k++) {
    d = sumarHabiles(d, 1);
    const futuros = CASOS_BASE.map(b => derivarCaso(b, d, DECISIONES[b.id], FECHA)).filter(c => c && c.estado === 'silencio');
    dias.push({ fecha: d, n: futuros.length - silencioHoy.length, monto: futuros.reduce((s, c) => s + c.monto, 0) - montoHoy });
  }
  const total = dias[dias.length - 1];
  const max = Math.max(1, total.n);
  $('pronostico-titular').textContent = total.n > 0
    ? `Si nadie actúa, en 5 días hábiles ${total.n} ${total.n === 1 ? 'reclamo más queda resuelto' : 'reclamos más quedan resueltos'} a favor del titular por silencio positivo (${formatearMoneda(total.monto)}), y la entidad se expone a sanción.`
    : 'Si nadie actúa, ningún reclamo cae en silencio positivo en los próximos 5 días hábiles.';
  $('pronostico-dias').innerHTML = dias.map(x => `<div class="pron-dia">
      <span class="pron-barra"><span style="height:${(x.n / max) * 100}%" class="${x.n ? 'pron-lleno' : ''}"></span></span>
      <strong class="num">${x.n > 0 ? `+${x.n}` : '0'}</strong><span class="pron-fecha">${fechaCorta(x.fecha)}</span></div>`).join('');
}

function renderizarGrafica() {
  const cont = $('grafica-radicaciones');
  if (FECHA < VIGENCIA) { cont.innerHTML = '<p class="vacio">La ley aún no está vigente en esta fecha.</p>'; return; }
  const dias = [];
  for (let d = VIGENCIA; d <= FECHA; d = sumarHabiles(d, 1)) dias.push(d);
  const conteo = {};
  CASOS.forEach(c => { conteo[c.fechaRadicacion] = (conteo[c.fechaRadicacion] || 0) + 1; });
  const max = Math.max(4, ...dias.map(d => conteo[d] || 0));
  const tope = Math.ceil(max / 2) * 2;
  const W = 520, H = 200, ml = 26, mr = 6, mt = 14, mb = 28, ancho = W - ml - mr, alto = H - mt - mb;
  const banda = ancho / dias.length, yv = v => mt + alto - (v / tope) * alto;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="grafica" role="img" aria-label="Reclamos radicados por día hábil">`;
  [0, tope / 2, tope].forEach(v => {
    s += `<line class="g-rejilla" x1="${ml}" x2="${W - mr}" y1="${yv(v)}" y2="${yv(v)}"/>`;
    s += `<text class="g-texto" x="${ml - 6}" y="${yv(v) + 4}" text-anchor="end">${v}</text>`;
  });
  const cadaCuanto = Math.ceil(dias.length / 6);
  dias.forEach((d, i) => {
    const v = conteo[d] || 0, x = ml + i * banda + banda * 0.15, w = banda * 0.7;
    const ultimo = i === dias.length - 1;
    if (v > 0) s += `<rect class="${ultimo ? 'g-barra-hoy' : 'g-barra'}" x="${x}" y="${yv(v)}" width="${w}" height="${mt + alto - yv(v)}" rx="1.5"><title>${formatearFecha(d)}: ${v}</title></rect>`;
    if (ultimo && v > 0) s += `<text class="g-texto g-fuerte" x="${x + w / 2}" y="${yv(v) - 5}" text-anchor="middle">${v}</text>`;
    if (i % cadaCuanto === 0 || ultimo) s += `<text class="g-texto" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${ultimo ? 'Hoy' : fechaCorta(d)}</text>`;
  });
  cont.innerHTML = s + '</svg>';
  $('grafica-total').textContent = `${CASOS.length} reclamos en ${dias.length} días hábiles`;
}

function renderizarComercios() {
  const porComercio = {}, porAsesor = {};
  CASOS.forEach(c => {
    porComercio[c.comercio] = (porComercio[c.comercio] || 0) + 1;
    (porAsesor[c.asesor] = porAsesor[c.asesor] || []).push(c);
  });
  const filas = Object.entries(porComercio).sort((a, b) => b[1] - a[1]);
  const max = filas.length ? filas[0][1] : 1;
  $('lista-comercios').innerHTML = filas.map(([nombre, n]) => `
    <div class="fila-barra"><span class="fb-nombre">${nombre}</span>
      <span class="fb-riel"><span class="fb-relleno" style="width:${(n / max) * 100}%"></span></span>
      <span class="fb-valor">${n}</span></div>`).join('');
  const sospechoso = Object.entries(porAsesor).filter(([, cs]) => cs.length >= 5).sort((a, b) => b[1].length - a[1].length)[0];
  $('alerta-asesor').hidden = !sospechoso;
  if (sospechoso) {
    const [asesor, cs] = sospechoso;
    $('alerta-asesor').innerHTML = `<strong>Posible participación interna (art. 5 num. 10).</strong> El asesor ${asesor} de ${cs[0].comercio} originó ${cs.length} de los créditos reclamados.`;
  }
}

// ---- Bandeja ----
function prepararFiltros() {
  const opciones = (id, pares) => { $(id).insertAdjacentHTML('beforeend', pares.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')); };
  opciones('filtro-estado', Object.entries(ESTADOS).map(([k, v]) => [k, v.texto]));
  opciones('filtro-comercio', COMERCIOS.map(c => [c, c]));
  opciones('filtro-canal', CANALES.map(c => [c, c]));
  opciones('filtro-analista', ANALISTAS.filter(a => a !== 'Tú').map(a => [a, a]));
  ['filtro-buscar', 'filtro-estado', 'filtro-banda', 'filtro-comercio', 'filtro-canal', 'filtro-analista']
    .forEach(id => $(id).addEventListener('input', renderizarBandeja));
}

function renderizarBandeja() {
  const q = $('filtro-buscar').value.toLowerCase().trim();
  const f = { estado: $('filtro-estado').value, banda: $('filtro-banda').value, comercio: $('filtro-comercio').value, canal: $('filtro-canal').value };
  const lista = CASOS.filter(c =>
    (!q || c.radicado.toLowerCase().includes(q) || c.titular.toLowerCase().includes(q)) &&
    (f.estado === 'todos' || c.estado === f.estado) &&
    (f.banda === 'todas' || c.evid.banda === f.banda) &&
    (f.comercio === 'todos' || c.comercio === f.comercio) &&
    (f.canal === 'todos' || c.canal === f.canal) &&
    ($('filtro-analista').value === 'todos' || c.analista === $('filtro-analista').value) &&
    filtroVistaRapida(c));
  ordenarBandeja(lista);
  LISTA_BANDEJA = lista.map(c => c.id);
  $('cuerpo-bandeja').innerHTML = lista.map(c => {
    const p = textoPlazo(c.proximo);
    return `<tr class="fila-${c.est.clase}" data-caso="${c.id}">
      <td class="num col-prio" title="Urgencia + monto + evidencia">${c.abierto ? c.prioridad : '·'}</td>
      <td class="col-caso"><button type="button" class="caso-nombre" data-caso="${c.id}">${c.titular}</button><span class="sub">${c.radicado} · ${formatearFecha(c.fechaRadicacion)} · ${c.canal}</span></td>
      <td><span class="analista"><span class="iniciales" aria-hidden="true">${iniciales(c.analista)}</span>${c.analista}</span></td>
      <td class="col-comercio">${c.comercio}<span class="sub">${c.ciudad}</span></td>
      <td class="num">${formatearMoneda(c.monto)}</td>
      <td>${c.proximo ? pill(p.texto, p.clase) : ''}<span class="sub">${c.proximo ? c.proximo.nombre : 'Caso cerrado'}</span></td>
      <td><span class="evid"><span class="evid-riel"><span class="evid-relleno ev-${c.evid.banda}" style="width:${c.evid.puntaje}%"></span></span><span class="num">${c.evid.puntaje}</span></span></td>
      <td>${pill(c.est.texto, c.est.clase)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="vacio">Ningún caso coincide con los filtros.</td></tr>';
  $('conteo-bandeja').textContent = `${lista.length} de ${CASOS.length} casos · fecha simulada ${formatearFecha(FECHA)}`;
}

// ---- Red de fraude: disposición por fuerzas con semilla fija ----
function disponerGrafo(nodos, aristas, W, H) {
  const rng = mulberry32(7);
  nodos.forEach(n => { n.x = n.cx + (rng() - 0.5) * 120; n.y = n.cy + (rng() - 0.5) * 120; });
  const idx = Object.fromEntries(nodos.map((n, i) => [n.id, i]));
  for (let it = 0; it < 420; it++) {
    const enfriar = 1 - it / 420;
    nodos.forEach(n => { n.fx = (n.cx - n.x) * 0.006; n.fy = (n.cy - n.y) * 0.006; });
    for (let i = 0; i < nodos.length; i++) for (let j = i + 1; j < nodos.length; j++) {
      const a = nodos[i], b = nodos[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
      const f = 7000 / d2, d = Math.sqrt(d2);
      a.fx += f * dx / d; a.fy += f * dy / d; b.fx -= f * dx / d; b.fy -= f * dy / d;
    }
    aristas.forEach(([s, t]) => {
      const a = nodos[idx[s]], b = nodos[idx[t]];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - 100) * 0.03;
      a.fx += f * dx / d; a.fy += f * dy / d; b.fx -= f * dx / d; b.fy -= f * dy / d;
    });
    nodos.forEach(n => {
      n.x += Math.max(-20, Math.min(20, n.fx)) * enfriar;
      n.y += Math.max(-20, Math.min(20, n.fy)) * enfriar;
      n.x = Math.max(40, Math.min(W - 40, n.x)); n.y = Math.max(30, Math.min(H - 34, n.y));
    });
  }
}

function renderizarRed() {
  const redes = construirRedes(CASOS);
  const W = 720, H = 440;
  if (!redes.length) {
    $('svg-red').innerHTML = `<text class="g-texto" x="${W / 2}" y="${H / 2}" text-anchor="middle">Sin casos unidos en esta fecha</text>`;
    $('fichas-red').innerHTML = '';
    return;
  }
  const nodos = [], aristas = [];
  redes.forEach((r, k) => {
    const cx = redes.length === 1 ? W / 2 : redes.length === 2 ? (k === 0 ? W * 0.36 : W * 0.84) : W * (k + 0.5) / redes.length, cy = H / 2;
    r.casos.forEach(c => nodos.push({ id: `c${c.id}`, tipo: 'caso', caso: c, cx, cy }));
    r.entidades.forEach(e => {
      nodos.push({ id: `${r.clave}-${e.id}`, tipo: 'entidad', e, cx, cy });
      e.casos.forEach(c => aristas.push([`c${c.id}`, `${r.clave}-${e.id}`, e.tipo]));
    });
  });
  disponerGrafo(nodos, aristas, W, H);
  const pos = Object.fromEntries(nodos.map(n => [n.id, n]));
  let s = '';
  aristas.forEach(([a, b, tipo]) => {
    s += `<line class="arista ${tipo === 'Asesor' ? 'arista-asesor' : ''}" data-a="${a}" data-b="${b}" x1="${pos[a].x.toFixed(1)}" y1="${pos[a].y.toFixed(1)}" x2="${pos[b].x.toFixed(1)}" y2="${pos[b].y.toFixed(1)}"/>`;
  });
  nodos.filter(n => n.tipo === 'entidad').forEach(n => {
    s += `<g class="nodo-ent" data-n="${n.id}" tabindex="0" aria-label="${n.e.tipo} ${n.e.etiqueta}: ${n.e.casos.length} casos">
      <rect class="nodo-entidad" x="${(n.x - 8).toFixed(1)}" y="${(n.y - 8).toFixed(1)}" width="16" height="16" rx="2"/>
      <text class="g-texto g-fuerte" x="${n.x.toFixed(1)}" y="${(n.y + 22).toFixed(1)}" text-anchor="middle">${n.e.etiqueta}</text>
      <title>${n.e.tipo}: ${n.e.casos.length} casos</title></g>`;
  });
  nodos.filter(n => n.tipo === 'caso').forEach(n => {
    s += `<g class="nodo-caso" data-n="${n.id}" tabindex="0" role="button" aria-label="Abrir ${n.caso.radicado}" data-caso="${n.caso.id}">
      <circle class="ev-${n.caso.evid.banda}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="15"/>
      <text class="n-texto" x="${n.x.toFixed(1)}" y="${(n.y + 4).toFixed(1)}" text-anchor="middle">${n.caso.radicado.slice(-4)}</text>
      <title>${n.caso.radicado} · ${n.caso.titular} · evidencia ${n.caso.evid.puntaje}</title></g>`;
  });
  $('svg-red').innerHTML = s;
  activarResaltadoRed();

  $('fichas-red').innerHTML = redes.map(r => {
    const monto = r.casos.reduce((s2, c) => s2 + c.monto, 0);
    const comercios = {}; r.casos.forEach(c => { comercios[c.comercio] = (comercios[c.comercio] || 0) + 1; });
    const top = Object.entries(comercios).sort((a, b) => b[1] - a[1])[0];
    return `<section class="tarjeta ficha-red">
      <h3 class="tarjeta-titulo">${r.titulo}</h3>
      <dl class="datos">
        <div><dt>Casos</dt><dd>${r.casos.length}</dd></div>
        <div><dt>Monto en disputa</dt><dd>${formatearMoneda(monto)}</dd></div>
        <div><dt>Comercio principal</dt><dd>${top[0]} (${top[1]})</dd></div>
        ${r.entidades.map(e => `<div><dt>${e.tipo}</dt><dd>${e.etiqueta} · ${e.casos.length} casos</dd></div>`).join('')}
      </dl>
      <div class="caja caja-alerta"><strong>Acción sugerida</strong><ul class="acciones-red">${r.acciones.map(a => `<li>${a}</li>`).join('')}</ul></div>
      <button type="button" class="btn btn-principal btn-contener" data-red="${r.clave}">Contener la red</button>
      <div class="lista-casos-red">${r.casos.map(c => `<button type="button" class="btn btn-secundario btn-compacto" data-caso="${c.id}">${c.radicado.slice(-4)} · ${c.titular.split(' ')[0]}</button>`).join('')}</div>
    </section>`;
  }).join('');
}

// ---- Calendario legal ----
function moverMes(delta) {
  let { anio, mes } = MES_VISTO;
  mes += delta;
  if (mes < 1) { mes = 12; anio--; }
  if (mes > 12) { mes = 1; anio++; }
  MES_VISTO = { anio, mes };
  renderizarCalendario();
}

function renderizarCalendario() {
  const { anio, mes } = MES_VISTO;
  $('titulo-mes').textContent = `${MESES_LARGOS[mes - 1]} ${anio}`;
  const festivos = obtenerSetFestivos(anio);
  const plazos = {};
  const sumar = (f, tipo) => { (plazos[f] = plazos[f] || { cotejo: 0, respuesta: 0, denuncia: 0 })[tipo]++; };
  CASOS.filter(c => c.abierto).forEach(c => {
    c.obligaciones.forEach(o => {
      if (!o.hecho && o.limite && o.texto !== 'No aplica') {
        if (o.paso.startsWith('Cotejar')) sumar(o.limite, 'cotejo');
        if (o.paso.startsWith('Responder')) sumar(o.limite, 'respuesta');
      }
    });
    if (!c.denunciaRecibida && c.lim.denuncia && c.lim.denuncia >= FECHA) sumar(c.lim.denuncia, 'denuncia');
  });
  const primero = new Date(Date.UTC(anio, mes - 1, 1));
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  let html = '<div class="cal-vacio"></div>'.repeat((primero.getUTCDay() + 6) % 7);
  for (let d = 1; d <= total; d++) {
    const iso = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(Date.UTC(anio, mes - 1, d)).getUTCDay();
    const clases = ['cal-dia'];
    if (festivos.has(iso)) clases.push('cal-festivo'); else if (dow === 0 || dow === 6) clases.push('cal-finde');
    if (iso === FECHA) clases.push('cal-hoy');
    const p = plazos[iso];
    const lineas = p ? ['cotejo', 'respuesta', 'denuncia'].filter(k => p[k]).map(k => `<span class="cal-plazo cal-${k}">${p[k]} ${k}</span>`).join('') : '';
    html += `<div class="${clases.join(' ')}"><span class="cal-num">${d}</span>
      ${festivos.has(iso) ? '<span class="cal-etq">Festivo</span>' : ''}
      ${iso === VIGENCIA ? '<span class="cal-etq cal-etq-ley">Entra en vigencia</span>' : ''}${lineas}</div>`;
  }
  $('dias-calendario').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', inicializarApp);
