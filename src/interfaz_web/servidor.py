"""Servidor web minimo (solo libreria estandar, sin dependencias) que
sirve la interfaz visual y expone la capa de entrada/salida como una
pequena API JSON.

Capas: interfaz_web -> entrada_salida -> motor/catalogo. Este archivo
NUNCA importa `src.motor` ni `src.catalogo` directamente -- solo pasa
por `src.entrada_salida`, que es el unico punto de contacto acordado
entre el mundo exterior y el motor.
"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Tuple

from ..entrada_salida import DiagnosticoInvalido, generar_recomendacion, listar_opciones

_DIR_ESTATICOS = Path(__file__).resolve().parent / "estaticos"

# Mapa explicito de ruta -> (archivo, content-type). Se evita un
# servidor de archivos generico para no abrir la puerta a path
# traversal: solo se sirven exactamente estos 3 archivos conocidos.
_RUTAS_ESTATICAS = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/estilos.css": ("estilos.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "application/javascript; charset=utf-8"),
}


class ManejadorRecomendador(BaseHTTPRequestHandler):
    server_version = "RecomendadorCortes/1.0"

    def log_message(self, formato, *args):  # noqa: D401 - silenciar log por defecto
        pass  # evita ruido en consola durante uso normal; los errores igual se ven en la respuesta

    # -- helpers -----------------------------------------------------
    def _responder_json(self, codigo: int, cuerpo: dict) -> None:
        datos = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def _servir_estatico(self, nombre_archivo: str, content_type: str) -> None:
        ruta = _DIR_ESTATICOS / nombre_archivo
        try:
            contenido = ruta.read_bytes()
        except FileNotFoundError:
            self._responder_json(404, {"error": "Recurso no encontrado."})
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(contenido)))
        self.end_headers()
        self.wfile.write(contenido)

    # -- rutas ---------------------------------------------------------
    def do_GET(self) -> None:  # noqa: N802 (nombre exigido por BaseHTTPRequestHandler)
        if self.path == "/api/opciones":
            self._responder_json(200, listar_opciones())
            return
        if self.path in _RUTAS_ESTATICAS:
            nombre_archivo, content_type = _RUTAS_ESTATICAS[self.path]
            self._servir_estatico(nombre_archivo, content_type)
            return
        self._responder_json(404, {"error": "Ruta no encontrada."})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/recomendacion":
            self._responder_json(404, {"error": "Ruta no encontrada."})
            return

        longitud = int(self.headers.get("Content-Length", 0) or 0)
        cuerpo_crudo = self.rfile.read(longitud) if longitud else b"{}"
        try:
            datos = json.loads(cuerpo_crudo or b"{}")
        except json.JSONDecodeError:
            self._responder_json(400, {"error": "El cuerpo de la solicitud no es JSON valido."})
            return

        try:
            resultado = generar_recomendacion(
                datos.get("rostro"),
                datos.get("textura"),
                datos.get("densidad"),
                datos.get("grosor"),
            )
        except DiagnosticoInvalido as error:
            self._responder_json(400, {"error": str(error)})
            return

        self._responder_json(200, resultado)


def crear_servidor(host: str = "localhost", puerto: int = 0) -> ThreadingHTTPServer:
    """Crea (sin arrancar) el servidor. `puerto=0` deja que el sistema
    operativo asigne un puerto libre -- util para pruebas automatizadas."""
    return ThreadingHTTPServer((host, puerto), ManejadorRecomendador)


def iniciar_servidor(host: str = "localhost", puerto: int = 8000) -> None:
    """Arranca el servidor y bloquea hasta que se interrumpa (Ctrl+C)."""
    servidor = crear_servidor(host, puerto)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        servidor.server_close()
