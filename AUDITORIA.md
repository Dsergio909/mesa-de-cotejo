# Auditoría «95 %» (3-nov-2026, ronda 39)

## Cómo se mide
- **Pruebas automáticas:** `node pruebas.js` (72) y `node casos_reales.js` (37). Los casos reales se comparan contra un **oráculo independiente**, que tiene los festivos oficiales escritos a mano y su propio contador de días hábiles, sin usar el código de la app.
- **Hallazgos:** salen de dos auditorías independientes y de la revisión de Claude.
  - Un agente de Claude cazó fallos con pruebas ejecutables: 31 pruebas con veredicto y más de 7.000 recorridos aleatorios.
  - Gemini hizo la revisión legal como abogado y como jefe de operaciones, con el texto oficial de las leyes.
  - Un hallazgo cuenta como resuelto solo si su reproducción deja de fallar y queda una prueba que lo vigila.
- **Navegador:**
  - 0 errores de JavaScript;
  - 0 textos sin traducir en inglés y portugués (3 fechas × 54 casos × 4 pestañas);
  - axe-core sin fallas WCAG 2.2 AA en 9 estados;
  - sin desbordes a 390 px en 3 idiomas.

## Resultado

| Qué | Resultado |
|---|---|
| Pruebas automáticas | **109 de 109** |
| Hallazgos que el código puede resolver | **24 de 24 resueltos** |
| Hallazgos que necesitan un abogado humano | 2 (ver abajo) |
| Total de hallazgos | 24 de 26 (92 %); **100 % de lo que el software puede decidir** |

## Hallazgos resueltos
| # | Gravedad | Fallo | Arreglo |
|---|---|---|---|
| 1 | ALTA | Los 20 días del titular para denunciar contaban desde la radicación | Cuentan desde el aviso, que sale con la suspensión (art. 8 inc. 3). Sin suspensión, el plazo aún no corre |
| 2 | ALTA | «Reanudar» miraba la fecha consultada, no la fecha de la decisión | Solo vale una decisión tomada después de vencer el plazo |
| 3 | ALTA | Aprobar antes de la fecha planeada: la respuesta «saltaba» después y el caso podía quedar exonerado sin que nadie lo exonerara | Cuenta la fecha más temprana |
| 4 | ALTA | La exoneración tardía aparecía en la línea de tiempo como si fuera de la fecha de la respuesta | Cada hecho aparece en su fecha |
| 5 | ALTA | «Exonerar» no enviaba instrucciones a cobranza, centrales ni DIAN | Mismo evento que una exoneración normal |
| 6 | ALTA | La carta decía «denunciamos la estafa» sin discrepancias en el documento | La frase sale solo si hay discrepancia |
| 7 | ALTA | «Si nadie actúa» contaba decisiones guardadas con fecha futura | Las ignora |
| 8 | ALTA | La denuncia de la entidad (C-413 de 2025) se daba por hecha al terminar el cotejo | Se registra aparte y vence con los 20 días |
| 9 | ALTA | Aprobar tarde borraba que el cotejo se había vencido | La línea de tiempo lo conserva y la obligación dice «Hecho tarde» |
| 10 | ALTA | No había forma de registrar la entrega de documentos, la denuncia del titular ni el reporte a la DIAN | Botón «Registrar como hecho hoy» en cada obligación |
| 11 | ALTA | Con una discrepancia en el documento (prueba sumaria, art. 7) no se podía exonerar | Se puede exonerar, con doble firma si el monto lo exige |
| 12 | ALTA | El estado «espera decisión judicial» no tenía salida (art. 9) | Se registra el resultado: «hubo suplantación» exonera; «no hubo» reanuda el cobro con preaviso |
| 13 | MEDIA | El aviso a las centrales de «reclamo en trámite» se daba por hecho con la suspensión | En los reclamos nuevos se registra aparte |
| 14 | MEDIA | La DIAN no aplicaba al silencio positivo | Aplica y se puede registrar |
| 15 | MEDIA | Una denuncia que llegaba después de reanudar el cobro no se podía registrar | Se registra y el caso vuelve a decisión judicial |
| 16 | MEDIA | La carta de reanudación no avisaba del preaviso antes de reportar | Menciona la comunicación previa (Ley 1266, art. 12) |
| 17 | MEDIA | «Deshacer» quitaba decisiones invisibles de fechas posteriores | Solo deshace la última visible |
| 18 | MEDIA | Datos guardados dañados impedían abrir la app | Se descartan las entradas inválidas |
| 19 | MEDIA | La recomendación contradecía el estado (en silencio decía «mantener la suspensión») | Recomendación según el estado |
| 20 | MEDIA | El indicador «en riesgo» omitía casos a punto de silencio con el cotejo vencido | Cuenta por días restantes |
| 21 | BAJA | Reclamos de 2027 decían «SUP-2026» | Llevan el año del reclamo |
| 22 | BAJA | Citas «art. 7, num. 7/8» en cartas y en Cumplimiento | Citan la Ley 1266, art. 16-II, modificada por el art. 7 |
| 23 | BAJA | «Plazos vencidos» contaba también plazos aún no vencidos | Dice «plazos medidos» |
| 24 | — | Radicación en sábado o festivo | **Por diseño:** la app cuenta un día antes que la ley (conservador). El oráculo comprueba que nunca da un plazo más tarde |

## Pendiente de un abogado humano
1. La leyenda «Víctima de Falsedad Personal» sin denuncia: el art. 7 y el concepto de la Superfinanciera (Boletín 123) no dicen lo mismo.
2. La vigencia exacta (19 o 20 de noviembre de 2026) y el régimen de los reclamos anteriores.

Siguen también los puntos dudosos de la ronda 38 (`LOOPS.md`).

## Qué le falta para usarse en una entidad real
La app es un **prototipo**: todo vive en el navegador. Para operar de verdad necesita lo que sigue, en orden de prioridad (detalle en el informe de Gemini).

**Imprescindible**
1. Servidor y base de datos compartida, para que varios analistas trabajen la misma bandeja.
2. Fecha y hora del servidor. Hoy la fecha simulada permite registrar decisiones con cualquier fecha.
3. Inicio de sesión corporativo y roles reales. La segunda firma debe hacerla otra persona, con su propia cuenta.
4. Reversiones como actos nuevos registrados, en vez de un «Deshacer».
5. Conexión con DataCrédito y TransUnion: «reclamo en trámite», corrección y leyenda.
6. Conexión con el sistema de crédito y de cobranza, para suspender y bloquear de forma automática.
7. Cumplir la Ley 1581: autorización y cifrado de cédulas y biometría.
8. Gestor documental para los soportes.
9. Notificaciones certificadas al titular, que prueben la fecha del aviso de los 20 días.
10. Devolución de dineros por fallas de seguridad (art. 5 par. 2).

**Importante**
- Radicar la denuncia de la entidad con su número SPOA.
- Formato para el reporte a la DIAN.
- Reportes a la Superfinanciera (SIQ) y al Defensor del Consumidor.
- Consulta a la Registraduría.
- Reclamos incompletos.
- Unir reclamos duplicados del mismo titular.
- Alertas a SARLAFT.
- Flujo disciplinario para asesores.

**Deseable**
- Portal para el titular.
- Asignación automática de casos.
- Alertas por correo o chat.
- Reglas del puntaje versionadas.
- Anonimizar los datos que van a la IA.
