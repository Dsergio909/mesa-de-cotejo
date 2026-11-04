# Rondas de mejora de la Mesa de Cotejo

Cada ronda: **Pregunta** (lo que preguntaría un director de riesgo de nivel internacional) → **Respuesta** (qué falla) → **Solución** (qué se cambió) → **Verificación** (cómo se comprobó).

## Ronda 0: referentes (24-oct-2026)
- **Pregunta:** ¿Qué tienen las herramientas internacionales de casos de fraude que esta mesa no tiene?
- **Respuesta:** Sardine, Unit21 y Alloy trabajan con colas asignadas a analistas, prioridad y plazos (SLA) por caso, vistas guardadas, notas, rastro de auditoría y resúmenes con IA. ServiceNow mide casos que piden atención inmediata, plazos incumplidos y tiempo medio de cierre. Las guías de internacionalización piden separar idioma y formato regional (fechas, moneda) con la API Intl y recordar el idioma elegido.
- **Solución:** plan de rondas 1 a 12 (abajo).
- **Fuentes:** sardine.ai/risk-case-management · docs.unit21.ai/docs/cases · help.alloy.com (Investigations) · servicenow.com (Intelligent Servicing for Fraud dashboard) · simplelocalize.io/blog/posts/language-vs-locale

## Ronda 1: idiomas
- **Pregunta:** ¿Puede usarla un analista o un evaluador que no hable español?
- **Respuesta:** No: todo estaba en español y las fechas y montos solo en formato colombiano.
- **Solución:** capa de traducción (`idiomas.js`) con selector ES, EN y PT que se recuerda por navegador. Traduce lo que aparece en pantalla con plantillas: los datos variables (radicados, fechas, montos, nombres, comercios) se protegen con marcadores y vuelven con el formato del idioma (fechas «Dec 22, 2026», montos «COP 1,360,000»). La IA responde en el idioma elegido. La carta al titular sigue en español, porque es el idioma del titular y de la ley.
- **Verificación:** recorrido automático de todas las vistas, 7 fechas, todos los casos, todas las decisiones, el recorrido guiado y la IA simulada: 629 textos únicos. Gemini (Antigravity) los traduce con un glosario legal y financiero.

## Ronda 2: marco de producto
- **Pregunta:** ¿Se ve como un producto o como una página?
- **Respuesta:** Faltaba el marco que tienen Sardine, Unit21 o Alloy: íconos, cuenta, tema, contadores de lo urgente.
- **Solución:** íconos en el menú, contadores (casos que vencen hoy o mañana, incumplimientos abiertos), selector de idioma, botón de tema (sistema, claro, oscuro), atajos de teclado y avatar de la sesión.

## Ronda 3: pestañas en el caso
- **Pregunta:** ¿Un analista entiende un caso en 30 segundos?
- **Respuesta:** No: el detalle era una sola columna muy larga.
- **Solución:** pestañas Resumen (IA, reloj, decisión y obligaciones), Cotejo y evidencia, Respuesta y Actividad. La recomendación quedó junto a los botones de decisión.

## Ronda 4: bandeja como herramienta de trabajo
- **Pregunta:** ¿Se puede ordenar y repartir el trabajo como en una herramienta real?
- **Respuesta:** El orden era un menú y nadie tenía casos asignados.
- **Solución:** encabezados que ordenan al hacer clic (con indicador), columna de analista con iniciales, filtro «Mis casos», columnas más compactas (caso con radicado y fecha en una sola celda).

## Ronda 5: deshacer
- **Pregunta:** ¿Qué pasa si el analista se equivoca de botón?
- **Respuesta:** No había forma de corregir.
- **Solución:** cada decisión muestra un aviso con «Deshacer» durante 7 segundos.

## Ronda 6: tendencias
- **Pregunta:** ¿Los indicadores dicen si vamos mejor o peor?
- **Respuesta:** Solo mostraban el número de hoy.
- **Solución:** cada indicador trae una línea de los últimos 10 días hábiles y el cambio frente a hace 5, en rojo si empeora lo que debe bajar.

## Ronda 7: barra superior
- **Pregunta:** ¿La barra superior cabe en una pantalla normal?
- **Respuesta:** En 1366 px se partía en dos líneas.
- **Solución:** «Reiniciar demo» pasó junto a los botones de la demo y el buscador se hizo más angosto.

## Ronda 8: teclado
- **Pregunta:** ¿Un usuario experto puede trabajar sin mouse?
- **Solución:** atajos: Ctrl+K buscar o preguntar, 1 a 6 secciones, Alt+flechas cambia el día, J y K pasan de caso con el panel abierto, ? muestra la ayuda.

## Ronda 9: exportar
- **Pregunta:** ¿Se puede sacar la bandeja para el informe del lunes?
- **Solución:** «Exportar CSV» con los filtros aplicados (UTF-8 con BOM para Excel), usando la capacidad de descargas del visor; si el visor no la permite, el botón no aparece.

## Ronda 10: vistas rápidas
- **Pregunta:** ¿Un analista encuentra su trabajo de hoy con un clic?
- **Solución:** vistas Vencen pronto, Mis casos, Incumplidos, Evidencia clara y Cerrados, como las vistas guardadas de Alloy.

## Ronda 11: traducción completa y revisada
- **Pregunta:** ¿La traducción es de nivel profesional y no deja textos en español?
- **Respuesta:** Gemini tradujo los 629 textos con el glosario; Claude revisó los legales («Art. 7(8)», «positive administrative silence (deemed approval)», «falsidade ideológica» en Brasil) y una segunda recolección encontró 31 textos nuevos sin traducir.
- **Solución:** los 31 se tradujeron a mano. Un enlace con `#en` o `#pt` abre la demo en ese idioma. README con resumen en inglés.

## Ronda 12: celular
- **Pregunta:** ¿En el celular se puede trabajar?
- **Respuesta:** la barra superior ocupaba un tercio de la pantalla y se quedaba pegada al bajar.
- **Solución:** en pantallas angostas la barra ya no se queda fija; las vistas rápidas pasan a varias líneas.

## Ronda 13: decimales en inglés
- **Pregunta:** ¿En inglés quedó algún número con coma decimal?
- **Respuesta:** sí, la biometría («0,48») y los porcentajes.
- **Solución:** la capa de idiomas convierte la coma decimal en punto en inglés.

## Rondas 14 a 25: crítica externa de Gemini (director de riesgo de una fintech de Colombia, Brasil y México)
Gemini leyó todo el código y propuso 8 problemas, 3 errores y 3 ideas. Claude evaluó cada uno antes de tocar nada:

| # | Pregunta de Gemini | Decisión de Claude | Qué se hizo |
|---|---|---|---|
| 14 | Si el fraude fue con la cédula real (SIM swap, selfie falsa), ¿se corrige el reporte en centrales? | Acepto en parte | Al exonerar también se pide la corrección (principio de veracidad). La denuncia de estafa sigue atada a discrepancias documentales, como dice el art. 5 num. 9. |
| 15 | ¿Un analista puede condonar solo una deuda grande? | Acepto | Control de cuatro ojos: desde $1.500.000 se propone y una supervisora firma. Ambas firmas quedan en la bitácora. |
| 16 | ¿La cadena SHA-256 es de verdad inalterable si se recalcula en cada vista? | Acepto | Nueva bitácora de decisiones de solo agregar: hora real, quién, huella encadenada; deshacer también queda escrito. La cadena de eventos simulados se mantiene como ilustración. |
| 17 | ¿Se envía la comunicación de prórroga con su motivo antes del día 15? | Acepto | Borrador de prórroga con motivo y nueva fecha límite. |
| 18 | ¿El puntaje castiga a víctimas de toma de cuenta con buen historial? | Acepto | El −20 «familiar» solo aplica si dispositivo, línea y ciudad son los de siempre; si cambiaron, suma +20 por posible toma de cuenta. |
| 19 | ¿Qué recibirían cobranza, centrales y DIAN? | Acepto | Cada decisión genera un evento con clave de idempotencia (contrato en inglés, como una API), visible en Actividad. |
| 20 | ¿Un nombre con instrucciones puede manipular a la IA? | Acepto | Los datos van dentro de etiquetas y se declaran como información; si la respuesta cruza el límite legal, se bloquea en vez de solo advertir. |
| 21 | ¿Montos pequeños salen como «$0,0 M»? | Acepto | Bajo un millón se muestra el monto completo. |
| 22 | Al acatar un silencio, ¿la pérdida desaparece del panel? | Acepto | Nuevo bloque Impacto financiero: perdido por silencio, exonerado por suplantación y pérdida esperada con supuestos visibles. |
| 23 | Al ordenar por plazo al revés, ¿los cerrados quedan arriba? | Acepto | Lo cerrado y lo sin fecha va siempre al final. |
| 24 | ¿Una fecha en domingo distorsiona los plazos? | **Rechazo** | Los plazos se calculan en días hábiles y nunca caen en domingo; si hoy es domingo y el plazo era el viernes, sí está vencido. El aviso «No es día hábil» ya lo explica. |
| 25 | Ideas: contener una red con un clic y expediente descargable | Acepto | «Contener la red» escala y pide validación a todos sus casos con una confirmación; «Descargar expediente (JSON)» con su huella SHA-256. La idea de provisiones NIIF 9 se adaptó a «pérdida esperada» con supuestos visibles, porque clasificar reclamos de fraude en etapas NIIF 9 sería afirmar algo contable que la demo no puede respaldar. |

## Ronda 26: pruebas automáticas
- **Pregunta:** ¿Cómo sabe un entrevistador técnico que los plazos legales están bien, sin creerme?
- **Respuesta:** las verificaciones existían, pero sueltas, en comandos que nadie más podía repetir.
- **Solución:** `pruebas.js`, sin dependencias: `node pruebas.js`. 21 pruebas: los 18 festivos de 2026, Reyes 2027, los plazos de 10/15/20 días con el festivo del 8 dic, que sumar y restar días hábiles son inversos todo el año, datos deterministas, los estados del 22 dic, silencio irreversible, suspensión tardía, prórroga válida e inválida, reanudación, rango del puntaje y toma de cuenta, el pronóstico «si nadie actúa», las dos redes y su crecimiento a 10, las plantillas de idioma, formatos en inglés, portugués completo y marcadores intactos.
- **Verificación:** 21 de 21 en verde.

## Ronda 27: código sin parches
- **Pregunta:** ¿Qué vería un ingeniero al leer el código?
- **Respuesta:** dos funciones redefinidas encima de otras (`abrirDetalle`, `pintarDetalle`), JavaScript dentro del HTML generado (`onclick` en 6 lugares) y un dato que nadie usaba.
- **Solución:** el panel llama directo a `activarPestana` y `pintarIntegraciones`; todo lo que abre un caso lleva `data-caso` y un solo manejador delegado (clic, Enter y Espacio); se quitó `lim.prorroga`.
- **Verificación:** `node --check` en todos los archivos y 21 de 21 pruebas.

## Ronda 28: accesibilidad (WCAG 2.2 AA)
- **Pregunta:** ¿La puede usar alguien con teclado, lector de pantalla o baja visión?
- **Respuesta:** el gris más claro daba 3:1 en texto; el foco se escapaba del diálogo de atajos; el cambio de fecha no se anunciaba; no había forma de saltar el menú.
- **Solución:** el texto usa solo grises de 4,5:1 o más (el gris claro queda para líneas y gráficos, que piden 3:1); trampa de foco también en atajos; región que anuncia «Fecha simulada… N casos vencen hoy, mañana o ya vencieron»; botón «Saltar al contenido»; pestañas con Inicio y Fin; filas de la bandeja con nombre accesible.

## Ronda 29: segunda crítica de Gemini (ingeniero sénior y experto WCAG)
| # | Punto de Gemini | Decisión de Claude | Qué se hizo |
|---|---|---|---|
| 1 | Todo es global; faltan módulos ES | **Rechazo** (por ahora) | Reescribir a módulos a días de la entrevista arriesga romper lo que funciona. Se documentó la arquitectura (orden de carga y dependencias) en el README y se propone como siguiente paso. |
| 2 | Comprobaciones `typeof` esconden dependencias | Acepto | Se quitaron: el orden de carga garantiza que existen. |
| 3 | Listas de meses repetidas | Acepto | Una sola lista (`MESES_CORTOS` en calendario.js). |
| 4 | Nombres de una letra (`b`, `ob`, `t`) | Acepto en parte | `b` → `base` y `ob` → `obligacion`; `t` se queda porque es un campo público que usan varios archivos y las pruebas. |
| 5 | Errores de guardado silenciados | Acepto | Si el navegador no deja guardar, se avisa una vez que lo hecho dura hasta cerrar la página. |
| 6 | Otros archivos modifican `CASOS_BASE` | Acepto | Solo `agregarCasoManual` y `quitarCasosManuales` lo tocan. |
| 7 | Falta `<html lang>` y la fila de la tabla tapa sus celdas | Rechazo lo primero, acepto lo segundo | El esqueleto HTML lo pone la plataforma y el idioma se fija al cargar. La fila ya no tiene `aria-label`: el nombre del titular es un botón real. Las tablas tienen título oculto. |
| 8 | Atajos de una tecla (WCAG 2.1.4) | Acepto | Interruptor para apagarlos en la ventana de atajos. |
| 9 | Foco al cambiar de vista | Acepto | El foco va al título de la vista (excepto durante el recorrido). |
| 10 | Contraste de los números en los nodos (3,05:1) | Acepto | Tonos medios más oscuros en claro y más claros en oscuro; «sin elementos» usa un gris de más de 4,5:1. |
| 11 | Avisos que no se leen y conteo sin anunciar | Acepto | Los avisos se escriben en una región siempre presente y el conteo de la bandeja se anuncia. |
| 12 | «Reproducir el mes» y movimiento reducido | Acepto | Con movimiento reducido avanza en saltos de 5 días hábiles, más despacio, y siempre se puede detener. |
| 13 | Faltan 3 pruebas | Acepto | Doble firma, detección de alteración en la cadena SHA-256 y contrato de integraciones. **25 de 25 pruebas en verde.** |

## Ronda 30: textos nuevos y última revisión visual
- **Pregunta:** ¿Quedó algo en español al abrir la demo con `#en`, o algo roto a la vista?
- **Respuesta:** 7 textos nuevos de accesibilidad sin traducir, y una regla de color de la tabla de registro que pintaba de rojo al analista en las filas incumplidas de la bandeja.
- **Solución:** los 7 textos se tradujeron a inglés y portugués; la regla de color quedó solo para la tabla de registro.
- **Verificación:** recorrido en inglés sin textos en español; clic, Enter en filas y nodos, pestañas con Inicio y Fin, interruptor de atajos, foco al cambiar de vista y anuncio de fecha, sin errores en consola; modo oscuro y celular de 390 px sin scroll horizontal; 25 de 25 pruebas. Publicada la versión 4.

## Ronda 31: investigación en fuentes oficiales (festivo nuevo)
- **Pregunta:** ¿El calendario coincide con los festivos reales de 2027 y 2028 publicados por fuentes externas?
- **Respuesta:** No del todo. La **Ley 2578 del 1 de junio de 2026** (Diario Oficial 53.510; infografía de la Rama Judicial) creó el festivo del 9 de julio (Virgen de Chiquinquirá), trasladable al lunes: en 2026 cayó el 13 de julio. 2026 tiene 19 festivos, no 18; la prueba anterior estaba desactualizada. También apareció que dos festivos trasladados pueden caer el mismo lunes (2030 y 2038).
- **Solución:** el calendario agrega el 9 de julio desde 2026 y cuenta una sola vez los festivos que coinciden. Textos de «Calendario legal» actualizados en los tres idiomas.
- **Verificación:** 2027 completo (19 festivos) y 2028 comparados contra calendariodecolombia.com, Publimetro y Radio Nacional. Los plazos de la demo (noviembre a marzo) no cambian. La Superfinanciera todavía no había publicado el protocolo del art. 5 par. 1 (plazo cerca del 19 nov 2026).

## Ronda 32: pruebas masivas
- **Pregunta:** ¿Las pruebas cubren lo raro, no solo lo esperado?
- **Solución:** de 25 a 62 pruebas. Calendario hasta 2100 (sin repetidos, trasladados en lunes, fijos en su fecha), Pascua más temprana y más tardía posibles, fuzz de 3.000 fechas, invariantes en cada día hábil del 19 nov 2026 al 30 jun 2027 para los 54 casos (nada falla, nada muestra «undefined» ni «NaN»), el silencio y la exoneración nunca se revierten, fuzz de 400 secuencias de decisiones al azar, redes sobre 200 subconjuntos, las 18 combinaciones de orden de la bandeja, y 2.000 frases al azar por idioma.
- **Verificación:** se comprobó que el fuzz de idiomas no es vacío (600 frases probadas por idioma, ninguna saltada).

## Ronda 33: 40 casos de borde de Gemini, verificados
- **Pregunta:** ¿Qué casos de borde se nos escapan?
- **Respuesta:** Gemini propuso 40 (bisiestos, Pascua 2027 y 2030, sábados, días 10/11/16 exactos, prórroga el día 15, doble prórroga, umbrales del puntaje, puentes entre redes, montos y fechas por idioma).
- **Solución:** los 40 se convirtieron en pruebas. En uno, Gemini se equivocó: esperaba que acatar un silencio sin cotejo dejara la corrección en centrales «a tiempo»; la mesa la marca «tarde», y es lo correcto, porque vencía el día 10. Se dejó la razón escrita en la prueba.
- **Verificación:** 62 de 62.

## Ronda 34: auditoría de accesibilidad con axe-core
- **Pregunta:** ¿Qué dice una herramienta profesional de accesibilidad (WCAG 2.0, 2.1 y 2.2 A y AA)?
- **Respuesta:** en 15 estados (6 vistas, 4 pestañas del caso, paleta, 2 diálogos, modo oscuro e inglés) encontró una sola falla: la lista de «Impacto financiero» tenía una nota en un elemento no permitido. Cero fallas de contraste.
- **Solución:** la nota pasó a ser parte válida de la lista.

## Ronda 35: pruebas de punta a punta en el navegador
- **Pregunta:** ¿Funciona igual en los 3 idiomas, los 2 temas y en celular?
- **Respuesta:** 12 combinaciones (3 idiomas × 2 temas × computador y celular): sin desbordes, sin textos rotos y sin errores de JavaScript. Solo faltaba traducir el texto nuevo del festivo, y se tradujo.
- **Verificación adicional:** recorrido con clics reales: radicar, doble firma con deshacer, contener la red, verificar la bitácora (14 decisiones íntegras), Ctrl+K con Enter, recorrido guiado completo, reproducir y detener, reiniciar.

## Ronda 36: tercera auditoría independiente (agente de Claude sin contexto previo, 83 pruebas propias)
El auditor reprodujo 15 problemas ejecutando código. Todos se corrigieron y cada uno quedó vigilado por una prueba de regresión:

| # | Hallazgo | Arreglo |
|---|---|---|
| 1 | La «segunda firma» la daba la misma persona con dos clics seguidos | La segunda firma es un paso aparte, con nombre propio («Firmar como Camila Rojas») y aviso de que en producción sería otro usuario |
| 2 | «Deshacer» no se alcanzaba con teclado (el aviso quedaba fuera del panel) | Botón «Deshacer mi última decisión» dentro del panel y atajo Ctrl+Z |
| 3 | Un caso respondido que después llega a evidencia clara quedaba sin salida | Nueva decisión «Exonerar ahora (art. 10)», también con doble firma si el monto lo exige |
| 4 | En fin de semana un plazo vencido decía «Vence hoy»; la denuncia se medía por número de día | Los vencidos siempre cuentan al menos −1 día; la denuncia se mide contra su fecha límite |
| 5 | La bitácora asíncrona mezclaba fechas y dejaba entradas fantasma al reiniciar | Fecha, hora y actor se fijan al decidir; vaciar la bitácora descarta lo pendiente |
| 6 | Reclamos radicados limpios formaban una red falsa por compartir asesor y línea | Cada reclamo de la demo tiene su propio asesor y su propia línea |
| 7 | Decisiones sin efecto (acatar sin silencio, repetidas, prórroga tardía) aparecían en la línea de tiempo | Solo se listan las decisiones que tuvieron efecto |
| 8 | Un monto enorme daba prioridad 99 aunque el monto debía aportar máximo 25 | Tope de 25 puntos |
| 9 | Fechas muy lejanas (2050, 2099) congelaban la página | La fecha simulada se limita de nov 2026 a dic 2027 |
| 10 | Textos en español con otro idioma (correos, «$0», «100 %», singulares) | Patrón para correos enmascarados, formatos de montos y porcentajes, 37 textos nuevos traducidos |
| 11 | Indicadores con datos vacíos y concordancia («1 casos») | «Sin datos» cuando no hay qué medir; singulares |
| 12 | El recorrido guiado se desordenaba al ir hacia atrás | Cada paso fija vista, caso y pestaña; iniciar el recorrido detiene «Reproducir el mes» |
| 13 | Las herramientas de la IA aceptaban «2026-13-45» y máximos negativos | Fechas reales validadas, máximo entre 1 y 12, búsqueda de al menos 3 letras |
| 14 | `#constructor` como idioma rompía todas las fechas | Solo se aceptan es, en y pt |
| 15 | Foco perdido al cerrar el panel, letras sueltas activas bajo diálogos, calendario contando lo «hecho tarde» como pendiente | Foco vuelve al caso, atajos de una letra apagados bajo diálogos, obligaciones marcadas como hechas |

Durante el arreglo también se encontró y corrigió un error propio: el recorrido usaba una función antes de que existiera, lo que habría roto la carga de la página; una prueba de carga lo detectó antes de publicar.
- **Verificación:** 72 de 72 pruebas (10 nuevas de regresión) y axe-core en cero fallas en 12 estados, incluido el paso nuevo de la segunda firma.

## Ronda 37: prueba final de punta a punta
- **Pregunta:** ¿Después de tantos arreglos, sigue todo bien en cualquier combinación?
- **Verificación:** 3 anchos (390, 577 y 1366 px) × 3 idiomas × 2 temas × 3 fechas (día normal, sábado 26 dic y 15 ene 2027): todas las vistas y casos de muestra con sus 4 pestañas, sin desbordes, sin «undefined» ni «NaN», sin textos en español con inglés o portugués activos y sin errores de JavaScript. 72 de 72 pruebas automáticas y axe-core en cero fallas. Publicada la versión 5.

## Ronda 38: revisión legal con fuentes oficiales
- **Pregunta:** ¿Lo que dice la mesa coincide con la ley vigente, tal como la publica la Secretaría del Senado?
- **Fuentes:** Ley 2573 de 2026 en la Secretaría del Senado (con las notas de la Sentencia C-413 de 2025), Ley 1266 de 2008 en su versión vigente (C-282 de 2021), Ley 2578 de 2026, Ley 51 de 1983 y el Boletín Jurídico 123 de la Superfinanciera.

| # | Hallazgo | Arreglo |
|---|---|---|
| 1 | Faltaba la denuncia penal de la propia entidad (la C-413 de 2025 la hizo obligatoria en el mismo plazo de 20 días hábiles) | Obligación nueva con su fecha límite |
| 2 | «La entidad ya no podría cobrar» y «pierde el caso» exageraban el silencio positivo | «Queda resuelto a favor del titular y la entidad se expone a sanción» (resumen, cumplimiento, README) |
| 3 | Faltaba avisar a las centrales para que marquen «reclamo en trámite» | Obligación nueva: 2 días hábiles (Ley 1266, art. 16-II) |
| 4 | La leyenda de víctima sola no basta | «Corregir el dato negativo y el puntaje, con la leyenda» |
| 5 | La carta de cobro activo prometía no cobrar intereses | «Suspendimos el cobro desde esa fecha, incluidos intereses y gastos» |
| 6 | La carta y el evento de silencio decían 15 días aunque hubiera prórroga | 23 días cuando hubo prórroga |
| 7 | Bloquear el cupo iba mezclado con la suspensión del cobro | Obligación y fila propias (art. 5 num. 5) |
| 8 | Citas «Art. 7, num. 7/8» | «Ley 1266, art. 16-II num. 7/8 (mod. art. 7 Ley 2573)» |
| 9 | «Positive administrative silence» (la C-282 de 2021 quitó «administrativo») | «Positive silence» / «deemed granted by silence» |
| 10 | El aviso de los 20 días figuraba hecho aunque no se hubiera suspendido el cobro | Se marca hecho con la suspensión |

- **Añadido a límites:** devolución por fallas de seguridad (art. 5 par. 2), que la demo no modela.
- **Puntos dudosos para un abogado humano:** leyenda sin denuncia, reanudar el cobro frente al art. 9 condicionado, alcance del silencio, vigencia 19 o 20 de noviembre, devolución del art. 5 par. 2, cuándo reportar a la DIAN, si los sábados cuentan.
- **Verificación:** 72 de 72 pruebas (ahora 12 obligaciones por caso), 0 textos sin traducir en inglés y portugués en 3 fechas × 54 casos, axe-core en cero fallas y sin desbordes a 390 px. Publicada la versión 6.

## Ronda 39: auditoría para llegar al 95 % (3-nov-2026)
- **Pregunta:** ¿la mesa es certera en casos reales y qué le falta para el trabajo de verdad?
- **Método:**
  - `casos_reales.js`: 37 casos de mesa comparados contra un oráculo con los festivos oficiales escritos a mano, día por día de nov 2026 a dic 2027.
  - Un agente de Claude cazó fallos con pruebas: 11 confirmados.
  - Gemini hizo la revisión legal y operativa: 14 hallazgos.
- **Resultado:** se resolvieron 24 hallazgos y se agregaron los botones «Registrar como hecho hoy» para cada paso real y el registro de la decisión judicial. Tabla completa en `AUDITORIA.md`.
- **Verificación:**
  - 109 de 109 pruebas automáticas;
  - 0 textos sin traducir;
  - axe-core en cero fallas;
  - sin desbordes a 390 px;
  - las reproducciones del agente ya no fallan.
- Quedan 2 puntos para un abogado humano. Publicada la versión 7.
