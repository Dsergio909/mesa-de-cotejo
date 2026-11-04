# Informe de Auditoría Legal y Operativa — «Mesa de Cotejo»

**Para:** Comité de Cumplimiento, Jurídica y Operaciones de Crédito  
**De:** Jefatura de Operaciones de Reclamos / Auditoría Legal en Hábeas Data Financiero  
**Marco normativo auditado:** Ley Estatutaria 2573 de 2026, Sentencia C-413 de 2025 (Corte Constitucional), Ley Estatutaria 1266 de 2008 (modificada por Ley 2157 de 2021 y Ley 2573 de 2026), y Concepto SFC 2026124048-004 (Boletín Jurídico No. 123).  
**Alcance:** Revisión de `README.md`, `calendario.js`, `datos.js`, `detalle.js` y `vistas.js` (excluyendo los 10 hallazgos ya cerrados en `ronda38.md`).

---

## 1. ERRORES LEGALES O DE CÁLCULO

### GRAVEDAD ALTA

#### 1.1. Cómputo erróneo del plazo de 20 días hábiles para denunciar cuando la suspensión/comunicación al titular es tardía
- **Norma y cita textual:** Ley 2573 de 2026, Art. 8 inc. 3: *«deberá comunicar a la persona suplantada que a partir de ese momento cuenta con veinte (20) días hábiles para interponer ante la Fiscalía General de la Nación la denuncia»*; Art. 5 num. 6: *«Comunicar a la persona suplantada el término [...] con el fin de ser beneficiario de suspensión»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 255, 289, 301, 313 y 350), el límite de denuncia se calcula siempre desde la fecha de radicación: `lim.denuncia = dia(20)` (`sumarHabiles(base.fechaRadicacion, 20)`), sin importar cuándo se suspendió el cobro ni cuándo se envió el aviso al titular (`fSusp`).
- **Qué debería hacer:** Calcular `lim.denuncia` sumando 20 días hábiles a partir de la fecha en que efectivamente se comunicó al titular el deber de denunciar junto con la suspensión (`fSusp ? sumarHabiles(fSusp, 20) : null`). No puede correr un término de caducidad contra el titular antes de haberle comunicado la carga legal.
- **Caso concreto:**
  - **Radicación:** `2026-12-09` (caso #16 de la base con `plan.suspension = null`, `plan.cotejo = 6`, `plan.respuesta = 10`, `plan.denuncia = null`).
  - **Decisiones:** El analista ejecuta `suspender` el `2026-12-21` (día hábil 8).
  - **Fecha consultada:** `2027-01-12` (día hábil 21 desde la radicación, pero apenas día hábil 13 desde el aviso del `2026-12-21`).
  - **Resultado erróneo:** El sistema muestra estado `puede_reanudar` («Plazo de denuncia vencido») y habilita el botón de reanudar el cobro (`lim.denuncia = 2027-01-08`), violando el debido proceso porque el plazo real del titular vence el `2027-01-22`.

#### 1.2. La denuncia penal obligatoria de la entidad se da por cumplida automáticamente con el cotejo, incluso sin discrepancias ni denuncia real
- **Norma y cita textual:** Ley 2573 de 2026, Art. 8 inc. 3 (condicionado por Sentencia C-413 de 2025, `ley2573_notas.txt` lín. 130 y `boletin123.txt` nota [2]): *«en el entendido que, en el mismo término [20 días hábiles], el operador de telecomunicaciones o entidad financiera y/o crediticia y demás establecimientos comerciales con esta competencia deberán formular la denuncia penal que corresponda»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, lín. 343), la obligación *«Formular la denuncia penal de la entidad (falsedad personal y conexos)»* recibe como fecha de cumplimiento `hecho(fCotejo) ? fCotejo : null`. Además, no existe acción ni decisión para radicar la denuncia de la entidad.
- **Qué debería hacer:** Separar el evento de cotejo documental (`fCotejo`) del evento de interposición de la denuncia penal por parte de la entidad (`fDenunciaEntidad`), exigiendo su registro explícito (con número de noticia criminal/SPOA) dentro de los 20 días hábiles (`lim.denuncia`). Hacer un cotejo interno sin discrepancias no equivale a formular denuncia penal ante la Fiscalía.
- **Caso concreto:**
  - **Radicación:** `2026-11-19` (`plan.cotejo = 5`, sin discrepancias documentales, sin denuncia penal interpuesta por la entidad).
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-12-22` (día hábil 22).
  - **Resultado erróneo:** La obligación del Art. 8 inc. 3 (C-413/25) aparece en verde como `Hecho el 26 nov 2026` por el solo hecho de haber cerrado el cotejo documental, ocultando el incumplimiento del mandato constitucional.

#### 1.3. La decisión `aprobar` sobreescribe retroactivamente la fecha del cotejo y oculta el vencimiento del plazo de 10 días hábiles
- **Norma y cita textual:** Ley 1266 de 2008, Art. 16-II num. 7 (mod. Art. 7 Ley 2573): *«La fuente, una vez reciba la solicitud, deberá cotejar, dentro de los diez (10) días hábiles siguientes [...] La modificación de que trata el inciso anterior deberá ser efectuada por la fuente dentro de los diez (10) días hábiles siguientes a ser informada por el titular»*; Ley 2573, Art. 5 num. 4: *«dentro de los diez (10) días hábiles siguientes a la radicación»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 262-266), cuando el analista toma la decisión `aprobar`, el código ejecuta `if (!hecho(fCotejo)) fCotejo = aprobada.fecha; if (!hecho(fResp)) fResp = aprobada.fecha;`. En la línea 295, la condición `else if (!hecho(fCotejo) && hoy > lim.cotejo) estado = 'cotejo_vencido'` deja de cumplirse y en la línea 365 desaparece de la línea de tiempo el evento crítico `'Venció el plazo de cotejo'`.
- **Qué debería hacer:** Permitir registrar el cotejo y la modificación en centrales en su fecha real e independiente de la respuesta de fondo, y conservar en la línea de tiempo el evento crítico de que el término de 10 días hábiles venció el día `lim.cotejo`, aunque el cotejo se haya realizado extemporáneamente el día 12 junto con la respuesta.
- **Caso concreto:**
  - **Radicación:** `2026-12-01` (`plan.cotejo = null`, `plan.respuesta = null`, con discrepancias).
  - **Decisiones:** El `2026-12-18` (día hábil 12, vencido el plazo de 10 días del `2026-12-16`), el analista pulsa `aprobar`.
  - **Fecha consultada:** `2026-12-18`.
  - **Resultado erróneo:** El caso pasa a estado `exonerado` (`bien`), desaparece de los KPI de incumplidos de `vistas.js` (lín. 171) y se borra de la bitácora visual el evento `'Venció el plazo de cotejo'` que figuraba el `2026-12-16`.

#### 1.4. La obligación de entregar copia de los documentos de aprobación se marca como «No aplica» y carece de plazo y botón de ejecución
- **Norma y cita textual:** Ley 2573 de 2026, Art. 2 lit. d: *«deberán entregar la información y documentos que recibieron para hacer la aprobación del bien o servicio»*; Art. 5 num. 7 (declarado exequible sin exigir denuncia previa en Sentencia C-413 de 2025, `ley2573_notas.txt` lín. 88): *«A solicitud de la persona presuntamente suplantada, entregar copia de la información y/o documentos aportados para la aprobación [...] Bajo ninguna circunstancia podrá negarse la entrega»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, lín. 339), se define `obligacion('Entregar copia...', 'Art. 5 num. 7', ..., null, fDocs, base.plan.documentos !== null)`. En `crearCasoManual` (lín. 186) y en la mitad de los casos generados (lín. 86), `plan.documentos` es `null`, por lo que la obligación muestra `No aplica` y no existe ningún botón en `detalle.js` para registrar la solicitud o entrega de documentos ni se le asigna el plazo de 10 días hábiles del Art. 5 num. 4 (o 15 días de petición).
- **Qué debería hacer:** Incluir un control para marcar cuándo el titular solicita los documentos (o asumir que los solicita con el reclamo conforme al principio de carga dinámica de la prueba del Art. 2 lit. d), fijar fecha límite (`dia(10)` según Art. 5 num. 4) y permitir al analista registrar su entrega efectiva.
- **Caso concreto:**
  - **Radicación:** `2026-11-19` (cualquier reclamo creado con `crearCasoManual` o caso base con `plan.documentos = null`).
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-12-10` (día hábil 15).
  - **Resultado erróneo:** La obligación del Art. 5 num. 7 aparece como `No aplica` (gris neutro) y el analista no tiene forma de cumplirla en la interfaz.

#### 1.5. El reporte a la DIAN (Art. 5 num. 8) nunca se ejecuta cuando hay denuncia sin exoneración, silencio positivo o discrepancias documentales
- **Norma y cita textual:** Ley 2573 de 2026, Art. 5 num. 8: *«Emitir el respectivo reporte a la Dirección de Impuestos Nacionales, para evitar que la persona suplantada sufra perjuicios de carácter tributario como consecuencia de las defraudaciones efectuadas»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 288 y 345), la fecha de cumplimiento del reporte a la DIAN es `const fDian = fExon;`, mientras que el parámetro `aplica` es `!!fExon || hecho(fDenuncia)`. Por tanto: (a) si el titular aporta denuncia pero el puntaje no llega a banda `alta` (`fExon === null`), la obligación aplica pero queda eternamente `Pendiente` sin forma de completarla; (b) si opera el silencio positivo (`silencio_acatado`), ni siquiera aplica (`No aplica`), dejando el crédito reportado como pasivo/movimiento fiscal del titular ante la DIAN.
- **Qué debería hacer:** Activar la obligación de reporte/corrección de información exógena ante la DIAN cuando el caso se resuelva por exoneración (`fExon`), por silencio positivo (`silencioFirme`) o por fallo judicial favorable, y permitir su ejecución o activación preventiva cuando medie denuncia (`hecho(fDenuncia)`).
- **Caso concreto:**
  - **Radicación:** `2026-11-23` (caso con puntaje 40, banda `media`, `plan.denuncia = 5`, `plan.respuesta = 9`).
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-12-22`.
  - **Resultado erróneo:** El caso está en estado `judicial` con denuncia recibida el `2026-11-30` y respuesta dada el `2026-12-04`, pero la obligación *«Reportar a la DIAN»* permanece en estado `Pendiente` sin botón para ejecutarla.

#### 1.6. La exoneración directa del Art. 10 está bloqueada cuando existe prueba sumaria legal de falsedad pero el puntaje heurístico es menor a 60
- **Norma y cita textual:** Ley 2573 de 2026, Art. 10 inc. 1: *«de encontrarse elementos que evidencien la suplantación, se liberará a la persona suplantada de la obligación de interponer una denuncia [...] y se le exonerará»*; Art. 7 (Ley 1266 Art. 16-II num. 7): *«los documentos allegados por el titular en la petición, los cuales se tendrán como prueba sumaria para probar la falsedad»*.
- **Qué hace el código:** En `datos.js` (`puntuar`, líns. 196-212 y `derivarCaso`, líns. 281-285, 394), la exoneración solo ocurre si `evid.banda === 'alta'` (`puntaje >= 60`). Sin embargo, que no coincida la fecha de expedición de la cédula suma 30 puntos (`expedicion`) y que no coincida la serie suma 20 puntos (`serie`), e incluso si hay compras previas en el mismo entorno (`familiar`) resta 20 puntos. Si un caso tiene discrepancia en la fecha de expedición de la cédula (30 pts) o en la serie (20 pts), queda en banda `media` o `baja`, y el botón `Exonerar` no se habilita: `aprobar` solo envía una respuesta manteniendo la suspensión y exigiendo denuncia penal al titular.
- **Qué debería hacer:** Cuando exista discrepancia documental objetiva en la cédula (`discrepancias === true`, que el propio Art. 5 num. 9 y Art. 7 califican como *«prueba sumaria para probar la falsedad»*), o cuando el analista lo justifique motivadamente, permitir al analista elegir la decisión de exonerar al titular (Art. 10) sin forzarlo a exigir denuncia penal.
- **Caso concreto:**
  - **Radicación:** `2026-12-01` (caso con `expAprob !== expTitular` [+30 pts] y ningún otro indicador activado: puntaje = 30, banda `media`).
  - **Decisiones:** El analista pulsa `aprobar` el `2026-12-09`.
  - **Fecha consultada:** `2026-12-09`.
  - **Resultado erróneo:** A pesar de que la cédula usada para aprobar el crédito tiene una fecha de expedición falsa (prueba sumaria según Art. 7), la herramienta impide exonerar al cliente, fija `fExon = null`, deja el caso en `espera_denuncia` y genera una carta (`detalle.js` lín. 182) exigiéndole ir a la Fiscalía en 20 días hábiles so pena de reanudar el cobro.

#### 1.7. Ausencia de desenlace para el estado `judicial` (Art. 9 Ley 2573 y condicionamientos de la Sentencia C-413 de 2025)
- **Norma y cita textual:** Ley 2573 de 2026, Art. 9 inc. 1, 2, 3 y Parágrafo (condicionados por Sentencia C-413 de 2025, `ley2573_notas.txt` lín. 144): *«la suspensión del cobro de las obligaciones se mantendrá hasta tanto exista pronunciamiento judicial, incluido el archivo de la indagación o, en su defecto, hasta que medie decisión judicial en sede civil que defina la existencia de la obligación»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 231, 302 y 317), una vez que hay respuesta y denuncia (`hecho(fResp) && hecho(fDenuncia)`), el caso entra en `estado = 'judicial'` (`abierto: true`) y no existe ninguna decisión posible para cerrarlo cuando llega: (a) sentencia penal o archivo fiscal confirmando la falsedad personal (Art. 9 inc. 2 y parágrafo -> exoneración definitiva), o (b) sentencia penal o civil declarando que el titular sí adquirió la obligación (Art. 9 inc. 3 -> reanudación del cobro *«con todos los intereses y demás valores que se hubieren causado como si nunca se hubiera suspendido el cobro»* y reinicio del término de prescripción).
- **Qué debería hacer:** Soportar las decisiones de cierre por pronunciamiento judicial/archivo fiscal (a favor del titular -> exoneración; en contra del titular -> reanudación retroactiva desde el origen conforme al Art. 9 inc. 3, diferenciándola de la reanudación desde la suspensión del Art. 8 Par. 1).
- **Caso concreto:**
  - **Radicación:** `2026-11-19` (`plan.cotejo = 4`, `plan.denuncia = 6`, `plan.respuesta = 8`, banda `media`).
  - **Decisiones:** La Fiscalía emite archivo indicando que sí ocurrió la falsedad personal (Art. 9 parágrafo) el `2026-12-21`.
  - **Fecha consultada:** `2026-12-22`.
  - **Resultado erróneo:** El analista no puede cerrar el caso ni registrar el archivo fiscal; el caso sigue contando como «Abierto» en los KPI con el cobro meramente suspendido en vez de exonerado.

---

### GRAVEDAD MEDIA

#### 1.8. Radicación en día no hábil (sábado, domingo o festivo) distorsiona el día 0 y el vencimiento de la suspensión inmediata
- **Norma y cita textual:** Ley 2573 de 2026, Art. 8 inc. 2: *«deberá suspender de manera inmediata el cobro»*; Ley 1266 de 2008, Art. 16-II num. 3: *«quince (15) días hábiles contados a partir del día siguiente a la fecha de su recibo»*.
- **Qué hace el código:** Si se radica un reclamo manual (`extras.js` / `crearCasoManual` en `datos.js` lín. 171) cuando `FECHA` es sábado, domingo o festivo (ej. por canal digital `App` o `Correo`), `fechaRadicacion` guarda ese día inhábil. En `derivarCaso` (líns. 246-247), el lunes siguiente `t = habilesEntre(base.fechaRadicacion, hoy)` ya vale `1` y `proximo.dias` para `cobro_activo` vale `-1`, marcando la obligación de suspensión como *«Vencido el sábado»*, mientras que si se suspende el lunes hábil inmediato aparece en rojo como *«Hecho tarde»* (`fSusp > base.fechaRadicacion`, lín. 326 y 361).
- **Qué debería hacer:** Para canales digitales 24/7, distinguir el *timestamp* de recepción (que dispara el bloqueo automático inmediato en sistemas) del inicio del cómputo de términos administrativos al primer día hábil siguiente, sin penalizar como «tardía» una actuación manual realizada a primera hora del primer día hábil.
- **Caso concreto:**
  - **Radicación:** `2026-11-21` (sábado), con `plan.suspension = null`.
  - **Decisiones:** El lunes `2026-11-23` (primer día hábil) el analista ejecuta `suspender`.
  - **Fecha consultada:** `2026-11-23`.
  - **Resultado erróneo:** El evento y la obligación quedan marcados en rojo (`critico`: *«Cobro suspendido tarde»* / *«Hecho tarde, el 23 nov 2026»*).

#### 1.9. La obligación de informar a centrales el «reclamo en trámite» (2 días hábiles) se marca cumplida con la suspensión interna del cobro
- **Norma y cita textual:** Ley 1266 de 2008, Art. 16-II num. 4: *«Si el reclamo es presentado ante la fuente, esta [...] deberá informar al operador sobre la recepción del reclamo dentro de los dos (2) días hábiles siguientes a su recibo, de forma que se pueda dar cumplimiento a la obligación de incluir la leyenda que diga "reclamo en trámite"»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, lín. 338), la obligación *«Informar a las centrales para que marquen "reclamo en trámite"»* tiene como límite `dia(2)`, pero usa como fecha de realización `fSusp` (la fecha en que se suspendió la cobranza interna).
- **Qué debería hacer:** Modelar de manera independiente el evento de transmisión de la novedad de «reclamo en trámite» al operador de información (DataCrédito / TransUnion) dentro de `dia(2)`, pues suspender el cobro en el core bancario no notifica por sí solo a las centrales de riesgo.
- **Caso concreto:**
  - **Radicación:** `2026-12-01` (`plan.suspension = 0`, pero la transmisión a centrales falla o no se ha ejecutado).
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-12-04` (día hábil 3).
  - **Resultado erróneo:** La obligación de Ley 1266 Art. 16-II aparece como `Hecho el 1 dic 2026` solo porque `plan.suspension` fue `0`.

#### 1.10. La carta de reanudación de cobro sugiere reporte negativo inmediato sin advertir el alcance constitucional del Art. 8 Par. 1 ni el preaviso de Ley 1266 Art. 12
- **Norma y cita textual:** Sentencia C-413 de 2025 (citada en `boletin123.txt`, lín. 204, nota [1]): *«la expresión "efectuar el reporte" prevista en el artículo 8 hace referencia a la actualización de la información relativa a la reactivación del cobro de la obligación y no al reporte de un dato negativo del titular de la información»*; Ley 1266 de 2008, Art. 12 inc. 3: *«transcurridos veinte (20) días calendario siguientes a la fecha de envío de la comunicación»*.
- **Qué hace el código:** Aunque `datos.js` no ordena un reporte negativo automático al reanudar, ni las obligaciones ni el borrador de `detalle.js` (`pintarBorrador`, lín. 172) aclaran que al reanudar el cobro se actualiza ante el operador la reactivación de la obligación (retirando «reclamo en trámite») y que cualquier reporte negativo requiere verificar mora efectiva y surtir la comunicación previa de 20 días calendario del Art. 12 de la Ley 1266 (o dos comunicaciones en días distintos si la obligación es $\le 15\%$ SMLMV según Art. 13 Par. 2 Ley 1266).
- **Qué debería hacer:** Incluir en la transición a `reanudado` y en la carta al titular la precisión de la Sentencia C-413 de 2025 (nota [1] del Boletín 123 SFC) y validar si ya se surtió la comunicación previa de 20 días calendario antes de permitir reporte negativo.
- **Caso concreto:**
  - **Radicación:** `2026-11-19` (caso #17, `edad = 22`, `plan.respuesta = 11`, `plan.denuncia = null`).
  - **Decisiones:** El analista pulsa `reanudar` el `2026-12-22`.
  - **Fecha consultada:** `2026-12-22`.
  - **Resultado erróneo:** Se cierra el caso como `reanudado` sin control sobre el levantamiento de la leyenda en centrales ni sobre el preaviso de 20 días calendario del Art. 12 de la Ley 1266.

#### 1.11. Tratamiento incompleto de la denuncia aportada por el titular después del día 20 hábil (extemporánea)
- **Norma y cita textual:** Ley 2573 de 2026, Art. 8 Par. 1: *«De no presentarse, dentro del plazo señalado en este artículo, la denuncia [...] podrá reanudar el cobro»*; Art. 5 num. 2: *«Cuando exista denuncia de falsedad personal o delitos conexos, se debe realizar el reporte correspondiente a los operadores de información, marcándolo como "víctima de falsedad personal"»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 259, 289, 301-302): (a) no existe un botón o acción para que el analista registre la recepción de la denuncia del titular en casos manuales o en casos donde `plan.denuncia === null`; (b) si el caso ya fue pasado a `reanudado` el día 21 y el titular aporta la denuncia el día 22, la condición `else if (reanudado) estado = 'reanudado'` (lín. 297) tiene prelación sobre `judicial` (lín. 302), ignorando la denuncia sobreviniente y el deber del Art. 5 num. 2.
- **Qué debería hacer:** Permitir al analista cargar/registrar la denuncia del titular en cualquier fecha; si llega después de haberse reanudado el cobro, activar el deber de marcación del Art. 5 num. 2, evaluar exoneración sobreviniente (Art. 10) o suspender nuevamente el cobro hasta decisión judicial (Art. 9).
- **Caso concreto:**
  - **Radicación:** `2026-11-19` (caso #17, sin denuncia planeada).
  - **Decisiones:** El analista ejecuta `reanudar` el `2026-12-21` (día hábil 21). El `2026-12-22` el titular entrega la denuncia ante Fiscalía.
  - **Fecha consultada:** `2026-12-22`.
  - **Resultado erróneo:** La herramienta no permite registrar la denuncia recibida ni revierte el estado `reanudado` a `judicial` o `exonerado`.

#### 1.12. [DUDOSO] Conflicto normativo entre el Art. 7 de la Ley 2573 y el Concepto SFC 2026124048-004 (Boletín 123) sobre la leyenda «Víctima de Falsedad Personal» sin denuncia penal
- **Norma y cita textual:** Ley 2573, Art. 7 (Ley 1266 Art. 16-II num. 7): *«con los documentos allegados por el titular en la petición, los cuales se tendrán como prueba sumaria para probar la falsedad y sin la exigencia de ningún requisito adicional, la fuente deberá solicitar la modificación del dato negativo [...] y se incluirá una leyenda dentro del registro personal que diga "Víctima de Falsedad Personal"»* vs. Concepto SFC 2026124048-004 (`boletin123.txt`, lín. 197): *«La incorporación de la marca de "víctima de falsedad personal" requiere la existencia de una denuncia por falsedad personal o delitos conexos»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 273-276 y 341), el código aplica la regla del Art. 7 cuando hay discrepancias documentales (`if (hecho(fCotejo) && discrepancias) fCentrales = fCotejo`), incluso si no hay denuncia del titular. Sin embargo, si no hay discrepancias en cédula/serie y el caso se exonera por otros factores (biometría, dispositivo, OTP) sin denuncia (`fExon`), también ordena poner la leyenda (lín. 287 y `detalle.js` lín. 175).
- **Qué debería hacer:** Dado que es un punto jurídicamente **DUDOSO** por contradicción entre el texto literal del Art. 7 (que prohíbe exigir requisitos adicionales tras el cotejo) y la doctrina de la SFC en el Boletín 123 (que exige denuncia conforme al Art. 5 num. 2), la herramienta debería distinguir: (1) eliminación/modificación del dato negativo y recomposición del *score* (obligatoria siempre por principio de veracidad, Art. 2 lit. c, y exoneración Art. 10), y (2) marcación con la leyenda «Víctima de Falsedad Personal» (advirtiendo al analista si aún no obra denuncia penal de la víctima o de la entidad bajo C-413/25).
- **Caso concreto:**
  - **Radicación:** `2026-12-01` (caso con cédula coincidente `discrepancias = false`, pero biometría 0,50, línea nueva, dispositivo compartido -> puntaje 75, banda `alta`, `plan.denuncia = null`).
  - **Decisiones:** El analista aprueba la exoneración el `2026-12-09`.
  - **Fecha consultada:** `2026-12-09`.
  - **Resultado erróneo:** La carta (`detalle.js` lín. 175) afirma que se pidió la leyenda «Víctima de Falsedad Personal» sin que exista denuncia del titular ni discrepancia documental del Art. 7, contrariando el criterio de la SFC en el Boletín 123.

---

### GRAVEDAD BAJA

#### 1.13. El estado `cotejo_vencido` eclipsa el estado `riesgo` de silencio positivo entre los días hábiles 12 y 15
- **Norma y cita textual:** Ley 1266 de 2008, Art. 16-II num. 8 (mod. Art. 7 Ley 2573): *«Las peticiones o reclamos deberán resolverse dentro de los quince (15) días hábiles siguientes a la fecha de su recibo [...] Si en ese lapso no se ha dado pronta resolución, se entenderá, para todos los efectos legales, que la respectiva solicitud ha sido resuelta favorablemente»*.
- **Qué hace el código:** En `datos.js` (`derivarCaso`, líns. 295-298), la cadena `else if (!hecho(fCotejo) && hoy > lim.cotejo) estado = 'cotejo_vencido'` se evalúa antes que `else if (!hecho(fResp) && restantes(hoy, lim.respuesta) <= 3) estado = 'riesgo'`. Además, `proximo` (lín. 311-315) ordena primero el plazo más antiguo (`lim.cotejo`, ya vencido), por lo que en la bandeja y en el KPI `'En riesgo de silencio'` (`vistas.js` lín. 169) no se contabilizan los casos que tienen el cotejo vencido y además están a 1, 2 o 3 días hábiles de caer en silencio positivo.
- **Qué debería hacer:** Contabilizar en el KPI de riesgo de silencio positivo todos los casos abiertos sin respuesta con `restantes(hoy, lim.respuesta) <= 3 && restantes(hoy, lim.respuesta) >= 0`, independientemente de si su estado principal es `cotejo_vencido` o `cobro_activo`, y mostrar en la bandeja la alerta simultánea del silencio inminente.
- **Caso concreto:**
  - **Radicación:** `2026-12-01` (`plan.cotejo = null`, `plan.respuesta = null`).
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-12-18` (día hábil 12: cotejo vencido hace 2 días y faltan 3 días hábiles para el silencio positivo del `2026-12-23`).
  - **Resultado erróneo:** El caso muestra únicamente `Cotejo vencido` (`proximo: Cotejo y corrección en centrales · Vencido hace 2 d`) y no suma en el KPI `En riesgo de silencio`.

#### 1.14. [DUDOSO] Fecha exacta de entrada en vigencia (19 vs. 20 de noviembre de 2026) y ausencia de régimen de transición en casos anteriores
- **Norma y cita textual:** Ley 2573 de 2026, Encabezado y Art. 13: *«LEY ESTATUTARIA 2573 DE 2026 (mayo 19) Diario Oficial No. 53.496 de 20 de mayo de 2026 [...] ARTÍCULO 13. VIGENCIA. La presente ley entrará en vigencia dentro de los seis (6) meses siguientes a su promulgación, con excepción de los parágrafos Primero y segundo del artículo quinto (5), los cuales entrarán en vigencia con la promulgación de la ley»*.
- **Qué hace el código:** En `datos.js` (lín. 5) se fija `const VIGENCIA = '2026-11-19'`. Sin embargo, la promulgación (publicación en el Diario Oficial No. 53.496) ocurrió el **20 de mayo de 2026** (mientras que el 19 de mayo fue la sanción presidencial, aunque el Concepto SFC del Boletín 123 lín. 190 menciona erróneamente que fue publicada el 19 de mayo). Conforme al Art. 52 y 59 de la Ley 4 de 1913 (CRPM), seis meses desde la promulgación del 20 de mayo de 2026 se cumplen el **20 de noviembre de 2026** (punto **DUDOSO** por la mención del Boletín 123). Además, si el usuario mueve el selector de fecha a días entre `2026-11-02` y `2026-11-18` (`vistas.js` lín. 92) y radica un caso manual, `derivarCaso` le aplica íntegramente la Ley 2573 antes de su vigencia.
- **Qué debería hacer:** Documentar la nota de vigencia (19 vs. 20 de noviembre de 2026) y, para reclamos radicados antes de la entrada en vigencia general, aplicar las reglas previas de la Ley 1266 de 2008 (Art. 16-II modificado por Ley 2157 de 2021) junto con los Parágrafos 1 y 2 del Art. 5 de la Ley 2573 (que sí entraron a regir desde el 20 de mayo de 2026).
- **Caso concreto:**
  - **Radicación:** Reclamo manual radicado el `2026-11-10`.
  - **Decisiones:** Ninguna.
  - **Fecha consultada:** `2026-11-10`.
  - **Resultado erróneo:** Aunque la barra superior dice *«faltan 6 días hábiles para su vigencia (19 nov 2026)»*, el detalle del caso exige todas las obligaciones de los Arts. 7, 8, 9 y 10 de la Ley 2573 como si ya estuviera vigente.
---

## 2. CASOS REALES DIFÍCILES (25 ESCENARIOS DE OPERACIÓN)

A continuación se presentan 25 escenarios complejos que enfrenta una mesa real de reclamos por suplantación, indicando los **datos de entrada**, **qué debe mostrar la herramienta según la ley** (estado, fechas límite y obligaciones) y **el fundamento legal / brecha frente al prototipo**.

### Escenario 1: Radicación en sábado por canal digital (App)
- **Datos:** Reclamo radicado el sábado `2026-11-21` a las 14:30 por `App`, crédito de $1.800.000, fecha consultada lunes `2026-11-23`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `nuevo` (día hábil 0/1 de trámite administrativo), con bloqueo automático del producto y suspensión preventiva de cobro ejecutados el `2026-11-21` (o a primera hora del `2026-11-23` sin marcarse como incumplimiento).
  - **Fechas límite:** Marcación «reclamo en trámite» en centrales: `2026-11-25` (2 días hábiles); Cotejo y modificación en centrales: `2026-12-07` (10 días hábiles); Respuesta de fondo: `2026-12-15` (15 días hábiles, contando el `2026-12-08` como festivo); Denuncia (titular y entidad): `2026-12-22` (20 días hábiles).
  - **Obligaciones:** Las 3 inmediatas (Art. 8 inc. 2, Art. 8 inc. 3, Art. 5 num. 5) en estado `Hecho` a tiempo.
- **Por qué:** Los términos en días hábiles (Ley 1266 Art. 16-II y Ley 2573 Arts. 5, 7 y 8) no corren en sábados, domingos ni festivos; si la recepción es en día inhábil, el cómputo inicia el primer día hábil siguiente sin penalizar la gestión del lunes como tardía (en el código actual, suspender el lunes marca `Hecho tarde`).

### Escenario 2: Radicación en lunes festivo (Ley Emiliani) con otro festivo intermedio
- **Datos:** Reclamo radicado el lunes festivo `2026-11-16` (Independencia de Cartagena trasladado) o el martes `2026-12-08` (Inmaculada Concepción); tomemos radicación el `2026-12-08`, fecha consultada `2026-12-28` (con Navidad `2026-12-25` en medio).
- **Qué debe mostrar según la ley:**
  - **Estado:** `en_tramite` (o `riesgo` a partir del día hábil 12). Al `2026-12-28` han transcurrido 13 días hábiles (`9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 28 dic`).
  - **Fechas límite:** «Reclamo en trámite»: `2026-12-10`; Cotejo (10 d.h.): `2026-12-22`; Respuesta (15 d.h.): `2026-12-30`; Denuncia (20 d.h.): `2027-01-07` (saltando `2027-01-01`).
  - **Obligaciones:** Si el cotejo se hizo el `2026-12-22`, debe figurar en término; la respuesta debe alertar `Faltan 2 días hábiles`.
- **Por qué:** Ni el día festivo de radicación (`2026-12-08`), ni el `2026-12-25`, ni el `2027-01-01` son hábiles (Ley 51 de 1983).

### Escenario 3: Suspensión del cobro tardía (día hábil 5) y desplazamiento del término de 20 días para denunciar
- **Datos:** Radicación `2026-11-19`, el sistema de cobranza falla y sigue debitando/cobrando hasta que el analista suspende el cobro y envía el aviso de 20 días el `2026-11-26` (día hábil 5). Cotejo y respuesta el `2026-12-03` (día hábil 10). Fecha consultada: `2026-12-21` (día hábil 21 desde radicación, día hábil 16 desde el aviso).
- **Qué debe mostrar según la ley:**
  - **Estado:** `espera_denuncia` (NO `puede_reanudar`).
  - **Fechas límite:** Plazo de 20 días hábiles para denunciar: `2026-12-28` (20 días hábiles contados desde el `2026-11-26`, fecha en que se comunicó al titular).
  - **Obligaciones:** Suspensión y aviso del Art. 8 marcados como `Hecho tarde, el 26 nov 2026` (incumplimiento auditable y reverso de cobros e intereses causados desde el `2026-11-19`), pero el botón `Reanudar el cobro` debe estar **deshabilitado** hasta después del `2026-12-28`.
- **Por qué:** El Art. 8 inc. 3 de la Ley 2573 dispone expresamente que la entidad *«deberá comunicar a la persona suplantada que a partir de ese momento cuenta con veinte (20) días hábiles para interponer ante la Fiscalía General de la Nación la denuncia»*. (El código actual falla aquí y permite reanudar desde el `2026-12-21`).

### Escenario 4: Prórroga de 8 días hábiles decidida el último día hábil permitido (día 15)
- **Datos:** Radicación `2026-11-19`, cotejo hecho el `2026-12-03` (día 10), sin respuesta aún. El `2026-12-11` (día hábil 15, pues el `2026-12-08` fue festivo) el analista decide `prorrogar` expresando el motivo. Fecha consultada: `2026-12-18` (día hábil 20).
- **Qué debe mostrar según la ley:**
  - **Estado:** `riesgo` (faltan 3 días hábiles para el nuevo vencimiento del día 23).
  - **Fechas límite:** Respuesta inicial: `2026-12-11`; Nueva fecha límite de respuesta prorrogada (23 d.h.): `2026-12-23`.
  - **Obligaciones:** Comunicación de prórroga motivada enviada a más tardar el `2026-12-11`; obligación de responder de fondo vigente hasta el `2026-12-23`.
- **Por qué:** El Art. 16-II num. 3 y 8 de la Ley 1266 (mod. Art. 7 Ley 2573) permite prorrogar hasta por 8 días hábiles más siempre que se informe al interesado expresando los motivos antes del vencimiento del primer término de 15 días hábiles.

### Escenario 5: Intento de prórroga extemporánea (día hábil 16)
- **Datos:** Radicación `2026-11-19`, sin respuesta al cierre del `2026-12-11` (día hábil 15). Fecha consultada: lunes `2026-12-14` (día hábil 16).
- **Qué debe mostrar según la ley:**
  - **Estado:** `silencio` («Silencio positivo»). Botón `prorrogar` oculto/inhabilitado; única acción: `acatar`.
  - **Fechas límite:** Respuesta vencida el `2026-12-11`.
  - **Obligaciones:** Respuesta de fondo en estado `Vencido el 11 dic 2026` (`critico`); obligación de acatar el silencio positivo, eliminar reporte negativo y desvincular del cobro.
- **Por qué:** Vencido el día 15 hábil sin respuesta ni prórroga comunicada en término, opera de pleno derecho el silencio positivo (Ley 1266 Art. 16-II num. 8 mod. Art. 7 Ley 2573; Sentencia C-282 de 2021 y C-413 de 2025).

### Escenario 6: Denuncia aportada por el titular exactamente el día hábil 20
- **Datos:** Radicación `2026-11-19`, suspensión el mismo día, cotejo el `2026-12-01` (banda `media`, sin exoneración), respuesta el `2026-12-07` manteniendo la suspensión. El titular radica la constancia de denuncia ante la Fiscalía el `2026-12-18` (día hábil 20). Fecha consultada: `2026-12-22` (día hábil 22).
- **Qué debe mostrar según la ley:**
  - **Estado:** `judicial` («Espera decisión judicial»). Botón `reanudar` deshabilitado.
  - **Fechas límite:** `Sin plazo: espera decisión judicial (art. 9)`.
  - **Obligaciones:** Denuncia del titular `Recibida el 18 dic 2026` (`bien`); obligación de reportar a centrales la leyenda «Víctima de Falsedad Personal» sin afectar puntaje (Art. 5 num. 2); obligación de mantener suspendido el cobro e interrumpida la prescripción hasta sentencia o archivo fiscal (Art. 9).
- **Por qué:** La denuncia presentada el último día hábil del término de 20 días es oportuna (Art. 8 inc. 3 Ley 2573) y activa la protección del Art. 9 y la marcación del Art. 5 num. 2.

### Escenario 7: Respuesta de fondo enviada tardíamente (día hábil 17 sin prórroga)
- **Datos:** Radicación `2026-11-19`, cotejo el `2026-12-01`, sin prórroga. La respuesta se envía el `2026-12-15` (día hábil 17). Fecha consultada: `2026-12-22`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `silencio` (o `silencio_acatado` si ya se ejecutó el acatamiento).
  - **Fechas límite:** Vencido el `2026-12-11` (día 15).
  - **Obligaciones:** Respuesta de fondo marcada como `Hecho tarde, el 15 dic 2026` (`critico`); evento crítico en línea de tiempo advirtiendo que la respuesta tardía no revoca el silencio positivo configurado el `2026-12-11`.
- **Por qué:** Conforme al Art. 16-II num. 8 de la Ley 1266 (mod. Art. 7 Ley 2573), una vez vencido el término legal sin resolución, se entiende resuelta favorablemente la solicitud *«para todos los efectos legales»*; un pronunciamiento extemporáneo de la fuente no deshace el efecto legal consumado.

### Escenario 8: Titular aporta la denuncia después de la respuesta de fondo, elevando la evidencia a exoneración (Art. 10)
- **Datos:** Radicación `2026-11-25`, crédito de $1.200.000, evidencia inicial de 50 puntos (banda `media`: biometría 0,62 [25 pts] + dispositivo compartido [25 pts]). El analista responde a tiempo el `2026-12-09` (día 9) manteniendo la suspensión. El `2026-12-15` (día 13) el titular aporta la denuncia ante Fiscalía (+10 pts -> puntaje sube a 60, banda `alta`). Fecha consultada: `2026-12-16`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `judicial` con habilitación activa del botón `Exonerar ahora (art. 10)` (`puedeExonerar = true`). Si el analista lo aprueba el `2026-12-16`, pasa a `exonerado`.
  - **Fechas límite:** Si se exonera el `2026-12-16`, caso cerrado sin esperar fallo penal.
  - **Obligaciones:** Exoneración y desvinculación definitiva del cobro (Art. 10), corrección en centrales con leyenda «Víctima de Falsedad Personal» (Art. 5 num. 2 y Art. 7) y reporte a la DIAN (Art. 5 num. 8).
- **Por qué:** El Art. 10 de la Ley 2573 impone el deber permanente de coadyuvar a la justicia y recortar tiempos desvinculando a la víctima tan pronto existan elementos que evidencien la suplantación, incluso si estos se completan con posterioridad a la respuesta inicial.

### Escenario 9: Titular aporta la denuncia en el día hábil 22 (vencido el plazo de 20 días), antes o después de reanudar el cobro
- **Datos:** Radicación `2026-11-19`, respuesta el `2026-12-03` (banda `baja`, 0 pts), el plazo de 20 días vence el `2026-12-18` sin denuncia. El `2026-12-21` (día 21) el analista reanuda el cobro; el `2026-12-22` (día 22) el titular aporta la denuncia penal. Fecha consultada: `2026-12-22`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Debe pasar de `reanudado` a `judicial` (o mostrar alerta de «Denuncia sobreviniente recibida: suspender cobro y marcar en centrales»).
  - **Fechas límite:** Espera decisión judicial (Art. 9).
  - **Obligaciones:** Incorporar la marca «Víctima de Falsedad Personal» en centrales (Art. 5 num. 2, que no fija caducidad para el deber de marcación cuando existe denuncia) y suspender nuevamente el cobro a la espera del pronunciamiento judicial (Art. 9).
- **Por qué:** El Parágrafo 1 del Art. 8 faculta (*«podrá reanudar»*) a reactivar el cobro ante la falta de denuncia en los 20 días, pero no extingue el derecho del titular ni deroga el Art. 5 num. 2 ni el Art. 9 cuando la denuncia penal efectivamente se acredita con posterioridad (en el código actual, una vez `reanudado`, ignora la denuncia).

### Escenario 10: Crédito de monto bajo ($\le 15\%$ SMLMV, ej. $200.000) con vencimiento de 20 días sin denuncia
- **Datos:** Radicación `2026-11-19`, monto $200.000 ($\le 15\%$ de 1 SMLMV), sin discrepancias (puntaje 10, banda `baja`), respuesta el `2026-12-03`, sin denuncia al `2026-12-22` (día 22).
- **Qué debe mostrar según la ley:**
  - **Estado:** `puede_reanudar` (y si el analista aprueba sin requerir doble firma porque $200.000 < $1.500.000, pasa a `reanudado`).
  - **Fechas límite:** Plazo de denuncia vencido el `2026-12-18`.
  - **Obligaciones:** Al reanudar el cobro, actualizar en centrales la reactivación de la obligación (Sentencia C-413/25, Boletín 123 nota [1]), pero **prohibir** el reporte negativo mientras no se surtan **al menos dos (2) comunicaciones en días diferentes** y medien 20 días calendario desde la última (Ley 1266 de 2008, Art. 13 Par. 2, adicionado por Ley 2157 de 2021).
- **Por qué:** El Art. 13 Par. 2 de la Ley 1266 exige doble comunicación previa en días distintos para obligaciones $\le 15\%$ de 1 SMLMV, y la C-413 de 2025 aclaró que el Art. 8 Par. 1 de la Ley 2573 no exime de las reglas de reporte negativo de la Ley 1266.

### Escenario 11: Crédito de monto alto ($\ge \$1.500.000$, ej. $3.200.000) con evidencia alta que exige control de cuatro ojos antes del día 15
- **Datos:** Radicación `2026-12-01`, monto $3.200.000, discrepancia en cédula y biometría fallida (puntaje 80, banda `alta`). El `2026-12-22` (día hábil 14, a 1 día del silencio positivo) el analista pulsa `Proponer exoneración`, pero la supervisora aún no ha firmado. Fecha consultada: `2026-12-22`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `riesgo` (falta 1 día hábil para el silencio positivo del `2026-12-23`), con alerta crítica de que la sola «propuesta» interna (`proponer`) **no interrumpe** el término legal de 15 días hábiles del Art. 7 (Ley 1266 Art. 16-II num. 8).
  - **Fechas límite:** Respuesta de fondo: `2026-12-23` (o prorrogar hoy mismo por 8 días hábiles hasta el `2027-01-06`).
  - **Obligaciones:** Cotejo y modificación en centrales debieron cumplirse a más tardar el día 10 (`2026-12-16`) sin esperar la segunda firma de exoneración de cartera.
- **Por qué:** El control interno de doble firma para castigo/exoneración contable es oponible internamente, pero frente al titular la modificación en centrales por discrepancias vence en 10 días hábiles (Art. 7) y la respuesta en 15 días hábiles.

### Escenario 12: Reclamo repetido o duplicado del mismo titular por la misma obligación
- **Datos:** El titular `Carlos Mario Restrepo` radica reclamo el `2026-12-01` por el crédito en `Celulares Plaza 80` ($2.100.000) por canal `App` (`SUP-2026-001801`) y el `2026-12-04` vuelve a radicar el mismo reclamo por `Oficina` (`SUP-2026-001855`). Fecha consultada: `2026-12-18`.
- **Qué debe mostrar según la ley:**
  - **Estado:** El segundo radicado debe vincularse/acumularse al expediente original (`SUP-2026-001801`) conservando los plazos más garantistas del primer radicado (`2026-12-01`), sin duplicar el saldo congelado en los KPI ni exigir dos denuncias penales.
  - **Fechas límite:** Cotejo: `2026-12-16` (10 d.h. desde el `2026-12-01`); Respuesta única acumulada: `2026-12-23` (15 d.h. desde el `2026-12-01`).
  - **Obligaciones:** Atender ambos radicados en la respuesta del `2026-12-23` para evitar que el segundo radicado genere un falso silencio positivo o infle la estadística de fraude.
- **Por qué:** Principio de eficacia y unidad de trámite del derecho de petición y hábeas data (Ley 1266 Art. 16-II). (En el código actual, `crearCasoManual` crea un caso independiente que suma dos veces el monto en disputa).

### Escenario 13: Varios créditos de la misma persona suplantada en una misma ráfaga delictiva
- **Datos:** A la misma titular (`Diana Marcela Gómez`, misma cédula) le aprueban el mismo día 3 créditos en comercios distintos ($1.500.000, $900.000 y $2.400.000) desde el dispositivo `DV-7F3A`. Reclama los 3 el `2026-12-02`. Fecha consultada: `2026-12-10`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Los 3 créditos deben agruparse bajo la misma víctima y red de fraude, compartiendo la misma prueba sumaria documental, la misma validación de identidad (Art. 6 num. 5) y una sola denuncia penal del titular (Art. 8).
  - **Fechas límite:** Cotejo: `2026-12-17`; Respuesta: `2026-12-24`; Denuncia: `2027-01-04`.
  - **Obligaciones:** Suspender inmediatamente los 3 cobros y bloquear el cupo total (Art. 5 num. 5 y Art. 8), corregir los 3 reportes en centrales y consolidar el reporte a la DIAN (Art. 5 num. 8) por el total de $4.800.000.
- **Por qué:** No se puede exigir al titular presentar 3 denuncias penales ni 3 pruebas biométricas separadas por el mismo hecho de falsedad personal (principio de carga dinámica de la prueba, Art. 2 lit. d Ley 2573).

### Escenario 14: Reclamo incompleto (el titular no adjunta soportes ni describe los hechos)
- **Datos:** Radicación `2026-12-01` donde el titular solo escribe «No reconozco este cobro» sin adjuntar copia de su documento ni descripción de los hechos. Fecha consultada: `2026-12-03`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Cobro suspendido preventivamente (Art. 8 inc. 2 Ley 2573 y Boletín 123 SFC lín. 195), pero con subestado `Requerimiento de subsanación enviado` (Ley 1266 Art. 16-II num. 1).
  - **Fechas límite:** Plazo de un (1) mes calendario desde el oficio de requerimiento (`2027-01-03`) para que el solicitante subsane antes de configurar desistimiento tácito del reclamo de hábeas data (Ley 1266 Art. 16-II num. 1), sin perjuicio del término de 20 días hábiles del Art. 8 de la Ley 2573.
  - **Obligaciones:** Suspender cobro de inmediato (Art. 8), entregar al titular los documentos de aprobación si los pide (Art. 5 num. 7) y oficiar para subsanar.
- **Por qué:** El Art. 16-II num. 1 de la Ley 1266 establece que *«En caso de que el escrito resulte incompleto, se deberá oficiar al interesado para que subsane las fallas. Transcurrido un mes desde la fecha del requerimiento, sin que el solicitante presente la información requerida, se entenderá que ha desistido de la reclamación»*, mientras que el Art. 8 de la Ley 2573 obliga a suspender el cobro desde el aviso inicial.

### Escenario 15: Reclamo trasladado desde el operador de información (DataCrédito / TransUnion) y no radicado directamente ante la fuente
- **Datos:** El titular presenta el reclamo ante DataCrédito el `2026-12-01`; el operador incluye la leyenda «reclamo en trámite» y da traslado a la entidad de crédito (fuente) el `2026-12-03` (día hábil 2). Fecha consultada: `2026-12-10`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `en_tramite` (con plazo acortado para responder al operador).
  - **Fechas límite:** Según el Art. 16-II num. 4 de la Ley 1266, la fuente *«deberá resolver e informar la respuesta al operador en un plazo máximo de diez (10) días hábiles»* (`2026-12-18`), para que el operador responda al titular dentro de los 15 días hábiles contados desde la presentación original (`2026-12-23`).
  - **Obligaciones:** Suspender cobro al recibir el traslado (`2026-12-03`), cotejar y responder al operador en máximo 10 días hábiles (`2026-12-18`).
- **Por qué:** El Art. 16-II num. 4 de la Ley 1266 distingue el reclamo directo ante la fuente del reclamo presentado ante el operador de información, imponiendo a la fuente un término máximo de 10 días hábiles para resolver e informar al operador.

### Escenario 16: Cotejo con discrepancia en fecha de expedición de cédula (30 pts), pero sin otros indicadores (banda `media`)
- **Datos:** Radicación `2026-12-01`, la cédula recibida al aprobar tiene fecha de expedición `2 jun 2021` y la del titular real es `14 mar 2012` (`expAprob !== expTitular`, +30 pts), pero biometría 0,85, línea antigua, mismo dispositivo y ciudad (puntaje total = 30, banda `media`). Cotejo el `2026-12-09`. Fecha consultada: `2026-12-09`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Debe permitir y recomendar la **exoneración directa** (Art. 10) o, como mínimo, aplicar todas las consecuencias legales de la prueba sumaria del Art. 7.
  - **Fechas límite:** Modificación en centrales y leyenda «Víctima de Falsedad Personal»: `2026-12-16` (10 d.h.); Respuesta: `2026-12-23` (15 d.h.).
  - **Obligaciones:** Por existir discrepancia entre los documentos de adquisición y los allegados por el titular, la ley los califica expresamente como *«prueba sumaria para probar la falsedad y sin la exigencia de ningún requisito adicional»* (Art. 7 y Art. 5 num. 9): obliga a corregir el dato negativo y el puntaje con la leyenda en 10 días hábiles, denunciar el delito de estafa (Art. 5 num. 9) y exonerar sin exigir denuncia al titular (Art. 10).
- **Por qué:** El modelo de puntaje de `datos.js` (lín. 196 y 211) le da solo 30 puntos a la discrepancia de cédula y la deja en banda `media`, por lo que contradice el Art. 7 y el Art. 10 al exigirle al titular presentar denuncia penal en vez de exonerarlo.

### Escenario 17: Posible autofraude o préstamo a un familiar (compras previas pagadas desde el mismo dispositivo, línea y ciudad)
- **Datos:** Radicación `2026-11-26` (como el caso #19 de la base), sin discrepancias documentales, biometría 0,88, `comprasPrevias = true` desde el mismo dispositivo, misma línea de 410 días y misma ciudad (regla `familiar`: -20 pts -> puntaje 0, banda `baja`). Fecha consultada: `2026-12-22`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Si aún no han pasado 20 días hábiles sin denuncia: `espera_denuncia` (o `en_tramite` si no se ha respondido). Si ya pasaron los 20 días hábiles sin denuncia: `puede_reanudar`. **Nunca** puede mostrarse como «Rechazado» ni declararse que no hubo suplantación antes del día 20 o cuando medie denuncia.
  - **Fechas límite:** Cotejo: 10 d.h.; Respuesta (manteniendo suspensión y pidiendo validación de identidad Art. 6 num. 5): 15 d.h.; Plazo del titular para denunciar: 20 d.h.
  - **Obligaciones:** Suspender el cobro inmediatamente (Art. 8), entregar copia de los soportes de aprobación y trazabilidad del dispositivo (Art. 5 num. 7), formular la denuncia penal de la entidad en 20 días hábiles (Art. 8 inc. 3, C-413/25) y advertir las consecuencias penales de la falsa denuncia (Art. 9 inc. 4).
- **Por qué:** El Art. 10 inc. 2 de la Ley 2573 y el Concepto SFC 2026124048-004 (`boletin123.txt` lín. 201) prohíben tajantemente a la entidad determinar que no existió suplantación; solo puede esperar el vencimiento de los 20 días sin denuncia (Art. 8 Par. 1) o el fallo judicial (Art. 9).

### Escenario 18: Toma de cuenta (*Account Takeover* - ATO) a un cliente antiguo con buen historial
- **Datos:** Radicación `2026-12-01`, cliente con `comprasPrevias = true` y documentos idénticos (`discrepancias = false`), pero en esta compra cambiaron el teléfono (`otp` +10, `linea` de 5 días +15), el correo (`correo` de 2 días +10), la ciudad de entrega (`ubicacion` +10), el dispositivo (`dispositivo` +25) y se activa la regla `ato` (+20): puntaje = 90 (banda `alta`). Fecha consultada: `2026-12-09`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `exonerado` tras la aprobación del analista.
  - **Fechas límite:** Cotejo y corrección en centrales: `2026-12-16`; Respuesta de exoneración: `2026-12-23`.
  - **Obligaciones:** Bloquear inmediatamente el cupo y las credenciales tomadas (Art. 5 num. 5), exonerar al titular sin exigirle denuncia (Art. 10), corregir el reporte negativo y el puntaje en centrales (Art. 7 y Art. 2 lit. c), reportar a la DIAN (Art. 5 num. 8) y formular la denuncia penal de la entidad por suplantación digital/acceso abusivo (Art. 3 num. 5 condicionado por C-413/25 y Art. 8 inc. 3).
- **Por qué:** El Art. 3 num. 5 y el Art. 4 lit. b de la Ley 2573 cubren expresamente la suplantación de identidad digital mediante ingeniería social, SMS o toma de perfiles electrónicos, aunque la cédula archivada en el banco sea la auténtica del cliente.

### Escenario 19: Participación interna de un asesor comercial (5 o más reclamos asociados al mismo asesor)
- **Datos:** El asesor `A-0231` de `Celulares Plaza 80` acumula 7 créditos reclamados por suplantación en Soacha (casos #1 a #7 de `datos.js`). Fecha consultada: `2026-12-22`.
- **Qué debe mostrar según la ley:**
  - **Estado:** En cada uno de los 7 casos, `investigacionSugerida = true` y alerta destacada de red de fraude.
  - **Fechas límite:** Además de los plazos individuales de 10 y 15 días hábiles por caso, activación inmediata de la investigación interna y denuncia penal contra los responsables.
  - **Obligaciones:** Cumplir el Art. 5 num. 10 de la Ley 2573 (*«Adelantar la investigación pertinente para determinar una probable responsabilidad de funcionarios de la entidad financiera o establecimiento comercial en la suplantación de identidad, interponiendo las respectivas acciones judiciales»*), suspender el código del asesor/comercio y exonerar a las víctimas (Art. 10).
- **Por qué:** El Art. 5 num. 10 convierte el hallazgo de patrones de originación interna en una obligación legal de investigar y judicializar.

### Escenario 20: Incumplimiento de protocolos de seguridad por la entidad y devolución de dineros debitados (Art. 5 Par. 2)
- **Datos:** Radicación `2026-12-01`. Al aprobar el crédito de $2.000.000, la entidad omitió la validación biométrica obligatoria de su protocolo (biometría 0,42, por debajo del umbral de 0,70) y además ya había debitado automáticamente $350.000 de la cuenta de ahorros de la víctima para la primera cuota. Fecha consultada: `2026-12-07`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `exonerado` con orden de **reverso/devolución inmediata de dineros**.
  - **Fechas límite:** Suspensión inmediata (`2026-12-01`), modificación en centrales (`2026-12-16`) y devolución oportuna de los $350.000 sin esperar respuesta del tercero receptor.
  - **Obligaciones:** Además de suspender la cobranza y modificar el reporte en centrales, el Art. 5 Parágrafo 2 (vigente desde la promulgación el 20 de mayo de 2026 según Art. 13) ordena: *«El incumplimiento igualmente dará lugar a la obligación de devolución oportuna de los dineros y/o la eliminación de las acreencias que fueron objeto de defraudación a la persona suplantada. No podrá congelarlos ni esperar respuesta o autorización del titular de la cuenta donde fueron transferidos los dineros objeto de defraudación para el reverso de la transacción»*.
- **Por qué:** Es la sanción civil/operativa más severa del Art. 5 Par. 2 de la Ley 2573 cuando fallan los protocolos de identificación (reconocida como límite no modelado en `ronda38.md`).

### Escenario 21: Archivo de la indagación por la Fiscalía por imposibilidad de identificar al sujeto activo (Art. 9 Parágrafo y C-413/25)
- **Datos:** Radicación `2026-11-19`, respuesta el `2026-12-03`, denuncia del titular el `2026-12-07` (estado `judicial`). El `2027-03-15` la Fiscalía archiva la indagación preliminar porque no pudo identificar al estafador, pero deja constancia de que la víctima no participó en la transacción. Fecha consultada: `2027-03-16`.
- **Qué debe mostrar según la ley:**
  - **Estado:** Debe pasar de `judicial` a `exonerado` (cerrado a favor del titular).
  - **Fechas límite:** Cierre inmediato tras la recepción de la orden de archivo fiscal.
  - **Obligaciones:** Exonerar y desvincular definitivamente al titular de cualquier cobro o reporte (Art. 9 Parágrafo), emitir reporte a la DIAN (Art. 5 num. 8) y mantener a la entidad como víctima en caso de reapertura penal.
- **Por qué:** El Parágrafo del Art. 9 de la Ley 2573, condicionado por la Sentencia C-413 de 2025 (`ley2573_notas.txt` lín. 144), dispone que cuando la indagación se archive sin identificar al autor pero estableciendo que la persona afectada no participó en la transacción, esta queda libre de nuevos cobros o reportes.

### Escenario 22: Sentencia judicial en firme que determina que NO existió suplantación (el reclamante sí adquirió el crédito)
- **Datos:** Radicación `2026-11-19`, cobro suspendido ese día, respuesta el `2026-12-03`, denuncia el `2026-12-10` (estado `judicial`). El `2027-05-10` queda en firme la decisión judicial penal o civil que determina que no hubo suplantación y que el titular sí tomó el crédito. Fecha consultada: `2027-05-11`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `reanudado` por fallo judicial en contra del reclamante (caso cerrado).
  - **Fechas límite:** Cómputo del término de prescripción de la obligación y de la acción pauliana (Art. 8 Par. 2 y Art. 9 inc. 3) iniciando el `2027-05-10`.
  - **Obligaciones:** Reanudar el cobro *«con todos los intereses y demás valores que se hubieren causado como si nunca se hubiera suspendido el cobro»* (Art. 9 inc. 3), retirar cualquier leyenda de víctima o reclamo en centrales y remitir copias por falsa denuncia (Art. 9 inc. 4).
- **Por qué:** El Art. 9 inc. 3 de la Ley 2573 regula expresamente el efecto retroactivo de los intereses (*«como si nunca se hubiera suspendido»*) y la suspensión del término de prescripción mientras duró la espera judicial.

### Escenario 23: Solicitud exclusiva de copias de los documentos de aprobación sin que exista denuncia penal previa (Art. 5 num. 7 y C-413/25)
- **Datos:** El `2026-12-01` el titular radica solicitud pidiendo copia del pagaré, solicitud de crédito, selfie y trazabilidad IP con que se aprobó el crédito a su nombre, manifestando presunta suplantación pero advirtiendo que aún no ha ido a la Fiscalía. Fecha consultada: `2026-12-10`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `en_tramite` con obligación activa y exigible de entregar las copias solicitadas.
  - **Fechas límite:** Entrega de documentos y trámite de la solicitud: máximo 10 días hábiles (`2026-12-16`, Art. 5 num. 4 y 7).
  - **Obligaciones:** Entregar copia íntegra de la información y documentos de aprobación **sin exigir copia de la denuncia ante la Fiscalía**.
- **Por qué:** La Sentencia C-413 de 2025 (`ley2573_notas.txt` líns. 74 y 88) declaró **INCONSTITUCIONAL** la frase del Art. 5 num. 7 que exigía acompañar la solicitud con copia de la denuncia ante la Fiscalía, consolidando además la carga dinámica de la prueba del Art. 2 lit. d.

### Escenario 24: Demanda judicial interpuesta por el titular inconforme o excepciones de mérito en proceso ejecutivo (Ley 1266 Art. 16-II num. 6)
- **Datos:** Tras habérsele reanudado el cobro por vencimiento de los 20 días sin denuncia (`2026-12-22`), el titular interpone demanda civil (o propone excepciones de mérito de falsedad en el ejecutivo) y la entidad es notificada el `2027-01-15`. Fecha consultada: `2027-01-18`.
- **Qué debe mostrar según la ley:**
  - **Estado:** `judicial` (en discusión judicial en sede civil, conforme al condicionamiento del Art. 9 inc. 1 en la Sentencia C-413 de 2025).
  - **Fechas límite:** Dos (2) días hábiles desde la notificación (`2027-01-19`) para informar al operador de información; más dos (2) días hábiles del operador para incluir la leyenda.
  - **Obligaciones:** Informar a las centrales en 2 días hábiles para que marquen *«información en discusión judicial»* hasta que haya fallo en firme (Ley 1266 Art. 16-II num. 6) y mantener suspendido el cobro hasta que medie decisión judicial en sede civil que defina la existencia de la obligación (Sentencia C-413 de 2025 sobre Art. 9 inc. 1).
- **Por qué:** Tanto el Art. 16-II num. 6 de la Ley 1266 como la Sentencia C-413 de 2025 (`ley2573_notas.txt` lín. 144) articulan la discusión en sede civil con la protección de hábeas data y la suspensión del cobro.

### Escenario 25: Titular se niega o no asiste a la prueba de validación de identidad de la entidad, pero existe discrepancia documental en la cédula
- **Datos:** Radicación `2026-12-01`, la entidad cita al titular a realizar la prueba de validación de identidad (Art. 6 num. 5) el `2026-12-04` y el titular no asiste; sin embargo, al cotejar el documento allegado en la petición con el del expediente crediticio, la fecha de expedición y la serie de la cédula no coinciden (`discrepancias = true`). Fecha consultada: `2026-12-16` (día hábil 10).
- **Qué debe mostrar según la ley:**
  - **Estado:** Cotejo con discrepancias completado; debe proceder la modificación en centrales en el día 10 y la exoneración (Art. 7 y Art. 10), sin condicionarla a la prueba adicional de validación.
  - **Fechas límite:** Modificación del reporte y puntaje con leyenda en centrales: `2026-12-16` (10 d.h.); Respuesta de fondo: `2026-12-23` (15 d.h.).
  - **Obligaciones:** Cumplir el Art. 7 (Ley 1266 Art. 16-II num. 7), que ordena que los documentos allegados en la petición *«se tendrán como prueba sumaria para probar la falsedad y sin la exigencia de ningún requisito adicional, la fuente deberá solicitar la modificación del dato negativo, récord (scoringsscore) [...] y se incluirá una leyenda dentro del registro personal que diga "Víctima de Falsedad Personal"»*, y denunciar la estafa (Art. 5 num. 9).
- **Por qué:** Aunque el Art. 6 num. 5 prevé el deber del titular de realizar la prueba de validación de identidad, el Art. 7 prohíbe expresamente exigir *«ningún requisito adicional»* cuando el cotejo documental ya prueba sumariamente la falsedad.

---

## 3. QUÉ LE FALTA PARA USARSE EN UNA ENTIDAD REAL

### IMPRESCINDIBLE (Bloqueante para salir a producción en una entidad vigilada)

1. **Backend transaccional y base de datos persistente con control de concurrencia:** Hoy todo vive en memoria y `localStorage` del navegador (`vistas.js` lín. 13), por lo que dos analistas no pueden ver ni trabajar la misma bandeja ni se garantiza la integridad de los estados.
2. **Reloj del servidor inmutable (NTP) y separación entre fecha real y simulador:** En `vistas.js` (lín. 73) cualquier usuario puede cambiar `FECHA` y registrar decisiones con fecha retroactiva o futura, lo que invalida cualquier defensa probatoria ante la SFC o la SIC.
3. **Autenticación corporativa (SSO/MFA) y control de acceso basado en roles (RBAC):** El botón de segunda firma (`detalle.js` lín. 144) permite que el mismo usuario en la misma sesión haga clic como analista y enseguida firme como «supervisora Camila Rojas», vulnerando la segregación de funciones (SARO / Circular Básica Jurídica SFC).
4. **Eliminación definitiva del botón «Deshacer decisión» en producción (`deshacerDecision` en `vistas.js` lín. 151):** En una operación regulada, una decisión comunicada al cliente o a las centrales no puede hacerse `.pop()` del arreglo; cualquier reversión requiere un acto administrativo interno nuevo que deje intacto el anterior.
5. **Integración bidireccional real (API/SFTP) con Operadores de Información (DataCrédito Experian y TransUnion):** Para transmitir automáticamente en $\le 2$ días hábiles la marca «reclamo en trámite», en $\le 10$ días hábiles la eliminación del dato negativo, recomposición del *score* y leyenda «Víctima de Falsedad Personal», y recibir los reclamos radicados directamente ante el operador (Ley 1266 Art. 16-II num. 4 y 7).
6. **Integración en tiempo real con el Core de Crédito y el motor de Cobranza (interna y casas de cobro externas):** Para que la suspensión del cobro, intereses corrientes/moratorios, débitos automáticos y gastos de cobranza (Art. 8 inc. 2) y el bloqueo de cupo/tarjeta (Art. 5 num. 5) sean automáticos al radicar, incluso en sábado o festivo.
7. **Cumplimiento de la Ley 1581 de 2012 (Protección de Datos Personales y Datos Sensibles Biométricos):** Falta la captura de autorización de tratamiento para el trámite del reclamo, el aviso de privacidad, el cifrado en reposo y tránsito de las imágenes de cédula y plantillas biométricas (datos sensibles, Art. 5 Ley 1581) y la política de retención y expurgo.
8. **Gestor documental seguro (DMS) para soportes y pruebas sumarias:** La mesa simula huellas de 4 caracteres hexadecimales (`datos.js` lín. 53), pero una operación real requiere almacenar, visualizar y firmar digitalmente los PDFs del pagaré desmaterializado (Deceval/certificadora), certificado de firma electrónica (Ley 527 de 1999), fotos de cédula, *selfies* y constancia de denuncia de la Fiscalía.
9. **Motor de notificaciones certificadas al titular (correo electrónico certificado, SMS con acuse, correspondencia física):** Conforme a la Ley 527 de 1999 y Ley 2157 de 2021, la entidad debe probar la fecha y hora exacta en que comunicó el plazo de 20 días para denunciar (Art. 8 inc. 3), la prórroga motivada (Art. 7 num. 8) y la respuesta de fondo, para desvirtuar reclamos de silencio positivo.
10. **Módulo de devolución y reverso contable por fallas de seguridad (Art. 5 Parágrafo 2 Ley 2573):** Cuando el titular ya sufrió débitos o pagos y se verifica incumplimiento de protocolos de seguridad, el sistema debe ordenar la devolución inmediata sin esperar autorización del receptor de los fondos.

### IMPORTANTE (Necesario para la operación completa, supervisión SFC/SIC y control de riesgos)

11. **Flujo completo de denuncias penales de la entidad (Art. 8 inc. 3 condicionado por C-413/25 y Art. 5 num. 9):** Generación de minuta penal, radicación o cargue del número único de noticia criminal (NUNC / SPOA) ante la Fiscalía General de la Nación dentro de los 20 días hábiles, y seguimiento de etapas procesales hasta sentencia o archivo fiscal (Art. 9).
12. **Módulo de generación y trazabilidad del reporte a la DIAN (Art. 5 num. 8):** Generación de los formatos de corrección de información exógena tributaria y certificado de ajuste para el titular, con acuse de recibo ante la DIAN.
13. **Reportes regulatorios para la Superintendencia Financiera (Smartsupervision / Sistema Integral de Quejas - SIQ) y Defensor del Consumidor Financiero (DCF):** Tipificación de quejas bajo las taxonomías oficiales de la SFC, exportación auditable para requerimientos de la SIC/SFC (Ley 1266 Art. 17) y atención de traslados del DCF.
14. **Verificación automática contra la Registraduría Nacional del Estado Civil (RNEC) y listas inhibitorias:** Consulta del estado de vigencia y fecha de expedición real de la cédula en el Archivo Nacional de Identificación (ANI) y biometría facial/dactilar cotejada contra fuentes oficiales.
15. **Gestión de reclamos incompletos y desistimiento tácito (Ley 1266 Art. 16-II num. 1):** Flujo para oficiar al reclamante cuando falten datos esenciales, controlando el reloj de 1 mes calendario de subsanación separado del reloj de suspensión del Art. 8.
16. **Consolidación multicanal y multiproducto por titular (deduplicación):** Detección automática de reclamos duplicados por distintos canales (Oficina, App, Defensoría, SFC, Centrales) y agrupación de múltiples créditos fraudulentos de una misma víctima bajo un único expediente maestro.
17. **Conexión con SARLAFT / SIPLAFT y Oficialía de Cumplimiento:** Las redes de fraude organizado detectadas (ej. 9 casos en Soacha con el mismo asesor y dispositivos) deben disparar alertas automáticas al Oficial de Cumplimiento para evaluar Reportes de Operaciones Sospechosas (ROS) ante la UIAF.
18. **Flujo disciplinario y de bloqueo comercial para asesores y comercios aliados (Art. 5 num. 10):** Integración con Recursos Humanos, Control Disciplinario y el sistema de originación en comercios para suspender preventivamente el usuario del asesor sospechoso al superar el umbral de alertas.
19. **Validación del preaviso de 20 días calendario (Ley 1266 Art. 12 y Art. 13 Par. 2) antes de reactivar reportes en centrales:** Al ejecutar `reanudar` (Art. 8 Par. 1), verificar que solo se actualice la reactivación del cobro (Sentencia C-413/25) y que cualquier reporte de mora cumpla la comunicación previa (simple o doble si es $\le 15\%$ SMLMV).

### DESEABLE (Optimización operativa, experiencia del usuario y analítica avanzada)

20. **Portal de autogestión para el titular suplantado:** Para que el cliente consulte en línea el estado de su reloj legal, descargue sin trabas las copias de los documentos de aprobación (Art. 5 num. 7), realice la prueba de validación de identidad (Art. 6 num. 5) y cargue la constancia de la denuncia ante la Fiscalía.
21. **Motor de asignación inteligente de carga operativa y turnos (WFM):** Distribución automática de casos según disponibilidad de analistas, vacaciones, nivel de atribución por monto y especialización (fraude individual vs. redes criminales).
22. **Alertas tempranas omnicanal (Slack/Teams/Correo) por SLA interno:** Avisos automáticos a las 24 horas para el reporte de «reclamo en trámite» (límite legal: 2 días), al día 7 para el cotejo (límite legal: 10 días) y al día 11 para la respuesta (límite legal: 15 días).
23. **Gobierno de modelos y calibración estadística del *score* de evidencia (`puntuar`):** Sustituir los pesos fijos en código por un motor de reglas versionado y auditable por Riesgo Operativo, donde cualquier discrepancia documental del Art. 7 active automáticamente la ruta de prueba sumaria.
24. **Anonimización y gobernanza de datos para el asistente de IA:** Garantizar que ningún dato personal semiprivado, privado o sensible del titular salga hacia modelos de lenguaje externos sin anonimización previa, cumpliendo el principio de circulación restringida (Art. 2 lit. a Ley 2573 y Art. 4 lit. c Ley 1266).
