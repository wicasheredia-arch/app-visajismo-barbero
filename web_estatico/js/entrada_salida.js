// Puerto a JavaScript de la capa de entrada/salida
// (src/entrada_salida/validacion.py + servicio.py + opciones.py).
// Unico punto de contacto entre la interfaz y el motor -- igual que
// en la version Python, este archivo nunca calcula nada de
// visagismo, solo valida y transporta.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(require("./motor.js"));
  } else {
    global.ENTRADA_SALIDA = factory(global.MOTOR);
  }
})(typeof window !== "undefined" ? window : globalThis, function (MOTOR) {
  "use strict";

  function DiagnosticoInvalido(mensaje) {
    this.name = "DiagnosticoInvalido";
    this.message = mensaje;
  }
  DiagnosticoInvalido.prototype = Object.create(Error.prototype);
  DiagnosticoInvalido.prototype.constructor = DiagnosticoInvalido;

  var FORMA_ROSTRO_VALORES = ["ovalado", "redondo", "cuadrado", "alargado", "triangular", "corazon"];
  var TEXTURA_VALORES = ["liso", "ondulado", "rizado", "afro"];
  var DENSIDAD_VALORES = ["baja", "media", "alta"];
  var GROSOR_VALORES = ["fino", "medio", "grueso"];

  var DENSIDAD_NOMBRE_A_NUMERO = { baja: 1, media: 2, alta: 3 };
  var GROSOR_NOMBRE_A_NUMERO = { fino: 1, medio: 2, grueso: 3 };

  function normalizar(texto) {
    return String(texto).trim().toLowerCase();
  }

  function mapaDesdeValores(valores) {
    var mapa = {};
    valores.forEach(function (v) { mapa[normalizar(v)] = v; });
    return mapa;
  }

  var MAPA_FORMA_ROSTRO = mapaDesdeValores(FORMA_ROSTRO_VALORES);
  var MAPA_TEXTURA = mapaDesdeValores(TEXTURA_VALORES);

  function resolver(valorCrudo, mapa, nombreCampo, valoresPermitidos) {
    var vacio = valorCrudo === null || valorCrudo === undefined ||
      (typeof valorCrudo === "string" && valorCrudo.trim() === "");
    if (vacio) {
      throw new DiagnosticoInvalido(
        "Falta el campo obligatorio '" + nombreCampo + "'. Valores permitidos: " +
        valoresPermitidos.join(", ") + "."
      );
    }
    var clave = normalizar(valorCrudo);
    if (!Object.prototype.hasOwnProperty.call(mapa, clave)) {
      throw new DiagnosticoInvalido(
        "Valor invalido para '" + nombreCampo + "': '" + valorCrudo + "'. Valores permitidos: " +
        valoresPermitidos.join(", ") + "."
      );
    }
    return mapa[clave];
  }

  function resolverFormaRostro(v) { return resolver(v, MAPA_FORMA_ROSTRO, "forma_rostro", FORMA_ROSTRO_VALORES); }
  function resolverTextura(v) { return resolver(v, MAPA_TEXTURA, "textura", TEXTURA_VALORES); }

  function resolverDensidad(v) {
    var nombre = resolver(v, mapaDesdeValores(DENSIDAD_VALORES), "densidad", DENSIDAD_VALORES);
    return DENSIDAD_NOMBRE_A_NUMERO[nombre];
  }

  function resolverGrosor(v) {
    var nombre = resolver(v, mapaDesdeValores(GROSOR_VALORES), "grosor", GROSOR_VALORES);
    return GROSOR_NOMBRE_A_NUMERO[nombre];
  }

  function construirDiagnostico(rostro, textura, densidad, grosor) {
    return {
      formaRostro: resolverFormaRostro(rostro),
      textura: resolverTextura(textura),
      densidad: resolverDensidad(densidad),
      grosor: resolverGrosor(grosor),
    };
  }

  function generarRecomendacion(rostro, textura, densidad, grosor) {
    var diagnostico = construirDiagnostico(rostro, textura, densidad, grosor);
    return MOTOR.recomendar(diagnostico);
  }

  function etiquetaLegible(valor) {
    return valor.charAt(0).toUpperCase() + valor.slice(1);
  }

  function listaDeOpciones(valores) {
    return valores.map(function (v) { return { valor: v, etiqueta: etiquetaLegible(v) }; });
  }

  function listarOpciones() {
    return {
      forma_rostro: listaDeOpciones(FORMA_ROSTRO_VALORES),
      textura: listaDeOpciones(TEXTURA_VALORES),
      densidad: listaDeOpciones(DENSIDAD_VALORES),
      grosor: listaDeOpciones(GROSOR_VALORES),
    };
  }

  return {
    DiagnosticoInvalido: DiagnosticoInvalido,
    construirDiagnostico: construirDiagnostico,
    generarRecomendacion: generarRecomendacion,
    listarOpciones: listarOpciones,
  };
});
