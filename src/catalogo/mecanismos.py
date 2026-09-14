"""Entidad Mecanismo: el principio tecnico por el cual un corte logra
su efecto de visagismo. Independiente de la entidad Corte (1:1 en el
estado actual del catalogo, pero el modelo permite que varios cortes
compartan mecanismo en el futuro).
"""

from dataclasses import dataclass
from typing import List

from .enums import TagVisagismo, Zona


@dataclass(frozen=True)
class Mecanismo:
    id: int
    nombre: str
    principio_tecnico: str
    efectos: List[TagVisagismo]
    zonas: List[Zona]


MECANISMOS: List[Mecanismo] = [
    Mecanismo(1, "Contraste de alturas (degradado)",
              "Degradado a piel + volumen arriba: el efecto nace del contraste, no de la cantidad de cabello.",
              [TagVisagismo.SUMAR_ARRIBA], [Zona.ARRIBA]),
    Mecanismo(2, "Contraste extremo por desconexion",
              "Cambio abrupto de longitud (desconexion) entre lados y volumen libre arriba.",
              [TagVisagismo.SUMAR_ARRIBA, TagVisagismo.ANGULOSIDAD], [Zona.ARRIBA]),
    Mecanismo(3, "Capas internas con movimiento",
              "Capas que rompen lineas rectas y aportan cuerpo lateral.",
              [TagVisagismo.SUAVIDAD, TagVisagismo.SUMAR_LATERAL], [Zona.LATERAL]),
    Mecanismo(4, "Desvio de atencion frontal",
              "Volumen frontal definido (flequillo corto) que desvia la atencion de la mandibula.",
              [TagVisagismo.SUAVIDAD], [Zona.ARRIBA]),
    Mecanismo(5, "Ausencia deliberada de direccion",
              "Longitud pareja sin ningun punto de volumen dirigido.",
              [TagVisagismo.EQUILIBRIO], []),
    Mecanismo(6, "Capas con movimiento natural, peso posterior",
              "Capas que concentran cuerpo en nuca y mandibula mediante movimiento de textura.",
              [TagVisagismo.SUMAR_POSTERIOR, TagVisagismo.SUMAR_LATERAL], [Zona.POSTERIOR, Zona.LATERAL]),
    Mecanismo(7, "Linea recta impuesta (raya)",
              "Raya marcada que exige que el cabello caiga plano.",
              [TagVisagismo.REDUCIR_LATERAL, TagVisagismo.REDUCIR_ARRIBA], [Zona.LATERAL, Zona.ARRIBA]),
    Mecanismo(8, "Control por largo + contorno (bajo)",
              "Afro corto y uniforme con contorno preciso; el volumen arriba se mantiene bajo por diseno.",
              [TagVisagismo.REDUCIR_ARRIBA, TagVisagismo.SUAVIDAD], [Zona.ARRIBA]),
    Mecanismo(9, "Control por largo + contorno (alto)",
              "Mismo principio que el mecanismo 8, invertido: mas largo arriba con contorno recto.",
              [TagVisagismo.SUMAR_ARRIBA], [Zona.ARRIBA]),
    Mecanismo(10, "Definicion de rizo + contorno",
              "Equivalente al control por largo+contorno del afro, para rizo suelto.",
              [TagVisagismo.SUAVIDAD], [Zona.ARRIBA]),
    Mecanismo(11, "Caida lateral dirigida del flequillo",
              "Flequillo largo dividido al centro con barrido hacia ambos lados.",
              [TagVisagismo.SUAVIDAD, TagVisagismo.SUMAR_LATERAL], [Zona.LATERAL]),
    Mecanismo(12, "Peso natural concentrado (sin degradado marcado)",
              "Volumen arriba logrado por cuerpo natural, sin depender de una linea de contraste.",
              [TagVisagismo.SUMAR_ARRIBA], [Zona.ARRIBA]),
    Mecanismo(13, "Corte recto sin capas (blunt)",
              "Concentra peso visual por geometria de corte, no por movimiento de textura.",
              [TagVisagismo.SUMAR_POSTERIOR, TagVisagismo.SUMAR_LATERAL], [Zona.POSTERIOR, Zona.LATERAL]),
    Mecanismo(14, "Largo diferenciado por zona",
              "Corto arriba, deliberadamente mas largo en nuca y patillas.",
              [TagVisagismo.REDUCIR_ARRIBA, TagVisagismo.SUMAR_LATERAL, TagVisagismo.SUMAR_POSTERIOR],
              [Zona.ARRIBA, Zona.LATERAL, Zona.POSTERIOR]),
    Mecanismo(15, "Control por forma/silueta ensanchada",
              "Ensancha mediante el corte de una longitud pareja y corta, no mediante largo suelto.",
              [TagVisagismo.SUMAR_LATERAL, TagVisagismo.REDUCIR_ARRIBA], [Zona.LATERAL, Zona.ARRIBA]),
]

MECANISMOS_POR_ID = {m.id: m for m in MECANISMOS}
