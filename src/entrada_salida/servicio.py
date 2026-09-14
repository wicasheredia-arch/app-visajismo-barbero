"""Capa de entrada/salida: recibe los 4 valores crudos del diagnostico,
los valida, construye el DiagnosticoCliente, lo envia al motor ya
existente (sin modificarlo) y devuelve el resultado como estructura
de datos plana (dicts/listas), lista para serializarse a JSON o para
imprimirse por cualquier interfaz futura.

No contiene ninguna regla de negocio: solo transporte y validacion de
forma. Toda decision sobre que recomendar vive en `src.motor`.
"""

from typing import Any, Dict, List, Optional

from ..diagnostico import DiagnosticoCliente
from ..motor import ResultadoRecomendacion, recomendar
from .validacion import (
    resolver_densidad,
    resolver_forma_rostro,
    resolver_grosor,
    resolver_textura,
)


def construir_diagnostico(rostro: str, textura: str, densidad: str, grosor: str) -> DiagnosticoCliente:
    """Valida los 4 campos contra sus enums cerrados y arma el
    diagnostico. Lanza DiagnosticoInvalido con un mensaje explicito si
    alguno no pertenece a los valores permitidos."""
    return DiagnosticoCliente(
        forma_rostro=resolver_forma_rostro(rostro),
        textura=resolver_textura(textura),
        densidad=resolver_densidad(densidad),
        grosor=resolver_grosor(grosor),
    )


def serializar_resultado(resultado: ResultadoRecomendacion) -> Dict[str, Any]:
    """Traduce el resultado del motor (dataclasses con enums) a un dict
    plano de tipos primitivos. No reordena ni recalcula nada: respeta
    exactamente el orden y los valores que devolvio el motor."""
    if resultado.mensaje_vacio is not None:
        return {"recomendaciones": [], "mensaje_vacio": resultado.mensaje_vacio}

    recomendaciones: List[Dict[str, Any]] = []
    for r in resultado.recomendaciones:
        recomendaciones.append({
            "nombre": r.nombre,
            "familia": r.familia,
            "etiqueta": r.etiqueta.value,
            "efectos_visagismo": list(r.efectos_atendidos),
            "mecanismo": r.mecanismo,
            "nota_tecnica_textura": r.nota_tecnica_textura,
            "advertencias": list(r.advertencias),
            "mantenimiento": r.mantenimiento,
        })
    return {"recomendaciones": recomendaciones, "mensaje_vacio": None}


def generar_recomendacion(rostro: str, textura: str, densidad: str, grosor: str) -> Dict[str, Any]:
    """Punto de entrada unico de la capa de entrada/salida: entrada
    cruda -> validacion -> motor -> salida estructurada."""
    diagnostico = construir_diagnostico(rostro, textura, densidad, grosor)
    resultado = recomendar(diagnostico)
    return serializar_resultado(resultado)
