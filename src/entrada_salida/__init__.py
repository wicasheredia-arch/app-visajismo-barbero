"""Capa de entrada/salida: unico punto de contacto entre el mundo
exterior (terminal hoy, una interfaz visual en el futuro) y el motor.
No contiene reglas de negocio ni datos del catalogo.
"""

from .opciones import listar_opciones
from .servicio import construir_diagnostico, generar_recomendacion, serializar_resultado
from .validacion import DiagnosticoInvalido

__all__ = [
    "construir_diagnostico",
    "generar_recomendacion",
    "serializar_resultado",
    "listar_opciones",
    "DiagnosticoInvalido",
]
