"""Entidad CompatibilidadCorteTextura: exactamente 60 registros
(15 cortes x 4 texturas). Valor curado a mano (0/1/2), nunca
calculado por distancia -- la textura es un lookup directo.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple

from .enums import Textura


@dataclass(frozen=True)
class CompatibilidadCorteTextura:
    corte_id: int
    textura: Textura
    valor: int  # 0, 1 o 2
    justificacion: str


# (liso, ondulado, rizado, afro) -- en ese orden fijo, con su justificacion.
_TABLA: Dict[int, Tuple[Tuple[int, str], Tuple[int, str], Tuple[int, str], Tuple[int, str]]] = {
    1: ((2, "El contraste de degradado funciona igual de bien sin ayuda de la textura."),
        (2, "La ondulacion refuerza el volumen arriba sin esfuerzo adicional."),
        (1, "El volumen arriba ya lo aporta la textura natural; el degradado acompana, no es el mecanismo decisivo."),
        (1, "Mismo principio que en rizado: el degradado deja de ser el factor decisivo.")),
    2: ((2, "El contraste por desconexion es su mecanismo nativo en cabello sin movimiento propio."),
        (2, "La ondulacion sostiene bien el volumen libre sin perder la linea de desconexion."),
        (1, "El rizo suaviza la desconexion, pero el principio de contraste sigue funcionando."),
        (1, "Se reinterpreta como 'high top' con contorno recto en vez de linea de desconexion clasica.")),
    3: ((1, "Sin movimiento propio, necesita producto para sostener el efecto de las capas."),
        (2, "Es el mecanismo ideal para esta textura: aprovecha el movimiento natural."),
        (2, "El rizo natural refuerza el movimiento lateral que buscan las capas."),
        (0, "Las capas internas no son ejecutables sin alterar la textura afro.")),
    4: ((2, "El flequillo cae con el cuerpo esperado sin ayuda de la textura."),
        (2, "La ondulacion no interfiere con la caida del flequillo."),
        (1, "El flequillo cambia su caida natural; requiere ajuste de definicion."),
        (0, "El mecanismo de caida sobre la frente no aplica sin alisar.")),
    5: ((2, "Ausencia de direccion: funciona igual en cualquier textura."),
        (2, "Ausencia de direccion: funciona igual en cualquier textura."),
        (2, "Ausencia de direccion: funciona igual en cualquier textura."),
        (2, "Ausencia de direccion: funciona igual en cualquier textura.")),
    6: ((1, "Sin movimiento propio, necesita producto para no verse plano."),
        (2, "Es el mecanismo ideal: el movimiento natural sostiene el peso posterior."),
        (2, "El rizo aporta cuerpo adicional al peso posterior buscado."),
        (0, "Las capas con movimiento no son ejecutables sin alterar la textura afro.")),
    7: ((2, "La raya perfectamente plana es su mecanismo nativo en liso."),
        (1, "Requiere fijador para mantener la linea plana."),
        (0, "La raya perfectamente plana no es ejecutable sin alisar."),
        (0, "La raya perfectamente plana no es ejecutable sin alisar.")),
    8: ((0, "El mecanismo de largo+contorno no aplica a liso, que no proyecta volumen propio en ese formato."),
        (0, "El mecanismo de largo+contorno no aplica a ondulado de la misma forma que a rizo cerrado o afro."),
        (1, "Aplica parcialmente en rizo muy cerrado (3c/4a)."),
        (2, "Es el mecanismo nativo de la textura afro.")),
    9: ((0, "El mismo motivo que el corte 8: el mecanismo es nativo de afro/rizo cerrado."),
        (0, "El mismo motivo que el corte 8."),
        (1, "Aplica parcialmente en rizo muy cerrado."),
        (2, "Es el mecanismo nativo de la textura afro.")),
    10: ((0, "La definicion de rizo no tiene equivalente en cabello liso."),
         (1, "Aplica con ajuste: la ondulacion no define tan marcadamente como el rizo."),
         (2, "Es el mecanismo nativo de esta textura."),
         (1, "Aplica parcialmente: el rizo cerrado del afro admite el mismo principio con ajuste.")),
    11: ((2, "La caida lateral tipo cortina es su mecanismo nativo en liso."),
         (2, "La ondulacion no interfiere con la caida lateral."),
         (1, "La caida natural cambia, requiere mas control."),
         (0, "El mecanismo de caida lateral dirigida no aplica sin alisar.")),
    12: ((2, "El peso natural concentrado funciona igual de bien sin ayuda de la textura."),
         (2, "La ondulacion refuerza el peso natural concentrado arriba."),
         (2, "El rizo aporta el cuerpo necesario sin depender de degradado marcado."),
         (1, "El afro aporta cuerpo, pero el mecanismo de 'peso concentrado sin degradado' no es su forma nativa.")),
    13: ((2, "El corte recto (blunt) es su mecanismo nativo en cabello sin rizo."),
         (2, "La ondulacion no interfiere con la geometria del corte recto."),
         (1, "El rizo dificulta mantener la linea recta perfecta, pero el peso concentrado sigue logrando el efecto."),
         (0, "El corte recto sin capas no es ejecutable sin alterar la textura afro.")),
    14: ((0, "El control por largo diferenciado por zona no tiene equivalente en liso."),
         (0, "El control por largo diferenciado por zona no tiene equivalente en ondulado."),
         (2, "Es un mecanismo nativo de esta textura."),
         (2, "Es el mecanismo nativo de esta textura.")),
    15: ((0, "El control por forma/silueta no tiene equivalente en liso."),
         (0, "El control por forma/silueta no tiene equivalente en ondulado."),
         (1, "Aplica parcialmente en rizo con buen volumen natural."),
         (2, "Es el mecanismo nativo de esta textura.")),
}

_ORDEN_TEXTURA = (Textura.LISO, Textura.ONDULADO, Textura.RIZADO, Textura.AFRO)

COMPATIBILIDADES: List[CompatibilidadCorteTextura] = [
    CompatibilidadCorteTextura(corte_id, textura, valor, justificacion)
    for corte_id, filas in _TABLA.items()
    for textura, (valor, justificacion) in zip(_ORDEN_TEXTURA, filas)
]

assert len(COMPATIBILIDADES) == 60, "Deben existir exactamente 60 relaciones corte x textura"

COMPATIBILIDAD_POR_CORTE_Y_TEXTURA: Dict[Tuple[int, Textura], CompatibilidadCorteTextura] = {
    (c.corte_id, c.textura): c for c in COMPATIBILIDADES
}
