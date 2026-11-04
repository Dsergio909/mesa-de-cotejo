// Pruebas de la Mesa de Cotejo. Correr con: node pruebas.js
// Sin dependencias: carga los mismos archivos que usa la página en un contexto aislado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sinUso = () => null;
const contexto = {
  console, crypto: globalThis.crypto, TextEncoder,
  document: { addEventListener: sinUso, getElementById: sinUso, querySelector: sinUso, querySelectorAll: () => [] },
  localStorage: { getItem: sinUso, setItem: sinUso, removeItem: sinUso },
  matchMedia: () => ({ matches: false }), $: sinUso
};
contexto.window = contexto;
vm.createContext(contexto);
for (const archivo of ['calendario.js', 'datos.js', 'idiomas.js', 'idioma-en.js', 'idioma-pt.js', 'extras.js', 'integraciones.js', 'pro.js', 'asistente.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, archivo), 'utf8'), contexto, { filename: archivo });
}
const js = codigo => vm.runInContext(codigo, contexto);

const cola = [];
const prueba = (nombre, fn) => cola.push({ nombre, fn });
const seccion = titulo => cola.push({ titulo });
function igual(real, esperado, que) {
  const a = JSON.stringify(real), b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${que || 'valor'}: se esperaba ${b} y salió ${a}`);
}
function cierto(cond, que) { if (!cond) throw new Error(que); }

const HOY = '2026-12-22';
js(`var derivar = (b, f, d, c) => derivarCaso(b, f, d, c);
    var casosEn = (f, dec) => CASOS_BASE.map(b => derivarCaso(b, f, dec && dec[b.id])).filter(Boolean);
    var contar = lista => lista.reduce((m, c) => (m[c.estado] = (m[c.estado] || 0) + 1, m), {});`);

seccion('Calendario legal');
prueba('los 19 festivos de Colombia en 2026 (incluye el 13 de julio por la Ley 2578 de 2026)', () => {
  igual(js('festivosColombia(2026)'), ['2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08',
    '2026-06-15', '2026-06-29', '2026-07-13', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'], 'festivos');
});
prueba('2027 trae Año Nuevo y Reyes trasladado al lunes 11 de enero', () => {
  cierto(js(`festivosColombia(2027).includes('2027-01-01') && festivosColombia(2027).includes('2027-01-11')`), 'faltan festivos de 2027');
});
prueba('10, 15 y 20 días hábiles desde el 19 nov 2026 (el 8 dic es festivo)', () => {
  igual([10, 15, 20].map(n => js(`sumarHabiles('2026-11-19', ${n})`)), ['2026-12-03', '2026-12-11', '2026-12-18']);
});
prueba('el día de radicación no cuenta y los fines de semana tampoco', () => {
  igual(js(`habilesEntre('2026-12-18', '2026-12-21')`), 1, 'viernes a lunes');
  igual(js(`habilesEntre('2026-12-22', '2026-12-22')`), 0, 'mismo día');
});
prueba('restar y sumar días hábiles son inversos en 2026', () => {
  const malos = js(`(() => { const m = []; for (let d = '2026-01-02'; d < '2026-12-20'; d = sumarHabiles(d, 1)) { if (restarHabiles(sumarHabiles(d, 7), 7) !== d) m.push(d); } return m; })()`);
  igual(malos, [], 'fechas que no vuelven');
});

seccion('Modelo de casos');
prueba('los datos de ejemplo son deterministas', () => {
  igual(js('JSON.stringify(generarCasosBase())') === js('JSON.stringify(generarCasosBase())'), true, 'dos generaciones iguales');
});
prueba('estados el 22 dic 2026: 2 silencios, 1 cobro activo, 3 en riesgo, 2 cotejos hoy, 6 nuevos', () => {
  const e = js(`contar(casosEn('${HOY}'))`);
  igual([e.silencio, e.cobro_activo, e.riesgo, e.cotejo_hoy, e.nuevo], [2, 1, 3, 2, 6]);
  igual(js(`casosEn('${HOY}').length`), 54, 'casos');
});
prueba('antes de la vigencia no hay casos', () => { igual(js(`casosEn('2026-11-18').length`), 0); });
prueba('aprobar tarde no borra el silencio positivo, y acatarlo cierra el caso', () => {
  const r = js(`(() => { const s = casosEn('${HOY}').find(c => c.estado === 'silencio'); const b = CASOS_BASE.find(x => x.id === s.id);
    return [derivar(b, '${HOY}', [{ tipo: 'aprobar', fecha: '${HOY}' }]).estado, derivar(b, '${HOY}', [{ tipo: 'acatar', fecha: '${HOY}' }]).estado,
      derivar(b, '${HOY}', [{ tipo: 'acatar', fecha: '${HOY}' }]).abierto, s.puedeAprobar]; })()`);
  igual(r, ['silencio', 'silencio_acatado', false, false]);
});
prueba('suspender tarde un cobro activo queda registrado como tarde', () => {
  const r = js(`(() => { const s = casosEn('${HOY}').find(c => c.estado === 'cobro_activo'); const d = derivar(CASOS_BASE.find(x => x.id === s.id), '${HOY}', [{ tipo: 'suspender', fecha: '${HOY}' }]);
    return [d.estado !== 'cobro_activo', d.obligaciones[0].texto.startsWith('Hecho tarde')]; })()`);
  igual(r, [true, true]);
});
prueba('la prórroga lleva la respuesta al día hábil 23 y saca el caso del riesgo', () => {
  const r = js(`(() => { const s = casosEn('${HOY}').find(c => c.estado === 'riesgo'); const b = CASOS_BASE.find(x => x.id === s.id);
    const d = derivar(b, '${HOY}', [{ tipo: 'prorrogar', fecha: '${HOY}' }]); return [d.lim.respuesta === sumarHabiles(b.fechaRadicacion, 23), d.estado !== 'riesgo', d.prorrogado]; })()`);
  igual(r, [true, true, true]);
});
prueba('una prórroga pedida después del día 15 no vale', () => {
  const r = js(`(() => { const s = casosEn('${HOY}').find(c => c.estado === 'silencio'); const b = CASOS_BASE.find(x => x.id === s.id);
    return derivar(b, '${HOY}', [{ tipo: 'prorrogar', fecha: '${HOY}' }]).estado; })()`);
  igual(r, 'silencio');
});
prueba('reanudar el cobro solo aplica cuando pasaron 20 días hábiles sin denuncia', () => {
  const r = js(`(() => { const cs = casosEn('${HOY}'); const p = cs.find(c => c.estado === 'puede_reanudar'); const t = cs.find(c => c.estado === 'en_tramite');
    return [derivar(CASOS_BASE.find(x => x.id === p.id), '${HOY}', [{ tipo: 'reanudar', fecha: '${HOY}' }]).estado,
      derivar(CASOS_BASE.find(x => x.id === t.id), '${HOY}', [{ tipo: 'reanudar', fecha: '${HOY}' }]).estado]; })()`);
  igual(r, ['reanudado', 'en_tramite']);
});
prueba('el puntaje queda entre 0 y 100 y la toma de cuenta suma en vez de restar', () => {
  igual(js(`casosEn('${HOY}').every(c => c.evid.puntaje >= 0 && c.evid.puntaje <= 100)`), true, 'rango');
  const r = js(`(() => { const b = { ...CASOS_BASE[20], comprasPrevias: true, telAprob: '3000000000' }; return puntuar(b, false).reglas.map(x => x.clave); })()`);
  cierto(r.includes('ato') && !r.includes('familiar'), `reglas: ${r.join(', ')}`);
});
prueba('si nadie actúa, en 5 días hábiles caen 4 silencios más', () => {
  const r = js(`(() => { const hoy = casosEn('${HOY}').filter(c => c.estado === 'silencio').length; const d = sumarHabiles('${HOY}', 5);
    return CASOS_BASE.map(b => derivar(b, d, null, '${HOY}')).filter(c => c && c.estado === 'silencio').length - hoy; })()`);
  igual(r, 4);
});

seccion('Redes de fraude');
prueba('dos redes: Soacha con 9 casos y la línea compartida con 4', () => {
  igual(js(`construirRedes(casosEn('${HOY}')).map(r => r.casos.length)`), [9, 4]);
});
prueba('un reclamo nuevo con el mismo dispositivo agranda la red a 10', () => {
  const r = js(`(() => { CASOS_BASE.push(crearCasoManual({ nombre: 'Prueba', cedula: '1', ciudad: 'Cali', canal: 'App', comercio: 'Electro Norte 14', categoria: 'celulares', monto: 900000, diasDesdeCompra: 30, dispositivo: true }, 1001, '${HOY}'));
    contarAsesores(); const n = construirRedes(casosEn('${HOY}'))[0].casos.length; CASOS_BASE.pop(); contarAsesores(); return n; })()`);
  igual(r, 10);
});

seccion('Idiomas');
prueba('las plantillas protegen radicados, fechas, montos, comercios y asesores', () => {
  igual(js(`normalizar('SUP-2026-001810: Respuesta de fondo (22 dic 2026)').plantilla`), '{rA}: Respuesta de fondo ({fA})');
  igual(js(`normalizar('$1.360.000 en Celulares Plaza 80 (asesor A-0231)').plantilla`), '{mA} en {cA} (asesor {aA})');
  igual(js(`normalizar('Faltan 3 días hábiles').plantilla`), 'Faltan {nA} días hábiles');
});
prueba('en inglés: plantilla traducida, fecha y monto con formato local', () => {
  js(`IDIOMA = 'en'`);
  const r = [js(`traducirTexto('Bandeja de casos')`), js(`traducirTexto('Hecho el 25 nov 2026')`), js(`traducirTexto('$3.290.000')`)];
  js(`IDIOMA = 'es'`);
  igual(r[0], 'Case queue', 'título');
  cierto(r[1].includes('Nov 25, 2026'), `fecha: ${r[1]}`);
  igual(r[2], 'COP 3,290,000', 'monto');
});
prueba('portugués completo: toda plantilla en inglés tiene su versión en portugués', () => {
  const faltan = js(`Object.keys(TRAD.en).filter(k => TRAD.pt[k] === undefined)`);
  igual(faltan, [], 'plantillas sin portugués');
});
prueba('ninguna traducción pierde o inventa marcadores de datos', () => {
  const malos = js(`(() => { const m = []; for (const id of ['en', 'pt']) for (const [k, v] of Object.entries(TRAD[id])) {
    const a = (k.match(/\\{[a-z]+[A-Z]\\}/g) || []).sort().join(), b = (v.match(/\\{[a-z]+[A-Z]\\}/g) || []).sort().join(); if (a !== b) m.push(id + ': ' + k); } return m; })()`);
  igual(malos, [], 'marcadores');
});


seccion('Controles');
prueba('doble firma: exonerar desde $1.500.000 con evidencia clara pide segunda firma', () => {
  const r = js(`(() => { const cs = casosEn('${HOY}'); const grande = cs.find(c => c.puedeAprobar && c.evid.banda === 'alta' && c.monto >= UMBRAL_DOBLE_FIRMA);
    const pequeno = { ...grande, monto: UMBRAL_DOBLE_FIRMA - 10000 }; const media = { ...grande, evid: { ...grande.evid, banda: 'media' } };
    return [requiereDobleFirma(grande), requiereDobleFirma(pequeno), requiereDobleFirma(media)]; })()`);
  igual(r, [true, false, false]);
});
prueba('la cadena SHA-256 detecta la alteración en el registro exacto', async () => {
  const r = await js(`(async () => { const regs = [1, 2, 3, 4, 5].map(i => ({ fecha: '2026-12-0' + i, quien: 'Sistema', radicado: 'SUP-2026-00180' + i, accion: 'Cotejo terminado' }));
    const cadena = await construirCadena(regs); const integra = await verificarCadena(cadena);
    const alterada = cadena.map(x => ({ ...x })); alterada[2].accion = 'Respuesta de fondo: titular exonerado';
    return [integra, await verificarCadena(alterada), cadena[4].huella.length]; })()`);
  igual(r, [-1, 2, 64]);
});
prueba('la bitácora encadena cada decisión con la anterior', async () => {
  const r = await js(`(async () => { var FECHA = '${HOY}'; globalThis.FECHA = FECHA; const c = casosEn('${HOY}')[0];
    vaciarBitacora(); ['validar', 'investigar', 'deshacer'].forEach(t => anotarBitacora(c, t, 'prueba')); await COLA_BITACORA;
    let anterior = CERO, ok = true; for (const e of BITACORA) { ok = ok && (await sha256(contenidoBitacora(anterior, e))) === e.huella; anterior = e.huella; }
    const n = BITACORA.length; BITACORA[1].nota = 'cambiada'; const roto = (await sha256(contenidoBitacora(BITACORA[0].huella, BITACORA[1]))) !== BITACORA[1].huella;
    vaciarBitacora(); return [n, ok, roto]; })()`);
  igual(r, [3, true, true]);
});
prueba('evento de integración: clave de idempotencia e instrucciones a cobranza, centrales y DIAN', () => {
  const r = js(`(() => { globalThis.FECHA = '${HOY}'; const c = casosEn('${HOY}').find(x => x.evid.banda === 'alta'); const e = eventoIntegracion(c, 'aprobar', '');
    const s = eventoIntegracion(c, 'suspender', ''); return [e.idempotencyKey === c.radicado + ':aprobar:${HOY}', e.instructions.collections, e.instructions.creditBureaus, e.instructions.taxAuthority, s.instructions.collections]; })()`);
  igual(r, [true, 'WRITE_OFF_FRAUD', 'FLAG_IDENTITY_THEFT_VICTIM', 'REPORT_IDENTITY_THEFT', 'SUSPEND_COLLECTIONS_AND_INTEREST']);
});

seccion('Calendario: fuentes externas y casos de borde');
prueba('2027 completo según calendariodecolombia.com, Publimetro y Radio Nacional (19 festivos)', () => {
  igual(js('festivosColombia(2027)'), ['2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01', '2027-05-10', '2027-05-31', '2027-06-07',
    '2027-07-05', '2027-07-12', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25']);
});
prueba('2028 coincide con las fechas publicadas (Reyes, San José, Semana Santa, Ascensión, Corpus, Sagrado Corazón, San Pedro)', () => {
  const f = js('festivosColombia(2028)');
  ['2028-01-10', '2028-03-20', '2028-04-13', '2028-04-14', '2028-05-29', '2028-06-19', '2028-06-26', '2028-07-03', '2028-07-10', '2028-07-20', '2028-12-08', '2028-12-25']
    .forEach(d => cierto(f.includes(d), `falta ${d}`));
});
prueba('Pascua correcta en años conocidos, incluida la más temprana y la más tardía posibles', () => {
  const conocidas = { 2008: '3-23', 2011: '4-24', 2019: '4-21', 2024: '3-31', 2025: '4-20', 2026: '4-5', 2027: '3-28', 2028: '4-16', 2038: '4-25', 2285: '3-22' };
  for (const [a, f] of Object.entries(conocidas)) { const p = js(`pascua(${a})`); igual(`${p.mes}-${p.dia}`, f, `Pascua ${a}`); }
});
prueba('de 2026 a 2100: festivos sin repetir, ordenados, trasladados en lunes y fijos en su fecha', () => {
  const problemas = js(`(() => { const m = []; const fijos = ['01-01', '05-01', '07-20', '08-07', '12-08', '12-25'];
    for (let a = 2026; a <= 2100; a++) { const f = festivosColombia(a);
      if (new Set(f).size !== f.length) m.push(a + ' repetidos');
      if (f.join() !== f.slice().sort().join()) m.push(a + ' desordenados');
      if (f.length < 18 || f.length > 19) m.push(a + ' cantidad ' + f.length);
      fijos.forEach(x => { if (!f.includes(a + '-' + x)) m.push(a + ' falta ' + x); });
      f.filter(d => !fijos.includes(d.slice(5))).forEach(d => { const dow = parsearFechaUTC(d).getUTCDay(); const p = pascua(a);
        const pas = a + '-' + String(p.mes).padStart(2, '0') + '-' + String(p.dia).padStart(2, '0');
        const santo = d === sumarDiasCalendario(pas, -3) || d === sumarDiasCalendario(pas, -2);
        if (!santo && dow !== 1) m.push(d + ' no es lunes'); }); }
    return m; })()`);
  igual(problemas, [], 'problemas');
});
prueba('dos festivos que caen el mismo lunes cuentan una vez (San Pedro y Sagrado Corazón el 5 jul 2038)', () => {
  const f = js('festivosColombia(2038)');
  igual(f.filter(d => d === '2038-07-05').length, 1, 'veces');
  igual(f.length, 18, 'festivos 2038');
});
prueba('fuzz de 3.000 fechas: sumar n días hábiles da un día hábil y habilesEntre lo devuelve exacto', () => {
  const malos = js(`(() => { const rng = mulberry32(42); const m = [];
    for (let i = 0; i < 3000; i++) { const base = sumarDiasCalendario('2026-01-01', Math.floor(rng() * 1800)); const n = 1 + Math.floor(rng() * 60);
      const f = sumarHabiles(base, n); if (!esHabil(f) || habilesEntre(base, f) !== n) m.push(base + '+' + n); }
    return m.slice(0, 5); })()`);
  igual(malos, []);
});
prueba('ningún festivo ni fin de semana es día hábil entre 2026 y 2035', () => {
  const malos = js(`(() => { const m = []; for (let a = 2026; a <= 2035; a++) festivosColombia(a).forEach(d => { if (esHabil(d)) m.push(d); });
    for (let d = '2026-01-03', i = 0; i < 520; i++, d = sumarDiasCalendario(d, 7)) { if (esHabil(d) || esHabil(sumarDiasCalendario(d, 1))) m.push(d); }
    return m; })()`);
  igual(malos, []);
});
prueba('cruce de año: 10 días hábiles desde el 22 dic 2026 saltan Navidad y Año Nuevo (7 ene 2027)', () => {
  igual(js(`sumarHabiles('2026-12-22', 10)`), '2027-01-07');
});

seccion('Modelo: invariantes en todas las fechas y todos los casos');
prueba('del 19 nov 2026 al 30 jun 2027, en cada día hábil y para los 54 casos: nada falla ni muestra undefined o NaN', () => {
  const malos = js(`(() => { const m = [];
    for (let f = '2026-11-19'; f <= '2027-06-30'; f = sumarHabiles(f, 1)) {
      for (const c of casosEn(f)) {
        if (!ESTADOS[c.estado]) m.push(f + ' estado ' + c.estado);
        if (c.t < 0 || c.evid.puntaje < 0 || c.evid.puntaje > 100) m.push(f + ' rango ' + c.radicado);
        if (c.obligaciones.length !== 12) m.push(f + ' obligaciones ' + c.obligaciones.length);
        const texto = JSON.stringify([c.obligaciones, c.eventos, c.proximo, c.recomendacion, c.tablaCotejo]);
        if (/undefined|NaN|null,"texto"/.test(texto)) m.push(f + ' texto ' + c.radicado);
        if (c.proximo && c.proximo.fecha && c.proximo.dias !== restantes(f, c.proximo.fecha)) m.push(f + ' dias ' + c.radicado);
        if (c.abierto !== ESTADOS[c.estado].abierto) m.push(f + ' abierto ' + c.radicado);
      }
      if (m.length > 5) break;
    }
    return m.slice(0, 5); })()`);
  igual(malos, []);
});
prueba('sin decisiones, el silencio positivo y la exoneración nunca se revierten al avanzar la fecha', () => {
  const malos = js(`(() => { const m = []; const visto = {};
    for (let f = '2026-11-19'; f <= '2027-04-30'; f = sumarHabiles(f, 1)) {
      for (const c of casosEn(f)) {
        const antes = visto[c.id];
        if (antes === 'silencio' && c.estado !== 'silencio') m.push(c.radicado + ' salió del silencio el ' + f);
        if (antes === 'exonerado' && c.estado !== 'exonerado') m.push(c.radicado + ' dejó de estar exonerado el ' + f);
        visto[c.id] = c.estado;
      }
    }
    return m.slice(0, 5); })()`);
  igual(malos, []);
});
prueba('fuzz de 400 secuencias de decisiones al azar: nada falla y se cumplen las reglas legales', () => {
  const malos = js(`(() => { const rng = mulberry32(7); const tipos = ['aprobar', 'validar', 'investigar', 'reanudar', 'suspender', 'prorrogar', 'acatar', 'proponer'];
    const m = []; const fechas = []; for (let f = '2026-11-19'; f <= '2027-02-26'; f = sumarHabiles(f, 1)) fechas.push(f);
    for (let i = 0; i < 400; i++) {
      const b = CASOS_BASE[Math.floor(rng() * CASOS_BASE.length)];
      const decs = []; const n = 1 + Math.floor(rng() * 5);
      for (let k = 0; k < n; k++) decs.push({ tipo: tipos[Math.floor(rng() * tipos.length)], fecha: fechas[Math.floor(rng() * fechas.length)] });
      const hoy = fechas[Math.floor(rng() * fechas.length)];
      let c; try { c = derivarCaso(b, hoy, decs); } catch (e) { m.push('error ' + e.message); continue; }
      if (!c) continue;
      if (c.estado === 'reanudado' && (hoy <= c.lim.denuncia || c.denunciaRecibida)) m.push('reanudado sin cumplir requisitos ' + b.radicado);
      if (c.estado === 'exonerado' && c.silencioFirme) m.push('exonerado con silencio ' + b.radicado);
      if (c.prorrogado && c.lim.respuesta !== sumarHabiles(b.fechaRadicacion, 23)) m.push('prórroga mal calculada ' + b.radicado);
      if (c.silencioFirme && c.puedeAprobar) m.push('se puede aprobar con silencio ' + b.radicado);
    }
    return m.slice(0, 5); })()`);
  igual(malos, []);
});
prueba('el pronóstico «si nadie actúa» nunca baja de un día al siguiente', () => {
  const r = js(`(() => { const hoy = '${HOY}'; let previo = -1, ok = true; let d = hoy;
    for (let k = 1; k <= 15; k++) { d = sumarHabiles(d, 1); const n = CASOS_BASE.map(b => derivarCaso(b, d, null, hoy)).filter(c => c && c.estado === 'silencio').length; if (n < previo) ok = false; previo = n; }
    return ok; })()`);
  igual(r, true);
});
prueba('prioridad: un incumplimiento siempre va primero y ningún caso cerrado tiene prioridad', () => {
  const r = js(`(() => { const cs = casosEn('${HOY}'); return [cs.filter(c => ESTADOS[c.estado].clase === 'critico').every(c => c.prioridad === 100),
    cs.filter(c => !c.abierto).every(c => c.prioridad === 0), cs.every(c => c.prioridad >= 0 && c.prioridad <= 100)]; })()`);
  igual(r, [true, true, true]);
});

seccion('Redes y bandeja');
prueba('fuzz de 200 subconjuntos de casos: redes de 3 o más, sin casos repetidos entre redes', () => {
  const malos = js(`(() => { const rng = mulberry32(99); const todos = casosEn('${HOY}'); const m = [];
    for (let i = 0; i < 200; i++) { const sub = todos.filter(() => rng() < 0.6); let redes; try { redes = construirRedes(sub); } catch (e) { m.push(e.message); continue; }
      const ids = redes.flatMap(r => r.casos.map(c => c.id));
      if (new Set(ids).size !== ids.length) m.push('caso en dos redes');
      if (redes.some(r => r.casos.length < 3)) m.push('red pequeña');
      if (redes.some(r => r.entidades.some(e => e.casos.some(c => !r.casos.includes(c))))) m.push('entidad fuera de su red'); }
    return [...new Set(m)]; })()`);
  igual(malos, []);
});
prueba('orden de la bandeja: en las 18 combinaciones de columna y sentido, lo cerrado al ordenar por plazo queda al final', () => {
  const malos = js(`(() => { const cols = ['prioridad', 'titular', 'analista', 'comercio', 'monto', 'plazo', 'evidencia', 'estado', 'radicado']; const m = [];
    for (const col of cols) for (const dir of [1, -1]) { ORDEN = { col, dir }; const l = casosEn('${HOY}'); ordenarBandeja(l);
      if (l.length !== 54) m.push(col + ' pierde casos');
      if (col === 'plazo') { const i = l.findIndex(c => !c.proximo || c.proximo.dias === null); if (i >= 0 && l.slice(i).some(c => c.proximo && c.proximo.dias !== null)) m.push('plazo ' + dir); } }
    ORDEN = { col: 'prioridad', dir: -1 }; return m; })()`);
  igual(malos, []);
});

seccion('Idiomas: cobertura y formatos');
prueba('formato inglés de las 12 abreviaturas de mes, con y sin año', () => {
  js(`IDIOMA = 'en'`);
  const r = js(`MESES_CORTOS.map((m, i) => formatoLocal('3 ' + m + ' 2027') + '|' + formatoLocal('3 ' + m))`);
  js(`IDIOMA = 'es'`);
  igual(r[0], 'Jan 3, 2027|Jan 3'); igual(r[4], 'May 3, 2027|May 3'); igual(r[11], 'Dec 3, 2027|Dec 3');
});
prueba('formato portugués de fechas y montos grandes y pequeños en inglés', () => {
  js(`IDIOMA = 'pt'`); const pt = js(`formatoLocal('22 dic 2026')`);
  js(`IDIOMA = 'en'`); const en = [js(`formatoLocal('$15.130.000')`), js(`formatoLocal('$950.000')`), js(`formatoLocal('$83,4 M')`), js(`formatoLocal('96,3 %')`)];
  js(`IDIOMA = 'es'`);
  igual(pt, '22 dez 2026'); igual(en, ['COP 15,130,000', 'COP 950,000', 'COP 83.4M', '96.3%']);
});
prueba('en español la capa de idiomas no cambia ningún texto (2.000 frases armadas al azar)', () => {
  const malos = js(`(() => { IDIOMA = 'es'; const rng = mulberry32(5); const plantillas = Object.keys(TRAD.en); const m = [];
    for (let i = 0; i < 2000; i++) { const p = plantillas[Math.floor(rng() * plantillas.length)]
        .replace(/\\{n[A-Z]\\}/g, () => String(Math.floor(rng() * 90))).replace(/\\{f[A-Z]\\}/g, '22 dic 2026').replace(/\\{m[A-Z]\\}/g, '$1.360.000')
        .replace(/\\{r[A-Z]\\}/g, 'SUP-2026-001810').replace(/\\{c[A-Z]\\}/g, 'Celulares Plaza 80').replace(/\\{p[A-Z]\\}/g, 'Lina María Ospina');
      if (traducirTexto(p) !== p) m.push(p); }
    return m.slice(0, 3); })()`);
  igual(malos, []);
});
prueba('toda frase armada desde una plantilla vuelve traducida al inglés y al portugués', () => {
  const malos = js(`(() => { const m = []; const rng = mulberry32(11);
    for (const id of ['en', 'pt']) { IDIOMA = id; const plantillas = Object.keys(TRAD[id]).filter(k => /\\{[a-z]+[A-Z]\\}/.test(k));
      for (let i = 0; i < 600; i++) { const k = plantillas[Math.floor(rng() * plantillas.length)];
        const frase = k.replace(/\\{n[A-Z]\\}/g, () => String(2 + Math.floor(rng() * 9))).replace(/\\{f[A-Z]\\}/g, '22 dic 2026').replace(/\\{fc[A-Z]\\}/g, '22 dic')
          .replace(/\\{m[A-Z]\\}/g, '$1.360.000').replace(/\\{r[A-Z]\\}/g, 'SUP-2026-001810').replace(/\\{c[A-Z]\\}/g, 'Celulares Plaza 80').replace(/\\{p[A-Z]\\}/g, 'Lina María Ospina')
          .replace(/\\{ci[A-Z]\\}/g, 'Cali').replace(/\\{a[A-Z]\\}/g, 'A-0231').replace(/\\{d[A-Z]\\}/g, 'DV-7F3A').replace(/\\{h[A-Z]\\}/g, '3d57afff533d');
        if (normalizar(frase).plantilla !== k) continue;
        if (traducirTexto(frase) === frase && TRAD[id][k] !== k) m.push(id + ': ' + frase); } }
    IDIOMA = 'es'; return m.slice(0, 3); })()`);
  igual(malos, []);
});

seccion('Casos de borde de Gemini (verificados por Claude)');
js(`var clon = (k, cambios, plan) => { const b = JSON.parse(JSON.stringify(CASOS_BASE[k])); Object.assign(b, cambios || {}); Object.assign(b.plan, plan || {}); return b; };`);
prueba('C1 año bisiesto: 2 días hábiles desde el viernes 25 feb 2028 = martes 29 feb', () => igual(js(`sumarHabiles('2028-02-25', 2)`), '2028-02-29'));
prueba('C2-C3 Pascua temprana 2027 y tardía 2030; en 2030 San Pedro y Sagrado Corazón caen el mismo lunes 1 de julio', () => {
  const f27 = js('festivosColombia(2027)'), f30 = js('festivosColombia(2030)');
  cierto(['2027-03-22', '2027-03-25', '2027-03-26'].every(d => f27.includes(d)), 'Semana Santa 2027');
  igual(f30.filter(d => d === '2030-07-01').length, 1, 'colisión 2030'); igual(f30.length, 18, 'festivos 2030');
});
prueba('C4 un festivo que ya cae en lunes no se mueve (1 nov 2027); uno en martes pasa al lunes siguiente (15 ago 2028 → 21 ago)', () => {
  igual([js(`trasladarAlLunes('2027-11-01')`), js(`trasladarAlLunes('2028-08-15')`)], ['2027-11-01', '2028-08-21']);
});
prueba('C5 y C7 cruce de año y Semana Santa: 15 hábiles desde el 21 dic 2026 = 14 ene 2027; 3 hábiles antes del 29 mar 2027 = 19 mar', () => {
  igual([js(`sumarHabiles('2026-12-21', 15)`), js(`restarHabiles('2027-03-29', 3)`)], ['2027-01-14', '2027-03-19']);
});
prueba('C6 habilesEntre con intervalo invertido o idéntico da 0', () => igual([js(`habilesEntre('2026-12-22', '2026-12-15')`), js(`habilesEntre('2026-12-22', '2026-12-22')`)], [0, 0]));
prueba('C8 reclamo radicado un sábado: el lunes es el día hábil 1 y el cotejo vence el 4 dic', () => {
  const r = js(`(() => { const c = derivarCaso(clon(30, { fechaRadicacion: '2026-11-21' }), '2026-11-23', []); return [c.t, c.lim.cotejo]; })()`);
  igual(r, [1, '2026-12-04']);
});
prueba('C9-C11 fronteras: día 10 sin cotejo «vence hoy», día 11 «cotejo vencido», día 16 sin respuesta «silencio»', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: null, respuesta: null, denuncia: null });
    const d10 = derivarCaso(b, '2026-12-03', []), d11 = derivarCaso(b, '2026-12-04', []), d16 = derivarCaso(b, '2026-12-14', []);
    return [d10.estado, d10.proximo.dias, d11.estado, d11.prioridad, d16.estado, d16.puedeAprobar, d16.puedeAcatar]; })()`);
  igual(r, ['cotejo_hoy', 0, 'cotejo_vencido', 100, 'silencio', false, true]);
});
prueba('C12-C13 denuncia tardía con respuesta a tiempo pasa a «espera decisión judicial»; con silencio no se puede reanudar', () => {
  const r = js(`(() => { const tarde = derivarCaso(clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: 11, denuncia: 22 }), '2026-12-22', []);
    const sil = derivarCaso(clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: null, denuncia: null }), '2026-12-22', []);
    return [tarde.estado, tarde.puedeReanudar, sil.estado, sil.puedeReanudar]; })()`);
  igual(r, ['judicial', false, 'silencio', false]);
});
prueba('C14 suspensión tardía y luego silencio: ambas faltas quedan a la vista', () => {
  const r = js(`(() => { const c = derivarCaso(clon(30, { fechaRadicacion: '2026-11-19' }, { suspension: 5, cotejo: 6, respuesta: null }), '2026-12-14', []);
    return [c.estado, c.obligaciones[0].texto.startsWith('Hecho tarde'), c.obligaciones.find(o => o.paso.startsWith('Responder')).clase]; })()`);
  igual(r, ['silencio', true, 'critico']);
});
prueba('C15 reanudar antes de 20 días hábiles no reanuda', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: 10, denuncia: null }); return derivarCaso(b, sumarHabiles('2026-11-19', 18), [{ tipo: 'reanudar', fecha: sumarHabiles('2026-11-19', 18) }]).estado; })()`);
  igual(r, 'espera_denuncia');
});
prueba('C16-C17 prórroga el mismo día 15 vale; una segunda prórroga no cambia nada', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: null, denuncia: null });
    const una = derivarCaso(b, '2026-12-11', [{ tipo: 'prorrogar', fecha: '2026-12-11' }]);
    const dos = derivarCaso(b, '2026-12-16', [{ tipo: 'prorrogar', fecha: '2026-12-11' }, { tipo: 'prorrogar', fecha: '2026-12-16' }]);
    return [una.prorrogado, una.lim.respuesta, una.estado !== 'silencio', dos.lim.respuesta, dos.puedeProrrogar]; })()`);
  igual(r, [true, '2026-12-23', true, '2026-12-23', false]);
});
// Gemini esperaba «Hecho el 22 dic»; es «Hecho tarde»: sin cotejo, la corrección vencía el día 10 (3 dic) y se hizo el día 22
prueba('C18 acatar el silencio cierra el caso y deja la corrección en centrales, marcada como tardía', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: null, respuesta: null, denuncia: null });
    const c = derivarCaso(b, '2026-12-22', [{ tipo: 'acatar', fecha: '2026-12-22' }]);
    return [c.estado, c.abierto, c.obligaciones.find(o => o.paso.startsWith('Pedir a las centrales')).texto]; })()`);
  igual(r, ['silencio_acatado', false, 'Hecho tarde, el 22 dic 2026']);
});
prueba('C19 deshacer la suspensión (quitar la decisión) devuelve el caso a «cobro sin suspender»', () => {
  const r = js(`(() => { const b = clon(30, {}, { suspension: null }); const hoy = '${HOY}'; const con = derivarCaso(b, hoy, [{ tipo: 'suspender', fecha: hoy }]); const sin = derivarCaso(b, hoy, []);
    return [con.estado !== 'cobro_activo', sin.estado, sin.puedeSuspender, sin.prioridad]; })()`);
  igual(r, [true, 'cobro_activo', true, 100]);
});
prueba('C20 proponer la exoneración no exonera: hace falta la segunda firma', () => {
  const r = js(`(() => { const c = casosEn('${HOY}').find(x => requiereDobleFirma(x)); const d = derivarCaso(CASOS_BASE.find(b => b.id === c.id), '${HOY}', [{ tipo: 'proponer', fecha: '${HOY}' }]); return [d.exonerado, d.abierto]; })()`);
  igual(r, [false, true]);
});
prueba('C21-C26 reglas del puntaje: solo expedición = 30; biometría 0,70 no suma y 0,699 sí; toma de cuenta por ciudad; tope 100; piso 0; ¿y si…? sin denuncia', () => {
  const r = js(`(() => { const limpio = { expAprob: 'x', expTitular: 'x', docAprob: 'a', docTitular: 'a', telAprob: '1', telTitular: '1', biometria: 0.9, cedulasDispositivo: 1, lineaDias: 400, correoDias: 900, ciudad: 'Bogotá', ipCiudad: 'Bogotá', dirAprob: 'd', dirTitular: 'd', categoria: 'moda', monto: 1, cupo: 10, comprasPrevias: false };
    const p = o => puntuar({ ...limpio, ...o }, false);
    const todo = puntuar({ ...limpio, expAprob: 'y', docAprob: 'b', telAprob: '2', biometria: 0.3, cedulasDispositivo: 5, lineaDias: 3, correoDias: 1, ipCiudad: 'Cali', categoria: 'celulares', monto: 10, comprasPrevias: true }, true);
    const yesi = puntuar({ ...limpio, expAprob: 'y', biometria: 0.5 }, true, new Set(['denuncia']));
    return [p({ expAprob: 'y' }).puntaje, p({ biometria: 0.70 }).puntaje, p({ biometria: 0.699 }).puntaje,
      p({ comprasPrevias: true, ipCiudad: 'Barranquilla' }).reglas.map(x => x.clave).sort().join(), todo.puntaje, p({ comprasPrevias: true }).puntaje, yesi.puntaje, yesi.banda]; })()`);
  igual(r, [30, 0, 25, 'ato,ubicacion', 100, 0, 55, 'media']);
});
prueba('C27-C31 redes: 2 casos no forman red; un caso puente une dos grupos; asesor con 4 no cuenta y con 5 sí; teléfono propio no une; título por ciudad mayoritaria', () => {
  const r = js(`(() => { const base = { telTitular: 't', dirAprob: 'x', dirTitular: 'x', cedulasDispositivo: 1, dispositivo: 'D', expAprob: 'e', expTitular: 'e', docAprob: 'a', docTitular: 'a' };
    const caso = (id, o) => ({ ...base, id, telAprob: 't', asesor: 'A-0' + (100 + id), ipCiudad: 'Cali', ...o });
    const dos = construirRedes([caso(1, { dispositivo: 'DV-9999', cedulasDispositivo: 4 }), caso(2, { dispositivo: 'DV-9999', cedulasDispositivo: 4 })]).length;
    const puente = construirRedes([caso(1, { telAprob: 'T1' }), caso(2, { telAprob: 'T1' }), caso(3, { telAprob: 'T1', dirAprob: 'Z' }), caso(4, { dirAprob: 'Z' }), caso(5, { dirAprob: 'Z' })]).map(x => x.casos.length);
    const cuatro = construirRedes([1, 2, 3, 4].map(i => caso(i, { asesor: 'A-0999' }))).length;
    const cinco = construirRedes([1, 2, 3, 4, 5].map(i => caso(i, { asesor: 'A-0999' }))).length;
    const propio = construirRedes([1, 2, 3].map(i => caso(i, { telAprob: '3155555555', telTitular: '3155555555' }))).length;
    const titulo = construirRedes([1, 2, 3, 4].map(i => caso(i, { asesor: 'A-0999', ipCiudad: i < 4 ? 'Medellín' : 'Bucaramanga' })).concat([caso(5, { asesor: 'A-0999', ipCiudad: 'Medellín' })]))[0].titulo;
    return [dos, puente, cuatro, cinco, propio, titulo]; })()`);
  igual(r, [0, [5], 0, 1, 0, 'Red 1 · Medellín']);
});
prueba('C32-C35 un caso a 1 día del silencio cae al día siguiente; congelar evita respuestas planeadas; los cerrados no cambian; un caso futuro no existe', () => {
  const r = js(`(() => { const hoy = '${HOY}'; const cs = casosEn(hoy);
    const r1 = cs.find(c => c.estado === 'riesgo' && c.proximo.dias === 0) || cs.find(c => c.estado === 'riesgo');
    const cae = derivarCaso(CASOS_BASE.find(b => b.id === r1.id), sumarHabiles(r1.lim.respuesta, 1), null).estado;
    const b = clon(30, { fechaRadicacion: hoy }, { cotejo: 3, respuesta: 12 });
    const congelado = derivarCaso(b, sumarHabiles(hoy, 16), null, hoy).estado, libre = derivarCaso(b, sumarHabiles(hoy, 16), null).estado;
    const cerrados = cs.filter(c => !c.abierto).every(c => derivarCaso(CASOS_BASE.find(x => x.id === c.id), sumarHabiles(hoy, 30), null).estado === c.estado);
    return [cae, congelado, libre !== 'silencio', cerrados, derivarCaso(clon(30, { fechaRadicacion: '2026-12-01' }), '2026-11-20')]; })()`);
  igual(r, ['silencio', 'silencio', true, true, null]);
});
prueba('C36-C40 idiomas: montos y fechas por idioma, nombres compuestos y textos sin letras intactos', () => {
  js(`IDIOMA = 'en'`);
  const en = [js(`formatoLocal('$1.249.900')`), js(`formatoLocal('$2,8 M')`), js(`traducirTexto('   ')`), js(`traducirTexto('---')`), js(`traducirTexto('987654')`)];
  js(`IDIOMA = 'pt'`); const pt = js(`formatoLocal('22 dic 2026')`); js(`IDIOMA = 'es'`);
  const n = js(`normalizar('Reclamo radicado por Consuelo del Pilar Botero en Óptica Visión 21 por $1.450.000')`);
  igual(en, ['COP 1,249,900', 'COP 2.8M', '   ', '---', '987654']); igual(pt, '22 dez 2026');
  igual(n.plantilla, 'Reclamo radicado por {pA} en {cA} por {mA}'); igual([n.valores.pA, n.valores.cA], ['Consuelo del Pilar Botero', 'Óptica Visión 21']);
});

seccion('Regresiones de la auditoría independiente (cada bug que se encontró queda vigilado)');
prueba('A4 un sábado, un plazo vencido el viernes dice «vencido», nunca «vence hoy»', () => {
  const malos = js(`casosEn('2026-12-26').filter(c => c.proximo && c.proximo.fecha && c.proximo.fecha < '2026-12-26' && c.proximo.dias >= 0).map(c => c.radicado)`);
  igual(malos, []);
  igual(js(`restantes('2026-12-26', '2026-12-24')`), -1, 'sábado frente al jueves');
});
prueba('A4 la denuncia se mide por fecha: vencida al día siguiente del límite aunque sea fin de semana', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: 11, denuncia: null }); const c = derivarCaso(b, '2026-12-19', []);
    return [c.lim.denuncia, c.denunciaTitular.texto, c.estado]; })()`);
  igual(r, ['2026-12-18', 'Venció sin denuncia', 'puede_reanudar']);
});
prueba('A3 un caso respondido que luego llega a evidencia clara se puede exonerar (art. 10)', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19', expAprob: 'otra', biometria: 0.5 }, { cotejo: 6, respuesta: 9, denuncia: 12 });
    const antes = derivarCaso(b, '2026-12-22', []); const despues = derivarCaso(b, '2026-12-22', [{ tipo: 'exonerar', fecha: '2026-12-22' }]);
    return [antes.respondido, antes.puedeExonerar, despues.estado, despues.decisiones.map(d => d.tipo).join()]; })()`);
  igual(r, [true, true, 'exonerado', 'exonerar']);
});
prueba('A7 solo cuentan las decisiones con efecto: acatar sin silencio, doble acatar y prórroga tardía no aparecen de más', () => {
  const r = js(`(() => { const b = clon(30, { fechaRadicacion: '2026-11-19' }, { cotejo: 6, respuesta: null, denuncia: null });
    const sinSilencio = derivarCaso(b, '2026-12-04', [{ tipo: 'acatar', fecha: '2026-12-04' }]).decisiones.length;
    const doble = derivarCaso(b, '2026-12-22', [{ tipo: 'acatar', fecha: '2026-12-21' }, { tipo: 'acatar', fecha: '2026-12-22' }]).decisiones.length;
    const tardia = derivarCaso(b, '2026-12-22', [{ tipo: 'prorrogar', fecha: '2026-12-15' }]).decisiones.length;
    return [sinSilencio, doble, tardia]; })()`);
  igual(r, [0, 1, 0]);
});
prueba('A8 el monto aporta como máximo 25 puntos de prioridad', () => {
  const r = js(`(() => { const c = derivarCaso(crearCasoManual({ nombre: 'Prueba', cedula: '1', ciudad: 'Cali', canal: 'App', comercio: 'Electro Norte 14', categoria: 'moda', monto: 20000000, diasDesdeCompra: 30 }, 1001, '${HOY}'), '${HOY}', []);
    return c.prioridad <= 60 + 25 + 15 && c.prioridad < 87; })()`);
  igual(r, true);
});
prueba('A6 cinco reclamos limpios radicados en la demo no forman una red de asesor ni de teléfono', () => {
  const r = js(`(() => { const nuevos = [1, 2, 3, 4, 5].map(i => crearCasoManual({ nombre: 'Prueba ' + i, cedula: String(i), ciudad: 'Cali', canal: 'App', comercio: 'Electro Norte 14', categoria: 'moda', monto: 900000, diasDesdeCompra: 30, linea: i < 4 }, 1000 + i, '${HOY}'));
    nuevos.forEach(agregarCasoManual); const redes = construirRedes(casosEn('${HOY}')).length; quitarCasosManuales(); return redes; })()`);
  igual(r, 2);
});
prueba('A5 la bitácora fija la fecha al decidir y descarta lo pendiente si se vacía', async () => {
  const r = await js(`(async () => { globalThis.FECHA = '2026-12-22'; const c = casosEn('${HOY}')[0]; vaciarBitacora();
    anotarBitacora(c, 'validar', ''); globalThis.FECHA = '2026-12-23'; anotarBitacora(c, 'investigar', ''); await COLA_BITACORA;
    const fechas = BITACORA.map(e => e.fechaSimulada);
    anotarBitacora(c, 'validar', ''); anotarBitacora(c, 'validar', ''); vaciarBitacora(); await COLA_BITACORA;
    globalThis.FECHA = '${HOY}'; return [fechas, BITACORA.length]; })()`);
  igual(r, [['2026-12-22', '2026-12-23'], 0]);
});
prueba('A13 las herramientas de la IA rechazan fechas imposibles y entradas raras', () => {
  const r = js(`(() => { globalThis.FECHA = '${HOY}'; globalThis.CASOS = casosEn('${HOY}'); const t = Object.fromEntries(herramientas(() => {}).map(x => [x.name, x]));
    const falla = f => { try { f(); return false; } catch (e) { return true; } };
    return [falla(() => t.calcular_fecha_habil.execute({ desde: '2026-13-45', dias_habiles: 1 })), falla(() => t.calcular_fecha_habil.execute({ desde: '2026-02-31', dias_habiles: 1 })),
      t.listar_casos.execute(undefined).length <= 12, t.listar_casos.execute({ maximo: -5 }).length, falla(() => t.obtener_caso.execute({ radicado_o_nombre: '' })),
      t.calcular_fecha_habil.execute({ desde: '2026-11-19', dias_habiles: 15 }).fecha]; })()`);
  igual(r, [true, true, true, 1, true, '2026-12-11']);
});
prueba('A14 el idioma solo acepta es, en y pt (no «constructor» ni «toString»)', () => {
  igual(js(`[esIdioma('constructor'), esIdioma('toString'), esIdioma('en'), esIdioma('pt'), esIdioma('fr')]`), [false, false, true, true, false]);
});
prueba('A10 montos pequeños y porcentajes enteros también cambian de formato', () => {
  js(`IDIOMA = 'en'`); const en = [js(`formatoLocal('$0')`), js(`formatoLocal('$850')`), js(`formatoLocal('100 %')`), js(`normalizar('ju•••@correo.co (950 días)').plantilla`)];
  js(`IDIOMA = 'pt'`); const pt = js(`formatoLocal('100 %')`); js(`IDIOMA = 'es'`);
  igual(en, ['COP 0', 'COP 850', '100%', '{eA} ({nA} días)']); igual(pt, '100%');
});

(async () => {
  let fallas = 0, total = 0;
  for (const t of cola) {
    if (t.titulo) { console.log(`\n${t.titulo}`); continue; }
    total++;
    try { await t.fn(); console.log(`  ok    ${t.nombre}`); }
    catch (e) { fallas++; console.log(`  FALLA ${t.nombre}\n        ${e.message}`); }
  }
  console.log(`\n${total - fallas} de ${total} pruebas pasaron.${fallas ? ` ${fallas} fallaron.` : ''}\n`);
  process.exit(fallas ? 1 : 0);
})();
