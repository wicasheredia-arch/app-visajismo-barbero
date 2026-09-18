// Motor 2 -- IA Visual: orquestador.
//
// Maquina de estados que recorre exactamente los pasos pedidos:
// seleccion de foto -> consentimiento -> validacion basica de calidad
// -> preparacion de la solicitud -> estado de generacion -> resultado
// -> error -> volver al resultado original.
//
// Reglas que este archivo protege:
//   - Nunca importa ni requiere nada de src/motor, src/catalogo ni
//     src/entrada_salida (ni sus versiones JS). Motor 1 no sabe que
//     este archivo existe.
//   - Nunca diagnostica rostro/textura/densidad/grosor.
//   - Nunca elige un corte -- `iniciar(corte)` recibe el corte que el
//     usuario ya selecciono desde los resultados de Motor 1.
//   - El proveedor se recibe por inyeccion (parametro), nunca se
//     importa un proveedor concreto por nombre de archivo -- así se
//     puede probar con un proveedor falso y cambiar de proveedor real
//     sin tocar este archivo.
//   - Si el proveedor falla, se cae al estado ERROR sin lanzar
//     excepciones sin capturar -- quien use este modulo (app.js)
//     puede seguir mostrando el resto de la pantalla de resultados
//     con normalidad.
//   - No persiste la fotografia en ningun almacenamiento (localStorage,
//     IndexedDB, etc.) -- vive solo en memoria mientras el panel esta
//     abierto, y se descarta al volver al resultado original.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(require("./adaptador_corte.js"));
  } else {
    global.MOTOR2 = factory(global.ADAPTADOR_CORTE);
  }
})(typeof window !== "undefined" ? window : globalThis, function (ADAPTADOR_CORTE) {
  "use strict";

  var PASOS = {
    INACTIVO: "INACTIVO",
    SELECCION_FOTO: "SELECCION_FOTO",
    CONSENTIMIENTO: "CONSENTIMIENTO",
    VALIDANDO_CALIDAD: "VALIDANDO_CALIDAD",
    CALIDAD_RECHAZADA: "CALIDAD_RECHAZADA",
    PREPARANDO_SOLICITUD: "PREPARANDO_SOLICITUD",
    GENERANDO: "GENERANDO",
    RESULTADO: "RESULTADO",
    ERROR: "ERROR",
  };

  function estadoInicial() {
    return { paso: PASOS.INACTIVO, fotoDataUrl: null, corte: null, resultado: null, error: null };
  }

  function crearMotor2(opciones) {
    opciones = opciones || {};
    var proveedor = opciones.proveedor || null;
    var anchoMinimo = opciones.anchoMinimo || 200;
    var altoMinimo = opciones.altoMinimo || 200;

    var estado = estadoInicial();
    var escuchas = [];
    var promesaActual = null;

    function emitir() {
      escuchas.forEach(function (fn) { fn(estado); });
    }

    function suscribir(fn) {
      escuchas.push(fn);
      return function desuscribir() {
        var indice = escuchas.indexOf(fn);
        if (indice !== -1) escuchas.splice(indice, 1);
      };
    }

    // Paso 1: el usuario ya eligio un corte en los resultados de
    // Motor 1 -- ese corte llega aqui completo (nombre, familia,
    // etc.), Motor 2 nunca vuelve a decidir si es un buen corte.
    function iniciar(corte) {
      estado = estadoInicial();
      estado.paso = PASOS.SELECCION_FOTO;
      estado.corte = corte;
      emitir();
    }

    // Paso 2: seleccion de foto (el llamador ya la convirtio a
    // data URL desde el input de archivo/camara).
    function seleccionarFoto(fotoDataUrl) {
      if (estado.paso !== PASOS.SELECCION_FOTO && estado.paso !== PASOS.CALIDAD_RECHAZADA) return;
      estado.fotoDataUrl = fotoDataUrl;
      estado.error = null;
      estado.paso = PASOS.CONSENTIMIENTO;
      emitir();
    }

    // Paso 3: consentimiento explicito antes de procesar la foto.
    function darConsentimiento() {
      if (estado.paso !== PASOS.CONSENTIMIENTO) return;
      estado.paso = PASOS.VALIDANDO_CALIDAD;
      emitir();
      validarCalidad(estado.fotoDataUrl).then(function (esValida) {
        if (estado.paso !== PASOS.VALIDANDO_CALIDAD) return; // se cancelo mientras tanto
        if (!esValida) {
          estado.paso = PASOS.CALIDAD_RECHAZADA;
          estado.error = "La fotografia no se pudo leer o es demasiado pequena. Elige otra.";
          emitir();
          return;
        }
        prepararYGenerar();
      });
    }

    // Paso 4: validacion basica de calidad -- solo confirma que la
    // imagen carga y tiene un tamano minimo razonable. Nunca intenta
    // evaluar forma de rostro, textura, densidad ni grosor: eso sigue
    // siendo trabajo humano, nunca de este motor.
    function validarCalidad(fotoDataUrl) {
      if (typeof Image === "undefined") {
        // Sin DOM (pruebas en Node): no hay como decodificar la
        // imagen aqui. Se asume valida -- este camino se prueba por
        // separado, inyectando el resultado.
        return Promise.resolve(true);
      }
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          resolve(img.width >= anchoMinimo && img.height >= altoMinimo);
        };
        img.onerror = function () { resolve(false); };
        img.src = fotoDataUrl;
      });
    }

    // Paso 5-6: preparar la solicitud (adaptador corte -> instruccion)
    // y pasar a estado de generacion.
    function prepararYGenerar() {
      estado.paso = PASOS.PREPARANDO_SOLICITUD;
      emitir();

      var instruccion;
      try {
        instruccion = ADAPTADOR_CORTE.construirInstruccion(estado.corte.nombre);
      } catch (error) {
        estado.paso = PASOS.ERROR;
        estado.error = error.message;
        emitir();
        return;
      }

      if (!proveedor || typeof proveedor.generar !== "function") {
        estado.paso = PASOS.ERROR;
        estado.error = "No hay ningun proveedor de IA visual disponible en este momento.";
        emitir();
        return;
      }

      estado.paso = PASOS.GENERANDO;
      emitir();

      // Se guarda la promesa devuelta por el proveedor para poder
      // cancelar la llamada real (no solo la UI) si el usuario toca
      // "Cancelar" -- ver volverAResultadoOriginal(). Si el proveedor
      // no soporta cancelacion (ej. proveedor_mock.js), promesaActual.cancelar
      // simplemente no existe y no se llama a nada; el comportamiento
      // de "ignorar el resultado si ya no estamos en GENERANDO" sigue
      // protegiendo la UI igual que antes.
      promesaActual = proveedor
        .generar({ fotoDataUrl: estado.fotoDataUrl, instruccion: instruccion, nombreCorte: estado.corte.nombre });

      promesaActual
        .then(function (resultado) {
          if (estado.paso !== PASOS.GENERANDO) return; // se volvio al original mientras generaba
          if (resultado && resultado.ok) {
            estado.paso = PASOS.RESULTADO;
            estado.resultado = resultado.imagenDataUrl;
          } else {
            estado.paso = PASOS.ERROR;
            estado.error = (resultado && resultado.error) || "El proveedor no pudo generar la visualizacion.";
          }
          emitir();
        })
        .catch(function (error) {
          if (estado.paso !== PASOS.GENERANDO) return;
          estado.paso = PASOS.ERROR;
          estado.error = error && error.message ? error.message : "Ocurrio un error inesperado.";
          emitir();
        });
    }

    // Paso 7-8: volver al resultado original de Motor 1 -- cierra el
    // panel, descarta la foto de memoria (nunca se guardo en disco ni
    // en almacenamiento persistente), y cancela la llamada real en
    // curso si el proveedor activo lo permite.
    function volverAResultadoOriginal() {
      if (promesaActual && typeof promesaActual.cancelar === "function") {
        promesaActual.cancelar();
      }
      promesaActual = null;
      estado = estadoInicial();
      emitir();
    }

    function obtenerEstado() {
      return estado;
    }

    return {
      iniciar: iniciar,
      seleccionarFoto: seleccionarFoto,
      darConsentimiento: darConsentimiento,
      volverAResultadoOriginal: volverAResultadoOriginal,
      suscribir: suscribir,
      obtenerEstado: obtenerEstado,
    };
  }

  return { PASOS: PASOS, crearMotor2: crearMotor2 };
});
