// Escribe C:\Trabajo\Cotejo\video\guion.md a partir de guion.json y tiempos_v2.json
const fs = require('fs');
const g = JSON.parse(fs.readFileSync(__dirname + '/guion.json', 'utf8'));
const t = JSON.parse(fs.readFileSync(__dirname + '/tiempos_v2.json', 'utf8'));
const mmss = s => { const m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); };
const nombres = {
  metodo: 'Cómo funciona', metodo_plazo: 'Cómo funciona (fila «Responder de fondo»)',
  resumen_kpis: 'Resumen (números de arriba)', resumen_pron: 'Resumen (aviso «Si nadie actúa»)',
  bandeja_top: 'Bandeja (primeros casos)', caso_reloj: 'Caso abierto: reloj legal',
  caso_oblig: 'Caso abierto: lista de obligaciones', caso_docs: 'Caso abierto: documentos lado a lado',
  caso_cotejo: 'Caso abierto: tabla del cotejo', caso_puntaje: 'Caso abierto: puntaje de evidencia',
  decision: 'Caso abierto: decisión del analista', decision_botones: 'Caso abierto: botones (sin «rechazar»)',
  decision_firmas: 'Caso abierto: aviso de dos firmas', red: 'Red de fraude', red_grafo: 'Red de fraude (grafo)',
  cumplimiento: 'Cumplimiento (porcentajes)', cumplimiento_registro: 'Cumplimiento (registro de auditoría)',
  uso_fecha: 'Fecha simulada y flechas', uso_paleta: 'Buscar o preguntar (Ctrl+K)',
  uso_ingles: 'La mesa en inglés', uso_ficticio: 'Etiqueta «Datos ficticios»'
};
const corregidas = ['s03', 's06'];
const filas = g.map((s, i) => {
  const x = t[i];
  if (x.id !== s.id) throw new Error('tiempos desalineados en ' + s.id);
  const pant = s.tipo === 'titulo' ? 'Tarjeta de título' : s.tipo === 'cierre' ? 'Tarjeta de cierre' : nombres[s.img];
  const paso = s.paso ? `${s.paso} · ${s.escena}` : '—';
  let txt = s.sub || s.voz;
  if (s.voz && s.sub) txt += ` *(la voz dice: «${s.voz}»)*`;
  if (!s.sub) txt += ' *(solo voz; la tarjeta muestra el texto)*';
  if (corregidas.includes(s.id)) txt += ' **(corregida el 24-oct)**';
  return `| ${mmss(x.tramoIni)} | ${mmss(x.inicio)} | ${paso} | ${pant} | ${txt} |`;
});
const total = t[t.length - 1].tramoFin;
const md = [
  '# Guion · Mesa de Cotejo: cómo funciona', '',
  `Video: \`como_funciona_mesa_cotejo.mp4\` · ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')} (${total.toFixed(1)} s) · 1920×1080 · 30 fps · subtítulos grabados en la imagen.`, '',
  'Uso interno: es para entender el programa, no para publicar. Todos los datos que se ven son ficticios.', '',
  'Voz: Microsoft Laura (español de España), la voz que ya trae Windows, a velocidad 1,1. Sin internet y sin usar la tarjeta gráfica.', '',
  '## Guion con tiempos', '',
  '«Imagen» es cuando cambia la pantalla; «Voz» es cuando empieza a hablar (0,12 s después).', '',
  '| Imagen | Voz | Paso | Qué se ve | Texto (voz y subtítulo) |', '|---|---|---|---|---|',
  ...filas, '',
  '## Cambios del 24-oct-2026', '',
  '- Revisión legal: se corrigieron dos frases que exageraban la ley (marcadas arriba). Antes decían «pierde el caso automáticamente» y «cuánta plata se perderían».',
  '- Se volvieron a tomar todas las capturas con la página actualizada: obligaciones nuevas en el caso (bloquear el cupo, avisar a las centrales de «reclamo en trámite», la denuncia penal de la entidad), textos nuevos en Resumen y la tarjeta nueva de Cumplimiento.',
  '- Como las frases nuevas son más largas, el video pasó de 1:58 a ' + `${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')}` + ' y lo que viene después se corrió unos 5,6 s.',
  '- Cuadros de revisión en `revision/`.', '',
  '## Cómo se hizo', '',
  String.raw`- **Capturas reales** de ` + '`abrir_local.html`' + String.raw` con Microsoft Edge sin ventana (tema claro, 1280×720 a escala 1,5). Para abrir un caso se usó una copia temporal de la página con un script que llama a ` + '`abrirDetalle`' + String.raw` y cambia de pestaña. El recuadro naranja que señala cada parte se dibujó solo en esa copia; los archivos de ` + '`' + String.raw`C:\Trabajo\Cotejo` + '`' + ' no se tocaron.',
  '- **Fecha simulada**: la de la demo, 22 dic 2026. El caso abierto es el primero «en riesgo de silencio» (Natalia Zuluaga Vargas, ficticio).',
  '- **Montaje** con ffmpeg en el procesador: cada cuadro dura lo que dura su frase más una pausa corta, y la imagen cambia 0,12 s antes de que empiece la voz.', ''
].join('\n');
fs.writeFileSync(String.raw`C:\Trabajo\Cotejo\video\guion.md`, md, 'utf8');
console.log(md);
