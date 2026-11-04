// ==== CALENDARIO ====

/**
 * Cálculo del Domingo de Pascua mediante el algoritmo de Computus (Meeus/Jones/Butcher).
 * @param {number} anio
 * @returns {{anio: number, mes: number, dia: number}} Mes en base 1 (1-12)
 */
function pascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { anio, mes, dia };
}

/**
 * Convierte un objeto fecha UTC en cadena ISO YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function fechaAISO(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parsea una cadena YYYY-MM-DD como Date en UTC
 * @param {string} iso
 * @returns {Date}
 */
function parsearFechaUTC(iso) {
  const partes = iso.split('-');
  return new Date(Date.UTC(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10)));
}

/**
 * Desplaza una fecha al siguiente lunes si no cae en lunes (Ley 51 de 1983 - Emiliani).
 * Si ya es lunes (día 1 en UTC), se mantiene intacta.
 * @param {string} fechaISO Cadena YYYY-MM-DD
 * @returns {string} Fecha trasladada al lunes
 */
function trasladarAlLunes(fechaISO) {
  const d = parsearFechaUTC(fechaISO);
  const diaSemana = d.getUTCDay(); // 0: domingo, 1: lunes, ..., 6: sábado
  if (diaSemana === 1) {
    return fechaISO;
  }
  const diasHastaLunes = (8 - diaSemana) % 7;
  d.setUTCDate(d.getUTCDate() + (diasHastaLunes === 0 ? 7 : diasHastaLunes));
  return fechaAISO(d);
}

/**
 * Suma días calendario a una fecha en UTC
 * @param {string} fechaISO
 * @param {number} dias
 * @returns {string}
 */
function sumarDiasCalendario(fechaISO, dias) {
  const d = parsearFechaUTC(fechaISO);
  d.setUTCDate(d.getUTCDate() + dias);
  return fechaAISO(d);
}

/**
 * Devuelve la lista ordenada de días festivos en Colombia para un año determinado (Ley 51 de 1983).
 * @param {number} anio
 * @returns {string[]} Array de fechas 'YYYY-MM-DD'
 */
function festivosColombia(anio) {
  const lista = [];

  // Fijos (no se trasladan)
  const aStr = String(anio);
  lista.push(`${aStr}-01-01`); // Año Nuevo
  lista.push(`${aStr}-05-01`); // Día del Trabajo
  lista.push(`${aStr}-07-20`); // Grito de Independencia
  lista.push(`${aStr}-08-07`); // Batalla de Boyacá
  lista.push(`${aStr}-12-08`); // Inmaculada Concepción
  lista.push(`${aStr}-12-25`); // Navidad

  // Pascua y festivos asociados a Semana Santa
  const p = pascua(anio);
  const pascuaISO = `${aStr}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`;
  lista.push(sumarDiasCalendario(pascuaISO, -3)); // Jueves Santo
  lista.push(sumarDiasCalendario(pascuaISO, -2)); // Viernes Santo

  // Ley Emiliani: Fijos que se trasladan al siguiente lunes
  lista.push(trasladarAlLunes(`${aStr}-01-06`)); // Reyes Magos
  lista.push(trasladarAlLunes(`${aStr}-03-19`)); // San José
  lista.push(trasladarAlLunes(`${aStr}-06-29`)); // San Pedro y San Pablo
  lista.push(trasladarAlLunes(`${aStr}-08-15`)); // Asunción de la Virgen
  lista.push(trasladarAlLunes(`${aStr}-10-12`)); // Día de la Raza
  lista.push(trasladarAlLunes(`${aStr}-11-01`)); // Todos los Santos
  lista.push(trasladarAlLunes(`${aStr}-11-11`)); // Independencia de Cartagena
  // Virgen del Rosario de Chiquinquirá (Ley 2578 del 1 de junio de 2026, Diario Oficial 53.510): 9 de julio, trasladable
  if (anio >= 2026) lista.push(trasladarAlLunes(`${aStr}-07-09`));

  // Ley Emiliani: Basados en Pascua que se trasladan al lunes siguiente
  // Ascensión (Pascua + 39 -> cae jueves, se mueve al lunes siguiente: Pascua + 43)
  lista.push(sumarDiasCalendario(pascuaISO, 43));
  // Corpus Christi (Pascua + 60 -> cae jueves, se mueve al lunes siguiente: Pascua + 64)
  lista.push(sumarDiasCalendario(pascuaISO, 64));
  // Sagrado Corazón (Pascua + 68 -> cae viernes, se mueve al lunes siguiente: Pascua + 71)
  lista.push(sumarDiasCalendario(pascuaISO, 71));

  // Dos festivos trasladados pueden caer el mismo lunes (por ejemplo en 2038): se cuentan una sola vez
  return [...new Set(lista)].sort();
}

// Cache de festivos por año para optimizar cálculos
const _cacheFestivos = {};
function obtenerSetFestivos(anio) {
  if (!_cacheFestivos[anio]) {
    _cacheFestivos[anio] = new Set(festivosColombia(anio));
  }
  return _cacheFestivos[anio];
}

/**
 * Determina si una fecha dada en formato 'YYYY-MM-DD' es día hábil en Colombia.
 * Sábado, domingo y festivos retornan false.
 * @param {string} fechaISO
 * @returns {boolean}
 */
function esHabil(fechaISO) {
  const d = parsearFechaUTC(fechaISO);
  const diaSemana = d.getUTCDay();
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }
  const anio = d.getUTCFullYear();
  const festivos = obtenerSetFestivos(anio);
  return !festivos.has(fechaISO);
}

/**
 * Calcula la fecha del n-ésimo día hábil DESPUÉS de fechaISO.
 * El día inicial no cuenta.
 * @param {string} fechaISO 'YYYY-MM-DD'
 * @param {number} n Cantidad de días hábiles a sumar
 * @returns {string} Fecha resultante 'YYYY-MM-DD'
 */
function sumarHabiles(fechaISO, n) {
  let d = parsearFechaUTC(fechaISO);
  let cont = 0;
  while (cont < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const iso = fechaAISO(d);
    if (esHabil(iso)) {
      cont++;
    }
  }
  return fechaAISO(d);
}

/**
 * Resta n días hábiles antes de fechaISO.
 * @param {string} fechaISO 'YYYY-MM-DD'
 * @param {number} n
 * @returns {string}
 */
function restarHabiles(fechaISO, n) {
  let d = parsearFechaUTC(fechaISO);
  let cont = 0;
  while (cont < n) {
    d.setUTCDate(d.getUTCDate() - 1);
    const iso = fechaAISO(d);
    if (esHabil(iso)) {
      cont++;
    }
  }
  return fechaAISO(d);
}

/**
 * Cuenta los días hábiles después de a hasta b incluido.
 * Si b <= a, retorna 0.
 * @param {string} a 'YYYY-MM-DD'
 * @param {string} b 'YYYY-MM-DD'
 * @returns {number}
 */
function habilesEntre(a, b) {
  if (a >= b) {
    return 0;
  }
  let d = parsearFechaUTC(a);
  const destino = parsearFechaUTC(b);
  let habiles = 0;
  while (d.getTime() < destino.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1);
    const iso = fechaAISO(d);
    if (esHabil(iso)) {
      habiles++;
    }
  }
  return habiles;
}

/**
 * Formatea una fecha ISO a texto colombiano legible: '22 dic 2026'
 * @param {string} fechaISO
 * @returns {string}
 */
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const meses = MESES_CORTOS;
  const p = fechaISO.split('-');
  const dia = parseInt(p[2], 10);
  const mesIdx = parseInt(p[1], 10) - 1;
  const anio = p[0];
  return `${dia} ${meses[mesIdx]} ${anio}`;
}

/**
 * Formatea un valor numérico a moneda colombiana: '$1.249.900'
 * @param {number} valor
 * @returns {string}
 */
function formatearMoneda(valor) {
  if (typeof valor !== 'number') return '$0';
  const entero = Math.round(valor);
  const formateado = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formateado}`;
}

// ==== FIN CALENDARIO ====
