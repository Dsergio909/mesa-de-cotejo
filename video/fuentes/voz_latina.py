# -*- coding: utf-8 -*-
"""Voz latina (Chatterbox + ajuste es-mx-latam, voz_latam.py) para el video de la Mesa de Cotejo.
Escribe 3 tomas por frase en tomas_v3\\<id>_<semilla>.wav. Los subtítulos no cambian: aquí el texto va como debe sonar.
Uso: chatterbox-env python voz_latina.py"""
import json
import os
import sys

import numpy as np
import soundfile as sf
import torch

sys.path.insert(0, r"C:\Trabajo\Video_Addi\scripts")
from voz_latam import cargar

BASE = os.path.dirname(os.path.abspath(__file__))
COMO_SUENA = {
    "s01": "En Colombia hay una ley nueva: la Ley dos mil quinientos setenta y tres, de dos mil veintiséis.",
    "s03": "Si no responde en quince días hábiles, el reclamo queda resuelto a favor de la persona, y la entidad se expone a una sanción.",
    "s06": "El aviso, si nadie actúa, calcula cuántos reclamos, y por cuánta plata, quedarían resueltos a favor de las personas si nadie hace nada.",
    "s15": "No hay botón de rechazar, porque eso solo lo puede decidir un juez.",
    "s25": "Datos ficticios. Demostración para entrevista.",
    "s22": "Con control más ka, buscas un caso o le preguntas a la inteligencia artificial.",
}
guion = json.load(open(os.path.join(BASE, "guion.json"), encoding="utf-8"))
frases = {s["id"]: COMO_SUENA.get(s["id"], s.get("voz") or s["sub"]) for s in guion}
OUT = os.path.join(BASE, "tomas_v3")
os.makedirs(OUT, exist_ok=True)
json.dump(frases, open(os.path.join(OUT, "frases.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

SOLO = sys.argv[1].split(",") if len(sys.argv) > 1 else list(frases)
SEMILLAS = [int(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else [3, 7, 11]
m = cargar()
for n, texto in frases.items():
    if n not in SOLO:
        continue
    for s in SEMILLAS:
        torch.manual_seed(s)
        a = m.generate(texto, language_id="es", exaggeration=0.55, cfg_weight=0.45).squeeze(0).cpu().numpy().astype(np.float32)
        sf.write(os.path.join(OUT, f"{n}_{s:02d}.wav"), a, m.sr)
        print(n, s, round(len(a) / m.sr, 2), flush=True)
print("listo")
