#!/usr/bin/env python3
"""Genera web_estatico/js/catalogo_datos.js a partir de los datos
Python ya congelados en src/catalogo.

Este script NO transpila ni bundla nada -- solo serializa los mismos
objetos Python (los 15 cortes, las 60 compatibilidades, los 15
mecanismos, las 8 excepciones y las 6 definiciones de rostro) a un
literal JSON embebido en un archivo JS. Se hace asi, en vez de
transcribir los datos a mano en JavaScript, para eliminar el riesgo
de errores de copiado: los datos JS son *exactamente* los datos
Python, generados programaticamente, nunca re-tecleados.

Ejecutar cada vez que cambie algo en src/catalogo:
    python3 scripts/generar_catalogo_js.py
"""

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from src.catalogo.cortes import CORTES
from src.catalogo.compatibilidad import COMPATIBILIDADES
from src.catalogo.enums import ModoEvaluacion
from src.catalogo.excepciones import EXCEPCIONES
from src.catalogo.mecanismos import MECANISMOS
from src.catalogo.rostros import ROSTROS


def _cortes_a_datos():
    return [
        {
            "id": c.id,
            "nombre": c.nombre,
            "familia": c.familia,
            "descripcion": c.descripcion,
            "volumenArriba": int(c.volumen_arriba),
            "volumenLateral": int(c.volumen_lateral),
            "volumenPosterior": int(c.volumen_posterior),
            "efectoLargo": c.efecto_largo.value,
            "eje": int(c.eje),
            "densidadReferencia": int(c.densidad_referencia),
            "grosorReferencia": int(c.grosor_referencia),
            "mantenimiento": int(c.mantenimiento),
            "mecanismoId": c.mecanismo_id,
        }
        for c in CORTES
    ]


def _compatibilidades_a_datos():
    return [
        {
            "corteId": comp.corte_id,
            "textura": comp.textura.value,
            "valor": comp.valor,
            "justificacion": comp.justificacion,
        }
        for comp in COMPATIBILIDADES
    ]


def _mecanismos_a_datos():
    return [
        {
            "id": m.id,
            "nombre": m.nombre,
            "principioTecnico": m.principio_tecnico,
            "efectos": [e.value for e in m.efectos],
            "zonas": [z.value for z in m.zonas],
        }
        for m in MECANISMOS
    ]


def _excepciones_a_datos():
    return [
        {"corteId": e.corte_id, "textura": e.textura.value, "texto": e.texto}
        for e in EXCEPCIONES
    ]


def _rostros_a_datos():
    salida = {}
    for forma, definicion in ROSTROS.items():
        entrada = {"modo": definicion.modo.value}
        if definicion.modo == ModoEvaluacion.POR_ZONA:
            entrada["objetivosZona"] = {
                zona.value: objetivo.value for zona, objetivo in definicion.objetivos_zona.items()
            }
        if definicion.modo == ModoEvaluacion.POR_EJE:
            entrada["objetivoEjeMinimo"] = int(definicion.objetivo_eje_minimo)
        salida[forma.value] = entrada
    return salida


def main() -> None:
    datos = {
        "cortes": _cortes_a_datos(),
        "compatibilidades": _compatibilidades_a_datos(),
        "mecanismos": _mecanismos_a_datos(),
        "excepciones": _excepciones_a_datos(),
        "rostros": _rostros_a_datos(),
    }

    assert len(datos["cortes"]) == 15
    assert len(datos["compatibilidades"]) == 60
    assert len(datos["mecanismos"]) == 15
    assert len(datos["excepciones"]) == 8
    assert len(datos["rostros"]) == 6

    contenido = (
        "// GENERADO AUTOMATICAMENTE desde src/catalogo por scripts/generar_catalogo_js.py\n"
        "// No editar a mano. Cualquier cambio de catalogo se hace en Python y se regenera este archivo.\n"
        "(function (global) {\n"
        "  \"use strict\";\n"
        "  var CATALOGO_DATOS = " + json.dumps(datos, ensure_ascii=False, indent=2) + ";\n"
        "  if (typeof module !== \"undefined\" && module.exports) {\n"
        "    module.exports = CATALOGO_DATOS;\n"
        "  } else {\n"
        "    global.CATALOGO_DATOS = CATALOGO_DATOS;\n"
        "  }\n"
        "})(typeof window !== \"undefined\" ? window : globalThis);\n"
    )

    destino = RAIZ / "web_estatico" / "js" / "catalogo_datos.js"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(contenido, encoding="utf-8")
    print(f"Generado: {destino} ({len(contenido)} bytes)")


if __name__ == "__main__":
    main()
