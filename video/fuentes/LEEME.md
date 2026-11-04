# Cómo rehacer el video

Todo corre en esta carpeta y escribe aquí sus archivos intermedios (capturas, tomas, clips).

1. `node capturar.js`: toma las capturas de `..\..\abrir_local.html` con Edge sin ventana (tema claro, 1280×720 a escala 1,5).
2. `C:\Users\ADMIN\chatterbox-env\Scripts\python.exe voz_latina.py`: genera 3 tomas por frase con la voz latina (Chatterbox es-mx-latam, en la tarjeta gráfica). Antes, revisa con `ollama ps` que no haya otro modelo cargado. Para repetir solo algunas frases: `voz_latina.py s02,s20 21,33,42,57`.
3. `C:\Users\ADMIN\kinocut-env\Scripts\python.exe elegir_tomas.py`: Whisper small, en el procesador, elige la toma más fiel y la copia a `audio_v3\`.
4. `VERSION=v3 node componer.js`: arma `como_funciona_mesa_cotejo_v3.mp4` con ffmpeg en el procesador. Necesita las capturas en `capturas_v3\`.

Los textos que se ven y se oyen están en `guion.json`. En `voz_latina.py`, `COMO_SUENA` guarda la versión que se le pasa a la voz: los números escritos en palabras.
