// ==== RECORRIDO, SIMULACIÓN, RECLAMO NUEVO, CUMPLIMIENTO Y DETALLES DEL CASO ====

const CLAVE_NUEVOS = 'mesa-cotejo.nuevos.v1';
const NUEVO_ID_BASE = 1000;

// ---- Reclamos radicados en la demo (por navegador) ----
function cargarNuevos() {
  let datos = [];
  try { datos = JSON.parse(localStorage.getItem(CLAVE_NUEVOS) || '[]'); } catch (e) { datos = []; }
  if (!Array.isArray(datos)) datos = [];
  datos.forEach(d => {
    // Se descarta lo dañado o de otra versión: id numérico, fecha válida, nombre y monto positivo
    if (!d || typeof d !== 'object' || !Number.isInteger(d.id) || typeof d.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) return;
    if (!d.datos || typeof d.datos !== 'object' || typeof d.datos.nombre !== 'string' || !(d.datos.monto > 0)) return;
    if (CASOS_BASE.some(c => c.id === d.id)) return;
    const c = crearCasoManual(d.datos, d.id, d.fecha);
    c.datosOriginales = d.datos;
    agregarCasoManual(c);
  });
}
function guardarNuevos() {
  const datos = CASOS_BASE.filter(c => c.manual).map(c => ({ id: c.id, fecha: c.fechaRadicacion, datos: c.datosOriginales }));
  try { localStorage.setItem(CLAVE_NUEVOS, JSON.stringify(datos)); } catch (e) { avisarSinGuardar(); }
}
function borrarNuevos() {
  quitarCasosManuales();
  try { localStorage.removeItem(CLAVE_NUEVOS); } catch (e) { /* nada */ }
}

function abrirRadicar() {
  $('dialogo-radicar').hidden = false; $('velo-paleta').hidden = false;
  $('rad-fecha').textContent = formatearFecha(esHabil(FECHA) ? FECHA : sumarHabiles(FECHA, 1));
  $('rad-nombre').focus();
}
function cerrarRadicar() { $('dialogo-radicar').hidden = true; if ($('paleta').hidden) $('velo-paleta').hidden = true; }

function radicar(e) {
  e.preventDefault();
  const f = $('form-radicar');
  const d = {
    // El nombre se pinta como HTML en varias vistas: solo se aceptan letras, espacios y signos de nombre
    nombre: $('rad-nombre').value.replace(/[^\p{L}\p{M} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60),
    cedula: $('rad-cedula').value.replace(/\D/g, ''), ciudad: $('rad-ciudad').value,
    canal: $('rad-canal').value, comercio: $('rad-comercio').value, categoria: $('rad-categoria').value,
    monto: Math.round(Number($('rad-monto').value) || 0), diasDesdeCompra: 30
  };
  f.querySelectorAll('input[type="checkbox"]').forEach(ch => { d[ch.value] = ch.checked; });
  if (FECHA < VIGENCIA) { $('rad-error').textContent = 'La ley rige desde el 19 nov 2026. Mueve la fecha simulada a ese día o después.'; return; }
  if ((d.nombre.match(/\p{L}/gu) || []).length < 3) { $('rad-error').textContent = 'Escribe el nombre del titular (solo letras).'; $('rad-nombre').focus(); return; }
  if (d.monto < 50000 || d.monto > 20000000) { $('rad-error').textContent = 'El monto debe estar entre $50.000 y $20.000.000.'; $('rad-monto').focus(); return; }
  const id = Math.max(NUEVO_ID_BASE, ...CASOS_BASE.map(c => c.id)) + 1;
  const fecha = esHabil(FECHA) ? FECHA : sumarHabiles(FECHA, 1);
  const caso = crearCasoManual(d, id, fecha);
  caso.datosOriginales = d;
  agregarCasoManual(caso); guardarNuevos();
  f.reset(); $('rad-error').textContent = '';
  cerrarRadicar();
  if (fecha !== FECHA) cambiarFecha(fecha); else actualizarTodo();
  abrirDetalle(id);
  mostrarAviso(`${caso.radicado} radicado. El reloj legal empezó a correr.`);
}

// ---- Reproducir el primer mes: avanza día hábil por día hábil ----
let TEMPORIZADOR_MES = null;
function reproducirMes() {
  if (TEMPORIZADOR_MES) { detenerMes(); return; }
  location.hash = 'resumen';
  cerrarDetalle();
  const fin = sumarHabiles(FECHA_DEFECTO, 3);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paso = reducido ? 1400 : 520, salto = reducido ? 5 : 1;
  cambiarFecha(VIGENCIA);
  $('btn-reproducir').textContent = 'Detener';
  $('btn-reproducir').setAttribute('aria-pressed', 'true');
  TEMPORIZADOR_MES = setInterval(() => {
    if (FECHA >= fin) { detenerMes(); return; }
    const siguiente = sumarHabiles(FECHA, salto);
    cambiarFecha(siguiente > fin ? fin : siguiente);
  }, paso);
}
function detenerMes() {
  clearInterval(TEMPORIZADOR_MES); TEMPORIZADOR_MES = null;
  $('btn-reproducir').textContent = 'Reproducir el mes';
  $('btn-reproducir').setAttribute('aria-pressed', 'false');
}

// ---- Recorrido guiado para quien ve la demo por primera vez ----
const PASOS_RECORRIDO = [
  { sel: '#barra .barra-fecha', titulo: 'El reloj de la ley', texto: 'Esta fecha es simulada. La Ley 2573 rige desde el 19 de noviembre de 2026; aquí ves la mesa un mes después. Muévela un día y todos los plazos se recalculan.', antes: () => { location.hash = 'resumen'; cerrarDetalle(); } },
  { sel: '.kpis', titulo: 'Lo que importa hoy', texto: 'Si la respuesta de fondo no sale en 15 días hábiles, el reclamo se entiende resuelto a favor del titular (silencio positivo). Aquí ves cuántos casos están a punto de vencer y cuántos ya se incumplieron.', antes: () => irResumen() },
  { sel: '#lista-vencimientos', titulo: 'La regla de días hábiles', texto: 'Cada caso tiene su regla: cotejo al día 10, respuesta al 15, denuncia del titular al 20. Los festivos de Colombia se calculan con la ley Emiliani y la Pascua.', antes: () => irResumen() },
  { sel: '#det-reloj', titulo: 'Un caso en riesgo', texto: 'Este caso está a pocos días del silencio positivo. La mesa muestra cada obligación con su artículo y su fecha límite.', antes: () => {
    const abiertos = CASOS.filter(c => c.abierto && c.proximo && c.proximo.dias !== null && c.proximo.dias >= 0).sort((a, b) => a.proximo.dias - b.proximo.dias);
    const caso = CASOS.find(c => c.estado === 'riesgo') || abiertos[0] || CASOS[0];
    CASO_RECORRIDO = caso ? caso.id : null;
    if (caso) abrirDetalle(caso.id);
  } },
  { sel: '#det-cotejo-bloque', titulo: 'El cotejo', texto: 'Lo que se recibió al aprobar el crédito contra lo que trae el titular. Cada discrepancia suma al puntaje de evidencia, y cada regla dice por qué sumó.', antes: () => { abrirCasoRecorrido(); activarPestana('cotejo'); } },
  { sel: '#det-decision', titulo: 'Decide una persona', texto: 'La mesa recomienda y el analista aprueba. No existe el botón «rechazar»: la ley dice que solo un juez puede declarar que no hubo suplantación (art. 10).', antes: () => { abrirCasoRecorrido(); activarPestana('resumen'); } },
  { sel: '#svg-red', titulo: 'Fraude organizado', texto: 'Nueve reclamos comparten dos dispositivos y tres direcciones; siete salieron del mismo asesor. Eso ya no es un caso suelto: es una investigación interna (art. 5 num. 10).', antes: () => { cerrarDetalle(); location.hash = 'red'; } },
  { sel: '#btn-paleta', titulo: 'Pregúntale a la mesa', texto: 'Con Ctrl+K buscas casos, saltas entre vistas o le preguntas a la IA. La IA consulta el calendario de la mesa para las fechas: nunca las inventa.', antes: () => { cerrarDetalle(); location.hash = 'resumen'; } }
];
let PASO_ACTUAL = -1;
// Cada paso deja la vista, el caso y la pestaña como deben estar, también al ir hacia atrás
let CASO_RECORRIDO = null;
const irResumen = () => { cerrarDetalle(); location.hash = 'resumen'; };
function abrirCasoRecorrido() {
  location.hash = 'resumen';
  if (CASO_RECORRIDO === null) PASOS_RECORRIDO[3].antes();
  else if (ID_ABIERTO !== CASO_RECORRIDO) abrirDetalle(CASO_RECORRIDO);
}

function iniciarRecorrido() {
  if (TEMPORIZADOR_MES) detenerMes();
  cerrarPaleta();
  if (FECHA !== FECHA_DEFECTO) cambiarFecha(FECHA_DEFECTO);
  $('recorrido').hidden = false;
  irAPaso(0);
}
function cerrarRecorrido() {
  if ($('recorrido').hidden) return;
  $('recorrido').hidden = true; PASO_ACTUAL = -1;
}
function irAPaso(i) {
  if (i < 0 || i >= PASOS_RECORRIDO.length) { cerrarRecorrido(); return; }
  PASO_ACTUAL = i;
  const p = PASOS_RECORRIDO[i];
  if (p.antes) p.antes();
  aplicarRuta();
  requestAnimationFrame(() => {
    const el = document.querySelector(p.sel);
    if (el) el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(() => colocarFoco(el), 320);
  });
  $('rec-paso').textContent = `${i + 1} de ${PASOS_RECORRIDO.length}`;
  $('rec-titulo').textContent = p.titulo;
  $('rec-texto').textContent = p.texto;
  $('rec-anterior').disabled = i === 0;
  $('rec-siguiente').textContent = i === PASOS_RECORRIDO.length - 1 ? 'Terminar' : 'Siguiente';
  $('rec-siguiente').focus();
}
function colocarFoco(el) {
  const foco = $('rec-foco');
  if (!el) { foco.hidden = true; return; }
  const r = el.getBoundingClientRect(), m = 6;
  foco.hidden = false;
  Object.assign(foco.style, { top: `${r.top - m}px`, left: `${r.left - m}px`, width: `${r.width + 2 * m}px`, height: `${r.height + 2 * m}px` });
  const tarjeta = $('rec-tarjeta');
  const abajo = r.bottom + 16 + tarjeta.offsetHeight < innerHeight;
  const arriba = r.top - 16 - tarjeta.offsetHeight > 0;
  if (innerWidth < 640 || (!abajo && !arriba)) { tarjeta.classList.add('rec-fija'); tarjeta.style.top = ''; tarjeta.style.left = ''; return; }
  tarjeta.classList.remove('rec-fija');
  tarjeta.style.top = `${abajo ? r.bottom + 14 : r.top - 14 - tarjeta.offsetHeight}px`;
  tarjeta.style.left = `${Math.max(16, Math.min(innerWidth - tarjeta.offsetWidth - 16, r.left))}px`;
}

// ---- Cumplimiento y auditoría ----
function renderizarCumplimiento() {
  if (!$('vista-cumplimiento')) return;
  const tipos = [
    { clave: 'suspension', nombre: 'Suspender el cobro', plazo: 'Inmediato', art: 'Art. 8 inc. 2', limite: c => c.fechaRadicacion },
    { clave: 'cotejo', nombre: 'Cotejo y corrección en centrales', plazo: '10 días hábiles', art: 'Ley 1266, art. 16-II num. 7 (mod. art. 7 Ley 2573)', limite: c => c.lim.cotejo },
    { clave: 'respuesta', nombre: 'Respuesta de fondo', plazo: '15 días hábiles', art: 'Ley 1266, art. 16-II num. 8 (mod. art. 7 Ley 2573)', limite: c => c.lim.respuesta }
  ];
  let aTiempo = 0, vencidas = 0;
  const filas = tipos.map(t => {
    let ok = 0, tarde = 0, pend = 0, venc = 0;
    CASOS.forEach(c => {
      const hecha = c.fechas[t.clave], lim = t.limite(c);
      if (t.clave === 'suspension' && hecha === null) { venc++; return; }
      if (hecha) { hecha <= lim ? ok++ : tarde++; }
      else if (FECHA > lim) venc++; else pend++;
    });
    aTiempo += ok; vencidas += tarde + venc;
    return { ...t, ok, tarde, pend, venc };
  });
  const medibles = aTiempo + vencidas;
  const pct = medibles ? Math.round((aTiempo / medibles) * 1000) / 10 : 100;
  const cotejados = CASOS.filter(c => c.fechas.cotejo);
  const tCotejo = cotejados.length ? cotejados.reduce((s, c) => s + habilesEntre(c.fechaRadicacion, c.fechas.cotejo), 0) / cotejados.length : 0;
  const respondidos = CASOS.filter(c => c.fechas.respuesta);
  const tResp = respondidos.length ? respondidos.reduce((s, c) => s + habilesEntre(c.fechaRadicacion, c.fechas.respuesta), 0) / respondidos.length : 0;
  const exposicion = CASOS.filter(c => c.riesgoSilencio || c.estado === 'silencio').reduce((s, c) => s + c.monto, 0);
  const dec = n => n.toFixed(1).replace('.', ',');
  $('cum-pct').textContent = medibles ? `${String(pct).replace('.', ',')} %` : 'Sin datos';
  $('cum-pct-nota').textContent = `${aTiempo} de ${medibles} plazos medidos se cumplieron a tiempo`;
  $('cum-cotejo').textContent = cotejados.length ? `${dec(tCotejo)} días` : 'Sin datos';
  $('cum-resp').textContent = respondidos.length ? `${dec(tResp)} días` : 'Sin datos';
  $('cum-exposicion').textContent = formatearMoneda(exposicion);
  $('cum-tabla').innerHTML = filas.map(f => `<tr><td>${f.nombre}<span class="sub">${f.art}</span></td><td>${f.plazo}</td>
    <td class="num">${f.ok}</td><td class="num">${f.tarde}</td><td class="num ${f.venc ? 'txt-critico' : ''}">${f.venc}</td><td class="num">${f.pend}</td></tr>`).join('');
  // Registro encadenado: cada fila guarda la huella SHA-256 de su contenido más la de la fila anterior
  const regs = [];
  CASOS.forEach(c => c.eventos.forEach(ev => regs.push({ fecha: ev.fecha, quien: ev.analista ? 'Analista' : 'Sistema', radicado: c.radicado, id: c.id, accion: ev.titulo, critico: !!ev.critico })));
  regs.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.radicado.localeCompare(b.radicado) || a.accion.localeCompare(b.accion));
  const turno = ++TURNO_CADENA;
  construirCadena(regs).then(cadena => {
    if (turno !== TURNO_CADENA) return;
    CADENA = cadena;
    $('cum-cadena').textContent = `${cadena.length} registros encadenados. Última huella: ${cadena.length ? cadena[cadena.length - 1].huella.slice(0, 16) : 'ninguna'}…`;
    $('cum-registro').innerHTML = cadena.slice(-40).reverse().map(r => `<tr class="${r.critico ? 'fila-critico' : ''}">
      <td class="num">${formatearFecha(r.fecha)}</td><td>${r.quien}</td>
      <td><button type="button" class="enlace-caso" data-caso="${r.id}">${r.radicado}</button></td><td>${r.accion}</td><td class="huella">${r.huella.slice(0, 10)}</td></tr>`).join('');
  });
}

let CADENA = [], TURNO_CADENA = 0;
const CERO = '0'.repeat(64);
async function sha256(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const contenidoRegistro = (anterior, r) => [anterior, r.fecha, r.quien, r.radicado, r.accion].join('|');
async function construirCadena(regs) {
  if (!window.crypto || !crypto.subtle) return regs.map(r => ({ ...r, huella: '(sin soporte)' }));
  let anterior = CERO;
  const salida = [];
  for (const r of regs) { const huella = await sha256(contenidoRegistro(anterior, r)); salida.push({ ...r, huella }); anterior = huella; }
  return salida;
}
// Devuelve la posición del primer registro cuya huella ya no coincide, o -1 si la cadena está íntegra
async function verificarCadena(cadena) {
  let anterior = CERO;
  for (let i = 0; i < cadena.length; i++) {
    if (await sha256(contenidoRegistro(anterior, cadena[i])) !== cadena[i].huella) return i;
    anterior = cadena[i].huella;
  }
  return -1;
}
async function mostrarVerificacion(alterar) {
  const salida = $('cum-verificacion');
  if (!CADENA.length || !window.crypto || !crypto.subtle) { salida.hidden = false; salida.textContent = 'Este navegador no puede calcular las huellas.'; return; }
  const copia = CADENA.map(r => ({ ...r }));
  let i = -1;
  if (alterar) {
    i = Math.floor(copia.length * 0.6);
    copia[i].accion = copia[i].accion === 'Respuesta de fondo: titular exonerado' ? 'Reclamo cerrado sin respuesta' : 'Respuesta de fondo: titular exonerado';
    copia[i].quien = 'Analista';
  }
  const falla = await verificarCadena(copia);
  salida.hidden = false;
  salida.className = `caja ${falla === -1 ? 'caja-bien' : 'caja-critico'}`;
  salida.textContent = falla === -1
    ? `Cadena íntegra: ${copia.length} registros verificados, del primero al último.`
    : `Alteración detectada en el registro ${falla + 1} de ${copia.length} (${copia[falla].radicado}, ${formatearFecha(copia[falla].fecha)}). Simulamos cambiar esa acción por «${copia[falla].accion}»: su huella ya no coincide y la cadena se rompe desde ahí. El registro real no cambió.`;
}

// ---- Documentos lado a lado (representación ficticia) ----
function pintarDocumentos(c) {
  const doc = (titulo, nombre, exp, huella, bio, propio) => {
    const marca = (a, b) => a !== b ? ' class="dif"' : '';
    return `<figure class="doc ${propio ? 'doc-titular' : ''}">
      <figcaption>${titulo}</figcaption>
      <div class="doc-cuerpo">
        <svg class="doc-foto" viewBox="0 0 40 48" aria-hidden="true"><rect width="40" height="48" rx="3" class="doc-foto-fondo"/><circle cx="20" cy="18" r="8" class="doc-foto-silueta"/><path d="M6 44c2-9 8-13 14-13s12 4 14 13z" class="doc-foto-silueta"/></svg>
        <dl>
          <div><dt>Nombre</dt><dd>${nombre}</dd></div>
          <div><dt>Cédula</dt><dd>${c.cedula}</dd></div>
          <div><dt>Expedición</dt><dd${marca(exp, propio ? c.expAprob : c.expTitular)}>${exp}</dd></div>
          <div><dt>Serie</dt><dd${marca(huella, propio ? c.docAprob : c.docTitular)}>${huella.toUpperCase()}</dd></div>
          <div><dt>Selfie</dt><dd${propio ? '' : (bio < 0.7 ? ' class="dif"' : '')}>${propio ? `revalidada: ${revalidacion(c)}` : `coincidencia ${bio.toFixed(2).replace('.', ',')}`}</dd></div>
        </dl>
      </div></figure>`;
  };
  $('det-documentos').innerHTML = doc('Documento con el que se aprobó', c.titular, c.expAprob, c.docAprob, c.biometria, false)
    + doc('Documento que aporta el titular', c.titular, c.expTitular, c.docTitular, 0.97, true);
}

// ---- ¿Y si…? Quitar reglas para ver cómo cambia el puntaje ----
const IGNORADAS = new Set();
let CASO_WHATIF = null;
function pintarWhatIf(c) {
  if (CASO_WHATIF !== c.id) { IGNORADAS.clear(); CASO_WHATIF = c.id; }
  const e = puntuar(c, c.denunciaRecibida, IGNORADAS);
  $('det-puntaje').textContent = e.puntaje;
  $('det-banda').textContent = BANDAS[e.banda].nombre;
  $('det-barra').style.width = `${e.puntaje}%`;
  $('det-barra').className = `evid-relleno ev-${e.banda}`;
  $('det-simulado').hidden = IGNORADAS.size === 0;
  $('det-simulado').textContent = IGNORADAS.size ? `Simulación: sin ${IGNORADAS.size === 1 ? 'una regla' : `${IGNORADAS.size} reglas`}, el puntaje real es ${c.evid.puntaje}. Nada cambia en el caso.` : '';
  $('det-reglas').innerHTML = e.reglas.length ? e.reglas.map(r => `
    <li class="${r.ignorada ? 'regla-ignorada' : ''}"><label><input type="checkbox" ${r.ignorada ? '' : 'checked'} data-clave="${r.clave}"><span>${r.texto}</span></label>
    <span class="peso ${r.peso < 0 ? 'peso-menos' : ''}">${r.peso > 0 ? '+' : '−'}${Math.abs(r.peso)}</span></li>`).join('')
    : '<li><span>Ninguna regla sumó puntos.</span><span class="peso">0</span></li>';
  $('det-reglas').querySelectorAll('input').forEach(ch => ch.onchange = () => {
    ch.checked ? IGNORADAS.delete(ch.dataset.clave) : IGNORADAS.add(ch.dataset.clave);
    pintarWhatIf(c);
  });
}

// ---- Red: resaltar lo conectado al pasar o enfocar un nodo ----
function activarResaltadoRed() {
  const svg = $('svg-red');
  const vecinos = {};
  svg.querySelectorAll('line.arista').forEach(l => {
    const a = l.dataset.a, b = l.dataset.b;
    (vecinos[a] = vecinos[a] || new Set()).add(b); (vecinos[b] = vecinos[b] || new Set()).add(a);
  });
  const encender = id => {
    svg.classList.add('red-enfocada');
    const v = vecinos[id] || new Set();
    svg.querySelectorAll('[data-n]').forEach(n => n.classList.toggle('activo', n.dataset.n === id || v.has(n.dataset.n)));
    svg.querySelectorAll('line.arista').forEach(l => l.classList.toggle('activa', l.dataset.a === id || l.dataset.b === id));
  };
  const apagar = () => { svg.classList.remove('red-enfocada'); svg.querySelectorAll('.activo, .activa').forEach(n => n.classList.remove('activo', 'activa')); };
  svg.querySelectorAll('[data-n]').forEach(n => {
    n.addEventListener('mouseenter', () => encender(n.dataset.n)); n.addEventListener('focus', () => encender(n.dataset.n));
    n.addEventListener('mouseleave', apagar); n.addEventListener('blur', apagar);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  $('btn-reproducir').addEventListener('click', reproducirMes);
  $('btn-verificar').addEventListener('click', () => mostrarVerificacion(false));
  $('btn-alterar').addEventListener('click', () => mostrarVerificacion(true));
  $('btn-recorrido').addEventListener('click', iniciarRecorrido);
  $('btn-radicar').addEventListener('click', abrirRadicar);
  $('form-radicar').addEventListener('submit', radicar);
  $('rad-cancelar').addEventListener('click', cerrarRadicar);
  $('rec-siguiente').addEventListener('click', () => irAPaso(PASO_ACTUAL + 1));
  $('rec-anterior').addEventListener('click', () => irAPaso(PASO_ACTUAL - 1));
  $('rec-salir').addEventListener('click', cerrarRecorrido);
  $('rad-comercio').innerHTML = COMERCIOS.map(c => `<option>${c}</option>`).join('');
  $('rad-canal').innerHTML = CANALES.map(c => `<option>${c}</option>`).join('');
  $('rad-ciudad').innerHTML = [...CIUDADES, 'Soacha'].map(c => `<option>${c}</option>`).join('');
  $('rad-categoria').innerHTML = CATEGORIAS.map(c => `<option>${c}</option>`).join('');
  const reubicar = () => { if (PASO_ACTUAL >= 0) colocarFoco(document.querySelector(PASOS_RECORRIDO[PASO_ACTUAL].sel)); };
  window.addEventListener('resize', reubicar);
  document.addEventListener('scroll', reubicar, { passive: true, capture: true });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('recorrido').hidden) { cerrarRecorrido(); e.preventDefault(); }
    else if (!$('dialogo-radicar').hidden) { cerrarRadicar(); e.preventDefault(); }
  });
});
