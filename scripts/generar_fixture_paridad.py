#!/usr/bin/env python3
"""Genera tests/fixtures/paridad_216_casos.json: la salida exacta del
motor Python (via src.entrada_salida.generar_recomendacion) para las
216 combinaciones posibles de diagnostico (6 rostros x 4 texturas x 3
densidades x 3 grosores).

Este fixture es la fuente de verdad para probar que el puerto
JavaScript produce resultados identicos al motor Python real -- no
solo en los 9 casos ya validados a mano, sino en el espacio completo
de entradas posible.

Ejecutar cada vez que cambie algo en el motor o el catalogo Python:
    python3 scripts/generar_fixture_paridad.py
"""

import itertools
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from src.entrada_salida import generar_recomendacion

FORMAS_ROSTRO = ["ovalado", "redondo", "cuadrado", "alargado", "triangular", "corazon"]
TEXTURAS = ["liso", "ondulado", "rizado", "afro"]
DENSIDADES = ["baja", "media", "alta"]
GROSORES = ["fino", "medio", "grueso"]


def main() -> None:
    casos = []
    for rostro, textura, densidad, grosor in itertools.product(FORMAS_ROSTRO, TEXTURAS, DENSIDADES, GROSORES):
        entrada = {"rostro": rostro, "textura": textura, "densidad": densidad, "grosor": grosor}
        salida = generar_recomendacion(rostro, textura, densidad, grosor)
        casos.append({"entrada": entrada, "salida": salida})

    assert len(casos) == 216, f"Se esperaban 216 combinaciones, se generaron {len(casos)}"

    destino = RAIZ / "tests" / "fixtures" / "paridad_216_casos.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(casos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generado: {destino} ({len(casos)} casos)")


if __name__ == "__main__":
    main()
