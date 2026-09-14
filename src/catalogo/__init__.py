"""Base de conocimiento congelada (grupo A: datos).

No contiene ninguna regla de negocio -- solo declara que es cada
rostro, cada corte, y como se relacionan entre si. La logica de
evaluacion vive en `src.motor`.
"""

from . import enums, rostros, mecanismos, cortes, compatibilidad, excepciones

__all__ = ["enums", "rostros", "mecanismos", "cortes", "compatibilidad", "excepciones"]
