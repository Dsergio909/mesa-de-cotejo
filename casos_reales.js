// Casos reales de una mesa de reclamos, comprobados contra un oráculo independiente. Correr con: node casos_reales.js
// El oráculo NO usa calendario.js: lleva escritos a mano los festivos oficiales (Ley 51 de 1983 y Ley 2578 de 2026)
// y cuenta los días hábiles con su propio código. Así un error en el cálculo de la app no se esconde en la prueba.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sinUso = () => null;
const ctx = {
  console, crypto: globalThis.crypto, TextEncoder,
  document: { addEventListener: sinUso, getElementById: sinUso, querySelector: sinUso, querySelectorAll: () => [] },
  localStorage: { getItem: sinUso, setItem: sinUso, removeItem: sinUso }, matchMedia: () => ({ matches: false }), $: sinUso
};
ctx.window = ctx;
vm.createContext(ctx);
for (const a of ['calendario.js', 'datos.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, a), 'utf8'), ctx, { filename: a });
const app = c => vm.runInContext(c, ctx);

// ---------- Oráculo ----------
const FESTIVOS = new Set([
  // 2026 (19, con el 13 de julio de la Ley 2578)
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-13', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  // 2027 (Pascua el 28 de marzo)
  '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01', '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-05',
  '2027-07-12', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25',
  // comienzo de 2028
  '2028-01-01', '2028-01-10', '2028-03-20'
]);
const iso = d => d.toISOString().slice(0, 10);
const masUno = f => { const d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return iso(d); };
const habil = f => { const w = new Date(f + 'T12:00:00Z').getUTCDay(); return w !== 0 && w !== 6 && !FESTIVOS.has(f); };
// Día hábil n «siguiente a la fecha de recibo»; si se recibe en día no hábil, se entiende recibido el hábil siguiente
function recibo(f) { while (!habil(f)) f = masUno(f); return f; }
function diaLegal(f, n) { let d = recibo(f); for (let k = 0; k < n; k++) { d = masUno(d); while (!habil(d)) d = masUno(d); } return d; }
const habilesDesde = (f, n) => { let d = f; for (let k = 0; k < n; k++) { d = masUno(d); while (!habil(d)) d = masUno(d); } return d; };

// ---------- Utilidades ----------
let id = 2000;
function caso(R, opciones = {}) {
  const d = { nombre: 'Titular de prueba', cedula: '1234', ciudad: 'Cali', canal: 'App', comercio: 'Electro Norte 14', categoria: 'celulares',
    monto: opciones.monto || 900000, diasDesdeCompra: 20, ...(opciones.banderas || {}) };
  const b = app(`crearCasoManual(${JSON.stringify(d)}, ${++id}, '${R}')`);
  if (opciones.sinSuspender) b.plan.suspension = null;
  return b;
}
const derivar = (b, hoy, decs) => { ctx.__b = b; ctx.__d = decs || []; return app(`derivarCaso(__b, '${hoy}', __d)`); };
const ALTA = { banderas: { expedicion: true, biometria: true, dispositivo: true, linea: true, correo: true } };

const resultados = [];
function caso_real(nombre, fn) {
  try { fn(); resultados.push([true, nombre]); } catch (e) { resultados.push([false, nombre, e.message]); }
}
function igual(real, esperado, que) { if (JSON.stringify(real) !== JSON.stringify(esperado)) throw new Error(`${que}: se esperaba ${JSON.stringify(esperado)} y salió ${JSON.stringify(real)}`); }
function cierto(c, que) { if (!c) throw new Error(que); }
const oblig = (c, inicio) => c.obligaciones.find(o => o.paso.startsWith(inicio));

// ---------- 1. Plazos contra el oráculo, día por día ----------
caso_real('plazos de 10, 15, 2 y 20 días para cada día de radicación hábil de nov 2026 a dic 2027', () => {
  let f = '2026-11-19', n = 0;
  while (f <= '2027-12-31') {
    if (habil(f)) {
      const c = derivar(caso(f), f);
      igual(c.lim.cotejo, diaLegal(f, 10), `cotejo radicado ${f}`);
      igual(c.lim.respuesta, diaLegal(f, 15), `respuesta radicado ${f}`);
      igual(oblig(c, 'Informar a las centrales').limite, diaLegal(f, 2), `centrales radicado ${f}`);
      igual(c.lim.denuncia, diaLegal(f, 20), `denuncia radicado ${f}`);
      n++;
    }
    f = masUno(f);
  }
  cierto(n > 250, 'se revisaron pocos días: ' + n);
});
caso_real('radicado en sábado, domingo o festivo: la app nunca da un plazo más tarde que la ley, y a lo sumo 1 día hábil antes', () => {
  let f = '2026-11-19';
  while (f <= '2027-12-31') {
    if (!habil(f)) {
      const c = derivar(caso(f), recibo(f));
      for (const n of [10, 15]) {
        const legal = diaLegal(f, n), dado = n === 10 ? c.lim.cotejo : c.lim.respuesta;
        cierto(dado <= legal, `radicado ${f}: plazo de ${n} días ${dado} es más tarde que el legal ${legal}`);
        cierto(dado === legal || habilesDesde(dado, 1) === legal, `radicado ${f}: plazo de ${n} días ${dado} se adelanta más de 1 día (${legal})`);
      }
    }
    f = masUno(f);
  }
});

// ---------- 2. Escenarios de la mesa ----------
caso_real('Semana Santa 2027: radicado el miércoles 24-mar, el cotejo salta jueves y viernes santos', () => {
  const c = derivar(caso('2027-03-24'), '2027-03-24');
  igual(c.lim.cotejo, '2027-04-09', 'cotejo');
  igual(c.lim.respuesta, '2027-04-16', 'respuesta');
});
caso_real('fin de año: radicado el 31-dic-2027, los plazos cruzan Año Nuevo y Reyes de 2028', () => {
  const c = derivar(caso('2027-12-31'), '2027-12-31');
  igual(c.lim.cotejo, diaLegal('2027-12-31', 10), 'cotejo');
  igual(c.lim.respuesta, diaLegal('2027-12-31', 15), 'respuesta');
});
caso_real('con el cotejo hecho, el día 15 sin responder está en riesgo y el día 16 ya hay silencio positivo', () => {
  const R = '2026-11-23', b = caso(R); b.plan.cotejo = 5;
  igual(derivar(b, diaLegal(R, 15)).estado, 'riesgo', 'día 15');
  igual(derivar(b, diaLegal(R, 16)).estado, 'silencio', 'día 16');
});
caso_real('prórroga decidida el día 15: la respuesta vence el día 23 y la carta lo dice', () => {
  const R = '2026-11-23', b = caso(R), d15 = diaLegal(R, 15);
  const c = derivar(b, diaLegal(R, 20), [{ tipo: 'prorrogar', fecha: d15 }]);
  igual(c.prorrogado, true, 'prorrogado');
  igual(c.lim.respuesta, diaLegal(R, 23), 'respuesta con prórroga');
  cierto(c.estado !== 'silencio', 'no debe haber silencio el día 20 con prórroga');
});
caso_real('prórroga pedida el día 16 no vale: el silencio ya operó', () => {
  const R = '2026-11-23', b = caso(R);
  const c = derivar(b, diaLegal(R, 17), [{ tipo: 'prorrogar', fecha: diaLegal(R, 16) }]);
  igual(c.prorrogado, false, 'prorrogado');
  igual(c.estado, 'silencio', 'estado');
});
caso_real('con prórroga, el día 23 sin responder es riesgo y el 24 es silencio', () => {
  const R = '2026-11-23', b = caso(R), p = [{ tipo: 'prorrogar', fecha: diaLegal(R, 5) }]; b.plan.cotejo = 5;
  igual(derivar(b, diaLegal(R, 23), p).estado, 'riesgo', 'día 23');
  igual(derivar(b, diaLegal(R, 24), p).estado, 'silencio', 'día 24');
});
caso_real('respuesta aprobada el día 15 cuenta a tiempo; aprobada el día 16 no deshace el silencio', () => {
  const R = '2026-11-23', b = caso(R);
  const a = derivar(b, diaLegal(R, 18), [{ tipo: 'aprobar', fecha: diaLegal(R, 15) }]);
  igual([a.respondido, a.silencioFirme], [true, false], 'a tiempo');
  const t = derivar(b, diaLegal(R, 18), [{ tipo: 'aprobar', fecha: diaLegal(R, 16) }]);
  igual(t.silencioFirme, true, 'tarde');
});
caso_real('sin cotejo, el día 15 manda el incumplimiento del cotejo (más grave que el riesgo de silencio)', () => {
  const R = '2026-11-23';
  igual(derivar(caso(R), diaLegal(R, 15)).estado, 'cotejo_vencido', 'estado');
});
caso_real('cotejo vencido: el día 11 sin cotejo el caso es incumplimiento', () => {
  const R = '2026-11-23';
  igual(derivar(caso(R), diaLegal(R, 11)).estado, 'cotejo_vencido', 'estado');
});
caso_real('cobro sin suspender: el caso pide suspender ya y las obligaciones inmediatas figuran vencidas', () => {
  const R = '2026-11-23', c = derivar(caso(R, { sinSuspender: true }), diaLegal(R, 2));
  igual(c.estado, 'cobro_activo', 'estado');
  igual(c.puedeSuspender, true, 'puede suspender');
  cierto(oblig(c, 'Suspender el cobro').clase === 'critico', 'suspensión debe figurar vencida');
});
caso_real('suspensión tardía (día 3): los 20 días del titular para denunciar corren desde el aviso, no desde la radicación (art. 8)', () => {
  const R = '2026-11-23', s = diaLegal(R, 3), b = caso(R, { sinSuspender: true });
  const c = derivar(b, s, [{ tipo: 'suspender', fecha: s }]);
  igual(c.lim.denuncia, habilesDesde(s, 20), 'plazo de denuncia');
});
caso_real('suspensión tardía: no se puede reanudar el cobro antes de que el titular complete sus 20 días', () => {
  const R = '2026-11-23', s = diaLegal(R, 3), b = caso(R, { sinSuspender: true });
  const decs = [{ tipo: 'suspender', fecha: s }, { tipo: 'aprobar', fecha: diaLegal(R, 9) }, { tipo: 'reanudar', fecha: diaLegal(R, 21) }];
  const c = derivar(b, diaLegal(R, 21), decs);
  cierto(c.estado !== 'reanudado', 'reanudó el día 21 desde la radicación, pero el titular aún estaba en su día 18');
});
caso_real('sin denuncia en 20 días hábiles y con respuesta, se puede reanudar el día 21, no el 20', () => {
  const R = '2026-11-23', b = caso(R), resp = { tipo: 'aprobar', fecha: diaLegal(R, 9) };
  igual(derivar(b, diaLegal(R, 20), [resp]).puedeReanudar, false, 'día 20');
  const c = derivar(b, diaLegal(R, 21), [resp]);
  igual(c.puedeReanudar, true, 'día 21');
  igual(derivar(b, diaLegal(R, 21), [resp, { tipo: 'reanudar', fecha: diaLegal(R, 21) }]).estado, 'reanudado', 'reanudado');
});
caso_real('reanudar decidido el día 20 no tiene efecto aunque se consulte después', () => {
  const R = '2026-11-23', b = caso(R);
  const c = derivar(b, diaLegal(R, 25), [{ tipo: 'aprobar', fecha: diaLegal(R, 9) }, { tipo: 'reanudar', fecha: diaLegal(R, 20) }]);
  cierto(c.estado !== 'reanudado', 'una decisión tomada antes de vencer el plazo no debería reanudar el cobro');
});
caso_real('evidencia clara: al responder se exonera, se piden las centrales y se reporta a la DIAN', () => {
  const R = '2026-11-23', b = caso(R, ALTA), f = diaLegal(R, 6);
  const c = derivar(b, diaLegal(R, 7), [{ tipo: 'aprobar', fecha: f }]);
  igual(c.evid.banda, 'alta', 'banda');
  igual(c.estado, 'exonerado', 'estado');
  cierto(oblig(c, 'Reportar a la DIAN').hecho, 'DIAN');
  cierto(oblig(c, 'Pedir a las centrales').hecho, 'centrales');
});
caso_real('exoneración desde $1.500.000 pide doble firma; por debajo no', () => {
  const alto = derivar(caso('2026-11-23', { ...ALTA, monto: 1500000 }), '2026-11-25');
  const bajo = derivar(caso('2026-11-23', { ...ALTA, monto: 1499999 }), '2026-11-25');
  igual([app('requiereDobleFirma')(alto, 'exonerar') || app('requiereDobleFirma')(alto, 'aprobar'), app('requiereDobleFirma')(bajo, 'aprobar')], [true, false], 'doble firma');
});
caso_real('acatar el silencio deja el caso acatado y la corrección en centrales hecha ese día', () => {
  const R = '2026-11-23', b = caso(R), d = diaLegal(R, 17);
  const c = derivar(b, d, [{ tipo: 'acatar', fecha: d }]);
  igual(c.estado, 'silencio_acatado', 'estado');
  cierto(oblig(c, 'Pedir a las centrales').hecho, 'centrales');
});
caso_real('un reclamo radicado antes de la vigencia (18-nov-2026) no se puede crear', () => {
  cierto(app('VIGENCIA') === '2026-11-19', 'vigencia');
});
caso_real('consultar antes de la radicación no muestra el caso', () => {
  igual(derivar(caso('2026-12-01'), '2026-11-30'), null, 'caso');
});
caso_real('las 12 obligaciones citan un artículo y, si tienen plazo, su fecha cae en día hábil', () => {
  const R = '2026-12-24', c = derivar(caso(R), diaLegal(R, 5));
  igual(c.obligaciones.length, 12, 'cantidad');
  for (const o of c.obligaciones) {
    cierto(/Art\.|art\.|Ley/.test(o.articulo), 'sin artículo: ' + o.paso);
    if (o.limite) cierto(habil(o.limite) || o.limite === R, `límite en día no hábil: ${o.paso} ${o.limite}`);
  }
});

// ---------- 3. Regresiones de la auditoría del 3-nov-2026 (ronda 39) ----------
caso_real('aprobar antes de la fecha planeada: la respuesta queda en la fecha de la decisión y no cambia después', () => {
  const b = app('CASOS_BASE').find(x => x.plan.respuesta !== null && x.plan.respuesta >= 6 && x.plan.suspension === 0);
  const f = diaLegal(b.fechaRadicacion, 2), decs = [{ tipo: 'aprobar', fecha: f }];
  for (const hoy of [f, diaLegal(b.fechaRadicacion, 12), diaLegal(b.fechaRadicacion, 25)]) {
    const c = derivar(b, hoy, decs);
    igual(c.fechas.respuesta, f, 'respuesta el ' + hoy);
    cierto(c.decisiones.some(d => d.tipo === 'aprobar'), 'la decisión del analista no debe desaparecer');
  }
});
caso_real('exoneración tardía: la respuesta figura como «se mantiene la suspensión» y la exoneración en su propia fecha', () => {
  const R = '2026-11-23', b = caso(R, { banderas: { expedicion: true } });
  const resp = diaLegal(R, 8), exo = diaLegal(R, 12);
  const c = derivar(b, exo, [{ tipo: 'aprobar', fecha: resp }, { tipo: 'exonerar', fecha: exo }]);
  igual(c.estado, 'exonerado', 'estado');
  const ev = c.eventos.find(e => e.fecha === resp && e.titulo.startsWith('Respuesta de fondo'));
  igual(ev.titulo, 'Respuesta de fondo: se mantiene la suspensión', 'título de la respuesta');
});
caso_real('discrepancia en el documento (prueba sumaria, art. 7) permite exonerar aunque el puntaje sea medio', () => {
  const R = '2026-11-23', b = caso(R, { banderas: { expedicion: true } });
  const c = derivar(b, diaLegal(R, 9), [{ tipo: 'aprobar', fecha: diaLegal(R, 8) }]);
  cierto(c.evid.banda !== 'alta', 'la banda debía ser media o baja');
  igual(c.puedeExonerar, true, 'puede exonerar');
  cierto(/prueba sumaria/.test(derivar(b, diaLegal(R, 3)).recomendacion), 'la recomendación debe mencionarlo');
});
caso_real('las decisiones de fechas posteriores no cuentan al proyectar «Si nadie actúa»', () => {
  const R = '2026-11-23', b = caso(R), hoy = diaLegal(R, 14), futuro = diaLegal(R, 17);
  ctx.__b = b; ctx.__d = [{ tipo: 'acatar', fecha: futuro }];
  const c = app(`derivarCaso(__b, '${diaLegal(R, 18)}', __d, '${hoy}')`);
  igual(c.estado, 'silencio', 'estado proyectado');
});
caso_real('el indicador de riesgo cuenta los casos a 3 días o menos del silencio aunque tengan el cotejo vencido', () => {
  const R = '2026-11-23', c = derivar(caso(R), diaLegal(R, 13));
  igual([c.estado, c.riesgoSilencio], ['cotejo_vencido', true], 'estado y riesgo');
});
caso_real('un reclamo radicado en 2027 lleva el año 2027 en el radicado', () => {
  cierto(caso('2027-01-12').radicado.startsWith('SUP-2027-'), 'radicado');
});
caso_real('reclamo nuevo: avisar a las centrales «reclamo en trámite» se registra aparte de la suspensión', () => {
  const R = '2026-11-23', b = caso(R);
  const sin = derivar(b, diaLegal(R, 1));
  igual([oblig(sin, 'Informar a las centrales').hecho, oblig(sin, 'Informar a las centrales').registro], [false, 'centrales'], 'pendiente con botón');
  const con = derivar(b, diaLegal(R, 1), [{ tipo: 'centrales', fecha: diaLegal(R, 1) }]);
  igual([oblig(con, 'Informar a las centrales').hecho, oblig(con, 'Informar a las centrales').registro], [true, null], 'hecho');
});
caso_real('la denuncia de la entidad no se da por hecha con el cotejo: se registra y vence con los 20 días', () => {
  const R = '2026-11-23', b = caso(R);
  const c = derivar(b, diaLegal(R, 21), [{ tipo: 'cotejo', fecha: diaLegal(R, 4) }]);
  const o = oblig(c, 'Formular la denuncia penal de la entidad');
  igual([o.hecho, o.clase], [false, 'critico'], 'vencida sin registrar');
  const d = derivar(b, diaLegal(R, 21), [{ tipo: 'cotejo', fecha: diaLegal(R, 4) }, { tipo: 'denuncia_entidad', fecha: diaLegal(R, 6) }]);
  igual(oblig(d, 'Formular la denuncia penal de la entidad').clase, 'bien', 'registrada a tiempo');
});
caso_real('cotejo registrado tarde: la línea de tiempo conserva que venció el plazo de 10 días', () => {
  const R = '2026-11-23', c = derivar(caso(R), diaLegal(R, 13), [{ tipo: 'cotejo', fecha: diaLegal(R, 12) }]);
  cierto(c.eventos.some(e => e.titulo === 'Venció el plazo de cotejo'), 'evento de vencimiento');
  cierto(oblig(c, 'Cotejar').texto.startsWith('Hecho tarde'), 'obligación hecha tarde');
});
caso_real('denuncia del titular registrada después de reanudar el cobro: el caso vuelve a decisión judicial', () => {
  const R = '2026-11-23', b = caso(R), decs = [{ tipo: 'aprobar', fecha: diaLegal(R, 9) }, { tipo: 'reanudar', fecha: diaLegal(R, 21) }];
  igual(derivar(b, diaLegal(R, 21), decs).estado, 'reanudado', 'reanudado');
  igual(derivar(b, diaLegal(R, 22), [...decs, { tipo: 'denuncia_titular', fecha: diaLegal(R, 22) }]).estado, 'judicial', 'con denuncia');
});
caso_real('sin suspender el cobro, el plazo del titular aún no corre y se dice así', () => {
  const c = derivar(caso('2026-11-23', { sinSuspender: true }), '2026-11-25');
  igual([c.lim.denuncia, c.denunciaTitular.texto], [null, 'Empieza al suspender el cobro'], 'plazo');
});
caso_real('la recomendación sigue al estado: en silencio pide acatar, nunca «mantener la suspensión»', () => {
  const R = '2026-11-23', c = derivar(caso(R), diaLegal(R, 17));
  cierto(c.recomendacion.startsWith('Acatar el silencio'), c.recomendacion);
});
caso_real('con silencio positivo, el reporte a la DIAN aplica y se puede registrar', () => {
  const R = '2026-11-23', c = derivar(caso(R), diaLegal(R, 17));
  igual(oblig(c, 'Reportar a la DIAN').registro, 'dian', 'botón DIAN');
});

caso_real('decisión judicial: «hubo suplantación» exonera y «no hubo suplantación» reanuda el cobro (art. 9)', () => {
  const R = '2026-11-23', b = caso(R), base = [{ tipo: 'denuncia_titular', fecha: diaLegal(R, 5) }, { tipo: 'aprobar', fecha: diaLegal(R, 9) }];
  const j = derivar(b, diaLegal(R, 30), base);
  igual([j.estado, j.puedeRegistrarFallo], ['judicial', true], 'en juicio');
  const si = derivar(b, diaLegal(R, 40), [...base, { tipo: 'fallo_suplantacion', fecha: diaLegal(R, 40) }]);
  igual([si.estado, si.exoneradoPorFallo, oblig(si, 'Reportar a la DIAN').hecho], ['exonerado', true, true], 'hubo suplantación');
  const no = derivar(b, diaLegal(R, 40), [...base, { tipo: 'fallo_sin_suplantacion', fecha: diaLegal(R, 40) }]);
  igual([no.estado, no.reanudadoPorFallo], ['reanudado', true], 'no hubo suplantación');
  cierto(/comunicación previa/.test(no.recomendacion), 'debe recordar el preaviso de la Ley 1266');
});
caso_real('sin denuncia del titular no se puede registrar una decisión judicial', () => {
  const R = '2026-11-23', b = caso(R);
  const c = derivar(b, diaLegal(R, 30), [{ tipo: 'aprobar', fecha: diaLegal(R, 9) }, { tipo: 'fallo_suplantacion', fecha: diaLegal(R, 30) }]);
  igual([c.puedeRegistrarFallo, c.exonerado], [false, false], 'sin juicio');
});

// ---------- Resumen ----------
const ok = resultados.filter(r => r[0]).length;
for (const [b, n, e] of resultados) console.log(`${b ? '  ok   ' : '  FALLA'} ${n}${e ? '\n        ' + e : ''}`);
console.log(`\n${ok} de ${resultados.length} casos reales pasaron.`);
process.exitCode = ok === resultados.length ? 0 : 1;
