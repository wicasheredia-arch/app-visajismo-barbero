"""Diagnostico del cliente (grupo C: dato de consulta).

Independiente del catalogo: no referencia ningun corte, y el
catalogo no lo referencia a el. Solo se cruzan dentro del motor.

Deliberadamente NO contiene: nombre, telefono, historial, citas,
preferencias, medidas, direccion ni ningun dato personal. Solo los
4 campos que la especificacion aprobada definio como necesarios.
"""

from dataclasses import dataclass

from .catalogo.enums import FormaRostro, Textura, Densidad, Grosor


@dataclass(frozen=True)
class DiagnosticoCliente:
    forma_rostro: FormaRostro
    textura: Textura
    densidad: Densidad
    grosor: Grosor
