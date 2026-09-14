"""Pruebas automatizadas del motor, usando exactamente los 9 casos de
validacion formal ya aprobados sobre la especificacion, mas chequeos
de integridad estructural del catalogo.

Ejecutar con:  python -m unittest discover -s tests -t .
"""

import unittest

from src.catalogo.cortes import CORTES
from src.catalogo.compatibilidad import COMPATIBILIDADES
from src.catalogo.enums import Densidad, Etiqueta, FormaRostro, Grosor, Textura
from src.diagnostico import DiagnosticoCliente
from src.motor import (
    evaluar_candidatos,
    evaluar_densidad,
    evaluar_rostro,
    etiquetar,
    ordenar,
    recomendar,
)
from src.motor.auditoria import auditar_cobertura, combinaciones_sin_cobertura
from src.catalogo.cortes import CORTES_POR_ID


class TestIntegridadCatalogo(unittest.TestCase):
    def test_15_cortes(self):
        self.assertEqual(len(CORTES), 15)

    def test_60_compatibilidades(self):
        self.assertEqual(len(COMPATIBILIDADES), 60)

    def test_24_combinaciones_auditoria(self):
        self.assertEqual(len(auditar_cobertura()), 24)

    def test_sin_huecos_totales_en_catalogo_actual(self):
        # Ninguna de las 24 combinaciones rostro x textura queda sin
        # ningun candidato que pase los gates (confirmado en la fase
        # de auditoria del catalogo).
        self.assertEqual(combinaciones_sin_cobertura(auditar_cobertura()), [])


class TestEtiquetadoExhaustivo(unittest.TestCase):
    """Verifica la tabla de 18 combinaciones (rostro en {1,2} x
    densidad en {0,1,2} x grosor en {0,1,2}) validada manualmente."""

    ESPERADO = {
        (2, 0, 0): Etiqueta.ACEPTABLE,
        (2, 0, 1): Etiqueta.SOLIDO,
        (2, 0, 2): Etiqueta.SOLIDO,
        (2, 1, 0): Etiqueta.SOLIDO,
        (2, 1, 1): Etiqueta.SOLIDO,
        (2, 1, 2): Etiqueta.SOLIDO,
        (2, 2, 0): Etiqueta.SOLIDO,
        (2, 2, 1): Etiqueta.SOLIDO,
        (2, 2, 2): Etiqueta.SOLIDO,
        (1, 0, 0): Etiqueta.DEBIL,
        (1, 0, 1): Etiqueta.DEBIL,
        (1, 0, 2): Etiqueta.DEBIL,
        (1, 1, 0): Etiqueta.DEBIL,
        (1, 1, 1): Etiqueta.ACEPTABLE,
        (1, 1, 2): Etiqueta.ACEPTABLE,
        (1, 2, 0): Etiqueta.DEBIL,
        (1, 2, 1): Etiqueta.ACEPTABLE,
        (1, 2, 2): Etiqueta.ACEPTABLE,
    }

    def test_las_18_combinaciones(self):
        for (rostro, densidad, grosor), esperado in self.ESPERADO.items():
            with self.subTest(rostro=rostro, densidad=densidad, grosor=grosor):
                self.assertEqual(etiquetar(rostro, densidad, grosor), esperado)


class TestCaso1RedondoRizadoDensidadAltaGrosorGrueso(unittest.TestCase):
    def setUp(self):
        self.diag = DiagnosticoCliente(FormaRostro.REDONDO, Textura.RIZADO, Densidad.ALTA, Grosor.GRUESO)
        self.candidatos = evaluar_candidatos(self.diag)

    def test_descartados_por_gate_rostro(self):
        sobrevivientes = {c.corte.id for c in self.candidatos}
        self.assertEqual(sobrevivientes, {1, 2, 3, 4, 9, 10, 11, 12})

    def test_densidad_y_grosor_en_2_para_todos(self):
        for c in self.candidatos:
            self.assertEqual(c.densidad, 2)
            self.assertEqual(c.grosor, 2)

    def test_top_3(self):
        resultado = recomendar(self.diag)
        ids = [r.corte_id for r in resultado.recomendaciones]
        self.assertEqual(ids, [12, 1, 9])
        self.assertTrue(all(r.etiqueta == Etiqueta.SOLIDO for r in resultado.recomendaciones))


class TestCaso2RedondoAfroDensidadBajaGrosorFino(unittest.TestCase):
    def setUp(self):
        self.diag = DiagnosticoCliente(FormaRostro.REDONDO, Textura.AFRO, Densidad.BAJA, Grosor.FINO)
        self.candidatos = evaluar_candidatos(self.diag)

    def test_descartados_por_ambos_gates(self):
        sobrevivientes = {c.corte.id for c in self.candidatos}
        self.assertEqual(sobrevivientes, {1, 2, 9, 10, 12})

    def test_densidad_0_no_elimina_candidatos(self):
        con_densidad_0 = [c for c in self.candidatos if c.densidad == 0]
        self.assertEqual({c.corte.id for c in con_densidad_0}, {2, 9, 12})
        # Siguen presentes en la lista de candidatos evaluados (no gatean).
        for c in con_densidad_0:
            self.assertIn(c.corte.id, {cc.corte.id for cc in self.candidatos})

    def test_advertencias_presentes_para_densidad_0(self):
        from src.motor import generar_explicacion
        candidato_9 = next(c for c in self.candidatos if c.corte.id == 9)
        explicacion = generar_explicacion(candidato_9, self.diag)
        self.assertTrue(any("fuerte" in a.lower() for a in explicacion.advertencias))

    def test_top_3(self):
        resultado = recomendar(self.diag)
        ids = [r.corte_id for r in resultado.recomendaciones]
        self.assertEqual(ids, [9, 1, 12])


class TestDeficitDensidadGrosor(unittest.TestCase):
    def test_referencia_alta_cliente_medio_da_1(self):
        corte_2 = CORTES_POR_ID[2]  # densidad_referencia = ALTA
        self.assertEqual(evaluar_densidad(corte_2, Densidad.MEDIA), 1)

    def test_referencia_alta_cliente_alto_da_2(self):
        corte_2 = CORTES_POR_ID[2]
        self.assertEqual(evaluar_densidad(corte_2, Densidad.ALTA), 2)

    def test_referencia_baja_cliente_alto_da_2_sin_penalizacion(self):
        corte_10 = CORTES_POR_ID[10]  # densidad_referencia = BAJA
        self.assertEqual(evaluar_densidad(corte_10, Densidad.ALTA), 2)


class TestCaso6RostroDosDensidadCeroGrosorCero(unittest.TestCase):
    def test_etiqueta_aceptable(self):
        diag = DiagnosticoCliente(FormaRostro.CUADRADO, Textura.ONDULADO, Densidad.BAJA, Grosor.FINO)
        candidatos = evaluar_candidatos(diag)
        candidato_6 = next(c for c in candidatos if c.corte.id == 6)
        self.assertEqual(candidato_6.rostro, 2)
        self.assertEqual(candidato_6.densidad, 0)
        self.assertEqual(candidato_6.grosor, 0)
        self.assertEqual(candidato_6.etiqueta, Etiqueta.ACEPTABLE)

    def test_dos_advertencias_fuertes_coherentes(self):
        from src.motor import generar_explicacion
        diag = DiagnosticoCliente(FormaRostro.CUADRADO, Textura.ONDULADO, Densidad.BAJA, Grosor.FINO)
        candidatos = evaluar_candidatos(diag)
        candidato_6 = next(c for c in candidatos if c.corte.id == 6)
        explicacion = generar_explicacion(candidato_6, diag)
        self.assertEqual(len(explicacion.advertencias), 2)
        self.assertTrue(all("fuerte" in a.lower() for a in explicacion.advertencias))


class TestCaso7RostroUnoConUnEjeEnCero(unittest.TestCase):
    def test_etiqueta_debil(self):
        diag = DiagnosticoCliente(FormaRostro.REDONDO, Textura.LISO, Densidad.BAJA, Grosor.MEDIO)
        candidatos = evaluar_candidatos(diag)
        candidato_4 = next(c for c in candidatos if c.corte.id == 4)
        self.assertEqual(candidato_4.rostro, 1)
        self.assertEqual(candidato_4.densidad, 0)
        self.assertEqual(candidato_4.grosor, 2)
        self.assertEqual(candidato_4.etiqueta, Etiqueta.DEBIL)


class TestCaso8Ovalado(unittest.TestCase):
    def test_todos_los_15_cortes_dan_rostro_2(self):
        for corte in CORTES:
            with self.subTest(corte=corte.nombre):
                self.assertEqual(evaluar_rostro(corte, FormaRostro.OVALADO), 2)


class TestCaso9EmpateAlfabetico(unittest.TestCase):
    def test_desempate_por_nombre(self):
        diag = DiagnosticoCliente(FormaRostro.OVALADO, Textura.ONDULADO, Densidad.MEDIA, Grosor.MEDIO)
        candidatos = evaluar_candidatos(diag)
        c1 = next(c for c in candidatos if c.corte.id == 1)
        c11 = next(c for c in candidatos if c.corte.id == 11)
        # Confirmar que es un empate real en todas las dimensiones salvo el nombre.
        self.assertEqual((c1.rostro, c1.textura, c1.densidad, c1.grosor, c1.corte.mantenimiento),
                          (c11.rostro, c11.textura, c11.densidad, c11.grosor, c11.corte.mantenimiento))
        ordenados = ordenar([c1, c11])
        self.assertEqual([c.corte.id for c in ordenados], [11, 1])  # "Corte..." < "Degradado..."


class TestNoFabricarRecomendaciones(unittest.TestCase):
    def test_nunca_mas_de_3(self):
        # Barremos varias combinaciones representativas.
        for forma in FormaRostro:
            for textura in Textura:
                diag = DiagnosticoCliente(forma, textura, Densidad.MEDIA, Grosor.MEDIO)
                resultado = recomendar(diag)
                self.assertLessEqual(len(resultado.recomendaciones), 3)


if __name__ == "__main__":
    unittest.main()
