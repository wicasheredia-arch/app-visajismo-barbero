"""Listado de las opciones validas para cada campo del diagnostico,
leidas directamente de los enums cerrados del catalogo. Existe para
que cualquier interfaz (CLI, web, o una futura app) pueda construir
sus selectores sin hardcodear ni duplicar los valores permitidos --
una sola fuente de verdad.

Esta es la unica pieza de la capa de entrada/salida que lee el
catalogo (solo los enums, que son dato, no logica); el resto de la
capa solo conoce al motor a traves de `servicio.py`.
"""

from typing import Dict, List

from ..catalogo.enums import Densidad, FormaRostro, Grosor, Textura


def _opciones(enum_cls, usar_value: bool) -> List[Dict[str, str]]:
    opciones = []
    for miembro in enum_cls:
        valor = miembro.value if usar_value else miembro.name.lower()
        opciones.append({"valor": str(valor), "etiqueta": str(valor).capitalize()})
    return opciones


def listar_opciones() -> Dict[str, List[Dict[str, str]]]:
    """Devuelve, en el orden ya definido por cada enum, las opciones
    validas para forma_rostro, textura, densidad y grosor."""
    return {
        "forma_rostro": _opciones(FormaRostro, usar_value=True),
        "textura": _opciones(Textura, usar_value=True),
        "densidad": _opciones(Densidad, usar_value=False),
        "grosor": _opciones(Grosor, usar_value=False),
    }
