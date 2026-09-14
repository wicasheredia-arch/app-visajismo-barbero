"""Validacion de los 4 valores de entrada del diagnostico contra los
enums cerrados del catalogo. No contiene ninguna regla de negocio --
solo confirma que lo que llega desde fuera es uno de los valores
permitidos, y traduce texto libre a los tipos que el motor espera.
"""

from typing import Dict, Type

from ..catalogo.enums import Densidad, FormaRostro, Grosor, Textura


class DiagnosticoInvalido(ValueError):
    """Se lanza cuando un valor de entrada no pertenece al enum permitido
    o falta un campo obligatorio. El mensaje es siempre explicito:
    nombra el campo, el valor recibido y los valores permitidos."""


def _normalizar(texto: str) -> str:
    return texto.strip().lower()


def _construir_mapa(enum_cls) -> Dict[str, object]:
    mapa: Dict[str, object] = {}
    for miembro in enum_cls:
        mapa[_normalizar(miembro.name)] = miembro
        if isinstance(miembro.value, str):
            mapa[_normalizar(miembro.value)] = miembro
    return mapa


_MAPA_FORMA_ROSTRO = _construir_mapa(FormaRostro)
_MAPA_TEXTURA = _construir_mapa(Textura)
_MAPA_DENSIDAD = _construir_mapa(Densidad)
_MAPA_GROSOR = _construir_mapa(Grosor)


def _valores_permitidos(enum_cls) -> str:
    return ", ".join(m.name.lower() for m in enum_cls)


def _resolver(valor_crudo, mapa: Dict[str, object], nombre_campo: str, enum_cls: Type):
    if valor_crudo is None or (isinstance(valor_crudo, str) and not valor_crudo.strip()):
        raise DiagnosticoInvalido(
            f"Falta el campo obligatorio '{nombre_campo}'. "
            f"Valores permitidos: {_valores_permitidos(enum_cls)}."
        )
    clave = _normalizar(str(valor_crudo))
    if clave not in mapa:
        raise DiagnosticoInvalido(
            f"Valor invalido para '{nombre_campo}': '{valor_crudo}'. "
            f"Valores permitidos: {_valores_permitidos(enum_cls)}."
        )
    return mapa[clave]


def resolver_forma_rostro(valor_crudo) -> FormaRostro:
    return _resolver(valor_crudo, _MAPA_FORMA_ROSTRO, "forma_rostro", FormaRostro)


def resolver_textura(valor_crudo) -> Textura:
    return _resolver(valor_crudo, _MAPA_TEXTURA, "textura", Textura)


def resolver_densidad(valor_crudo) -> Densidad:
    return _resolver(valor_crudo, _MAPA_DENSIDAD, "densidad", Densidad)


def resolver_grosor(valor_crudo) -> Grosor:
    return _resolver(valor_crudo, _MAPA_GROSOR, "grosor", Grosor)
