"""Interfaz web minima sobre la capa de entrada/salida existente.
No contiene ninguna regla de negocio ni acceso directo al motor o al
catalogo -- ver `servidor.py`.
"""

from .servidor import crear_servidor, iniciar_servidor

__all__ = ["crear_servidor", "iniciar_servidor"]
