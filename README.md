# Mesa de Cotejo

Demo en vivo: https://dsergio909.github.io/mesa-de-cotejo/ (en inglés: agrega `#en`; en portugués: `#pt`). El asistente con IA solo funciona al abrir la demo dentro de Claude. En el PC: `abrir_local.html` con un servidor local (por ejemplo, `python -m http.server`).

Prototipo de portafolio (datos ficticios). Una mesa de operación para que una entidad de crédito atienda los reclamos por suplantación de identidad sin dejar vencer ningún plazo de la **Ley Estatutaria 2573 de 2026**.

## El problema
- La ley entra en vigencia el **19-nov-2026** (art. 13). Obliga a quien da crédito a suspender el cobro de inmediato (art. 8), cotejar documentos y corregir las centrales de riesgo en 10 días hábiles (art. 7), y responder en 15 días hábiles. Si no responde a tiempo, **el reclamo se entiende resuelto a favor del cliente** (silencio positivo) y puede haber sanción.
- La entidad **no puede** declarar que no hubo suplantación: eso lo deciden los jueces (art. 10). Solo puede exonerar, esperar la denuncia o, si pasaron 20 días hábiles sin denuncia, reanudar el cobro (art. 8).
- El fraude es real y crece. Asobancaria reportó más de 765.000 reclamaciones por fraude en 2025, por más de $967.000 millones. Según TransUnion, en 2025 la tasa más alta de presunto fraude digital en Colombia estuvo en la creación de cuentas (7,2 %). Y la SIC lleva 40.316 denuncias por suplantación de identidad desde 2020.
- Un prestamista que aprueba en minutos, y sobre todo a personas sin historial crediticio, es justo donde verificar la identidad es más difícil.

## Qué hace
1. **Reloj legal**: calcula cada plazo en días hábiles con los festivos de Colombia (ley Emiliani y Pascua) y avisa qué casos están a 3 días o menos del silencio positivo.
2. **Cotejo**: pone lado a lado lo que se recibió al aprobar el crédito y lo que aporta el cliente, y da un puntaje de evidencia con reglas explicables (cada punto dice por qué).
3. **Red de fraude**: une casos que comparten dispositivo, teléfono, dirección o asesor. En los datos de ejemplo aparecen 9 casos con 2 dispositivos y un mismo asesor, lo que activa la investigación interna (art. 5 num. 10).
4. **Decisión humana**: la herramienta recomienda, la persona aprueba. No existe el botón «rechazar», porque la ley no lo permite.
5. **Borrador de respuesta** al cliente, con fechas y artículos, para revisar antes de enviar.
6. **Asistente con IA** (solo al abrir la demo en Claude): explica un caso o responde preguntas de la mesa. La IA **no calcula fechas**: llama a las funciones del calendario como herramientas, y cada consulta queda visible («Calendario: 15 días hábiles desde 1 dic = 23 dic»).
7. **Buscar o preguntar (Ctrl+K)**: busca casos, salta entre vistas o le pregunta a la IA.
8. **Prioridad**: la bandeja ordena por urgencia del plazo (hasta 60), monto (hasta 25) y evidencia (hasta 15); un incumplimiento va primero.
9. **Cumplimiento y auditoría**: porcentaje de plazos cumplidos a tiempo, tiempos medios y el registro de cada acción con fecha y responsable, como lo pediría la Superintendencia.
10. **Radicar un reclamo**: crea un caso nuevo y el reloj legal arranca en vivo.
11. **¿Y si…?**: desmarca una regla del puntaje para ver cómo cambiaría sin ella.
12. **Recorrido guiado** de 8 pasos y **Reproducir el mes**: la mesa avanza día por día desde el 19 de noviembre.

## Decisiones de diseño
- **Las fechas legales las calcula código determinista, nunca una IA.** La IA sirve para resumir el reclamo y redactar el borrador; una persona aprueba cada decisión.
- **El sistema solo ofrece salidas legales.** Recomendar «rechazar» expondría a la entidad a una sanción.
- **Todo es explicable.** El puntaje muestra cada regla y su peso, para que un analista o un auditor entiendan por qué.

## Cómo explicarlo en 2 minutos
1. «El 19 de noviembre entra en vigencia la Ley 2573. Desde ese día, si una entidad de crédito no responde un reclamo de suplantación en 15 días hábiles, el reclamo se entiende resuelto a favor del titular y la entidad se expone a sanción.»
2. «Hice una mesa de operación que calcula esos plazos con los festivos de Colombia y muestra qué casos están por vencer.» (Mostrar Resumen y la regla de días.)
3. «Para cada caso compara lo que recibimos al aprobar el crédito con lo que trae el cliente, y da un puntaje con reglas que se pueden explicar.» (Abrir un caso.)
4. «Además une casos que comparten dispositivo o asesor. Aquí aparecen 9 casos unidos por dos dispositivos y 7 del mismo asesor: eso es una investigación interna, no 9 reclamos sueltos.» (Red de fraude.)
5. «La herramienta recomienda y la persona decide. No hay botón de rechazar, porque la ley dice que eso solo lo decide un juez.»
6. «Y la IA está, pero en su sitio: si le pregunto qué atender hoy, consulta la bandeja y el calendario como herramientas. Nunca inventa una fecha legal.» (Ctrl+K y preguntar «¿Qué debo atender primero hoy?».)

Si hay poco tiempo: botón **Recorrido guiado** (8 pasos, menos de 2 minutos).

## Fuentes
- Ley Estatutaria 2573 de 2026, Diario Oficial No. 53.496 del 20-may-2026.
- Superintendencia Financiera, Boletín Jurídico No. 123: https://www.superfinanciera.gov.co/publicaciones/10116246/boletin-juridico-no-123/
- Asobancaria, Banca & Economía n.º 1536 (7 de septiembre de 2026): https://www.asobancaria.com/wp-content/uploads/2026/09/Banca-1536.pdf
- TransUnion, comunicado del 28 de mayo de 2026: https://noticias.transunion.co/los-casos-sospechosos-de-fraude-digital-en-colombia-se-situan-por-debajo-de-la-tasa-mundial-en-2025-mientras-que-estafas-como-el-vishing-provocan-perdidas-a-los-consumidores/
- SIC, comunicado del 23 de junio de 2026: https://sedeelectronica.sic.gov.co/noticias/la-sic-alerta-por-aumento-de-suplantacion-de-identidad-en-el-pais-y-lanza-campana-para-prevenir-fraudes-digitales

Prototipo con datos ficticios. No es asesoría jurídica.

## In English (for international reviewers)
**Cotejo Desk** is a fictitious operations desk for a consumer lender handling identity-theft claims under Colombia's Statutory Law 2573 of 2026 (in force since Nov 19, 2026). The law gives lenders hard deadlines in business days: suspend collections immediately, cross-check documents and correct credit bureaus within 10, and issue a formal response within 15, or the claim is deemed resolved in the consumer's favor (deemed granted by silence).

What it shows: a legal clock per case (Colombian holidays computed from Easter and the Emiliani law), an explainable evidence score, fraud networks found by union-find over shared devices, phones, addresses and sales advisors, a tamper-evident audit trail (SHA-256 hash chain), an "if no one acts" forecast, and an AI assistant that never computes legal dates itself: it calls the deterministic calendar as a tool, and every call is visible. There is no "reject" button, because only a judge can rule that no identity theft occurred (Art. 10). Available in Spanish, English and Portuguese: add `#en` or `#pt` to the link.

## Arquitectura (para quien lea el código)
Página estática sin compilación: cada archivo se carga en este orden y expone funciones globales. Es una decisión consciente para que la demo funcione dentro de un artifact de Claude sin herramientas de compilación; en producción se pasaría a módulos ES con un empaquetador.

| Archivo | Qué hace | Depende de |
|---|---|---|
| `calendario.js` | Festivos de Colombia, días hábiles, formatos de fecha y dinero. Sin DOM. | Nada |
| `datos.js` | Casos ficticios, reglas de evidencia, estado legal derivado de la fecha, redes (union-find). Sin DOM. | calendario |
| `idiomas.js`, `idioma-en.js`, `idioma-pt.js` | Capa de traducción por plantillas sobre el DOM. | datos (nombres y comercios) |
| `extras.js` | Recorrido guiado, reproducir el mes, radicar, cumplimiento y cadena SHA-256. | datos, vistas |
| `asistente.js` | IA con la capacidad `sample` y la barra Buscar o preguntar. | datos, calendario |
| `vistas.js` | Estado de la página (fecha, decisiones), resumen, bandeja, red, calendario. | todo lo anterior |
| `detalle.js` | Panel del caso, pestañas, decisiones, borradores, foco. | vistas |
| `pro.js` | Orden de la bandeja, tema, atajos, tendencias, vistas rápidas, CSV. | vistas, detalle |
| `integraciones.js` | Eventos de integración, bitácora de solo agregar, contención de redes, impacto, expediente. | vistas, extras |
| `pruebas.js`, `casos_reales.js` | 72 pruebas y 37 casos reales contra un oráculo de festivos independiente: `node pruebas.js` y `node casos_reales.js`. Resultado de la auditoría en `AUDITORIA.md`. | calendario, datos, idiomas, extras, integraciones |

El estado legal nunca se guarda: se deriva de la fecha simulada y de las decisiones del analista, así que mover la fecha recalcula todo y las pruebas pueden comprobarlo.
