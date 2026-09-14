"""Funcion de auditoria de cobertura del catalogo (rostro x textura).

Deliberadamente SEPARADA del flujo de recomendacion por cliente: no
recibe ni usa densidad/grosor (esos nunca son gates, asi que no
determinan si una combinacion rostro x textura "tiene candidatos").
No es una funcionalidad nueva: es la misma auditoria ya definida en la
fase de diseno del catalogo, ahora expresada como funcion pura sobre
los mismos datos y las mismas reglas de gate que usa el motor.
"""

from typing import Dict, List, Tuple

from ..catalogo.cortes import CORTES
from ..catalogo.enums import FormaRostro, Textura
from .motor import evaluar_rostro, evaluar_textura

Combinacion = Tuple[FormaRostro, Textura]


def auditar_cobertura() -> Dict[Combinacion, List[int]]:
    """Para cada una de las 24 combinaciones rostro x textura, devuelve
    la lista de ids de corte que pasan AMBOS gates (rostro!=0, textura!=0).
    """
    resultado: Dict[Combinacion, List[int]] = {}
    for forma in FormaRostro:
        for textura in Textura:
            candidatos_id = []
            for corte in CORTES:
                if evaluar_rostro(corte, forma) == 0:
                    continue
                if evaluar_textura(corte, textura) == 0:
                    continue
                candidatos_id.append(corte.id)
            resultado[(forma, textura)] = candidatos_id
    return resultado


def combinaciones_sin_cobertura(auditoria: Dict[Combinacion, List[int]]) -> List[Combinacion]:
    """Combinaciones rostro x textura donde ningun corte pasa los gates."""
    return [combinacion for combinacion, ids in auditoria.items() if not ids]


def combinaciones_con_un_solo_candidato(auditoria: Dict[Combinacion, List[int]]) -> List[Combinacion]:
    """Combinaciones donde solo existe un mecanismo disponible."""
    return [combinacion for combinacion, ids in auditoria.items() if len(ids) == 1]
