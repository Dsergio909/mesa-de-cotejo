// ==== PANEL DE DETALLE: RELOJ LEGAL, COTEJO, DECISIÓN Y BORRADOR ====

let ID_ABIERTO = null;
let ORIGEN_FOCO = null;

// ---- Pestañas del caso ----
function activarPestana(nombre) {
  document.querySelectorAll('.pestana').forEach(b => {
    const activa = b.id === `pes-${nombre}`;
    b.setAttribute('aria-selected', String(activa));
    b.tabIndex = activa ? 0 : -1;
  });
  document.querySelectorAll('.pestana-panel').forEach(p => { p.hidden = p.id !== `tab-${nombre}`; });
  const cuerpo = document.querySelector('.panel-cuerpo');
  if (cuerpo) cuerpo.scrollTop = 0;
}

function abrirDetalle(id) {
  if (ID_ABIERTO === null) ORIGEN_FOCO = document.activeElement;
  const otroCaso = id !== ID_ABIERTO;
  ID_ABIERTO = id;
  if (otroCaso) activarPestana('resumen');
  $('panel-detalle').hidden = false;
  $('velo').hidden = false;
  document.body.classList.add('panel-abierto');
  pintarDetalle();
  $('btn-cerrar-detalle').focus();
}

function cerrarDetalle() {
  if (ID_ABIERTO === null) return;
  if (CONTROL_IA) CONTROL_IA.abort();
  const idCerrado = ID_ABIERTO;
  ID_ABIERTO = null;
  $('panel-detalle').hidden = true;
  $('velo').hidden = true;
  document.body.classList.remove('panel-abierto');
  // Si la vista se redibujó, el foco vuelve al elemento nuevo del mismo caso
  const destino = ORIGEN_FOCO && ORIGEN_FOCO.isConnected ? ORIGEN_FOCO : document.querySelector(`[data-caso="${idCerrado}"]`);
  if (destino && destino.focus) destino.focus();
}

function refrescarDetalle() {
  if (ID_ABIERTO === null) return;
  if (!CASOS.find(c => c.id === ID_ABIERTO)) { cerrarDetalle(); return; } // la fecha quedó antes de la radicación
  pintarDetalle();
};

function pintarDetalle() {
  const c = CASOS.find(x => x.id === ID_ABIERTO);
  if (!c) return;
  $('det-radicado').textContent = `${c.radicado} · radicado el ${formatearFecha(c.fechaRadicacion)} por ${c.canal.toLowerCase()}`;
  $('det-titular').textContent = c.titular;
  $('det-datos').innerHTML = `C.C. ${c.cedula} · ${c.ciudad} · <strong>${formatearMoneda(c.monto)}</strong> en ${c.comercio} (asesor ${c.asesor})`;
  $('det-estado').innerHTML = pill(c.est.texto, c.est.clase) + (c.proximo ? ` <span class="sub-linea">${c.proximo.nombre}${c.proximo.fecha ? ` · ${formatearFecha(c.proximo.fecha)}` : ''}</span>` : '');

  $('det-reloj').innerHTML = reglaSvg(c, true);
  $('det-reloj-nota').textContent = `Día hábil ${c.t} desde la radicación. El día de radicación no cuenta; sábados, domingos y festivos tampoco.`;

  $('det-obligaciones').innerHTML = c.obligaciones.map(o => `
    <li class="oblig oblig-${o.clase}">
      <div class="oblig-fila"><span class="oblig-paso">${o.paso}</span>${pill(o.texto, o.clase)}</div>
      <div class="oblig-meta">${o.articulo}${o.limite ? ` · límite ${formatearFecha(o.limite)}` : ''}</div>
      <div class="cita-ley">${o.cita}</div>${o.registro ? `
      <button type="button" class="btn btn-secundario btn-compacto btn-registrar" data-registrar="${o.registro}">Registrar como hecho hoy</button>` : ''}
    </li>`).join('') + `
    <li class="oblig oblig-${c.denunciaTitular.clase}">
      <div class="oblig-fila"><span class="oblig-paso">Denuncia del titular ante la Fiscalía (20 días hábiles)</span>${pill(c.denunciaTitular.texto, c.denunciaTitular.clase)}</div>
      <div class="oblig-meta">Art. 8 · si no llega, la entidad puede reanudar el cobro (parágrafo 1)</div>${c.puedeRegistrarDenuncia ? `
      <button type="button" class="btn btn-secundario btn-compacto btn-registrar" data-registrar="denuncia_titular">Registrar denuncia recibida hoy</button>` : ''}
    </li>` + (c.puedeRegistrarFallo ? `
    <li class="oblig oblig-neutro">
      <div class="oblig-fila"><span class="oblig-paso">Decisión judicial (art. 9)</span>${pill('Pendiente', 'neutro')}</div>
      <div class="oblig-meta">Art. 9 · registra el resultado cuando llegue</div>
      <div class="botones-registro"><button type="button" class="btn btn-secundario btn-compacto btn-registrar" data-registrar="fallo_suplantacion">Hubo suplantación</button>
      <button type="button" class="btn btn-secundario btn-compacto btn-registrar" data-registrar="fallo_sin_suplantacion">No hubo suplantación</button></div>
    </li>` : '');
  $('det-obligaciones').onclick = e => {
    const b = e.target.closest('[data-registrar]');
    if (!b) return;
    registrarDecision(c.id, b.dataset.registrar, `Registrado por el analista: ${NOMBRE_DECISION[b.dataset.registrar]}.`);
    avisoConDeshacer(c.id, `${c.radicado}: ${NOMBRE_DECISION[b.dataset.registrar]}.`);
  };

  $('det-cotejo').innerHTML = c.tablaCotejo.map(f => `
    <tr><th scope="row">${f.dato}</th><td>${f.aprob}</td><td>${f.titular}</td>
    <td>${pill(f.resultado, f.resultado === 'Coincide' ? 'bien' : f.resultado === 'Discrepa' ? 'critico' : 'neutro')}</td></tr>`).join('');

  const e = c.evid;
  pintarDocumentos(c);
  pintarWhatIf(c);
  pintarAsistenteCaso(c);
  $('det-recomendacion').innerHTML = `<strong>Recomendación.</strong> ${c.recomendacion}`
    + (c.investigacionSugerida ? ' Además, abrir investigación interna (art. 5 num. 10).' : '')
    + (e.banda !== 'alta' ? '<br><span class="cita-ley">La entidad no puede declarar que no hubo suplantación: eso lo deciden los jueces (art. 10, inciso 2).</span>' : '');

  pintarDecisiones(c);
  pintarBorrador(c);
  pintarIntegraciones();

  $('det-linea').innerHTML = c.eventos.map(ev => `
    <li class="${ev.critico ? 'ev-critico' : ''} ${ev.analista ? 'ev-analista' : ''}">
      <span class="lt-fecha">${formatearFecha(ev.fecha)}</span>
      <span class="lt-titulo">${ev.titulo}</span>
      ${ev.detalle ? `<span class="lt-detalle">${ev.detalle}</span>` : ''}
    </li>`).join('');
}

function pintarDecisiones(c) {
  const ya = tipo => c.decisiones.some(d => d.tipo === tipo);
  const b = { aprobar: $('btn-aprobar'), validar: $('btn-validar'), investigar: $('btn-investigar'), reanudar: $('btn-reanudar') };
  b.aprobar.disabled = !c.puedeAprobar;
  b.validar.disabled = !c.abierto || ya('validar');
  b.investigar.disabled = !c.abierto || ya('investigar');
  b.reanudar.disabled = !c.puedeReanudar;
  $('btn-suspender').hidden = !c.puedeSuspender;
  $('btn-acatar').hidden = !c.puedeAcatar;
  $('btn-prorrogar').hidden = !c.puedeProrrogar;
  $('btn-suspender').onclick = () => { registrarDecision(c.id, 'suspender', 'Orden de suspensión enviada a cobranza (art. 8).'); avisoConDeshacer(c.id, `${c.radicado}: cobro suspendido.`); };
  $('btn-acatar').onclick = () => { registrarDecision(c.id, 'acatar', 'Corrección en centrales con la leyenda y cierre del caso a favor del titular.'); avisoConDeshacer(c.id, `${c.radicado}: silencio acatado.`); };
  $('btn-prorrogar').onclick = () => { registrarDecision(c.id, 'prorrogar', 'Prórroga de 8 días hábiles informada al titular con su motivo (Ley 1266, art. 16-II num. 8, modificado por el art. 7).'); avisoConDeshacer(c.id, `${c.radicado}: respuesta prorrogada al ${formatearFecha(sumarHabiles(c.fechaRadicacion, 23))}.`); };
  b.aprobar.textContent = c.evid.banda === 'alta' ? 'Aprobar: exonerar al titular' : 'Aprobar: responder y mantener la suspensión';
  $('confirmar-reanudar').hidden = true;

  let nota;
  if (!c.abierto) nota = c.estado === 'silencio_acatado' ? 'El caso se cerró a favor del titular por silencio positivo. Queda como incumplimiento en la auditoría.' : 'El caso está cerrado.';
  else if (c.estado === 'cobro_activo') nota = 'Primero hay que suspender el cobro: es una orden inmediata del art. 8.';
  else if (c.estado === 'silencio') nota = 'El silencio positivo ya operó: el reclamo se entiende resuelto a favor del titular y una respuesta tardía no lo cambia. Solo queda acatarlo.';
  else if (c.respondido && c.puedeReanudar) nota = 'Venció el plazo de 20 días hábiles sin denuncia. Reanudar el cobro es opcional y queda registrado.';
  else if (c.respondido) nota = 'La respuesta de fondo ya se envió.';
  else nota = `La aprobación queda registrada con la fecha simulada (${formatearFecha(FECHA)}).`;
  $('det-nota-decision').textContent = nota;

  b.aprobar.onclick = () => {
    registrarDecision(c.id, 'aprobar', c.evid.banda === 'alta' ? 'Exoneración por art. 10.' : 'Respuesta de fondo: se mantiene la suspensión.');
    avisoConDeshacer(c.id, c.evid.banda === 'alta' ? `${c.radicado}: titular exonerado.` : `${c.radicado}: respuesta registrada.`);
  };
  // Exonerar después de responder (art. 10): la evidencia llegó tarde, por ejemplo con la denuncia
  const tipoExoneracion = c.puedeExonerar ? 'exonerar' : 'aprobar';
  if (c.puedeExonerar) {
    b.aprobar.disabled = false;
    b.aprobar.textContent = 'Exonerar ahora (art. 10)';
    b.aprobar.onclick = () => { registrarDecision(c.id, 'exonerar', 'Exoneración posterior a la respuesta: llegaron elementos que evidencian la suplantación (art. 10).'); avisoConDeshacer(c.id, `${c.radicado}: titular exonerado.`); };
  }
  // Control de cuatro ojos: la segunda firma es un paso aparte, con nombre propio, nunca un segundo clic en el mismo botón
  const dobleFirma = requiereDobleFirma(c);
  const propuesto = c.decisiones.some(d => d.tipo === 'proponer');
  $('det-doble-firma').hidden = !dobleFirma;
  $('confirmar-firma').hidden = true;
  $('btn-deshacer').hidden = !(DECISIONES[c.id] && DECISIONES[c.id].some(d => d.fecha <= FECHA));
  $('btn-deshacer').onclick = () => deshacerDecision(c.id);
  if (dobleFirma && !propuesto) {
    b.aprobar.textContent = 'Proponer exoneración (requiere segunda firma)';
    b.aprobar.onclick = () => { registrarDecision(c.id, 'proponer', `Propuesta de exoneración por ${formatearMoneda(c.monto)}; pasa a la supervisora.`); avisoConDeshacer(c.id, `${c.radicado}: propuesta enviada a segunda firma.`); };
  } else if (dobleFirma && propuesto) {
    b.aprobar.textContent = 'Pedir la firma de la supervisora';
    b.aprobar.onclick = () => { $('confirmar-firma').hidden = false; $('btn-firmar').focus(); };
    $('btn-firmar').onclick = () => { registrarDecision(c.id, tipoExoneracion, 'Exoneración con segunda firma de la supervisora Camila Rojas.'); avisoConDeshacer(c.id, `${c.radicado}: exonerado con doble firma.`); };
    $('btn-cancelar-firma').onclick = () => { $('confirmar-firma').hidden = true; b.aprobar.focus(); };
  }
  b.validar.onclick = () => { registrarDecision(c.id, 'validar', 'Prueba de validación de identidad (art. 6 num. 5).'); avisoConDeshacer(c.id, `${c.radicado}: validación pedida.`); };
  b.investigar.onclick = () => { registrarDecision(c.id, 'investigar', `Revisión del asesor ${c.asesor} y de ${c.comercio} (art. 5 num. 10).`); avisoConDeshacer(c.id, `${c.radicado}: escalado a investigación interna.`); };
  b.reanudar.onclick = () => { $('confirmar-reanudar').hidden = false; $('btn-confirmar-reanudar').focus(); };
  $('btn-cancelar-reanudar').onclick = () => { $('confirmar-reanudar').hidden = true; b.reanudar.focus(); };
  $('btn-confirmar-reanudar').onclick = () => {
    registrarDecision(c.id, 'reanudar', 'Cobro reanudado desde la fecha de suspensión (art. 8 par. 1).');
    avisoConDeshacer(c.id, `${c.radicado}: cobro reanudado.`);
  };
}

function pintarBorrador(c) {
  const hoy = formatearFecha(FECHA);
  const art = '(Ley 2573 de 2026)';
  let cuerpo, etiqueta = 'Borrador automático. Revísalo antes de enviarlo.';
  const diferencias = c.tablaCotejo.filter(f => f.resultado === 'Discrepa').map(f => f.dato.toLowerCase());
  if (c.estado === 'silencio' || c.estado === 'silencio_acatado') {
    cuerpo = `No le dimos respuesta de fondo ${c.prorrogado ? 'dentro de los veintitrés (23) días hábiles que permitía la prórroga' : 'dentro de los quince (15) días hábiles que fija la ley'}. Por eso su reclamo se entiende resuelto a su favor (Ley 1266, art. 16-II num. 8, modificado por el art. 7) ${art}. ${c.estado === 'silencio_acatado' ? 'Ya pedimos' : 'Hoy pedimos'} a las centrales de riesgo corregir el reporte con la leyenda «Víctima de Falsedad Personal», y el cobro sigue suspendido.`;
    if (c.estado === 'silencio') etiqueta = 'Borrador pendiente: se envía cuando el analista acate el silencio.';
  } else if (c.estado === 'cobro_activo') {
    cuerpo = `Detectamos que el cobro siguió activo después de su aviso del ${formatearFecha(c.fechaRadicacion)}. Suspendimos el cobro desde esa fecha, incluidos los intereses y los gastos de cobranza (art. 8) ${art}. Le pedimos disculpas por el error.`;
    etiqueta = 'Borrador pendiente: se envía cuando el analista suspenda el cobro.';
  } else if (c.prorrogado && !c.respondido) {
    cuerpo = `Le informamos que necesitamos ocho (8) días hábiles adicionales para responder de fondo su reclamo, porque estamos terminando la verificación de su identidad y de los documentos con que se aprobó el crédito (Ley 1266, art. 16-II num. 8, modificado por el art. 7) ${art}. La nueva fecha máxima de respuesta es el ${formatearFecha(c.lim.respuesta)}. Mientras tanto, el cobro, los intereses y los gastos de cobranza siguen suspendidos (art. 8).`;
    etiqueta = 'Comunicación de prórroga: debe salir antes de que venzan los 15 días hábiles, con el motivo.';
  } else if (c.reanudadoPorFallo) {
    cuerpo = `La autoridad judicial concluyó que no hubo suplantación de identidad en este crédito. Por eso reanudamos el cobro (art. 9) ${art}. Antes de cualquier reporte negativo a las centrales de riesgo le enviaremos la comunicación previa que exige la Ley 1266 (art. 12).`;
  } else if (c.exoneradoPorFallo) {
    cuerpo = `La autoridad judicial confirmó la suplantación de identidad en este crédito. Por eso queda exonerado de esta obligación (art. 9 y art. 10) ${art}. Pedimos a las centrales de riesgo corregir el reporte con la leyenda «Víctima de Falsedad Personal» y enviamos el reporte a la DIAN (art. 5, num. 2 y 8).`;
  } else if (c.estado === 'reanudado' || c.puedeReanudar) {
    cuerpo = `El ${formatearFecha(c.lim.denuncia)} venció el plazo de veinte (20) días hábiles para aportar la denuncia ante la Fiscalía y no la recibimos. Por eso reanudamos el cobro, con los intereses y gastos desde la fecha en que se suspendió (art. 8, parágrafo 1) ${art}. Antes de cualquier reporte negativo a las centrales de riesgo le enviaremos la comunicación previa que exige la Ley 1266 (art. 12). Si tiene la denuncia, puede enviárnosla por este mismo canal.`;
    if (c.puedeReanudar) etiqueta = 'Borrador condicionado: solo se envía si el analista reanuda el cobro.';
  } else if (c.exonerado || c.evid.banda === 'alta') {
    cuerpo = `Al cotejar los documentos con que se aprobó el crédito con los que usted aportó, encontramos elementos que evidencian la suplantación${diferencias.length ? ` (${diferencias.join(', ')})` : ''}. Por eso queda exonerado de esta obligación sin necesidad de presentar denuncia (art. 10) ${art}. Pedimos a las centrales de riesgo la leyenda «Víctima de Falsedad Personal», que no afecta su puntaje (Ley 1266, art. 16-II num. 7). ${c.discrepancias ? 'También denunciamos la estafa y enviamos el reporte a la DIAN (art. 5, num. 8 y 9).' : 'También enviamos el reporte a la DIAN (art. 5, num. 8).'}`;
    if (!c.exonerado) etiqueta = 'Borrador pendiente: se envía cuando el analista apruebe la exoneración.';
  } else if (c.denunciaRecibida) {
    cuerpo = `Recibimos la constancia de su denuncia. Pedimos a las centrales de riesgo la leyenda «Víctima de Falsedad Personal», que no afecta su puntaje (art. 5, num. 2). El cobro, los intereses y los gastos de cobranza siguen suspendidos hasta que la autoridad judicial decida (art. 9) ${art}.`;
  } else {
    cuerpo = `Resultado del cotejo: ${diferencias.length ? `encontramos diferencias entre los documentos con que se aprobó el crédito y los suyos (${diferencias.join(', ')})` : 'no encontramos diferencias entre los documentos con que se aprobó el crédito y los suyos'}.
Decisión: el cobro, los intereses y los gastos de cobranza siguen suspendidos desde el ${formatearFecha(c.fechaRadicacion)} (art. 8) ${art}.${c.discrepancias ? ' Pedimos a las centrales de riesgo la leyenda «Víctima de Falsedad Personal», que no afecta su puntaje (Ley 1266, art. 16-II num. 7).' : ''}
Usted tiene hasta el ${formatearFecha(c.lim.denuncia)} (veinte días hábiles) para presentar la denuncia ante la Fiscalía y enviarnos la constancia. Si no la recibimos, la ley nos permite reanudar el cobro (art. 8, parágrafo 1).${c.evid.banda === 'media' ? ' Para avanzar más rápido, le pedimos agendar una validación de identidad (art. 6, num. 5).' : ''} Si lo desea, le entregamos copia de los documentos con que se aprobó el crédito (art. 5, num. 7).`;
  }
  $('det-borrador').value = `Bogotá, ${hoy}

Señor(a) ${c.titular}
Radicado ${c.radicado}

Asunto: respuesta a su reclamo por suplantación de identidad

${cuerpo}

Crédito: ${formatearMoneda(c.monto)} en ${c.comercio}, compra del ${formatearFecha(sumarDiasCalendario(c.fechaRadicacion, -c.diasDesdeCompra))}.

Atentamente,
Mesa de Cotejo
Entidad de crédito (ficticia)`;
  $('det-borrador-etiqueta').textContent = etiqueta;
}

function copiarBorrador() {
  const area = $('det-borrador');
  const ok = () => mostrarAviso('Borrador copiado.');
  const respaldo = () => { area.focus(); area.select(); mostrarAviso('Texto seleccionado: cópialo con Ctrl+C.'); };
  try {
    navigator.clipboard.writeText(area.value).then(ok, respaldo);
  } catch (e) { respaldo(); }
}

// El foco no sale de la ventana que está encima (paleta, formulario o panel)
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !$('recorrido').hidden) return;
  const cont = [$('dialogo-atajos'), $('paleta'), $('dialogo-radicar'), $('panel-detalle')].find(x => !x.hidden);
  if (!cont) return;
  const f = [...cont.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex="0"]')].filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const primero = f[0], ultimo = f[f.length - 1];
  if (!cont.contains(document.activeElement)) { e.preventDefault(); primero.focus(); }
  else if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
});

// Cualquier elemento con data-caso abre ese caso (filas, nodos de la red, enlaces de la IA)
document.addEventListener('click', e => {
  const el = e.target.closest('[data-caso]');
  if (!el) return;
  if (!$('paleta').hidden) cerrarPaleta();
  abrirDetalle(Number(el.dataset.caso));
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('g[data-caso]');
  if (!el) return;
  e.preventDefault();
  abrirDetalle(Number(el.dataset.caso));
});

document.addEventListener('DOMContentLoaded', () => {
  $('btn-cerrar-detalle').addEventListener('click', cerrarDetalle);
  $('velo').addEventListener('click', cerrarDetalle);
  $('btn-copiar').addEventListener('click', copiarBorrador);
});

// Las decisiones se pueden deshacer desde el aviso durante unos segundos
function avisoConDeshacer(id, texto) { mostrarAviso(texto, () => deshacerDecision(id)); }
