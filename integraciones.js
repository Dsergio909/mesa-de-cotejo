// ==== CONTROL Y TRAZABILIDAD: eventos de integración, bitácora, contención de redes, impacto y expediente ====

// ---- Evento de integración: lo que la mesa enviaría a cobranza, centrales y DIAN (contrato en inglés, como una API) ----
function eventoIntegracion(c, tipo, nota) {
  const alta = c.evid.banda === 'alta';
  const instrucciones = {
    suspender: { collections: 'SUSPEND_COLLECTIONS_AND_INTEREST' },
    proponer: { workflow: 'PENDING_SECOND_SIGNATURE' },
    aprobar: alta ? { collections: 'WRITE_OFF_FRAUD', creditBureaus: 'FLAG_IDENTITY_THEFT_VICTIM', taxAuthority: 'REPORT_IDENTITY_THEFT' }
      : { collections: 'KEEP_SUSPENDED', creditBureaus: c.discrepancias ? 'FLAG_IDENTITY_THEFT_VICTIM' : 'NO_CHANGE', customer: 'SEND_FORMAL_RESPONSE' },
    acatar: { collections: 'CLOSE_WITHOUT_COLLECTION', creditBureaus: 'FLAG_IDENTITY_THEFT_VICTIM' },
    reanudar: { collections: 'RESUME_FROM_SUSPENSION_DATE' },
    prorrogar: { customer: 'SEND_EXTENSION_NOTICE' },
    validar: { customer: 'SCHEDULE_IDENTITY_VALIDATION' },
    investigar: { internalAudit: 'OPEN_INVESTIGATION' },
    exonerar: { collections: 'WRITE_OFF_FRAUD', creditBureaus: 'FLAG_IDENTITY_THEFT_VICTIM', taxAuthority: 'REPORT_IDENTITY_THEFT' },
    cotejo: { creditBureaus: c.discrepancias ? 'CORRECT_RECORD_AND_FLAG_VICTIM' : 'NO_CHANGE' },
    centrales: { creditBureaus: 'FLAG_CLAIM_IN_PROCESS' },
    documentos: { customer: 'SEND_APPROVAL_DOCUMENTS' },
    denuncia_titular: { collections: 'KEEP_SUSPENDED_PENDING_COURT', creditBureaus: 'FLAG_IDENTITY_THEFT_VICTIM' },
    denuncia_entidad: { legal: 'FILE_CRIMINAL_COMPLAINT' },
    dian: { taxAuthority: 'REPORT_IDENTITY_THEFT' },
    fallo_suplantacion: { collections: 'WRITE_OFF_FRAUD', creditBureaus: 'FLAG_IDENTITY_THEFT_VICTIM', taxAuthority: 'REPORT_IDENTITY_THEFT' },
    fallo_sin_suplantacion: { collections: 'RESUME_AFTER_COURT_RULING', customer: 'SEND_PRIOR_NOTICE_BEFORE_REPORTING' }
  }[tipo] || {};
  return {
    event: `claim.decision.${tipo}`,
    idempotencyKey: `${c.radicado}:${tipo}:${FECHA}`,
    occurredAt: new Date().toISOString(),
    simulatedDate: FECHA,
    jurisdiction: 'CO', regulation: 'Ley 2573 de 2026',
    claim: { id: c.radicado, amountCOP: c.monto, merchant: c.comercio, evidenceScore: c.evid.puntaje },
    instructions: instrucciones,
    note: nota || ''
  };
}

// ---- Bitácora de decisiones: solo se agrega, nunca se reescribe (hora real y huella encadenada) ----
const CLAVE_BITACORA = 'mesa-cotejo.bitacora.v1';
let BITACORA = [];
try { BITACORA = JSON.parse(localStorage.getItem(CLAVE_BITACORA) || '[]'); } catch (e) { BITACORA = []; }
// Lo dañado o de otra versión se descarta; si falta una entrada, la verificación de la cadena lo mostrará
BITACORA = Array.isArray(BITACORA) ? BITACORA.filter(e => e && typeof e === 'object' && typeof e.huella === 'string' && typeof e.hora === 'string' && Number.isInteger(e.seq)) : [];
let COLA_BITACORA = Promise.resolve();
const contenidoBitacora = (anterior, e) => [anterior, e.seq, e.hora, e.fechaSimulada, e.radicado, e.actor, e.accion, e.nota].join('|');

let EPOCA_BITACORA = 0;
function anotarBitacora(c, tipo, nota) {
  // Hora, fecha y actor se fijan al decidir, no cuando la cola llega a esta entrada
  const segundaFirma = (tipo === 'aprobar' || tipo === 'exonerar') && c.decisiones.some(d => d.tipo === 'proponer');
  const datos = { hora: new Date().toISOString(), fechaSimulada: FECHA, radicado: c.radicado,
    actor: segundaFirma ? 'Camila Rojas (supervisora, segunda firma)' : 'Tú (analista)', accion: NOMBRE_DECISION[tipo], nota: nota || '' };
  const epoca = EPOCA_BITACORA;
  COLA_BITACORA = COLA_BITACORA.then(async () => {
    if (epoca !== EPOCA_BITACORA) return;   // la bitácora se vació mientras esta entrada esperaba
    const anterior = BITACORA.length ? BITACORA[BITACORA.length - 1].huella : CERO;
    const e = { seq: BITACORA.length + 1, ...datos };
    e.huella = window.crypto && crypto.subtle ? await sha256(contenidoBitacora(anterior, e)) : '(sin soporte)';
    BITACORA.push(e);
    try { localStorage.setItem(CLAVE_BITACORA, JSON.stringify(BITACORA)); } catch (err) { avisarSinGuardar(); }
    renderizarBitacora();
  });
}
function vaciarBitacora() {
  EPOCA_BITACORA++;
  BITACORA = [];
  try { localStorage.removeItem(CLAVE_BITACORA); } catch (e) { /* nada */ }
  renderizarBitacora();
}
function renderizarBitacora() {
  const cuerpo = $('bitacora-lista');
  if (!cuerpo) return;
  $('bitacora-vacia').hidden = BITACORA.length > 0;
  const localidad = IDIOMA === 'en' ? 'en-US' : IDIOMA === 'pt' ? 'pt-BR' : 'es-CO';
  cuerpo.innerHTML = BITACORA.slice().reverse().map(e => `<tr>
    <td class="num">${e.seq}</td><td class="num">${new Date(e.hora).toLocaleTimeString(localidad)}</td>
    <td class="num">${formatearFecha(e.fechaSimulada)}</td><td>${e.radicado}</td><td>${e.actor}</td><td>${e.accion}</td>
    <td class="huella">${e.huella.slice(0, 10)}</td></tr>`).join('');
}
async function verificarBitacora() {
  const salida = $('bitacora-verificacion');
  salida.hidden = false;
  if (!window.crypto || !crypto.subtle) { salida.className = 'caja'; salida.textContent = 'Este navegador no puede calcular las huellas (se necesita una conexión segura).'; return; }
  if (!BITACORA.length) { salida.className = 'caja'; salida.textContent = 'La bitácora está vacía: toma una decisión en cualquier caso.'; return; }
  let anterior = CERO, falla = -1;
  for (let i = 0; i < BITACORA.length; i++) {
    if (await sha256(contenidoBitacora(anterior, BITACORA[i])) !== BITACORA[i].huella) { falla = i; break; }
    anterior = BITACORA[i].huella;
  }
  salida.className = `caja ${falla === -1 ? 'caja-bien' : 'caja-critico'}`;
  salida.textContent = falla === -1 ? `Bitácora íntegra: ${BITACORA.length} decisiones verificadas.` : `La decisión ${falla + 1} fue alterada: su huella no coincide.`;
}

// ---- Contener una red: escalar a investigación y pedir validación en todos sus casos abiertos ----
function contenerRed(boton) {
  const red = construirRedes(CASOS).find(r => r.clave === boton.dataset.red);
  if (!red) return;
  const abiertos = red.casos.filter(c => c.abierto);
  if (!boton.dataset.confirmar) {
    boton.dataset.confirmar = '1';
    boton.textContent = `Confirmar: escalar y pedir validación en ${abiertos.length} casos`;
    setTimeout(() => { if (boton.isConnected) { delete boton.dataset.confirmar; boton.textContent = 'Contener la red'; } }, 6000);
    return;
  }
  const lote = [];
  abiertos.forEach(c => {
    if (!c.decisiones.some(d => d.tipo === 'investigar')) lote.push({ id: c.id, tipo: 'investigar', nota: `Contención de ${red.titulo}: ${red.entidades.length} datos compartidos (art. 5 num. 10).` });
    if (!c.decisiones.some(d => d.tipo === 'validar')) lote.push({ id: c.id, tipo: 'validar', nota: `Contención de ${red.titulo}: validación de identidad (art. 6 num. 5).` });
  });
  registrarDecisionesLote(lote);
  mostrarAviso(abiertos.length === 1 ? `${red.titulo} contenida: 1 caso escalado y con validación pedida.` : `${red.titulo} contenida: ${abiertos.length} casos escalados y con validación pedida.`);
}

// ---- Impacto financiero (supuestos explícitos, no calibrados) ----
const PERDIDA_ESPERADA = { alta: 0.9, media: 0.5, baja: 0.15 };
function renderizarImpacto() {
  if (!$('imp-silencio')) return;
  const suma = lista => lista.reduce((s, c) => s + c.monto, 0);
  $('imp-silencio').textContent = formatearMoneda(suma(CASOS.filter(c => c.estado === 'silencio' || c.estado === 'silencio_acatado')));
  $('imp-exonerado').textContent = formatearMoneda(suma(CASOS.filter(c => c.estado === 'exonerado')));
  const esperada = CASOS.filter(c => c.abierto && c.estado !== 'silencio').reduce((s, c) => s + c.monto * PERDIDA_ESPERADA[c.evid.banda], 0);
  $('imp-esperada').textContent = formatearMoneda(Math.round(esperada / 10000) * 10000);
}

// ---- Eventos y expediente descargable en la pestaña Actividad ----
function pintarIntegraciones() {
  const c = CASOS.find(x => x.id === ID_ABIERTO);
  if (!c || !$('det-eventos')) return;
  const eventos = c.decisiones.map(d => d.evento).filter(Boolean);
  $('det-eventos-cuenta').textContent = eventos.length;
  $('det-eventos').textContent = JSON.stringify(eventos, null, 2);
  $('btn-expediente').hidden = !DESCARGAS;
}
async function descargarExpediente() {
  const c = CASOS.find(x => x.id === ID_ABIERTO);
  if (!c || !DESCARGAS) return;
  const expediente = {
    generatedAt: new Date().toISOString(), simulatedDate: FECHA, regulation: 'Ley 2573 de 2026', fictitiousData: true,
    claim: { id: c.radicado, holder: c.titular, amountCOP: c.monto, merchant: c.comercio, advisor: c.asesor, analyst: c.analista, status: c.estado, businessDay: c.t },
    deadlines: c.lim,
    obligations: c.obligaciones.map(o => ({ step: o.paso, status: o.texto, article: o.articulo, deadline: o.limite })),
    crossCheck: c.tablaCotejo,
    evidence: { score: c.evid.puntaje, band: c.evid.banda, rules: c.evid.reglas.map(r => ({ rule: r.clave, weight: r.peso, text: r.texto })) },
    decisions: c.decisiones, timeline: c.eventos, decisionLog: BITACORA.filter(e => e.radicado === c.radicado)
  };
  const cuerpo = JSON.stringify(expediente, null, 2);
  const huella = window.crypto && crypto.subtle ? await sha256(cuerpo) : '';
  try {
    await DESCARGAS.save({ filename: `expediente-${c.radicado}.json`, data: new Blob([JSON.stringify({ sha256: huella, expediente }, null, 2)], { type: 'application/json' }) });
    mostrarAviso(`Expediente ${c.radicado} descargado con su huella SHA-256.`);
  } catch (e) { mostrarAviso('No se descargó el archivo.'); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => { const b = e.target.closest('.btn-contener'); if (b) contenerRed(b); });
  $('btn-verificar-bitacora').addEventListener('click', verificarBitacora);
  $('btn-expediente').addEventListener('click', descargarExpediente);
  renderizarBitacora();
});
