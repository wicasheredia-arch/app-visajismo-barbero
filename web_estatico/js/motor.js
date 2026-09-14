// Puerto a JavaScript del motor de recomendacion (src/motor/motor.py).
// Misma especificacion, mismas reglas, sin ninguna desviacion.
// Se valida contra el motor Python real mediante tests_js/test_paridad.js.
//
// Formato UMD minimo (sin dependencias, sin build tools): funciona
// como <script> global en el navegador y como modulo CommonJS en
// Node (para las pruebas de paridad).
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(require("./catalogo_datos.js"));
  } else {
    global.MOTOR = factory(global.CATALOGO_DATOS);
  }
})(typeof window !== "undefined" ? window : globalThis, function (CATALOGO_DATOS) {
  "use strict";

  var CORTES = CATALOGO_DATOS.cortes;
  var COMPATIBILIDADES = CATALOGO_DATOS.compatibilidades;
  var MECANISMOS = CATALOGO_DATOS.mecanismos;
  var EXCEPCIONES = CATALOGO_DATOS.excepciones;
  var ROSTROS = CATALOGO_DATOS.rostros;

  var VOLUMEN = { NINGUNO: 0, BAJO: 1, MEDIO: 2, ALTO: 3 };
  var EJE = { MUY_ANGULAR: 1, ANGULAR: 2, NEUTRO: 3, SUAVE: 4, MUY_SUAVE: 5 };
  var ZONA_A_CAMPO = { arriba: "volumenArriba", lateral: "volumenLateral", posterior: "volumenPosterior" };

  var MECANISMOS_POR_ID = {};
  MECANISMOS.forEach(function (m) { MECANISMOS_POR_ID[m.id] = m; });

  var COMPAT_POR_CLAVE = {};
  COMPATIBILIDADES.forEach(function (c) { COMPAT_POR_CLAVE[c.corteId + "|" + c.textura] = c; });

  var EXCEPCION_POR_CLAVE = {};
  EXCEPCIONES.forEach(function (e) { EXCEPCION_POR_CLAVE[e.corteId + "|" + e.textura] = e; });

  // -- FASE 1a: puntaje de rostro (0/1/2), condicional por modo --------

  function nivelParaObjetivoZona(objetivo, volumen) {
    if (objetivo === "sin_objetivo") return null;
    if (objetivo === "sumar") {
      if (volumen === VOLUMEN.ALTO) return 2;
      if (volumen === VOLUMEN.MEDIO) return 1;
      return 0; // BAJO o NINGUNO
    }
    if (objetivo === "reducir") {
      if (volumen === VOLUMEN.NINGUNO || volumen === VOLUMEN.BAJO) return 2;
      if (volumen === VOLUMEN.MEDIO) return 1;
      return 0; // ALTO
    }
    throw new Error("Objetivo de zona desconocido: " + objetivo);
  }

  function rostroPorZona(corte, definicion) {
    var niveles = [];
    Object.keys(definicion.objetivosZona).forEach(function (zona) {
      var campo = ZONA_A_CAMPO[zona];
      var nivel = nivelParaObjetivoZona(definicion.objetivosZona[zona], corte[campo]);
      if (nivel !== null) niveles.push(nivel);
    });
    if (niveles.length === 0) return 2;
    return Math.min.apply(null, niveles);
  }

  function rostroPorEje(corte, definicion) {
    if (corte.eje >= definicion.objetivoEjeMinimo) return 2;
    if (corte.eje === EJE.NEUTRO) return 1;
    return 0;
  }

  function rostroPorEquilibrio(corte) {
    var zonasEnAlto = [corte.volumenArriba, corte.volumenLateral, corte.volumenPosterior]
      .filter(function (v) { return v === VOLUMEN.ALTO; }).length;
    return zonasEnAlto === 3 ? 0 : 2;
  }

  function evaluarRostro(corte, formaRostro) {
    var definicion = ROSTROS[formaRostro];
    if (!definicion) throw new Error("Forma de rostro desconocida: " + formaRostro);
    if (definicion.modo === "por_zona") return rostroPorZona(corte, definicion);
    if (definicion.modo === "por_eje") return rostroPorEje(corte, definicion);
    if (definicion.modo === "por_equilibrio") return rostroPorEquilibrio(corte);
    throw new Error("Modo de evaluacion desconocido: " + definicion.modo);
  }

  // -- FASE 1b: puntaje de textura (lookup, nunca distancia) -----------

  function evaluarTextura(corte, textura) {
    return COMPAT_POR_CLAVE[corte.id + "|" + textura].valor;
  }

  // -- FASE 1c: deficit unilateral de densidad/grosor -------------------

  function nivelPorDeficit(referencia, real) {
    if (real >= referencia) return 2;
    var deficit = referencia - real;
    if (deficit === 1) return 1;
    return 0; // deficit === 2
  }

  function evaluarDensidad(corte, densidadCliente) {
    return nivelPorDeficit(corte.densidadReferencia, densidadCliente);
  }

  function evaluarGrosor(corte, grosorCliente) {
    return nivelPorDeficit(corte.grosorReferencia, grosorCliente);
  }

  // -- FASE 3: etiquetado SOLIDO / ACEPTABLE / DEBIL ---------------------

  function etiquetar(rostro, densidad, grosor) {
    var ambosEnCero = densidad === 0 && grosor === 0;
    var algunEjeEnCero = densidad === 0 || grosor === 0;
    if (rostro === 2 && !ambosEnCero) return "solido";
    if (rostro === 1 && algunEjeEnCero) return "debil";
    return "aceptable";
  }

  // -- Gates + evaluacion de candidatos ----------------------------------

  function evaluarCandidatos(diagnostico) {
    var candidatos = [];
    CORTES.forEach(function (corte) {
      var rostro = evaluarRostro(corte, diagnostico.formaRostro);
      if (rostro === 0) return; // gate: contradice el objetivo de visagismo
      var textura = evaluarTextura(corte, diagnostico.textura);
      if (textura === 0) return; // gate: imposible de ejecutar con esta textura
      var densidad = evaluarDensidad(corte, diagnostico.densidad);
      var grosor = evaluarGrosor(corte, diagnostico.grosor);
      var etiqueta = etiquetar(rostro, densidad, grosor);
      candidatos.push({ corte: corte, rostro: rostro, textura: textura, densidad: densidad, grosor: grosor, etiqueta: etiqueta });
    });
    return candidatos;
  }

  // -- FASE 4: comparador lexicografico completo -------------------------

  function claveOrden(candidato) {
    return [
      -candidato.rostro,
      -candidato.textura,
      -Math.min(candidato.densidad, candidato.grosor),
      -(candidato.densidad + candidato.grosor),
      candidato.corte.mantenimiento,
    ];
  }

  function compararCandidatos(a, b) {
    var claveA = claveOrden(a);
    var claveB = claveOrden(b);
    for (var i = 0; i < claveA.length; i++) {
      if (claveA[i] !== claveB[i]) return claveA[i] - claveB[i];
    }
    if (a.corte.nombre < b.corte.nombre) return -1;
    if (a.corte.nombre > b.corte.nombre) return 1;
    return 0;
  }

  function ordenar(candidatos) {
    return candidatos.slice().sort(compararCandidatos);
  }

  // -- FASE 6: explicacion y advertencias --------------------------------

  var NOMBRE_DENSIDAD = { 1: "baja", 2: "media", 3: "alta" };
  var NOMBRE_GROSOR = { 1: "fino", 2: "medio", 3: "grueso" };
  var NOMBRE_MANTENIMIENTO = { 1: "bajo", 2: "medio", 3: "alto" };

  var PLANTILLA_ADVERTENCIA = {
    0: "Advertencia fuerte: {articulo} {atributo} del cliente ({real}) esta muy por debajo " +
       "de la referencia de este corte ({referencia}); el resultado puede verse " +
       "notablemente comprometido.",
    1: "Advertencia leve: {articulo} {atributo} del cliente ({real}) esta un escalon " +
       "por debajo de la referencia de este corte ({referencia}); el corte es viable " +
       "con un ajuste tecnico menor.",
  };

  function formatear(plantilla, valores) {
    return plantilla.replace(/\{(\w+)\}/g, function (coincidencia, clave) {
      return Object.prototype.hasOwnProperty.call(valores, clave) ? valores[clave] : coincidencia;
    });
  }

  function calcularAdvertencias(corte, diagnostico, densidadScore, grosorScore) {
    var advertencias = [];
    if (densidadScore === 0 || densidadScore === 1) {
      advertencias.push(formatear(PLANTILLA_ADVERTENCIA[densidadScore], {
        articulo: "la",
        atributo: "densidad",
        real: NOMBRE_DENSIDAD[diagnostico.densidad],
        referencia: NOMBRE_DENSIDAD[corte.densidadReferencia],
      }));
    }
    if (grosorScore === 0 || grosorScore === 1) {
      advertencias.push(formatear(PLANTILLA_ADVERTENCIA[grosorScore], {
        articulo: "el",
        atributo: "grosor",
        real: NOMBRE_GROSOR[diagnostico.grosor],
        referencia: NOMBRE_GROSOR[corte.grosorReferencia],
      }));
    }
    return advertencias;
  }

  function generarExplicacion(candidato, diagnostico) {
    var corte = candidato.corte;
    var mecanismo = MECANISMOS_POR_ID[corte.mecanismoId];
    var excepcion = EXCEPCION_POR_CLAVE[corte.id + "|" + diagnostico.textura];
    return {
      nombre: corte.nombre,
      familia: corte.familia,
      etiqueta: candidato.etiqueta,
      efectos_visagismo: mecanismo.efectos.slice(),
      mecanismo: mecanismo.principioTecnico,
      nota_tecnica_textura: excepcion ? excepcion.texto : null,
      advertencias: calcularAdvertencias(corte, diagnostico, candidato.densidad, candidato.grosor),
      mantenimiento: NOMBRE_MANTENIMIENTO[corte.mantenimiento],
    };
  }

  // -- FASE 5: seleccion final (maximo 3, nunca fabricado) ----------------

  var MENSAJE_CATALOGO_VACIO = (
    "Ningun corte de la base de conocimiento actual cumple simultaneamente con " +
    "el objetivo de visagismo de este rostro y con la viabilidad de esta " +
    "textura/densidad/grosor. Se recomienda que el barbero aplique su criterio " +
    "profesional directamente; este caso queda registrado como un hueco de " +
    "cobertura del catalogo."
  );

  function recomendar(diagnostico) {
    var candidatos = evaluarCandidatos(diagnostico);
    if (candidatos.length === 0) {
      return { recomendaciones: [], mensaje_vacio: MENSAJE_CATALOGO_VACIO };
    }
    var ordenados = ordenar(candidatos);
    var top = ordenados.slice(0, 3);
    var recomendaciones = top.map(function (c) { return generarExplicacion(c, diagnostico); });
    return { recomendaciones: recomendaciones, mensaje_vacio: null };
  }

  return {
    evaluarRostro: evaluarRostro,
    evaluarTextura: evaluarTextura,
    evaluarDensidad: evaluarDensidad,
    evaluarGrosor: evaluarGrosor,
    etiquetar: etiquetar,
    evaluarCandidatos: evaluarCandidatos,
    ordenar: ordenar,
    generarExplicacion: generarExplicacion,
    recomendar: recomendar,
    MENSAJE_CATALOGO_VACIO: MENSAJE_CATALOGO_VACIO,
  };
});
