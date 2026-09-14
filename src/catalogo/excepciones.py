"""Entidad ExcepcionTecnicaPorTextura: notas que solo existen cuando
el mecanismo de un corte se ejecuta de forma distinta en una textura
concreta (regla: se documentan por excepcion, no se duplica el corte).
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple

from .enums import Textura


@dataclass(frozen=True)
class ExcepcionTecnicaPorTextura:
    corte_id: int
    textura: Textura
    texto: str
    afecta_mantenimiento: bool = False


EXCEPCIONES: List[ExcepcionTecnicaPorTextura] = [
    ExcepcionTecnicaPorTextura(1, Textura.RIZADO,
        "El volumen arriba ya lo aporta la textura natural; el degradado acompana, no es el mecanismo decisivo."),
    ExcepcionTecnicaPorTextura(1, Textura.AFRO,
        "Mismo principio que en rizado."),
    ExcepcionTecnicaPorTextura(2, Textura.AFRO,
        "La desconexion clasica se reinterpreta como 'high top' con contorno recto."),
    ExcepcionTecnicaPorTextura(3, Textura.LISO,
        "Necesita producto para sostener el movimiento que la textura no aporta sola."),
    ExcepcionTecnicaPorTextura(4, Textura.RIZADO,
        "El flequillo cambia su caida natural, requiere ajuste de definicion."),
    ExcepcionTecnicaPorTextura(6, Textura.LISO,
        "Necesita producto para no verse plano."),
    ExcepcionTecnicaPorTextura(8, Textura.RIZADO,
        "Aplica parcialmente en rizo muy cerrado (3c/4a)."),
    ExcepcionTecnicaPorTextura(11, Textura.RIZADO,
        "La caida natural cambia, requiere mas control."),
]

assert len(EXCEPCIONES) == 8, "Se esperan exactamente 8 excepciones tecnicas documentadas"

EXCEPCIONES_POR_CORTE_Y_TEXTURA: Dict[Tuple[int, Textura], ExcepcionTecnicaPorTextura] = {
    (e.corte_id, e.textura): e for e in EXCEPCIONES
}
