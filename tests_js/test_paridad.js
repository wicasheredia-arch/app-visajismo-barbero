// Prueba de paridad JavaScript <-> Python.
//
// Carga tests/fixtures/paridad_216_casos.json (generado por
// scripts/generar_fixture_paridad.py a partir del motor Python REAL,
// sin tocarlo) y verifica que src/entrada_salida.generarRecomendacion
// en JavaScript produce, para cada una de las 216 combinaciones
// posibles de diagnostico, exactamente la misma salida.
//
// Solo libreria estandar de Node (assert, fs, path) -- cero
// dependencias, cero build tools.
//
// Ejecutar: node tests_js/test_paridad.js

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ENTRADA_SALIDA = require("../web_estatico/js/entrada_salida.js");

const RUTA_FIXTURE = path.join(__dirname, "..", "tests", "fixtures", "paridad_216_casos.json");
const CASOS = JSON.parse(fs.readFileSync(RUTA_FIXTURE, "utf-8"));

let aprobadas = 0;
let fallidas = 0;

function verificar(nombre, condicion) {
  if (condicion) {
    aprobadas += 1;
  } else {
    fallidas += 1;
    console.error("FALLO:", nombre);
  }
}

// -- 1. Paridad exhaustiva: las 216 combinaciones del fixture ------------

assert.strictEqual(CASOS.length, 216, "El fixture debe tener exactamente 216 casos");

CASOS.forEach(function (caso, indice) {
  const { rostro, textura, densidad, grosor } = caso.entrada;
  const obtenido = ENTRADA_SALIDA.generarRecomendacion(rostro, textura, densidad, grosor);
  const nombreCaso = `caso #${indice} (${rostro}+${textura}+${densidad}+${grosor})`;
  try {
    assert.deepStrictEqual(obtenido, caso.salida);
    aprobadas += 1;
  } catch (error) {
    fallidas += 1;
    console.error("FALLO:", nombreCaso);
    console.error("  esperado:", JSON.stringify(caso.salida));
    console.error("  obtenido:", JSON.stringify(obtenido));
  }
});

// -- 2. Los 9 casos de validacion nombrados explicitamente ----------------

function buscarCasoFixture(rostro, textura, densidad, grosor) {
  return CASOS.find(function (c) {
    return c.entrada.rostro === rostro && c.entrada.textura === textura &&
      c.entrada.densidad === densidad && c.entrada.grosor === grosor;
  }).salida;
}

// Caso 1: redondo + rizado + densidad alta + grosor grueso -> top 3 esperado.
(function () {
  const resultado = ENTRADA_SALIDA.generarRecomendacion("redondo", "rizado", "alta", "grueso");
  const nombres = resultado.recomendaciones.map((r) => r.nombre);
  verificar("Caso 1: top 3 correcto", JSON.stringify(nombres) === JSON.stringify([
    "Corte texturizado corto con volumen concentrado en coronilla",
    "Degradado alto con volumen superior por contraste",
    "Afro moldeado con mayor largo superior (high top)",
  ]));
  verificar("Caso 1: coincide con fixture Python",
    JSON.stringify(resultado) === JSON.stringify(buscarCasoFixture("redondo", "rizado", "alta", "grueso")));
})();

// Caso 2: redondo + afro + densidad baja + grosor fino -> densidad=0 no elimina candidatos.
(function () {
  const resultado = ENTRADA_SALIDA.generarRecomendacion("redondo", "afro", "baja", "fino");
  const nombres = resultado.recomendaciones.map((r) => r.nombre);
  verificar("Caso 2: top 3 correcto", JSON.stringify(nombres) === JSON.stringify([
    "Afro moldeado con mayor largo superior (high top)",
    "Degradado alto con volumen superior por contraste",
    "Corte texturizado corto con volumen concentrado en coronilla",
  ]));
  const primero = resultado.recomendaciones[0];
  verificar("Caso 2: trae advertencia fuerte de densidad",
    primero.advertencias.some((a) => a.toLowerCase().includes("fuerte")));
})();

// Caso 3/4/5: deficit unilateral de densidad.
const MOTOR = require("../web_estatico/js/motor.js");
const CATALOGO = require("../web_estatico/js/catalogo_datos.js");
const corte2 = CATALOGO.cortes.find((c) => c.id === 2); // densidadReferencia = ALTA (3)
const corte10 = CATALOGO.cortes.find((c) => c.id === 10); // densidadReferencia = BAJA (1)

verificar("Caso 3: referencia alta + cliente medio = 1", MOTOR.evaluarDensidad(corte2, 2) === 1);
verificar("Caso 4: referencia alta + cliente alto = 2", MOTOR.evaluarDensidad(corte2, 3) === 2);
verificar("Caso 5: referencia baja + cliente alto = 2 sin penalizacion", MOTOR.evaluarDensidad(corte10, 3) === 2);

// Caso 6: rostro=2 (cuadrado via eje suave), densidad=0 y grosor=0 -> ACEPTABLE.
(function () {
  const diagnostico = { formaRostro: "cuadrado", textura: "ondulado", densidad: 1, grosor: 1 };
  const candidatos = MOTOR.evaluarCandidatos(diagnostico);
  const candidato6 = candidatos.find((c) => c.corte.id === 6);
  verificar("Caso 6: rostro=2", candidato6.rostro === 2);
  verificar("Caso 6: densidad=0", candidato6.densidad === 0);
  verificar("Caso 6: grosor=0", candidato6.grosor === 0);
  verificar("Caso 6: etiqueta ACEPTABLE", candidato6.etiqueta === "aceptable");
})();

// Caso 7: rostro=1, densidad=0, grosor=2 -> DEBIL (basta un solo eje en cero).
(function () {
  const diagnostico = { formaRostro: "redondo", textura: "liso", densidad: 1, grosor: 2 };
  const candidatos = MOTOR.evaluarCandidatos(diagnostico);
  const candidato4 = candidatos.find((c) => c.corte.id === 4);
  verificar("Caso 7: rostro=1", candidato4.rostro === 1);
  verificar("Caso 7: densidad=0", candidato4.densidad === 0);
  verificar("Caso 7: grosor=2", candidato4.grosor === 2);
  verificar("Caso 7: etiqueta DEBIL", candidato4.etiqueta === "debil");
})();

// Caso 8: ovalado -> los 15 cortes dan rostro=2.
(function () {
  const todos = CATALOGO.cortes.every((corte) => MOTOR.evaluarRostro(corte, "ovalado") === 2);
  verificar("Caso 8: los 15 cortes dan rostro=2 en ovalado", todos);
})();

// Caso 9: empate total (corte 1 vs corte 11) -> desempate alfabetico.
(function () {
  const diagnostico = { formaRostro: "ovalado", textura: "ondulado", densidad: 2, grosor: 2 };
  const candidatos = MOTOR.evaluarCandidatos(diagnostico);
  const c1 = candidatos.find((c) => c.corte.id === 1);
  const c11 = candidatos.find((c) => c.corte.id === 11);
  const empatan = c1.rostro === c11.rostro && c1.textura === c11.textura &&
    c1.densidad === c11.densidad && c1.grosor === c11.grosor &&
    c1.corte.mantenimiento === c11.corte.mantenimiento;
  verificar("Caso 9: es un empate real en todo salvo el nombre", empatan);
  const ordenados = MOTOR.ordenar([c1, c11]);
  verificar("Caso 9: desempate alfabetico (11 antes que 1)",
    ordenados[0].corte.id === 11 && ordenados[1].corte.id === 1);
})();

// -- 3. Validacion de entrada --------------------------------------------

(function () {
  let lanzo = false;
  try {
    ENTRADA_SALIDA.construirDiagnostico("hexagonal", "liso", "media", "medio");
  } catch (error) {
    lanzo = error instanceof ENTRADA_SALIDA.DiagnosticoInvalido &&
      error.message.includes("forma_rostro") && error.message.includes("hexagonal");
  }
  verificar("Validacion: rostro invalido lanza DiagnosticoInvalido explicito", lanzo);
})();

(function () {
  const diagnostico = ENTRADA_SALIDA.construirDiagnostico("  Redondo ", "AFRO", "Baja", "fino");
  verificar("Validacion: acepta mayusculas/espacios", diagnostico.formaRostro === "redondo" && diagnostico.textura === "afro");
})();

// -- 4. listarOpciones ------------------------------------------------------

(function () {
  const opciones = ENTRADA_SALIDA.listarOpciones();
  verificar("Opciones: 6 formas de rostro", opciones.forma_rostro.length === 6);
  verificar("Opciones: 4 texturas", opciones.textura.length === 4);
  verificar("Opciones: 3 densidades en orden", JSON.stringify(opciones.densidad.map((o) => o.valor)) === JSON.stringify(["baja", "media", "alta"]));
  verificar("Opciones: 3 grosores en orden", JSON.stringify(opciones.grosor.map((o) => o.valor)) === JSON.stringify(["fino", "medio", "grueso"]));
})();

// -- resultado --------------------------------------------------------------

console.log(`\n${aprobadas} verificaciones aprobadas, ${fallidas} fallidas (sobre ${CASOS.length} casos exhaustivos + 9 casos nombrados + validaciones).`);
if (fallidas > 0) {
  process.exit(1);
}
