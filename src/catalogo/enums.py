"""Enumeraciones cerradas del modelo de datos congelado.

Ningún valor fuera de estas listas es válido. Este archivo es
puramente de datos/tipos: no contiene ninguna regla de negocio.
"""

from enum import Enum, IntEnum


class Textura(Enum):
    LISO = "liso"
    ONDULADO = "ondulado"
    RIZADO = "rizado"
    AFRO = "afro"


class Densidad(IntEnum):
    """Orden ascendente: BAJA < MEDIA < ALTA."""
    BAJA = 1
    MEDIA = 2
    ALTA = 3


class Grosor(IntEnum):
    """Orden ascendente: FINO < MEDIO < GRUESO."""
    FINO = 1
    MEDIO = 2
    GRUESO = 3


class Volumen(IntEnum):
    """Orden ascendente: NINGUNO < BAJO < MEDIO < ALTO."""
    NINGUNO = 0
    BAJO = 1
    MEDIO = 2
    ALTO = 3


class EfectoLargo(Enum):
    ALARGA = "alarga"
    NEUTRO = "neutro"
    ACORTA = "acorta"


class Eje(IntEnum):
    """Escala bidireccional angulosidad <-> suavidad."""
    MUY_ANGULAR = 1
    ANGULAR = 2
    NEUTRO = 3
    SUAVE = 4
    MUY_SUAVE = 5


class Mantenimiento(IntEnum):
    """Orden ascendente: BAJO < MEDIO < ALTO."""
    BAJO = 1
    MEDIO = 2
    ALTO = 3


class ModoEvaluacion(Enum):
    POR_ZONA = "por_zona"
    POR_EJE = "por_eje"
    POR_EQUILIBRIO = "por_equilibrio"


class ObjetivoZona(Enum):
    SUMAR = "sumar"
    REDUCIR = "reducir"
    SIN_OBJETIVO = "sin_objetivo"


class Zona(Enum):
    ARRIBA = "arriba"
    LATERAL = "lateral"
    POSTERIOR = "posterior"


class FormaRostro(Enum):
    OVALADO = "ovalado"
    REDONDO = "redondo"
    CUADRADO = "cuadrado"
    ALARGADO = "alargado"
    TRIANGULAR = "triangular"
    CORAZON = "corazon"


class TagVisagismo(Enum):
    SUMAR_ARRIBA = "sumar_arriba"
    REDUCIR_ARRIBA = "reducir_arriba"
    SUMAR_LATERAL = "sumar_lateral"
    REDUCIR_LATERAL = "reducir_lateral"
    SUMAR_POSTERIOR = "sumar_posterior"
    ANGULOSIDAD = "angulosidad"
    SUAVIDAD = "suavidad"
    EQUILIBRIO = "equilibrio"


class Etiqueta(Enum):
    SOLIDO = "solido"
    ACEPTABLE = "aceptable"
    DEBIL = "debil"
