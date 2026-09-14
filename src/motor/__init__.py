"""Motor de recomendacion (grupo B: reglas) -- ver `motor.py`.

La funcion de auditoria de cobertura vive deliberadamente separada
en `auditoria.py`, tal como exige la especificacion aprobada.
"""

from .motor import (
    Candidato,
    Recomendacion,
    ResultadoRecomendacion,
    MENSAJE_CATALOGO_VACIO,
    evaluar_rostro,
    evaluar_textura,
    evaluar_densidad,
    evaluar_grosor,
    etiquetar,
    evaluar_candidatos,
    ordenar,
    generar_explicacion,
    recomendar,
)
from .auditoria import (
    auditar_cobertura,
    combinaciones_sin_cobertura,
    combinaciones_con_un_solo_candidato,
)

__all__ = [
    "Candidato",
    "Recomendacion",
    "ResultadoRecomendacion",
    "MENSAJE_CATALOGO_VACIO",
    "evaluar_rostro",
    "evaluar_textura",
    "evaluar_densidad",
    "evaluar_grosor",
    "etiquetar",
    "evaluar_candidatos",
    "ordenar",
    "generar_explicacion",
    "recomendar",
    "auditar_cobertura",
    "combinaciones_sin_cobertura",
    "combinaciones_con_un_solo_candidato",
]
