#!/usr/bin/env python3
"""Genera docs/index.html: UNA sola pagina HTML con el CSS y los 4
archivos JS (catalogo_datos.js, motor.js, entrada_salida.js, app.js)
insertados directamente inline, a partir de web_estatico/.

Esto NO es un build tool en el sentido de webpack/babel/etc. -- no
transpila, no minifica, no reescribe nada. Solo concatena texto: lee
web_estatico/index.html y sustituye cada <link>/<script src="..."> por
su contenido real entre <style>/<script>. El resultado es un archivo
unico, sin ninguna referencia externa, que:

  - se puede abrir haciendo doble clic (file://), sin servidor;
  - se puede publicar en cualquier hosting estatico (GitHub Pages,
    Netlify, etc.) subiendo un solo archivo;
  - se puede publicar como un Artifact autocontenido.

Ejecutar despues de cualquier cambio en web_estatico/:
    python3 scripts/generar_pagina_autocontenida.py
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "web_estatico"
DESTINO = RAIZ / "docs" / "index.html"

PATRON_CSS = re.compile(r'<link rel="stylesheet" href="([^"]+)">')
PATRON_JS = re.compile(r'<script src="([^"]+)"></script>')


def inlinear(html: str) -> str:
    def reemplazar_css(coincidencia: "re.Match[str]") -> str:
        ruta = ORIGEN / coincidencia.group(1)
        return f"<style>\n{ruta.read_text(encoding='utf-8')}\n</style>"

    def reemplazar_js(coincidencia: "re.Match[str]") -> str:
        ruta = ORIGEN / coincidencia.group(1)
        return f"<script>\n{ruta.read_text(encoding='utf-8')}\n</script>"

    html = PATRON_CSS.sub(reemplazar_css, html)
    html = PATRON_JS.sub(reemplazar_js, html)
    return html


def main() -> None:
    plantilla = (ORIGEN / "index.html").read_text(encoding="utf-8")
    pagina_final = inlinear(plantilla)

    # Verificacion minima de que no quedo ninguna referencia externa.
    if "<link" in pagina_final or 'src="js/' in pagina_final:
        print("ERROR: quedaron referencias externas sin inlinear.", file=sys.stderr)
        sys.exit(1)

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(pagina_final, encoding="utf-8")
    print(f"Generado: {DESTINO} ({len(pagina_final)} bytes, autocontenido)")


if __name__ == "__main__":
    main()
