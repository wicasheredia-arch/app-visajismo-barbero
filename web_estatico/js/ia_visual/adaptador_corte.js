// Motor 2 -- IA Visual: adaptador Corte -> instruccion de generacion.
//
// Traduce los campos tecnicos que YA existen en el catalogo (ver
// web_estatico/js/catalogo_datos.js, generado automaticamente desde
// src/catalogo -- nunca editado a mano) a una frase corta que un
// proveedor de generacion de imagen pueda usar como instruccion.
//
// Este archivo SOLO LEE del catalogo. No le agrega ningun campo, no
// lo modifica, y no decide que corte es correcto para un rostro --
// esa decision ya la tomo Motor 1. Motor 2 solo describe, en
// palabras, el corte que el usuario ya eligio desde los resultados.
//
// `entrada_salida.generarRecomendacion` no expone `corte_id` a
// proposito (ver el comentario en entrada_salida.js/servicio.py), asi
// que este adaptador busca el corte completo por su nombre -- unico
// por diseno entre los 15 cortes del catalogo.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(require("../catalogo_datos.js"));
  } else {
    global.ADAPTADOR_CORTE = factory(global.CATALOGO_DATOS);
  }
})(typeof window !== "undefined" ? window : globalThis, function (CATALOGO_DATOS) {
  "use strict";

  var NOMBRE_VOLUMEN = { 0: "ninguno", 1: "bajo", 2: "medio", 3: "alto" };
  var NOMBRE_EJE = { 1: "muy angular", 2: "angular", 3: "neutro", 4: "suave", 5: "muy suave" };

  function buscarCortePorNombre(nombreCorte) {
    var cortes = (CATALOGO_DATOS && CATALOGO_DATOS.cortes) || [];
    for (var i = 0; i < cortes.length; i++) {
      if (cortes[i].nombre === nombreCorte) return cortes[i];
    }
    return null;
  }

  function construirInstruccion(nombreCorte) {
    var corte = buscarCortePorNombre(nombreCorte);
    if (!corte) {
      throw new Error(
        "No se encontro en el catalogo el corte '" + nombreCorte + "'. " +
        "El adaptador solo describe cortes que ya existen en el catalogo de Motor 1."
      );
    }
    return (
      "Corte de barberia: " + corte.nombre + ". " +
      "Volumen arriba " + NOMBRE_VOLUMEN[corte.volumenArriba] + ", " +
      "volumen lateral " + NOMBRE_VOLUMEN[corte.volumenLateral] + ", " +
      "volumen posterior " + NOMBRE_VOLUMEN[corte.volumenPosterior] + ". " +
      "Terminacion " + NOMBRE_EJE[corte.eje] + ". " +
      "Mantener el mismo rostro, piel, barba y edad aparente del cliente; " +
      "cambiar unicamente el peinado."
    );
  }

  return {
    buscarCortePorNombre: buscarCortePorNombre,
    construirInstruccion: construirInstruccion,
  };
});
