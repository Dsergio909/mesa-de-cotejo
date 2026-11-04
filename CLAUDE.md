# CLAUDE.md

## Antes de empezar: lee la memoria (cerebro)
La memoria de mis proyectos es mi repo **privado** `Dsergio909/cerebro` (copia diaria de mi Obsidian). Al empezar cualquier sesión, antes de proponer o cambiar nada:

1. Abre ese repo (en la nube: agrégalo a la sesión) y lee:
   - `Proyectos/Como trabajar con Sergio.md`: cómo me gusta trabajar, diseño, decisiones tomadas y privacidad.
   - `Como_actualizar_el_cerebro.md`
   - `Proyectos/Mesa de Cotejo.md`: estado y pendientes de este proyecto.
2. Si no puedes abrirlo o la nota todavía no existe, sigue las reglas mínimas de abajo y avísame.
3. Desde la nube el cerebro **solo se lee**. Al terminar con cambios, entrégame un paquete en Markdown con lo que hay que cambiar en cada nota y sección, para pasárselo a Claude Code en mi PC.

## Reglas mínimas (por si no se puede leer el cerebro)
- Háblame en español, simple y paso a paso.
- **Diseño profesional, como software empresarial.** Nada infantil ni con el «look Claude»: sin neón, pixel art, letra de videojuego o de consola, brillos, emojis de adorno ni avatares en caricatura. La Mesa de Cotejo tiene su propio estilo sobrio (azul marino, Libre Franklin y Source Sans): no lo cambies sin que Sergio lo pida.
- **Antes de publicar algo visible** (diseño, textos, imágenes): muéstrame el antes y el después en capturas y espera mi «sí».
- Prueba y audita tú mismo; comprueba con datos reales. Sin cifras inventadas. Quita lo que no sirva.
- No vuelvas a proponer algo que ya se decidió: está en el cerebro.
- Nunca mi número de teléfono, claves, tokens, cédulas ni direcciones exactas. Nada interno de la empresa de mi práctica. Datos de ejemplo siempre ficticios.
- Nada de `push --force` ni borrar ramas o repos sin mi permiso explícito.
- Fechas legales siempre con código determinista, nunca con IA. No existe el botón «rechazar» (art. 10 de la Ley 2573). Teléfonos, cédulas y direcciones de los datos de ejemplo van enmascarados también en el código.

## Estado del proyecto (4-nov-2026)
- Publicado: demo en GitHub Pages (rama `gh-pages`, armada desde `main` con el documento completo de `abrir_local.html`) y caso 03 del portafolio.
- `index.html` en `main` es la fuente para abrir la demo dentro de Claude (sin `<!doctype>`); la demo pública usa el documento completo. Si cambias `index.html`, cambia también `abrir_local.html` y la rama `gh-pages`.
- 109 pruebas (`node pruebas.js` y `node casos_reales.js`), 24 de 24 hallazgos de auditoría resueltos, axe sin fallas en 3 idiomas (escritorio y celular, revisado el 4-nov).
- Pendiente de un abogado: la leyenda «Víctima de Falsedad Personal» sin denuncia y la vigencia exacta (19 o 20 nov 2026).

## Registro de carrera
Al cerrar ("cierra el chat") o cuando diga "registra esto", revisa si pasó algo que cumpla al menos uno de estos criterios: terminé o entregué algo, tomé una decisión importante con su razón, obtuve un resultado concreto, aprendí una herramienta usándola de verdad, o algo falló y entendí por qué. Si nada cumple, dime "nada para registrar".

- En mi Google Drive, carpeta Cerebro: Carrera/REGISTRO.md (registro) y Carrera/00_Carrera.md (formato).
- Si aparece una copia que dice "Este cerebro se mudó" (por ejemplo, en la carpeta vieja `Cerebro_Carrera`), ignórala.

Puedes escribir la entrada tú mismo: agrégala al final de REGISTRO.md sin editar ni borrar las anteriores, y confírmame en una línea. Si tu herramienta no puede agregar al final sin reemplazar el archivo completo o crear uno nuevo (por ejemplo, el conector de Drive desde la nube), no lo hagas: entrégame la entrada en un bloque de código para que yo la pegue.

Si no puedes leer 00_Carrera.md, usa este formato:

```markdown
## AAAA-MM-DD · <Proyecto> · <título corto>
- Qué hice:
- Problema que resuelve:
- Herramientas:
- Resultado o evidencia: (si no hay cifra real, no se inventa)
- Qué aprendí o qué falló:
- ¿Lo puedo defender en entrevista?: sí / parcial (qué me falta)
- ¿Se puede mostrar en público?: sí / no / solo sin datos internos
```

Máximo 8 líneas. Sin cifras inventadas, sin datos de terceros, sin claves ni rutas privadas.
