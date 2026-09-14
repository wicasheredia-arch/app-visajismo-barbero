"""Definición de las 6 formas de rostro y su objetivo de visagismo.

Dato de conocimiento puro (grupo A). No contiene la LOGICA de cómo
evaluar un corte contra un rostro -- eso vive en motor/motor.py
(grupo B, reglas). Aquí solo se declara QUE quiere cada rostro.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional

from .enums import FormaRostro, ModoEvaluacion, ObjetivoZona, Zona, Eje


@dataclass(frozen=True)
class DefinicionRostro:
    forma: FormaRostro
    modo: ModoEvaluacion
    objetivos_zona: Dict[Zona, ObjetivoZona] = field(default_factory=dict)
    objetivo_eje_minimo: Optional[Eje] = None


# Umbral mínimo en el eje para considerar "cumple" en modo por_eje.
# Cuadrado persigue SUAVIDAD: a partir de SUAVE se considera pleno.
_EJE_OBJETIVO_CUADRADO = Eje.SUAVE

ROSTROS: Dict[FormaRostro, DefinicionRostro] = {
    FormaRostro.OVALADO: DefinicionRostro(
        forma=FormaRostro.OVALADO,
        modo=ModoEvaluacion.POR_EQUILIBRIO,
    ),
    FormaRostro.REDONDO: DefinicionRostro(
        forma=FormaRostro.REDONDO,
        modo=ModoEvaluacion.POR_ZONA,
        objetivos_zona={
            Zona.ARRIBA: ObjetivoZona.SUMAR,
            Zona.LATERAL: ObjetivoZona.REDUCIR,
            Zona.POSTERIOR: ObjetivoZona.SIN_OBJETIVO,
        },
    ),
    FormaRostro.CUADRADO: DefinicionRostro(
        forma=FormaRostro.CUADRADO,
        modo=ModoEvaluacion.POR_EJE,
        objetivo_eje_minimo=_EJE_OBJETIVO_CUADRADO,
    ),
    FormaRostro.ALARGADO: DefinicionRostro(
        forma=FormaRostro.ALARGADO,
        modo=ModoEvaluacion.POR_ZONA,
        objetivos_zona={
            Zona.ARRIBA: ObjetivoZona.REDUCIR,
            Zona.LATERAL: ObjetivoZona.SUMAR,
            Zona.POSTERIOR: ObjetivoZona.SIN_OBJETIVO,
        },
    ),
    FormaRostro.TRIANGULAR: DefinicionRostro(
        forma=FormaRostro.TRIANGULAR,
        modo=ModoEvaluacion.POR_ZONA,
        objetivos_zona={
            Zona.ARRIBA: ObjetivoZona.SUMAR,
            Zona.LATERAL: ObjetivoZona.REDUCIR,
            Zona.POSTERIOR: ObjetivoZona.SIN_OBJETIVO,
        },
    ),
    FormaRostro.CORAZON: DefinicionRostro(
        forma=FormaRostro.CORAZON,
        modo=ModoEvaluacion.POR_ZONA,
        objetivos_zona={
            Zona.ARRIBA: ObjetivoZona.REDUCIR,
            Zona.LATERAL: ObjetivoZona.SUMAR,
            Zona.POSTERIOR: ObjetivoZona.SUMAR,
        },
    ),
}
