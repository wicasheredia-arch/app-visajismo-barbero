#!/usr/bin/env python3
"""Genera docs/index.html: UNA sola pagina HTML con el CSS, los
archivos JS (catalogo_datos.js, motor.js, entrada_salida.js, app.js)
y la imagen de bienvenida insertados directamente inline, a partir de
web_estatico/.

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

import base64
import mimetypes
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "web_estatico"
# Se escribe en dos destinos identicos a proposito: GitHub Pages puede
# estar configurado con origen "main / (root)" o "main / docs" segun
# como haya quedado el ajuste en Settings > Pages de cada quien -- en
# vez de depender de que ese ajuste este correcto, la app funciona
# igual sirviendola desde cualquiera de los dos.
DESTINOS = [RAIZ / "docs" / "index.html", RAIZ / "index.html"]

PATRON_CSS = re.compile(r'<link rel="stylesheet" href="([^"]+)">')
PATRON_JS = re.compile(r'<script src="([^"]+)"></script>')
PATRON_IMG = re.compile(r'(<img\b[^>]*\bsrc=")(img/[^"]+)(")')


def inlinear(html: str) -> str:
    def reemplazar_css(coincidencia: "re.Match[str]") -> str:
        ruta = ORIGEN / coincidencia.group(1)
        return f"<style>\n{ruta.read_text(encoding='utf-8')}\n</style>"

    def reemplazar_js(coincidencia: "re.Match[str]") -> str:
        ruta = ORIGEN / coincidencia.group(1)
        return f"<script>\n{ruta.read_text(encoding='utf-8')}\n</script>"

    def reemplazar_img(coincidencia: "re.Match[str]") -> str:
        ruta = ORIGEN / coincidencia.group(2)
        tipo_mime = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
        datos_b64 = base64.b64encode(ruta.read_bytes()).decode("ascii")
        return f"{coincidencia.group(1)}data:{tipo_mime};base64,{datos_b64}{coincidencia.group(3)}"

    html = PATRON_CSS.sub(reemplazar_css, html)
    html = PATRON_JS.sub(reemplazar_js, html)
    html = PATRON_IMG.sub(reemplazar_img, html)
    return html


def main() -> None:
    plantilla = (ORIGEN / "index.html").read_text(encoding="utf-8")
    pagina_final = inlinear(plantilla)

    # Verificacion minima de que no quedo ninguna referencia externa.
    if "<link" in pagina_final or 'src="js/' in pagina_final or 'src="img/' in pagina_final:
        print("ERROR: quedaron referencias externas sin inlinear.", file=sys.stderr)
        sys.exit(1)

    for destino in DESTINOS:
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(pagina_final, encoding="utf-8")
        print(f"Generado: {destino} ({len(pagina_final)} bytes, autocontenido)")


if __name__ == "__main__":
    main()
