#!/usr/bin/env python3
"""Punto de entrada minimo para probar la capa de entrada/salida desde
la terminal. Ver `src/entrada_salida/cli.py` para el detalle.

    python3 main.py --rostro redondo --textura afro --densidad baja --grosor fino
"""

import sys

from src.entrada_salida.cli import main

if __name__ == "__main__":
    sys.exit(main())
