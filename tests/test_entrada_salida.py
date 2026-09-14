"""Pruebas de la capa de entrada/salida. No tocan ni redefinen ninguna
de las 21 pruebas existentes del motor -- solo prueban validacion,
orquestacion y serializacion, ademas de un smoke test de la CLI.

Ejecutar junto con el resto: python -m unittest discover -s tests -t .
"""

import subprocess
import sys
import unittest
from pathlib import Path

from src.catalogo.enums import Etiqueta
from src.diagnostico import DiagnosticoCliente
from src.entrada_salida import (
    DiagnosticoInvalido,
    construir_diagnostico,
    generar_recomendacion,
    serializar_resultado,
)
from src.motor import Recomendacion, ResultadoRecomendacion

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestValidacionEntrada(unittest.TestCase):
    def test_acepta_variaciones_de_mayusculas_y_espacios(self):
        diagnostico = construir_diagnostico("  Redondo ", "AFRO", "Baja", "fino")
        self.assertIsInstance(diagnostico, DiagnosticoCliente)
        self.assertEqual(diagnostico.forma_rostro.value, "redondo")
        self.assertEqual(diagnostico.textura.value, "afro")

    def test_rostro_invalido_da_error_explicito(self):
        with self.assertRaises(DiagnosticoInvalido) as ctx:
            construir_diagnostico("hexagonal", "liso", "media", "medio")
        mensaje = str(ctx.exception)
        self.assertIn("forma_rostro", mensaje)
        self.assertIn("hexagonal", mensaje)
        self.assertIn("redondo", mensaje)  # lista de valores permitidos

    def test_textura_invalida_da_error_explicito(self):
        with self.assertRaises(DiagnosticoInvalido) as ctx:
            construir_diagnostico("redondo", "crespo", "media", "medio")
        self.assertIn("textura", str(ctx.exception))

    def test_densidad_invalida_da_error_explicito(self):
        with self.assertRaises(DiagnosticoInvalido) as ctx:
            construir_diagnostico("redondo", "liso", "muy_alta", "medio")
        self.assertIn("densidad", str(ctx.exception))

    def test_grosor_invalido_da_error_explicito(self):
        with self.assertRaises(DiagnosticoInvalido) as ctx:
            construir_diagnostico("redondo", "liso", "media", "gordo")
        self.assertIn("grosor", str(ctx.exception))

    def test_campo_faltante_da_error_explicito(self):
        with self.assertRaises(DiagnosticoInvalido) as ctx:
            construir_diagnostico("", "liso", "media", "medio")
        self.assertIn("forma_rostro", str(ctx.exception))


class TestGenerarRecomendacionExtremoAExtremo(unittest.TestCase):
    def test_caso_redondo_afro_baja_fino_coincide_con_motor(self):
        # Mismo caso validado a mano y en test_motor.py::TestCaso2...
        resultado = generar_recomendacion("redondo", "afro", "baja", "fino")
        nombres = [r["nombre"] for r in resultado["recomendaciones"]]
        self.assertEqual(nombres, [
            "Afro moldeado con mayor largo superior (high top)",
            "Degradado alto con volumen superior por contraste",
            "Corte texturizado corto con volumen concentrado en coronilla",
        ])
        self.assertIsNone(resultado["mensaje_vacio"])

    def test_estructura_de_cada_recomendacion(self):
        resultado = generar_recomendacion("cuadrado", "liso", "media", "medio")
        self.assertGreater(len(resultado["recomendaciones"]), 0)
        claves_esperadas = {
            "nombre", "familia", "etiqueta", "efectos_visagismo",
            "mecanismo", "nota_tecnica_textura", "advertencias", "mantenimiento",
        }
        for rec in resultado["recomendaciones"]:
            self.assertEqual(set(rec.keys()), claves_esperadas)
            self.assertIn(rec["etiqueta"], {e.value for e in Etiqueta})

    def test_maximo_3_recomendaciones(self):
        resultado = generar_recomendacion("ovalado", "ondulado", "alta", "grueso")
        self.assertLessEqual(len(resultado["recomendaciones"]), 3)

    def test_no_persiste_ni_exige_datos_personales(self):
        # La firma de generar_recomendacion solo acepta los 4 campos
        # del diagnostico -- llamarla con datos personales debe fallar
        # por firma, no ser silenciosamente aceptada.
        with self.assertRaises(TypeError):
            generar_recomendacion("redondo", "afro", "baja", "fino", nombre_cliente="Juan")


class TestSerializacionCatalogoVacio(unittest.TestCase):
    """El catalogo actual no tiene ninguna combinacion rostro x textura
    sin candidatos (confirmado por la auditoria), asi que este camino
    no es alcanzable hoy con datos reales. Se prueba construyendo el
    resultado manualmente para garantizar que la capa de entrada/salida
    lo serializa bien si el catalogo cambiara en el futuro."""

    def test_serializa_mensaje_vacio_sin_tocar_el_motor_real(self):
        resultado_motor = ResultadoRecomendacion(
            recomendaciones=[],
            mensaje_vacio="Ningun corte cumple ambos criterios para este diagnostico hipotetico.",
        )
        serializado = serializar_resultado(resultado_motor)
        self.assertEqual(serializado["recomendaciones"], [])
        self.assertEqual(
            serializado["mensaje_vacio"],
            "Ningun corte cumple ambos criterios para este diagnostico hipotetico.",
        )


class TestCLI(unittest.TestCase):
    def _ejecutar(self, *args):
        return subprocess.run(
            [sys.executable, "main.py", *args],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=10,
        )

    def test_cli_caso_valido(self):
        proceso = self._ejecutar(
            "--rostro", "redondo", "--textura", "afro", "--densidad", "baja", "--grosor", "fino",
        )
        self.assertEqual(proceso.returncode, 0, msg=proceso.stderr)
        self.assertIn("Afro moldeado con mayor largo superior (high top)", proceso.stdout)
        self.assertIn("SOLIDO", proceso.stdout)

    def test_cli_entrada_invalida_devuelve_error_explicito(self):
        proceso = self._ejecutar(
            "--rostro", "hexagonal", "--textura", "liso", "--densidad", "media", "--grosor", "medio",
        )
        self.assertEqual(proceso.returncode, 1)
        self.assertIn("forma_rostro", proceso.stderr)
        self.assertIn("hexagonal", proceso.stderr)


if __name__ == "__main__":
    unittest.main()
