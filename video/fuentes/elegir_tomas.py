# -*- coding: utf-8 -*-
"""Elige la toma más fiel de cada frase (Whisper small en CPU, como voz_elegir.py) y la copia a audio_v3\\<id>.wav.
Uso: kinocut-env python elegir_tomas.py"""
import difflib
import glob
import json
import os
import re
import shutil
import unicodedata

import soundfile as sf
import whisper

BASE = os.path.dirname(os.path.abspath(__file__))
TOMAS, OUT = os.path.join(BASE, "tomas_v3"), os.path.join(BASE, "audio_v3")
os.makedirs(OUT, exist_ok=True)
frases = json.load(open(os.path.join(TOMAS, "frases.json"), encoding="utf-8"))


def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).split()


modelo = whisper.load_model("small", device="cpu")
import sys
SOLO = sys.argv[1].split(",") if len(sys.argv) > 1 else list(frases)
res = json.load(open(os.path.join(OUT, "elegidas.json"), encoding="utf-8")) if os.path.exists(os.path.join(OUT, "elegidas.json")) else {}
for n, f in frases.items():
    if n not in SOLO:
        continue
    esperado = len(norm(f)) * 0.36 + 0.6
    mejor = None
    for t in sorted(glob.glob(os.path.join(TOMAS, f"{n}_*.wav"))):
        oido = modelo.transcribe(t, language="es", fp16=False)["text"].strip()
        p = difflib.SequenceMatcher(None, norm(f), norm(oido)).ratio()
        d = sf.info(t).duration
        punt = p - max(0.0, d - esperado * 1.25) * 0.1
        if mejor is None or punt > mejor[0]:
            mejor = (punt, t, oido, d)
    shutil.copy(mejor[1], os.path.join(OUT, f"{n}.wav"))
    res[n] = {"toma": os.path.basename(mejor[1]), "puntaje": round(mejor[0], 3), "dur": round(mejor[3], 2), "oido": mejor[2]}
    print(n, res[n]["puntaje"], res[n]["oido"], flush=True)
json.dump(res, open(os.path.join(OUT, "elegidas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
