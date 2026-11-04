// ==== MODELO DE CASOS (determinista, sin DOM) ====
// Cada caso guarda sus eventos como desfases en días hábiles desde la radicación.
// El estado no se guarda: se deriva comparando esos eventos con la fecha simulada.

const VIGENCIA = '2026-11-19';
const FECHA_DEFECTO = '2026-12-22';

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMERCIOS = [
  'Celulares Plaza 80', 'Electro Norte 14', 'Moda Urbana Centro', 'Hogar y Más Kennedy',
  'Deportes Andes', 'Óptica Visión 21', 'Tecno Sur Bosa', 'Calzado La 19'
];
const CANALES = ['App', 'Correo', 'Línea telefónica', 'Oficina'];
const CATEGORIAS = ['celulares', 'electrónica', 'moda', 'hogar', 'deportes', 'óptica'];
const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'];
const NOMBRES = [
  'Carlos Mario Restrepo', 'Diana Marcela Gómez', 'Jorge Iván Ramírez', 'Lina María Ospina',
  'Andrés Felipe Jaramillo', 'Claudia Patricia Henao', 'Juan Camilo Morales', 'Paula Andrea Ortiz',
  'Mateo Bermúdez Silva', 'Natalia Zuluaga Vargas', 'Diego Alejandro Cardona', 'Laura Valentina Ruiz',
  'Héctor Fabio Quintero', 'Sonia Esperanza Rincón', 'Óscar Eduardo Pineda', 'Ángela María Giraldo',
  'Julián David Caicedo', 'Bibiana Lucía Cárdenas', 'Wilson Fernando Barón', 'Paola Cristina Duarte',
  'Hernán Darío Gil', 'Luz Marina Castrillón', 'Mauricio Enrique Alarcón', 'Sandra Milena Villalba',
  'César Augusto Parra', 'Gloria Amparo Chaves', 'Fabio Nelson Salgado', 'María Constanza Londoño',
  'Albeiro de Jesús Correa', 'Patricia Elena Arango', 'Rodrigo Alfonso Beltrán', 'Yolanda del Socorro Meza',
  'Víctor Hugo Sanabria', 'Elvia Rocío Cifuentes', 'Gabriel Jaime Lopera', 'Martha Cecilia Guzmán',
  'Nelson Enrique Carvajal', 'Nubia Stella Bohórquez', 'Guillermo León Palacio', 'Mónica Isabel Hoyos',
  'Jaime Alberto Forero', 'Clara Inés Montaño', 'Orlando de Jesús Echeverry', 'Adriana Lucía Puerta',
  'Germán Darío Benítez', 'Doris Amanda Cuervo', 'Álvaro José Saldarriaga', 'Olga Lucía Valderrama',
  'Gustavo Adolfo Buitrago', 'Beatriz Eugenia Marulanda', 'Édgar Hernando Serna', 'Luz Stella Meneses',
  'Ricardo León Ocampo', 'Consuelo del Pilar Botero'
];
const ANALISTAS = ['Tú', 'Laura Méndez', 'Andrés Peña', 'Camila Rojas'];
const DIRECCIONES_RED =['Cra 7 # ••-45, Soacha', 'Cl 15 # ••-80, Soacha', 'Tv 9 # ••-22, Soacha'];
// Teléfonos ficticios ya enmascarados: el código público no guarda ningún número que pueda ser de alguien.
const TELEFONO_COMPARTIDO = '315•••4512';

// Enmascarado de datos personales: la mesa solo muestra lo necesario para cotejar
const telMask = t => `${t.slice(0, 3)} ••• ${t.slice(-4)}`;
const mailMask = (usuario, dominio) => `${usuario.slice(0, 2)}•••@${dominio}`;

function generarCasosBase() {
  const rng = mulberry32(20261119);
  const r = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const elegir = arr => arr[Math.floor(rng() * arr.length)];
  const fechaTexto = () => `${r(1, 28)} ${elegir(['ene', 'mar', 'may', 'jul', 'sep', 'nov'])} ${r(2004, 2019)}`;
  const huella = () => Math.floor(rng() * 0xffff).toString(16).padStart(4, '0');
  const casos = [];

  for (let i = 0; i < 54; i++) {
    const ciudad = elegir(CIUDADES);
    const monto = r(18, 340) * 10000;
    const exp = fechaTexto();
    const telTitular = `3${r(0, 2)}${r(0, 9)}•••${String(r(1000000, 9999999)).slice(-4)}`;
    const usuario = NOMBRES[i].toLowerCase().split(' ')[0];
    const c = {
      id: i + 1,
      radicado: `SUP-2026-${String(1801 + i).padStart(6, '0')}`,
      titular: NOMBRES[i],
      cedula: `•••• ${r(1000, 9999)}`,
      ciudad,
      canal: elegir(CANALES),
      comercio: elegir(COMERCIOS.slice(1)),
      asesor: `A-0${r(300, 989)}`,
      categoria: elegir(CATEGORIAS),
      monto,
      cupo: Math.round(monto / (0.45 + rng() * 0.5) / 10000) * 10000,
      edad: Math.floor(Math.pow(rng(), 1.3) * 21), // días hábiles de antigüedad en la fecha por defecto
      diasDesdeCompra: r(5, 120),
      // Evidencia recibida al aprobar el crédito frente a la que aporta el titular
      expAprob: exp, expTitular: exp,
      docAprob: huella(), docTitular: null,
      biometria: +(0.45 + rng() * 0.53).toFixed(2),
      telAprob: telTitular, telTitular, lineaDias: r(40, 1400),
      correoAprob: mailMask(usuario, 'correo.co'), correoTitular: mailMask(usuario, 'correo.co'), correoDias: r(30, 2200),
      dirAprob: `Cl ${r(10, 170)} # ••-${r(10, 99)}, ${ciudad}`, dirTitular: null,
      ipCiudad: ciudad,
      dispositivo: `DV-${huella().toUpperCase()}`, cedulasDispositivo: 1, comprasPrevias: false,
      red: null, grupoTelefono: false,
      plan: { suspension: 0, documentos: rng() > 0.5 ? r(1, 4) : null, cotejo: r(4, 7), respuesta: r(8, 11), denuncia: rng() > 0.45 ? r(2, 17) : null }
    };
    c.docTitular = c.docAprob;
    c.dirTitular = c.dirAprob;
    // Ruido realista en los casos generales
    if (rng() < 0.3) { c.expAprob = fechaTexto(); }
    if (rng() < 0.25) { c.docAprob = huella(); }
    if (rng() < 0.25) { c.ipCiudad = elegir(CIUDADES.filter(x => x !== ciudad)); }
    if (rng() < 0.2) { c.cedulasDispositivo = 2; }
    if (rng() < 0.15) { c.comprasPrevias = true; c.cedulasDispositivo = 1; }
    casos.push(c);
  }

  const fraudeFuerte = (c, overrides) => {
    c.expAprob = fechaTexto(); c.docAprob = huella();
    c.biometria = +(0.38 + rng() * 0.24).toFixed(2);
    c.telAprob = `3${r(0, 2)}${r(0, 9)}•••${String(r(1000000, 9999999)).slice(-4)}`; c.lineaDias = r(3, 20);
    c.correoAprob = mailMask('z' + huella(), 'mailbox.co'); c.correoDias = r(1, 5);
    c.categoria = 'celulares'; c.cupo = c.monto; c.comprasPrevias = false;
    Object.assign(c, overrides);
  };

  // Red sembrada: 9 casos, 2 dispositivos, 3 direcciones en Soacha; 7 del mismo asesor
  [18, 16, 15, 13, 11, 9, 7, 4, 2].forEach((edad, k) => {
    const c = casos[k];
    fraudeFuerte(c, {
      edad, red: 'soacha', ipCiudad: 'Soacha', dirAprob: DIRECCIONES_RED[k % 3],
      dispositivo: k < 5 ? 'DV-7F3A' : 'DV-7F3B', cedulasDispositivo: k < 5 ? 5 : 4,
      comercio: k < 7 ? 'Celulares Plaza 80' : 'Tecno Sur Bosa',
      asesor: k < 7 ? 'A-0231' : c.asesor
    });
    c.plan.cotejo = r(4, 6);
    c.plan.respuesta = edad >= 12 ? r(9, 11) : null; // los recientes esperan la aprobación del analista
  });

  // Teléfono compartido por 4 titulares (línea nueva al aprobar)
  [14, 10, 6, 3].forEach((edad, k) => {
    const c = casos[9 + k];
    Object.assign(c, { edad, grupoTelefono: true, telAprob: TELEFONO_COMPARTIDO, lineaDias: r(8, 25), ciudad: 'Medellín', ipCiudad: 'Medellín' });
    c.dirAprob = c.dirAprob.replace(/, .*$/, ', Medellín'); c.dirTitular = c.dirAprob;
  });
  casos[9].plan.respuesta = null; // a 1 día hábil del silencio positivo

  // Incidentes: dos silencios positivos y un cobro que no se suspendió
  Object.assign(casos[13], { edad: 22 }); casos[13].plan.cotejo = null; casos[13].plan.respuesta = null; casos[13].plan.denuncia = null;
  Object.assign(casos[14], { edad: 21 }); casos[14].plan.cotejo = 9; casos[14].plan.respuesta = null; casos[14].plan.denuncia = 6;
  Object.assign(casos[15], { edad: 8 }); casos[15].plan.suspension = null;

  // Plazo de 20 días vencido sin denuncia: se puede reanudar el cobro con aprobación
  [16, 17].forEach(i => {
    const c = casos[i];
    Object.assign(c, { edad: 22, expAprob: c.expTitular, docAprob: c.docTitular, biometria: 0.88, cedulasDispositivo: 1, lineaDias: 410, correoDias: 950, ipCiudad: c.ciudad });
    c.plan.denuncia = null; c.plan.respuesta = 11;
  });
  casos[17].comprasPrevias = true;

  // En riesgo de silencio positivo (faltan 3 y 2 días hábiles)
  Object.assign(casos[18], { edad: 12, comprasPrevias: true, cedulasDispositivo: 1 }); casos[18].plan.respuesta = null; casos[18].plan.cotejo = 6;
  Object.assign(casos[19], { edad: 13 }); casos[19].plan.respuesta = null; casos[19].plan.cotejo = 7;

  // Nuevos de hoy y cotejos que vencen hoy o mañana
  [20, 21].forEach(i => { casos[i].edad = 0; });
  [[22, 10], [23, 10], [24, 9]].forEach(([i, edad]) => { casos[i].edad = edad; casos[i].plan.cotejo = null; casos[i].plan.respuesta = null; });

  casos.forEach(c => { c.fechaRadicacion = restarHabiles(FECHA_DEFECTO, c.edad); });
  // Asignación: las redes van a la especialista en fraude organizado; el resto se reparte en el equipo
  casos.forEach(c => { c.analista = c.red ? 'Camila Rojas' : ANALISTAS[c.id % 3]; });
  return casos;
}

const CASOS_BASE = generarCasosBase();
const CASOS_POR_ASESOR = {};
function contarAsesores() {
  Object.keys(CASOS_POR_ASESOR).forEach(k => delete CASOS_POR_ASESOR[k]);
  CASOS_BASE.forEach(c => { CASOS_POR_ASESOR[c.asesor] = (CASOS_POR_ASESOR[c.asesor] || 0) + 1; });
}
contarAsesores();
// Los reclamos radicados en la demo entran y salen solo por estas dos funciones
function agregarCasoManual(caso) { CASOS_BASE.push(caso); contarAsesores(); }
function quitarCasosManuales() {
  for (let i = CASOS_BASE.length - 1; i >= 0; i--) if (CASOS_BASE[i].manual) CASOS_BASE.splice(i, 1);
  contarAsesores();
}

// Reclamo radicado a mano en la demo: empieza con todo pendiente para que el analista actúe
function crearCasoManual(d, id, fecha) {
  const exp = '14 mar 2012', doc = 'a41c';
  const ciudad = d.ciudad;
  const c = {
    id, radicado: `SUP-${String(fecha).slice(0, 4)}-${String(1855 + id - 1001).padStart(6, '0')}`, titular: d.nombre, cedula: `•••• ${String(d.cedula || '0000').slice(-4)}`,
    ciudad, canal: d.canal, comercio: d.comercio, asesor: d.asesor || `A-0${600 + (id % 300)}`, categoria: d.categoria, monto: d.monto,
    cupo: d.reventa ? d.monto : Math.round(d.monto * 2 / 10000) * 10000, diasDesdeCompra: d.diasDesdeCompra, edad: 0,
    expAprob: d.expedicion ? '2 jun 2021' : exp, expTitular: exp, docAprob: doc, docTitular: doc,
    biometria: d.biometria ? 0.52 : 0.91,
    telAprob: d.linea ? `320•••${String(9000 + id).slice(-4)}` : '310•••7720', telTitular: '310•••7720', lineaDias: d.linea ? 9 : 640,
    correoAprob: d.correo ? 'qx•••@mailbox.co' : 'ti•••@correo.co', correoTitular: 'ti•••@correo.co', correoDias: d.correo ? 2 : 900,
    dirAprob: d.ubicacion ? 'Cl 40 # ••-12, Soacha' : `Cl 72 # ••-18, ${ciudad}`, dirTitular: `Cl 72 # ••-18, ${ciudad}`,
    ipCiudad: d.ubicacion ? 'Soacha' : ciudad,
    dispositivo: d.dispositivo ? 'DV-7F3A' : 'DV-0C11', cedulasDispositivo: d.dispositivo ? 6 : 1, comprasPrevias: false,
    red: null, grupoTelefono: false, manual: true, analista: 'Tú',
    plan: { suspension: 0, documentos: null, cotejo: null, respuesta: null, denuncia: null },
    fechaRadicacion: fecha
  };
  return c;
}

// ---- Puntaje de evidencia: reglas explicables ----
function puntuar(c, conDenuncia, excluir) {
  const reglas = [];
  const sumar = (clave, cond, peso, texto) => { if (cond) reglas.push({ clave, peso, texto, ignorada: !!(excluir && excluir.has(clave)) }); };
  sumar('expedicion', c.expAprob !== c.expTitular, 30, 'La fecha de expedición de la cédula no coincide (prueba sumaria, art. 7)');
  sumar('serie', c.docAprob !== c.docTitular, 20, 'La serie del documento no coincide con la del titular');
  sumar('otp', c.telAprob !== c.telTitular, 10, 'El código para firmar el pagaré llegó a una línea que no es del titular');
  sumar('biometria', c.biometria < 0.70, 25, `Biometría de la selfie al aprobar: ${c.biometria.toFixed(2).replace('.', ',')} (mínimo 0,70)`);
  sumar('dispositivo', c.cedulasDispositivo >= 3, 25, `El dispositivo lo usaron ${c.cedulasDispositivo} cédulas distintas`);
  sumar('linea', c.lineaDias < 30, 15, `La línea telefónica tenía ${c.lineaDias} días al aprobar`);
  sumar('correo', c.correoDias < 7, 10, `El correo se creó ${c.correoDias} días antes de la solicitud`);
  sumar('ubicacion', c.ipCiudad !== c.ciudad || c.dirAprob !== c.dirTitular, 10, 'Dirección de entrega o ciudad de conexión distinta a la del titular');
  sumar('reventa', ['celulares', 'electrónica'].includes(c.categoria) && c.monto >= 0.8 * c.cupo, 10, 'Primera compra de alta reventa por el 80 % o más del cupo');
  sumar('denuncia', conDenuncia, 10, 'El titular aportó la denuncia ante la Fiscalía');
  // Historial limpio no siempre es inocencia: si cambió la línea, la ciudad o el dispositivo es compartido, huele a toma de cuenta
  const mismoEntorno = c.cedulasDispositivo === 1 && c.telAprob === c.telTitular && c.ipCiudad === c.ciudad;
  sumar('familiar', c.comprasPrevias && mismoEntorno, -20, 'Compras anteriores pagadas desde el mismo dispositivo, línea y ciudad (posible uso de un familiar)');
  sumar('ato', c.comprasPrevias && !mismoEntorno, 20, 'Cliente con historial, pero con línea, ciudad o dispositivo nuevos (posible toma de cuenta)');
  const puntaje = Math.max(0, Math.min(100, reglas.filter(x => !x.ignorada).reduce((s, x) => s + x.peso, 0)));
  const banda = puntaje >= 60 ? 'alta' : puntaje >= 30 ? 'media' : 'baja';
  return { puntaje, banda, reglas };
}

const BANDAS = {
  alta: { nombre: 'Hay elementos que evidencian la suplantación', corto: 'Evidencia clara' },
  media: { nombre: 'Evidencia parcial', corto: 'Parcial' },
  baja: { nombre: 'Sin elementos todavía', corto: 'Sin elementos' }
};

const ESTADOS = {
  cobro_activo: { texto: 'Cobro sin suspender', clase: 'critico', abierto: true },
  silencio: { texto: 'Silencio positivo', clase: 'critico', abierto: true },
  cotejo_vencido: { texto: 'Cotejo vencido', clase: 'critico', abierto: true },
  riesgo: { texto: 'En riesgo de silencio', clase: 'alerta', abierto: true },
  cotejo_hoy: { texto: 'Cotejo vence hoy', clase: 'alerta', abierto: true },
  nuevo: { texto: 'Nuevo', clase: 'acento', abierto: true },
  puede_reanudar: { texto: 'Plazo de denuncia vencido', clase: 'alerta', abierto: true },
  en_tramite: { texto: 'En término', clase: 'bien', abierto: true },
  espera_denuncia: { texto: 'Esperando denuncia', clase: 'neutro', abierto: true },
  judicial: { texto: 'Espera decisión judicial', clase: 'neutro', abierto: true },
  silencio_acatado: { texto: 'Resuelto por silencio', clase: 'critico', abierto: false },
  exonerado: { texto: 'Exonerado', clase: 'bien', abierto: false },
  reanudado: { texto: 'Cobro reanudado', clase: 'neutro', abierto: false }
};

// Días hábiles que faltan para una fecha (negativo si ya pasó)
function restantes(hoy, fecha) {
  return fecha >= hoy ? habilesEntre(hoy, fecha) : -Math.max(1, habilesEntre(fecha, hoy));
}

// ---- Derivación del estado de un caso en una fecha ----
// congelarDesde: simula que nadie actúa después de esa fecha (los eventos planeados no ocurren)
function derivarCaso(base, hoy, decisiones, congelarDesde) {
  if (base.fechaRadicacion > hoy) return null; // todavía no se ha radicado
  const t = habilesEntre(base.fechaRadicacion, hoy);
  const dia = n => (n === null || n === undefined) ? null : sumarHabiles(base.fechaRadicacion, n);
  const hecho = f => f !== null && f <= hoy && (!congelarDesde || f <= congelarDesde);
  const decs = (decisiones || []).filter(d => d && d.fecha >= base.fechaRadicacion && d.fecha <= hoy && (!congelarDesde || d.fecha <= congelarDesde))
    .sort((a, b2) => a.fecha < b2.fecha ? -1 : a.fecha > b2.fecha ? 1 : 0);
  const dec = tipo => decs.find(d => d.tipo === tipo);

  // Prórroga de 8 días hábiles: solo vale si se decidió antes de vencer los 15 (art. 7, num. 8)
  const prorroga = decs.find(d => d.tipo === 'prorrogar' && d.fecha <= dia(15));
  const lim = { cotejo: dia(10), respuesta: dia(prorroga ? 23 : 15), denuncia: null, respuestaInicial: dia(15) };
  let fSusp = dia(base.plan.suspension);
  if (fSusp === null && dec('suspender')) fSusp = dec('suspender').fecha;
  // Art. 8 inc. 3: los 20 días del titular corren desde que se le comunica, junto con la suspensión; sin aviso, aún no corren
  lim.denuncia = fSusp ? sumarHabiles(fSusp, 20) : null;
  // Cada paso cuenta en la fecha más temprana: la de los datos de ejemplo o la que registró el analista en la mesa
  const antes = (plan, tipo) => { const d = dec(tipo); return d && (plan === null || d.fecha < plan) ? d.fecha : plan; };
  const fDocs = antes(dia(base.plan.documentos), 'documentos');
  const fDenuncia = antes(dia(base.plan.denuncia), 'denuncia_titular');
  let fCotejo = antes(dia(base.plan.cotejo), 'cotejo');
  let fResp = dia(base.plan.respuesta);
  const aprobada = dec('aprobar');
  // Responder implica haber cotejado. Si el analista aprobó antes de lo planeado, vale su fecha, nunca una posterior
  if (aprobada) {
    if (fCotejo === null || aprobada.fecha < fCotejo) fCotejo = aprobada.fecha;
    if (fResp === null || aprobada.fecha < fResp) fResp = aprobada.fecha;
  }
  // Aviso a las centrales de «reclamo en trámite» (Ley 1266, art. 16-II num. 4): en los reclamos nuevos lo registra el analista
  const fCentralesT = base.manual ? (dec('centrales') ? dec('centrales').fecha : null) : antes(dia(base.plan.suspension), 'centrales');

  const evid = puntuar(base, hecho(fDenuncia));
  const evidAlResponder = hecho(fResp) ? puntuar(base, hecho(fDenuncia) && fDenuncia <= fResp) : null;
  const discrepancias = base.expAprob !== base.expTitular || base.docAprob !== base.docTitular;
  const acatado = dec('acatar');
  // Leyenda «Víctima de Falsedad Personal»: tras un cotejo con discrepancias (art. 7) o cuando hay denuncia (art. 5 num. 2)
  let fCentrales = null;
  if (hecho(fCotejo) && discrepancias) fCentrales = fCotejo;
  else if (hecho(fCotejo) && hecho(fDenuncia)) fCentrales = fDenuncia > fCotejo ? fDenuncia : fCotejo;
  if (!fCentrales && acatado) fCentrales = acatado.fecha;
  // Denuncia penal de la entidad (art. 8 inc. 3, C-413 de 2025); con discrepancias incluye la estafa (art. 5 num. 9)
  const fDenEnt = antes(!base.manual && discrepancias && hecho(fCotejo) ? fCotejo : null, 'denuncia_entidad');
  const fEstafa = discrepancias ? fDenEnt : null;
  // El silencio positivo no se borra: una respuesta tardía no lo deshace
  const respTardia = hecho(fResp) && fResp > lim.respuesta;
  const silencioFirme = respTardia || (!hecho(fResp) && hoy > lim.respuesta);
  let fExon = !silencioFirme && evidAlResponder && evidAlResponder.banda === 'alta' ? fResp : null;
  // Art. 10: si los elementos llegan después de responder (por ejemplo, con la denuncia), se puede exonerar en cualquier momento del trámite
  const exonerarTarde = dec('exonerar');
  if (!fExon && !silencioFirme && exonerarTarde && hecho(fResp) && exonerarTarde.fecha >= fResp
    && (discrepancias || puntuar(base, hecho(fDenuncia) && fDenuncia <= exonerarTarde.fecha).banda === 'alta')) fExon = exonerarTarde.fecha;
  // Art. 9: con la denuncia en curso, el caso espera la decisión judicial; el analista registra el resultado cuando llega
  const falloSi = dec('fallo_suplantacion'), falloNo = dec('fallo_sin_suplantacion');
  const enJuicio = f => hecho(fDenuncia) && hecho(fResp) && f.fecha >= fDenuncia && f.fecha >= fResp;
  const exoneradoPorFallo = !fExon && !silencioFirme && !!falloSi && enJuicio(falloSi);
  if (exoneradoPorFallo) fExon = falloSi.fecha;
  // Si se exonera, el reporte negativo deja de ser veraz y se pide corregirlo (principio de veracidad, art. 2)
  if (!fCentrales && fExon) fCentrales = fExon;
  const fDian = antes(fExon, 'dian');
  const reanudadoPorFallo = !!falloNo && !fExon && !silencioFirme && enJuicio(falloNo);
  const reanudado = reanudadoPorFallo || !!dec('reanudar') && !!lim.denuncia && dec('reanudar').fecha > lim.denuncia && !hecho(fDenuncia) && !fExon && !silencioFirme;
  const investigacionSugerida = base.cedulasDispositivo >= 3 || (CASOS_POR_ASESOR[base.asesor] || 0) >= 5;

  let estado;
  if (fSusp === null) estado = 'cobro_activo';
  else if (silencioFirme) estado = acatado ? 'silencio_acatado' : 'silencio';
  else if (!hecho(fCotejo) && hoy > lim.cotejo) estado = 'cotejo_vencido';
  else if (hecho(fExon)) estado = 'exonerado';
  else if (reanudado) estado = 'reanudado';
  else if (!hecho(fResp) && restantes(hoy, lim.respuesta) <= 3) estado = 'riesgo';
  else if (!hecho(fCotejo) && lim.cotejo === hoy) estado = 'cotejo_hoy';
  else if (t === 0) estado = 'nuevo';
  else if (hecho(fResp) && !hecho(fDenuncia) && lim.denuncia && hoy > lim.denuncia) estado = 'puede_reanudar';
  else if (hecho(fResp) && hecho(fDenuncia)) estado = 'judicial';
  else if (hecho(fResp)) estado = 'espera_denuncia';
  else estado = 'en_tramite';
  const abierto = ESTADOS[estado].abierto;

  // Próximo plazo: el pendiente más cercano (los vencidos primero)
  let proximo = null;
  if (abierto) {
    const pend = [];
    if (!hecho(fCotejo)) pend.push({ nombre: 'Cotejo y corrección en centrales', fecha: lim.cotejo });
    if (!hecho(fResp)) pend.push({ nombre: 'Respuesta de fondo', fecha: lim.respuesta });
    if (!hecho(fDenuncia) && lim.denuncia && hoy <= lim.denuncia) pend.push({ nombre: 'Plazo del titular para denunciar', fecha: lim.denuncia });
    pend.sort((a, b2) => a.fecha < b2.fecha ? -1 : 1);
    if (pend.length) proximo = { ...pend[0], dias: restantes(hoy, pend[0].fecha) };
    else if (estado === 'puede_reanudar') proximo = { nombre: 'Decidir si se reanuda el cobro', fecha: null, dias: null };
    else if (estado === 'judicial') proximo = { nombre: 'Sin plazo: espera decisión judicial (art. 9)', fecha: null, dias: null };
    if (estado === 'silencio') proximo = { nombre: 'Acatar el silencio y corregir centrales', fecha: lim.respuesta, dias: restantes(hoy, lim.respuesta) };
    if (estado === 'cobro_activo') proximo = { nombre: 'Suspender el cobro ya (art. 8)', fecha: base.fechaRadicacion, dias: -t };
  }

  // Obligaciones legales con su estado
  const obligacion = (paso, articulo, cita, limite, fecha, aplica = true, registro = null) => {
    let est;
    if (!aplica) est = { clase: 'neutro', texto: 'No aplica' };
    else if (hecho(fecha)) est = limite && fecha > limite
      ? { clase: 'critico', texto: `Hecho tarde, el ${formatearFecha(fecha)}` }
      : { clase: 'bien', texto: `Hecho el ${formatearFecha(fecha)}` };
    else if (limite && hoy > limite) est = { clase: 'critico', texto: `Vencido el ${formatearFecha(limite)}` };
    else if (limite) { const d = restantes(hoy, limite); est = { clase: d <= 3 ? 'alerta' : 'neutro', texto: d === 0 ? 'Vence hoy' : d === 1 ? 'Falta 1 día hábil' : `Faltan ${d} días hábiles` }; }
    else est = { clase: 'neutro', texto: 'Pendiente' };
    return { paso, articulo, cita, limite, hecho: aplica && hecho(fecha), registro: aplica && registro && !hecho(fecha) ? registro : null, ...est };
  };
  const obligaciones = [
    obligacion('Suspender el cobro, los intereses y los gastos de cobranza', 'Art. 8 inc. 2', '«deberá suspender de manera inmediata el cobro»', base.fechaRadicacion, fSusp),
    obligacion('Avisar al titular que tiene 20 días hábiles para denunciar', 'Art. 8 inc. 3 y art. 5 num. 6', '«a partir de ese momento cuenta con veinte (20) días hábiles»', base.fechaRadicacion, fSusp),
    obligacion('Bloquear el cupo y el producto adquirido por suplantación', 'Art. 5 num. 5', '«Suspender de forma inmediata la prestación o suministro de los bienes y/o servicios»', base.fechaRadicacion, fSusp),
    obligacion('Informar a las centrales para que marquen «reclamo en trámite»', 'Ley 1266, art. 16-II', 'Ley 1266 de 2008: máximo dos días hábiles', dia(2), fCentralesT, true, 'centrales'),
    obligacion('Entregar copia de los documentos con que se aprobó el crédito', 'Art. 5 num. 7', '«Bajo ninguna circunstancia podrá negarse la entrega»', null, fDocs, true, 'documentos'),
    obligacion('Cotejar los documentos del crédito con los del titular', 'Ley 1266, art. 16-II num. 7 (mod. art. 7 Ley 2573)', '«deberá cotejar, dentro de los diez (10) días hábiles siguientes»', lim.cotejo, fCotejo, true, estado === 'cobro_activo' ? null : 'cotejo'),
    obligacion('Pedir a las centrales corregir el dato negativo y el puntaje, con la leyenda «Víctima de Falsedad Personal»', 'Ley 1266, art. 16-II num. 7 y art. 5 num. 2', '«sin que esto impacte la puntuación de la presunta víctima»', discrepancias ? lim.cotejo : null, fCentrales, discrepancias || hecho(fDenuncia) || !!acatado || !!fExon),
    obligacion(prorroga ? 'Responder de fondo (con prórroga de 8 días)' : 'Responder de fondo', 'Ley 1266, art. 16-II num. 8 (mod. art. 7 Ley 2573)', '«dentro de los quince (15) días hábiles siguientes a la fecha de su recibo»', lim.respuesta, fResp),
    obligacion('Formular la denuncia penal de la entidad (falsedad personal y conexos)', 'Art. 8 inc. 3 (Sentencia C-413 de 2025)', 'Condicionamiento de la Corte Constitucional: dentro del mismo término de 20 días hábiles', lim.denuncia, fDenEnt, true, 'denuncia_entidad'),
    obligacion('Denunciar la estafa por las discrepancias', 'Art. 5 num. 9', '«deberá denunciar el delito de estafa»', null, fEstafa, discrepancias),
    obligacion('Reportar a la DIAN', 'Art. 5 num. 8', '«para evitar que la persona suplantada sufra perjuicios de carácter tributario»', null, fDian, !!fExon || hecho(fDenuncia) || silencioFirme, 'dian'),
    obligacion('Investigar si hubo participación de funcionarios', 'Art. 5 num. 10', '«en caso de encontrar eventuales indicios»', null, dec('investigar') ? dec('investigar').fecha : null, investigacionSugerida)
  ];
  const denunciaTitular = hecho(fDenuncia)
    ? { clase: 'bien', texto: `Recibida el ${formatearFecha(fDenuncia)}` }
    : !lim.denuncia ? { clase: 'neutro', texto: 'Empieza al suspender el cobro' }
    : hoy > lim.denuncia ? { clase: 'alerta', texto: 'Venció sin denuncia' } : { clase: 'neutro', texto: `Vence el ${formatearFecha(lim.denuncia)}` };

  // Recomendación: nunca existe la salida «rechazar» (art. 10, inciso 2)
  let recomendacion;
  if (estado === 'cobro_activo') recomendacion = 'Suspender hoy el cobro, bloquear el cupo y avisar al titular que tiene 20 días hábiles para denunciar (art. 8).';
  else if (estado === 'silencio') recomendacion = 'Acatar el silencio positivo: el reclamo se entiende resuelto a favor del titular. Pedir la corrección en las centrales y cerrar el caso.';
  else if (estado === 'silencio_acatado') recomendacion = 'Caso cerrado a favor del titular. Verificar que la corrección en centrales y el reporte a la DIAN queden registrados.';
  else if (estado === 'exonerado') recomendacion = 'Titular exonerado. Verificar que centrales, DIAN y la denuncia de la entidad queden registradas.';
  else if (estado === 'reanudado' && reanudadoPorFallo) recomendacion = 'La autoridad judicial concluyó que no hubo suplantación: el cobro se reanuda (art. 9). Antes de reportar a las centrales, enviar la comunicación previa (Ley 1266, art. 12).';
  else if (estado === 'reanudado') recomendacion = 'Cobro reanudado. Si el titular aporta la denuncia, registrarla: el caso pasa a decisión judicial y el cobro se suspende de nuevo (art. 9).';
  else if (estado === 'puede_reanudar') recomendacion = 'Venció el plazo de 20 días hábiles sin denuncia. Reanudar el cobro es opcional (art. 8, parágrafo 1).';
  else if (estado === 'judicial') recomendacion = 'Mantener la suspensión hasta que la autoridad judicial decida (art. 9).';
  else if (evid.banda !== 'alta' && discrepancias) recomendacion = 'Hay discrepancias en el documento, que sirven como prueba sumaria de la falsedad (art. 7). Después de responder se puede exonerar sin exigir la denuncia (art. 10).';
  else if (evid.banda === 'alta') recomendacion = 'Exonerar al titular sin exigir la denuncia (art. 10), pedir la corrección en las centrales con la leyenda «Víctima de Falsedad Personal», denunciar la estafa y reportar a la DIAN.';
  else if (evid.banda === 'media') recomendacion = 'Mantener la suspensión, pedir una prueba de validación de identidad (art. 6 num. 5) y esperar la denuncia (art. 8).';
  else recomendacion = 'Mantener la suspensión y esperar la denuncia del titular (art. 8).';

  // Línea de tiempo: solo lo que ya ocurrió
  const eventos = [{ fecha: base.fechaRadicacion, titulo: 'Reclamo radicado', detalle: `Canal: ${base.canal}. Compra del ${formatearFecha(sumarDiasCalendario(base.fechaRadicacion, -base.diasDesdeCompra))} en ${base.comercio}.` }];
  if (!hecho(fSusp) || fSusp > base.fechaRadicacion) eventos.push({ fecha: base.fechaRadicacion, titulo: 'La cobranza siguió activa', detalle: 'El sistema de cobranza no recibió la orden de suspensión. Incumple el art. 8.', critico: true });
  if (hecho(fSusp)) eventos.push({ fecha: fSusp, titulo: fSusp > base.fechaRadicacion ? 'Cobro suspendido tarde' : 'Cobro suspendido y aviso de 20 días enviado', detalle: 'Se congelan intereses y gastos de cobranza.', critico: fSusp > base.fechaRadicacion });
  if (hecho(fDocs)) eventos.push({ fecha: fDocs, titulo: 'Documentos de aprobación entregados al titular', detalle: 'Copia de la solicitud, la selfie y el pagaré digital.' });
  if (hecho(fDenuncia)) eventos.push({ fecha: fDenuncia, titulo: 'El titular aportó la denuncia', detalle: 'Constancia de la denuncia ante la Fiscalía.' });
  if (hecho(fCotejo)) eventos.push({ fecha: fCotejo, titulo: 'Cotejo terminado', detalle: discrepancias ? 'Hay discrepancias: se pidió la corrección en las centrales y se denunció la estafa.' : 'Sin discrepancias documentales.' });
  if ((!hecho(fCotejo) && hoy > lim.cotejo) || (hecho(fCotejo) && fCotejo > lim.cotejo)) eventos.push({ fecha: lim.cotejo, titulo: 'Venció el plazo de cotejo', detalle: 'Pasaron 10 días hábiles sin cotejo.', critico: true });
  if (hecho(fResp)) eventos.push({ fecha: fResp, analista: true, critico: respTardia,
    titulo: respTardia ? 'Respuesta de fondo enviada tarde' : fExon && fExon === fResp ? 'Respuesta de fondo: titular exonerado' : 'Respuesta de fondo: se mantiene la suspensión',
    detalle: respTardia ? 'Ya había operado el silencio positivo: la respuesta no lo deshace.' : fExon && fExon === fResp ? 'Aprobada por un analista. Exoneración por art. 10 y reporte a la DIAN.' : 'Aprobada por un analista. Resultado del cotejo comunicado; el cobro sigue suspendido hasta la denuncia o la decisión judicial.' });
  if (silencioFirme) eventos.push({ fecha: lim.respuesta, titulo: 'Silencio positivo configurado', detalle: `Pasaron ${prorroga ? 23 : 15} días hábiles sin respuesta. El reclamo se entiende resuelto a favor del titular.`, critico: true });
  // Solo se muestran las decisiones que tuvieron efecto: las repetidas o sin requisito no cuentan
  const primera = tipo => decs.find(d => d.tipo === tipo);
  const efecto = { aprobar: d => fResp === d.fecha, exonerar: d => fExon === d.fecha, acatar: () => silencioFirme,
    suspender: () => base.plan.suspension === null, reanudar: () => !!reanudado,
    cotejo: d => fCotejo === d.fecha, centrales: d => fCentralesT === d.fecha, documentos: d => fDocs === d.fecha,
    denuncia_titular: d => fDenuncia === d.fecha, denuncia_entidad: d => fDenEnt === d.fecha, dian: d => fDian === d.fecha,
    fallo_suplantacion: d => exoneradoPorFallo && fExon === d.fecha, fallo_sin_suplantacion: () => reanudadoPorFallo };
  const decsValidas = decs.filter(d => d.tipo === 'prorrogar' ? d === prorroga : d === primera(d.tipo) && (!efecto[d.tipo] || efecto[d.tipo](d)));
  // El cotejo, los documentos y la denuncia del titular ya tienen su propio evento en la línea de tiempo
  decsValidas.filter(d => !['cotejo', 'documentos', 'denuncia_titular'].includes(d.tipo)).forEach(d => eventos.push({ fecha: d.fecha, titulo: `Decisión de analista: ${NOMBRE_DECISION[d.tipo]}`, detalle: d.nota || '', analista: true }));
  eventos.sort((a, b2) => a.fecha < b2.fecha ? -1 : a.fecha > b2.fecha ? 1 : 0);

  // Prioridad explicable: urgencia del plazo (hasta 60) + monto (hasta 25) + evidencia (hasta 15); un incumplimiento va primero
  let prioridad = 0;
  if (ESTADOS[estado].clase === 'critico') prioridad = 100;
  else if (abierto) {
    const urgencia = proximo && proximo.dias !== null ? Math.max(0, 60 - proximo.dias * 6) : 10;
    prioridad = Math.min(99, Math.round(urgencia + Math.min(25, (base.monto / 3400000) * 25) + evid.puntaje * 0.15));
  }

  return {
    ...base, t, lim, estado, abierto, est: ESTADOS[estado], proximo, evid, recomendacion, discrepancias, prioridad,
    fechas: { suspension: fSusp, cotejo: hecho(fCotejo) ? fCotejo : null, respuesta: hecho(fResp) ? fResp : null, denuncia: hecho(fDenuncia) ? fDenuncia : null },
    investigacionSugerida, obligaciones, denunciaTitular, eventos, decisiones: decsValidas,
    respondido: hecho(fResp), exonerado: hecho(fExon), denunciaRecibida: hecho(fDenuncia),
    riesgoSilencio: abierto && !hecho(fResp) && !silencioFirme && estado !== 'cobro_activo' && restantes(hoy, lim.respuesta) <= 3,
    puedeRegistrarFallo: estado === 'judicial', exoneradoPorFallo, reanudadoPorFallo,
    puedeRegistrarDenuncia: !hecho(fDenuncia) && !fExon && !silencioFirme && estado !== 'cobro_activo',
    cobroSuspendido: hecho(fSusp) && abierto,
    puedeAprobar: abierto && !hecho(fResp) && !['cobro_activo', 'silencio'].includes(estado),
    puedeReanudar: estado === 'puede_reanudar',
    puedeExonerar: abierto && hecho(fResp) && !fExon && !silencioFirme && (evid.banda === 'alta' || discrepancias) && estado !== 'cobro_activo',
    puedeSuspender: estado === 'cobro_activo',
    puedeAcatar: estado === 'silencio',
    puedeProrrogar: abierto && !hecho(fResp) && !prorroga && hoy <= lim.respuestaInicial && !['cobro_activo', 'silencio'].includes(estado),
    prorrogado: !!prorroga, silencioFirme,
    tablaCotejo: tablaCotejo(base)
  };
}

const NOMBRE_DECISION = {
  aprobar: 'aprobó la recomendación',
  validar: 'pidió validación de identidad',
  investigar: 'escaló a investigación interna',
  reanudar: 'reanudó el cobro',
  suspender: 'suspendió el cobro',
  prorrogar: 'prorrogó la respuesta 8 días hábiles',
  acatar: 'acató el silencio positivo y corrigió centrales',
  proponer: 'propuso exonerar (falta la segunda firma)',
  exonerar: 'exoneró al titular (art. 10)',
  deshacer: 'deshizo su decisión anterior',
  cotejo: 'registró el cotejo terminado',
  centrales: 'informó a las centrales «reclamo en trámite»',
  documentos: 'entregó copia de los documentos al titular',
  denuncia_titular: 'registró la denuncia del titular',
  denuncia_entidad: 'registró la denuncia penal de la entidad',
  dian: 'registró el reporte a la DIAN',
  fallo_suplantacion: 'registró la decisión judicial: hubo suplantación',
  fallo_sin_suplantacion: 'registró la decisión judicial: no hubo suplantación'
};
// Exoneraciones desde este monto necesitan una segunda firma (control de cuatro ojos)
const UMBRAL_DOBLE_FIRMA = 1500000;
const requiereDobleFirma = c => ((c.puedeAprobar && c.evid.banda === 'alta') || c.puedeExonerar) && c.monto >= UMBRAL_DOBLE_FIRMA;

// La persona que reclama es la titular real: su revalidación biométrica siempre pasa (entre 0,93 y 0,99)
const revalidacion = c => (0.93 + (c.id * 37 % 7) / 100).toFixed(2).replace('.', ',');

// ---- Cotejo: lo recibido al aprobar contra lo que aporta el titular ----
function tablaCotejo(c) {
  const fila = (dato, aprob, titular, resultado) => ({ dato, aprob, titular, resultado: resultado || (aprob === titular ? 'Coincide' : 'Discrepa') });
  return [
    fila('Nombre', c.titular, c.titular),
    fila('Fecha de expedición de la cédula', c.expAprob, c.expTitular),
    fila('Serie del documento', c.docAprob.toUpperCase(), c.docTitular.toUpperCase()),
    fila('Biometría de la selfie', c.biometria.toFixed(2).replace('.', ','), `Revalidación al reclamar: ${revalidacion(c)}`, c.biometria >= 0.70 ? 'Coincide' : 'Discrepa'),
    fila('Teléfono', `${telMask(c.telAprob)} (línea de ${c.lineaDias} días)`, telMask(c.telTitular), c.telAprob === c.telTitular ? 'Coincide' : 'Discrepa'),
    fila('Correo', `${c.correoAprob} (${c.correoDias} días)`, c.correoTitular, c.correoAprob === c.correoTitular ? 'Coincide' : 'Discrepa'),
    fila('Dirección de entrega', c.dirAprob, c.dirTitular),
    fila('Ciudad de conexión', c.ipCiudad, c.ciudad),
    fila('Dispositivo', `${c.dispositivo} (${c.cedulasDispositivo} ${c.cedulasDispositivo === 1 ? 'cédula' : 'cédulas'})`,
      c.comprasPrevias ? 'Lo reconoce como suyo' : 'No lo reconoce',
      c.comprasPrevias ? 'Coincide' : c.cedulasDispositivo >= 2 ? 'Discrepa' : 'Sin dato'),
    fila('Firma del pagaré digital', `Código enviado a ${telMask(c.telAprob)}`, c.telAprob === c.telTitular ? 'Recibido en su línea' : 'No recibió el código',
      c.telAprob === c.telTitular ? 'Coincide' : 'Discrepa')
  ];
}

// ---- Redes: casos unidos por datos compartidos (se calculan, no están fijas) ----
// Une con union-find los casos que comparten un dispositivo usado por 3 o más cédulas, una línea o una
// dirección que no son del titular, o un asesor con 5 o más reclamos. Una red tiene al menos 3 casos.
function construirRedes(casos) {
  const padre = new Map(casos.map(c => [c.id, c.id]));
  const raiz = x => { while (padre.get(x) !== x) { padre.set(x, padre.get(padre.get(x))); x = padre.get(x); } return x; };
  const unir = (a, b) => { const ra = raiz(a), rb = raiz(b); if (ra !== rb) padre.set(ra, rb); };
  const criterios = [
    { tipo: 'Dispositivo', valor: c => c.cedulasDispositivo >= 3 ? c.dispositivo : null, etiqueta: v => v, minimo: 2 },
    { tipo: 'Teléfono', valor: c => c.telAprob !== c.telTitular ? c.telAprob : null, etiqueta: v => telMask(v), minimo: 2 },
    { tipo: 'Dirección', valor: c => c.dirAprob !== c.dirTitular ? c.dirAprob : null, etiqueta: v => v.replace(/, [^,]+$/, ''), minimo: 2 },
    { tipo: 'Asesor', valor: c => c.asesor, etiqueta: v => `Asesor ${v}`, minimo: 5 }
  ];
  const entidades = [];
  criterios.forEach(cr => {
    const grupos = {};
    casos.forEach(c => { const v = cr.valor(c); if (v) (grupos[v] = grupos[v] || []).push(c); });
    Object.entries(grupos).forEach(([v, cs]) => {
      if (cs.length < cr.minimo) return;
      cs.slice(1).forEach(c => unir(cs[0].id, c.id));
      entidades.push({ id: `${cr.tipo}-${v}`, tipo: cr.tipo, etiqueta: cr.etiqueta(v), casos: cs });
    });
  });
  const componentes = {};
  casos.forEach(c => { if (entidades.some(e => e.casos.includes(c))) (componentes[raiz(c.id)] = componentes[raiz(c.id)] || []).push(c); });
  return Object.values(componentes).filter(cs => cs.length >= 3).sort((a, b) => b.length - a.length).map((cs, k) => {
    const ents = entidades.filter(e => e.casos.some(c => cs.includes(c)));
    const tipos = new Set(ents.map(e => e.tipo));
    const ciudades = {}; cs.forEach(c => { ciudades[c.ipCiudad] = (ciudades[c.ipCiudad] || 0) + 1; });
    const ciudad = Object.entries(ciudades).sort((a, b) => b[1] - a[1])[0][0];
    const acciones = [];
    if (tipos.has('Asesor')) acciones.push('investigación interna del asesor y del comercio (art. 5 num. 10)');
    if (tipos.has('Dispositivo')) acciones.push('bloqueo preventivo de los dispositivos');
    if (tipos.has('Teléfono')) acciones.push('validación de identidad a los titulares (art. 6 num. 5) y bloqueo de la línea');
    if (tipos.has('Dirección')) acciones.push('alerta sobre las direcciones de entrega');
    if (cs.some(c => c.expAprob !== c.expTitular || c.docAprob !== c.docTitular)) acciones.push('denuncia de estafa (art. 5 num. 9)');
    const texto = acciones.join(', ');
    return { clave: `red${k}`, titulo: `Red ${k + 1} · ${ciudad}`, casos: cs, entidades: ents, acciones: acciones.map(a => a.charAt(0).toUpperCase() + a.slice(1) + '.'),
      accion: texto.charAt(0).toUpperCase() + texto.slice(1) + '.' };
  });
}
