// ==== HERRAMIENTAS DE PRODUCTO: pestañas, orden de la bandeja, tema, atajos y tendencias ====

// ---- Orden de la bandeja por columna ----
let ORDEN = { col: 'prioridad', dir: -1 };
const DESCENDENTE_PRIMERO = ['prioridad', 'monto', 'evidencia', 'fecha'];
const RANGO_ESTADO = Object.keys(ESTADOS);
function ordenarBandeja(lista) {
  const plazo = c => c.proximo && c.proximo.dias !== null ? c.proximo.dias : (c.abierto ? 900 : 999);
  const valor = {
    prioridad: c => c.prioridad, radicado: c => c.radicado, titular: c => c.titular, analista: c => c.analista,
    comercio: c => c.comercio, monto: c => c.monto, fecha: c => c.fechaRadicacion, plazo,
    evidencia: c => c.evid.puntaje, estado: c => RANGO_ESTADO.indexOf(c.estado)
  }[ORDEN.col];
  lista.sort((a, b) => {
    // Al ordenar por plazo, lo cerrado y lo que no tiene fecha va siempre al final, en cualquier sentido
    if (ORDEN.col === 'plazo' && (plazo(a) >= 900) !== (plazo(b) >= 900)) return plazo(a) >= 900 ? 1 : -1;
    const va = valor(a), vb = valor(b);
    const r = typeof va === 'string' ? va.localeCompare(vb, 'es') : va - vb;
    return r * ORDEN.dir || plazo(a) - plazo(b) || a.id - b.id;
  });
  document.querySelectorAll('#vista-bandeja th').forEach(th => {
    const b = th.querySelector('.orden');
    th.setAttribute('aria-sort', b && b.dataset.orden === ORDEN.col ? (ORDEN.dir > 0 ? 'ascending' : 'descending') : 'none');
  });
}

// ---- Tema: sistema, claro u oscuro ----
const TEMAS = ['sistema', 'claro', 'oscuro'];
let TEMA = 'sistema';
function aplicarTema(t) {
  TEMA = TEMAS.includes(t) ? t : 'sistema';
  if (TEMA === 'sistema') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', TEMA === 'claro' ? 'light' : 'dark');
  const b = $('btn-tema');
  b.setAttribute('aria-label', `Cambiar tema: ${TEMA}`);
  b.title = `Tema: ${TEMA}`;
  b.dataset.tema = TEMA;
  try { localStorage.setItem('mesa-cotejo.tema', TEMA); } catch (e) { /* nada */ }
}

// ---- Tendencia de los indicadores: últimos 10 días hábiles y cambio frente a hace 5 ----
function chispa(valores, clase) {
  const W = 84, H = 22, max = Math.max(...valores), min = Math.min(...valores), rango = max - min || 1;
  const pts = valores.map((v, i) => [2 + (i * (W - 4)) / (valores.length - 1), H - 3 - ((v - min) / rango) * (H - 6)]);
  const linea = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const [ux, uy] = pts[pts.length - 1];
  return `<svg class="chispa chispa-${clase}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${linea}"/><circle cx="${ux.toFixed(1)}" cy="${uy.toFixed(1)}" r="2.4"/></svg>`;
}
function renderizarTendencias() {
  const kpis = [
    ['kpi-abiertos', c => c.filter(x => x.abierto).length, 0],
    ['kpi-riesgo', c => c.filter(x => x.riesgoSilencio).length, 1],
    ['kpi-cotejos', c => c.filter(x => x.estado === 'cotejo_hoy').length, 1],
    ['kpi-suspendido', c => c.filter(x => x.cobroSuspendido).reduce((s, x) => s + x.monto, 0), 0],
    ['kpi-incumplidos', c => c.filter(x => ESTADOS[x.estado].clase === 'critico').length, 1]
  ];
  const fechas = [];
  for (let d = FECHA, i = 0; i < 10; i++, d = restarHabiles(d, 1)) fechas.unshift(d);
  const conjuntos = fechas.map(f => f === FECHA ? CASOS : CASOS_BASE.map(b => derivarCaso(b, f, DECISIONES[b.id])).filter(Boolean));
  kpis.forEach(([id, medir, subirEsMalo]) => {
    const serie = conjuntos.map(medir);
    const delta = serie[serie.length - 1] - serie[serie.length - 6];
    const dinero = id === 'kpi-suspendido';
    const magnitud = dinero ? `$${(Math.abs(delta) / 1e6).toFixed(1).replace('.', ',')} M` : String(Math.abs(delta));
    const clase = !delta || !subirEsMalo ? 'neutra' : delta > 0 ? 'mala' : 'buena';
    const texto = !delta ? 'Igual que hace 5 días hábiles' : `${delta > 0 ? '+' : '−'}${magnitud} frente a hace 5 días hábiles`;
    const kpi = $(id).closest('.kpi');
    let t = kpi.querySelector('.kpi-tendencia');
    if (!t) { t = document.createElement('div'); t.className = 'kpi-tendencia'; kpi.appendChild(t); }
    t.innerHTML = `${chispa(serie, clase)}<span class="delta delta-${clase}">${texto}</span>`;
  });
  if (typeof renderizarImpacto === 'function') renderizarImpacto();
  // Lectores de pantalla: al cambiar la fecha se anuncia el día y lo urgente
  if (ULTIMA_FECHA_ANUNCIADA !== FECHA) {
    if (ULTIMA_FECHA_ANUNCIADA !== null) {
      const urgentes = CASOS.filter(c => c.abierto && c.proximo && c.proximo.dias !== null && c.proximo.dias <= 1).length;
      $('anuncio-fecha').textContent = urgentes === 1 ? `Fecha simulada ${formatearFecha(FECHA)}. 1 caso vence hoy, mañana o ya venció.` : `Fecha simulada ${formatearFecha(FECHA)}. ${urgentes} casos vencen hoy, mañana o ya vencieron.`;
    }
    ULTIMA_FECHA_ANUNCIADA = FECHA;
  }
  // Contadores del menú: lo que pide atención hoy y los incumplimientos
  const atencion = CASOS.filter(c => c.abierto && c.proximo && c.proximo.dias !== null && c.proximo.dias <= 1).length;
  const criticos = CASOS.filter(c => ESTADOS[c.estado].clase === 'critico' && c.abierto).length;
  $('cuenta-bandeja').textContent = atencion || '';
  $('cuenta-cumplimiento').textContent = criticos || '';
  $('cuenta-bandeja').title = atencion ? `${atencion} casos vencen hoy, mañana o ya vencieron` : '';
  $('cuenta-cumplimiento').title = criticos ? `${criticos} incumplimientos abiertos` : '';
}

let ULTIMA_FECHA_ANUNCIADA = null;
let ATAJOS_SIMPLES = true;
try { ATAJOS_SIMPLES = localStorage.getItem('mesa-cotejo.atajos') !== 'no'; } catch (e) { /* quedan activos */ }

// ---- Atajos de teclado ----
const escribiendo = e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable;
function abrirAtajos() { $('dialogo-atajos').hidden = false; $('velo-paleta').hidden = false; $('atajos-cerrar').focus(); }
function cerrarAtajos() { if ($('dialogo-atajos').hidden) return false; $('dialogo-atajos').hidden = true; if ($('paleta').hidden && $('dialogo-radicar').hidden) $('velo-paleta').hidden = true; return true; }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !e.defaultPrevented && cerrarAtajos()) { e.preventDefault(); return; }
  // Ctrl+Z deshace la última decisión del caso abierto (también se puede con el botón del panel)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !escribiendo(e) && ID_ABIERTO !== null) { e.preventDefault(); deshacerDecision(ID_ABIERTO); return; }
  if (escribiendo(e) || e.ctrlKey || e.metaKey) return;
  const vistas = ['resumen', 'bandeja', 'red', 'cumplimiento', 'calendario', 'metodo'];
  if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault(); cambiarFecha(e.key === 'ArrowRight' ? sumarHabiles(FECHA, 1) : restarHabiles(FECHA, 1)); return;
  }
  if (e.altKey || !ATAJOS_SIMPLES) return;
  // Con un diálogo abierto, las letras sueltas no hacen nada; con el panel abierto solo valen J, K y ?
  if (['paleta', 'dialogo-radicar', 'dialogo-atajos'].some(id => !$(id).hidden) || !$('recorrido').hidden) return;
  if (ID_ABIERTO !== null && !['j', 'k', '?'].includes(e.key)) return;
  if (e.key === '?') { e.preventDefault(); abrirAtajos(); return; }
  if (/^[1-6]$/.test(e.key) && $('paleta').hidden) { location.hash = vistas[+e.key - 1]; return; }
  if ((e.key === 'j' || e.key === 'k') && ID_ABIERTO !== null) {
    const orden = LISTA_BANDEJA.length ? LISTA_BANDEJA : CASOS.slice().sort((a, b) => b.prioridad - a.prioridad).map(c => c.id);
    const i = orden.indexOf(ID_ABIERTO);
    const sig = orden[(i + (e.key === 'j' ? 1 : -1) + orden.length) % orden.length];
    if (sig !== undefined) abrirDetalle(sig);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pestana').forEach(b => b.addEventListener('click', () => activarPestana(b.id.replace('pes-', ''))));
  document.querySelector('.pestanas').addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...document.querySelectorAll('.pestana')];
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    const sig = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1]
      : tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    activarPestana(sig.id.replace('pes-', '')); sig.focus();
  });
  document.querySelectorAll('#vista-bandeja .orden').forEach(b => b.addEventListener('click', () => {
    const col = b.dataset.orden;
    ORDEN = ORDEN.col === col ? { col, dir: -ORDEN.dir } : { col, dir: DESCENDENTE_PRIMERO.includes(col) ? -1 : 1 };
    renderizarBandeja();
  }));
  let tema = 'sistema';
  try { tema = localStorage.getItem('mesa-cotejo.tema') || 'sistema'; } catch (e) { /* nada */ }
  aplicarTema(tema);
  $('btn-tema').addEventListener('click', () => aplicarTema(TEMAS[(TEMAS.indexOf(TEMA) + 1) % TEMAS.length]));
  $('btn-atajos').addEventListener('click', abrirAtajos);
  $('atajos-simples').checked = ATAJOS_SIMPLES;
  $('atajos-simples').addEventListener('change', e => {
    ATAJOS_SIMPLES = e.target.checked;
    try { localStorage.setItem('mesa-cotejo.atajos', ATAJOS_SIMPLES ? 'si' : 'no'); } catch (err) { avisarSinGuardar(); }
  });
  $('btn-saltar').addEventListener('click', () => $('contenido-principal').focus());
  $('atajos-cerrar').addEventListener('click', cerrarAtajos);
  iniciarIdioma();
  renderizarTendencias();
});

// ---- Vistas rápidas de la bandeja ----
let VISTA_RAPIDA = 'todos';
const VISTAS_RAPIDAS = {
  todos: () => true,
  pronto: c => c.abierto && c.proximo && c.proximo.dias !== null && c.proximo.dias <= 3,
  mios: c => c.analista === 'Tú',
  incumplidos: c => ESTADOS[c.estado].clase === 'critico',
  alta: c => c.evid.banda === 'alta',
  cerrados: c => !c.abierto
};
const filtroVistaRapida = c => VISTAS_RAPIDAS[VISTA_RAPIDA](c);

// ---- Exportar la bandeja filtrada a CSV (si el visor permite descargas) ----
let DESCARGAS = null;
(async () => {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try { DESCARGAS = await window.claude.use('downloads'); } catch (e) { DESCARGAS = null; }
  const b = document.getElementById('btn-exportar');
  if (b) b.hidden = !DESCARGAS;
})();
async function exportarCSV() {
  if (!DESCARGAS) return;
  const filas = LISTA_BANDEJA.map(id => CASOS.find(c => c.id === id)).filter(Boolean);
  const campo = v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
  const encabezado = ['radicado', 'titular', 'analista', 'comercio', 'ciudad', 'canal', 'monto_cop', 'radicado_el', 'estado', 'proximo_plazo', 'dias_habiles', 'evidencia', 'prioridad'];
  const lineas = filas.map(c => [c.radicado, c.titular, c.analista, c.comercio, c.ciudad, c.canal, c.monto, c.fechaRadicacion, c.est.texto,
    c.proximo ? c.proximo.nombre : '', c.proximo && c.proximo.dias !== null ? c.proximo.dias : '', c.evid.puntaje, c.prioridad].map(campo).join(','));
  const csv = '\ufeff' + [encabezado.join(','), ...lineas].join('\r\n');
  try {
    await DESCARGAS.save({ filename: `bandeja-cotejo-${FECHA}.csv`, data: new Blob([csv], { type: 'text/csv;charset=utf-8' }) });
    mostrarAviso(`Exportados ${filas.length} casos (datos ficticios).`);
  } catch (e) {
    mostrarAviso('No se descargó el archivo.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chip[data-vista]').forEach(b => b.addEventListener('click', () => {
    VISTA_RAPIDA = b.dataset.vista;
    document.querySelectorAll('.chip[data-vista]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderizarBandeja();
  }));
  document.getElementById('btn-exportar').addEventListener('click', exportarCSV);
});
