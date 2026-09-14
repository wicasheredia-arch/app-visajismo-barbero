"""Entidad Corte: los 15 cortes-base del catalogo, congelados.

Cada campo corresponde exactamente a los atributos aprobados en la
fase de modelo de datos, con la nomenclatura final:
`densidad_referencia` / `grosor_referencia` (ya no "minima requerida"),
porque estos valores nunca actuan como gate -- son un punto de
comparacion para la regla de deficit unilateral del motor.

NO SE MODIFICA NINGUN VALOR EN ESTE ARCHIVO. Si se detecta la
necesidad de un cambio, debe discutirse como una nueva decision de
catalogo, no editarse aqui silenciosamente.
"""

from dataclasses import dataclass
from typing import List

from .enums import Volumen, EfectoLargo, Eje, Densidad, Grosor, Mantenimiento


@dataclass(frozen=True)
class Corte:
    id: int
    nombre: str
    familia: str
    descripcion: str
    volumen_arriba: Volumen
    volumen_lateral: Volumen
    volumen_posterior: Volumen
    efecto_largo: EfectoLargo
    eje: Eje
    densidad_referencia: Densidad
    grosor_referencia: Grosor
    mantenimiento: Mantenimiento
    mecanismo_id: int


CORTES: List[Corte] = [
    Corte(1, "Degradado alto con volumen superior por contraste", "Degradados",
          "Fade marcado que crea contraste entre los lados rapados y un volumen concentrado arriba, texturizado.",
          Volumen.ALTO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.ALARGA, Eje.ANGULAR,
          Densidad.MEDIA, Grosor.MEDIO, Mantenimiento.MEDIO, 1),

    Corte(2, "Undercut con desconexion marcada", "Undercuts",
          "Corte muy corto en los lados con un cambio abrupto hacia un volumen libre y largo arriba.",
          Volumen.ALTO, Volumen.NINGUNO, Volumen.BAJO, EfectoLargo.ALARGA, Eje.MUY_ANGULAR,
          Densidad.ALTA, Grosor.MEDIO, Mantenimiento.ALTO, 2),

    Corte(3, "Corte texturizado en capas medias con movimiento lateral", "Capas con movimiento",
          "Largo medio con capas internas que generan movimiento y anchura suave a los lados.",
          Volumen.MEDIO, Volumen.MEDIO, Volumen.BAJO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.MEDIA, Grosor.MEDIO, Mantenimiento.BAJO, 3),

    Corte(4, "Crop frances con flequillo texturizado", "Crops",
          "Corte corto con flequillo texturizado corto que cae sobre la frente.",
          Volumen.MEDIO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.ALTA, Grosor.MEDIO, Mantenimiento.MEDIO, 4),

    Corte(5, "Corte corto uniforme (buzz/crew)", "Uniformes",
          "Longitud pareja y corta en toda la cabeza, sin puntos de volumen dirigido.",
          Volumen.NINGUNO, Volumen.NINGUNO, Volumen.NINGUNO, EfectoLargo.NEUTRO, Eje.NEUTRO,
          Densidad.BAJA, Grosor.FINO, Mantenimiento.BAJO, 5),

    Corte(6, "Corte largo con capas y volumen hacia atras/lados bajos", "Capas largas con peso posterior",
          "Largo medio-alto con capas que concentran cuerpo en nuca y a la altura de la mandibula.",
          Volumen.BAJO, Volumen.MEDIO, Volumen.ALTO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.ALTA, Grosor.GRUESO, Mantenimiento.MEDIO, 6),

    Corte(7, "Corte corto con raya lateral definida", "Uniformes/clasicos",
          "Corte corto peinado con raya recta y marcada, sin volumen anadido.",
          Volumen.BAJO, Volumen.NINGUNO, Volumen.NINGUNO, EfectoLargo.NEUTRO, Eje.NEUTRO,
          Densidad.MEDIA, Grosor.MEDIO, Mantenimiento.MEDIO, 7),

    Corte(8, "Afro moldeado con contorno definido y largo controlado (bajo)", "Afro moldeado",
          "Afro corto, uniforme, con contorno preciso; el volumen arriba se mantiene bajo por diseno.",
          Volumen.BAJO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.NEUTRO, Eje.SUAVE,
          Densidad.BAJA, Grosor.FINO, Mantenimiento.MEDIO, 8),

    Corte(9, "Afro moldeado con mayor largo superior (high top)", "Afro moldeado",
          "Variante del corte 8 dejando bastante mas largo arriba, con contorno recto y marcado en los lados.",
          Volumen.ALTO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.ALARGA, Eje.ANGULAR,
          Densidad.ALTA, Grosor.MEDIO, Mantenimiento.ALTO, 9),

    Corte(10, "Corte corto de rizos definidos con contorno (curly shape-up)", "Rizos definidos",
          "Equivalente del corte 8 para rizo suelto: rizos cortos definidos con contorno preciso.",
          Volumen.MEDIO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.NEUTRO, Eje.SUAVE,
          Densidad.BAJA, Grosor.FINO, Mantenimiento.MEDIO, 10),

    Corte(11, "Corte con flequillo largo tipo cortina", "Flequillos",
          "Flequillo largo dividido al centro, con caida lateral hacia ambos lados.",
          Volumen.MEDIO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.MEDIA, Grosor.MEDIO, Mantenimiento.MEDIO, 11),

    Corte(12, "Corte texturizado corto con volumen concentrado en coronilla", "Degradados",
          "Similar al corte 1 en efecto, sin degradado marcado: el volumen arriba nace del peso natural.",
          Volumen.ALTO, Volumen.BAJO, Volumen.BAJO, EfectoLargo.ALARGA, Eje.ANGULAR,
          Densidad.ALTA, Grosor.MEDIO, Mantenimiento.MEDIO, 12),

    Corte(13, "Corte largo con corte recto (blunt) y peso concentrado en las puntas", "Capas largas con peso posterior",
          "Largo medio-alto cortado recto (sin capas), concentrando el peso visual en las puntas.",
          Volumen.BAJO, Volumen.MEDIO, Volumen.ALTO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.ALTA, Grosor.MEDIO, Mantenimiento.BAJO, 13),

    Corte(14, "Afro/rizado con mayor largo en nuca y patillas (peso bajo)", "Afro con silueta ampliada",
          "Variante de afro/rizo cerrado que deja mas largo en nuca y patillas, con la coronilla corta.",
          Volumen.BAJO, Volumen.MEDIO, Volumen.ALTO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.BAJA, Grosor.FINO, Mantenimiento.MEDIO, 14),

    Corte(15, "Afro con silueta ensanchada en los lados y corona controlada", "Afro con silueta ampliada",
          "Anchura deliberada a la altura de patillas/mandibula, coronilla corta y controlada.",
          Volumen.BAJO, Volumen.ALTO, Volumen.MEDIO, EfectoLargo.ACORTA, Eje.SUAVE,
          Densidad.BAJA, Grosor.FINO, Mantenimiento.MEDIO, 15),
]

CORTES_POR_ID = {c.id: c for c in CORTES}

assert len(CORTES) == 15, "El catalogo debe tener exactamente 15 cortes-base"
