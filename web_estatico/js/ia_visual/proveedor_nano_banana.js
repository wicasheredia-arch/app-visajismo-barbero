// Motor 2 -- IA Visual: proveedor real (Nano Banana Pro / gemini-3-pro-image).
//
// Implementa exactamente el mismo contrato que proveedor.js exige --
// { nombre, generar(solicitud) -> Promise<ResultadoGeneracion> } -- y
// NUNCA llama a Gemini directamente. Llama solo a un backend propio
// (Cloud Run), que es el unico lugar donde vive la clave de
// autenticacion. Este archivo no contiene, ni puede contener, ninguna
// clave -- ver docs/INTEGRACION_NANO_BANANA_PRO.md.
//
// No sustituye a proveedor_mock.js: ambos quedan registrados, y el
// mock sigue siendo el proveedor activo por defecto. Activar este
// proveedor real es una decision explicita posterior, nunca
// automatica -- ver PROVEEDOR_IA.activar(...) en la documentacion.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    var proveedor = factory();
    if (global.PROVEEDOR_IA) global.PROVEEDOR_IA.registrar(proveedor.nombre, proveedor);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // URL del backend propio (Cloud Run) -- NUNCA la URL de Gemini
  // directamente. Configurable para poder apuntar a un backend local
  // durante pruebas, sin tocar el resto del archivo.
  var URL_BACKEND_POR_DEFECTO = "https://REEMPLAZAR-CON-TU-BACKEND.a.run.app/generar";
  var urlBackend = URL_BACKEND_POR_DEFECTO;

  function configurar(opciones) {
    if (opciones && typeof opciones.urlBackend === "string" && opciones.urlBackend) {
      urlBackend = opciones.urlBackend;
    }
  }

  function generar(solicitud) {
    if (!solicitud || !solicitud.fotoDataUrl) {
      return Promise.resolve({ ok: false, error: "Falta la fotografia." });
    }

    var controlador = typeof AbortController !== "undefined" ? new AbortController() : null;
    // Se expone en el resultado interno para que quien orqueste (motor2.js
    // en una version futura, o un llamador de pruebas) pueda cancelar
    // la solicitud real, no solo dejar de mirar el resultado.
    var promesa = fetch(urlBackend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controlador ? controlador.signal : undefined,
      body: JSON.stringify({
        fotoDataUrl: solicitud.fotoDataUrl,
        instruccion: solicitud.instruccion,
        nombreCorte: solicitud.nombreCorte,
      }),
    })
      .then(function (respuesta) {
        return respuesta.json().catch(function () {
          return { ok: false, error: "El backend devolvio una respuesta invalida." };
        });
      })
      .catch(function (error) {
        if (error && error.name === "AbortError") {
          return { ok: false, error: "Generacion cancelada." };
        }
        return { ok: false, error: "No se pudo conectar con el backend de VISAGE." };
      });

    promesa.cancelar = function () {
      if (controlador) controlador.abort();
    };

    return promesa;
  }

  return { nombre: "nano-banana-pro", generar: generar, configurar: configurar };
});
