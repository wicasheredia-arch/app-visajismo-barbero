"""Interfaz minima y portable para probar la capa de entrada/salida
desde la terminal -- NO es la interfaz visual final de la app, solo
el medio mas simple y sin dependencias para ejercitar el flujo
entrada -> motor -> salida antes de construir una interfaz completa.

Uso:
    python3 main.py --rostro redondo --textura afro --densidad baja --grosor fino
"""

import argparse
import sys

from .servicio import generar_recomendacion
from .validacion import DiagnosticoInvalido


def _construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Genera recomendaciones de corte a partir del diagnostico de un cliente.",
    )
    parser.add_argument("--rostro", required=True,
                         help="ovalado | redondo | cuadrado | alargado | triangular | corazon")
    parser.add_argument("--textura", required=True,
                         help="liso | ondulado | rizado | afro")
    parser.add_argument("--densidad", required=True,
                         help="baja | media | alta")
    parser.add_argument("--grosor", required=True,
                         help="fino | medio | grueso")
    return parser


def _imprimir_resultado(resultado: dict) -> None:
    if resultado["mensaje_vacio"] is not None:
        print(resultado["mensaje_vacio"])
        return

    for posicion, rec in enumerate(resultado["recomendaciones"], start=1):
        print(f"{posicion}. {rec['nombre']} [{rec['etiqueta'].upper()}]")
        print(f"   Familia: {rec['familia']}")
        print(f"   Efectos de visagismo: {', '.join(rec['efectos_visagismo'])}")
        print(f"   Mecanismo: {rec['mecanismo']}")
        if rec["nota_tecnica_textura"]:
            print(f"   Nota tecnica para esta textura: {rec['nota_tecnica_textura']}")
        print(f"   Mantenimiento: {rec['mantenimiento']}")
        for advertencia in rec["advertencias"]:
            print(f"   - {advertencia}")
        print()


def main(argv=None) -> int:
    parser = _construir_parser()
    args = parser.parse_args(argv)

    try:
        resultado = generar_recomendacion(args.rostro, args.textura, args.densidad, args.grosor)
    except DiagnosticoInvalido as error:
        print(f"Error de entrada: {error}", file=sys.stderr)
        return 1

    _imprimir_resultado(resultado)
    return 0


if __name__ == "__main__":
    sys.exit(main())
