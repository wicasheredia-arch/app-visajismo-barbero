#!/usr/bin/env python3
"""Arranca la interfaz visual minima en el navegador, sobre el motor
y la capa de entrada/salida ya existentes (sin modificarlos).

    python3 web.py
    python3 web.py --puerto 8080
    python3 web.py --sin-navegador
"""

import argparse
import sys
import webbrowser

from src.interfaz_web import iniciar_servidor


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Interfaz web del recomendador de cortes.")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--puerto", type=int, default=8000)
    parser.add_argument("--sin-navegador", action="store_true",
                         help="No abrir el navegador automaticamente al iniciar.")
    args = parser.parse_args(argv)

    url = f"http://{args.host}:{args.puerto}/"
    print(f"Interfaz disponible en {url} (Ctrl+C para detener)")
    if not args.sin_navegador:
        webbrowser.open(url)

    iniciar_servidor(args.host, args.puerto)
    return 0


if __name__ == "__main__":
    sys.exit(main())
