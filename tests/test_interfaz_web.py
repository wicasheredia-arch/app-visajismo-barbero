"""Pruebas de integracion de la interfaz web minima. Solo verifican
que el servidor conecta correctamente la capa de entrada/salida (ya
probada en test_entrada_salida.py) con el mundo HTTP -- no repiten la
logica de negocio, que ya esta cubierta por las 21 + 13 pruebas
existentes.

Usa unicamente libreria estandar (http.server + urllib.request) para
no introducir ninguna dependencia nueva.
"""

import json
import threading
import unittest
import urllib.error
import urllib.request

from src.interfaz_web import crear_servidor


class TestInterfazWeb(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.servidor = crear_servidor(puerto=0)  # puerto 0 = el SO elige uno libre
        cls.hilo = threading.Thread(target=cls.servidor.serve_forever, daemon=True)
        cls.hilo.start()
        host, puerto = cls.servidor.server_address
        cls.base_url = f"http://{host}:{puerto}"

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()
        cls.hilo.join(timeout=5)

    def _get(self, ruta):
        with urllib.request.urlopen(f"{self.base_url}{ruta}") as respuesta:
            return respuesta.status, respuesta.read(), respuesta.headers.get("Content-Type", "")

    def _post_json(self, ruta, cuerpo):
        datos = json.dumps(cuerpo).encode("utf-8")
        peticion = urllib.request.Request(
            f"{self.base_url}{ruta}", data=datos,
            headers={"Content-Type": "application/json"}, method="POST",
        )
        try:
            with urllib.request.urlopen(peticion) as respuesta:
                return respuesta.status, json.loads(respuesta.read())
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    def test_sirve_index_html(self):
        estado, cuerpo, tipo = self._get("/")
        self.assertEqual(estado, 200)
        self.assertIn("text/html", tipo)
        self.assertIn(b"<title>Recomendador de cortes</title>", cuerpo)

    def test_sirve_estilos_y_script(self):
        estado_css, _, tipo_css = self._get("/estilos.css")
        estado_js, _, tipo_js = self._get("/app.js")
        self.assertEqual(estado_css, 200)
        self.assertIn("text/css", tipo_css)
        self.assertEqual(estado_js, 200)
        self.assertIn("javascript", tipo_js)

    def test_ruta_desconocida_da_404(self):
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self._get("/no-existe")
        self.assertEqual(ctx.exception.code, 404)

    def test_api_opciones_expone_los_4_campos_desde_el_catalogo(self):
        estado, cuerpo, tipo = self._get("/api/opciones")
        self.assertEqual(estado, 200)
        self.assertIn("application/json", tipo)
        datos = json.loads(cuerpo)
        self.assertEqual(set(datos.keys()), {"forma_rostro", "textura", "densidad", "grosor"})
        self.assertEqual(len(datos["forma_rostro"]), 6)
        self.assertEqual(len(datos["textura"]), 4)
        self.assertEqual(len(datos["densidad"]), 3)
        self.assertEqual(len(datos["grosor"]), 3)
        # Orden ascendente preservado (mismo orden que el enum ordinal).
        self.assertEqual([o["valor"] for o in datos["densidad"]], ["baja", "media", "alta"])
        self.assertEqual([o["valor"] for o in datos["grosor"]], ["fino", "medio", "grueso"])

    def test_api_recomendacion_caso_conocido(self):
        # Mismo caso ya validado en test_motor.py y test_entrada_salida.py:
        # redondo + afro + baja + fino.
        estado, datos = self._post_json("/api/recomendacion", {
            "rostro": "redondo", "textura": "afro", "densidad": "baja", "grosor": "fino",
        })
        self.assertEqual(estado, 200)
        nombres = [r["nombre"] for r in datos["recomendaciones"]]
        self.assertEqual(nombres, [
            "Afro moldeado con mayor largo superior (high top)",
            "Degradado alto con volumen superior por contraste",
            "Corte texturizado corto con volumen concentrado en coronilla",
        ])
        self.assertIsNone(datos["mensaje_vacio"])

    def test_api_recomendacion_entrada_invalida_da_400_con_mensaje_explicito(self):
        estado, datos = self._post_json("/api/recomendacion", {
            "rostro": "hexagonal", "textura": "liso", "densidad": "media", "grosor": "medio",
        })
        self.assertEqual(estado, 400)
        self.assertIn("forma_rostro", datos["error"])
        self.assertIn("hexagonal", datos["error"])

    def test_api_recomendacion_cuerpo_no_json_da_400(self):
        peticion = urllib.request.Request(
            f"{self.base_url}/api/recomendacion", data=b"no es json",
            headers={"Content-Type": "application/json"}, method="POST",
        )
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(peticion)
        self.assertEqual(ctx.exception.code, 400)


if __name__ == "__main__":
    unittest.main()
