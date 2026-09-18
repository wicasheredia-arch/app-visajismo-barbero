// Motor 2 -- IA Visual: proveedor local de prueba (mock).
//
// No llama a ningun servicio externo ni usa ninguna clave de API: es
// el proveedor activo por defecto porque GitHub Pages es un sitio
// estatico y no puede guardar un secreto de forma segura (ver
// docs/INTEGRACION_NANO_BANANA_PRO.md para lo que hace falta para
// conectar un proveedor real sin exponer credenciales).
//
// Simula el tiempo de espera de una generacion real y devuelve la
// MISMA fotografia del cliente con un aviso superpuesto, para poder
// probar todo el flujo (consentimiento, validacion, estados, error)
// sin depender de nada externo. Implementa el mismo contrato que
// cualquier proveedor real (ver proveedor.js) -- el dia que exista un
// backend seguro, se registra otro objeto con esa misma forma y se
// activa con PROVEEDOR_IA.activar(...), sin tocar motor2.js.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    var proveedor = factory();
    if (global.PROVEEDOR_IA) global.PROVEEDOR_IA.registrar(proveedor.nombre, proveedor);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // En un entorno sin DOM (ej. las pruebas en Node) no hay forma de
  // dibujar sobre un canvas -- se devuelve la foto sin modificar, para
  // poder probar la maquina de estados de motor2.js sin depender del
  // navegador.
  // Reduce el tamano de fuente hasta que el texto quepa dentro del
  // ancho disponible (con margen) -- evita que un lienzo angosto
  // (foto vertical de celular) recorte el texto por los dos lados.
  function ajustarFuenteParaCaber(ctx, texto, anchoDisponible, prefijoFuente, tamanoInicial, tamanoMinimo) {
    var tamano = tamanoInicial;
    while (tamano > tamanoMinimo) {
      ctx.font = prefijoFuente + tamano + "px sans-serif";
      if (ctx.measureText(texto).width <= anchoDisponible) break;
      tamano -= 1;
    }
    return tamano;
  }

  function dibujarAviso(fotoDataUrl, textoInstruccion) {
    if (typeof document === "undefined") {
      return Promise.resolve(fotoDataUrl);
    }
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var lienzo = document.createElement("canvas");
        lienzo.width = img.width;
        lienzo.height = img.height;
        var ctx = lienzo.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var anchoDisponible = img.width * 0.92;
        var alturaFranja = Math.max(48, Math.round(img.height * 0.12));
        ctx.fillStyle = "rgba(11, 11, 13, 0.78)";
        ctx.fillRect(0, img.height - alturaFranja, img.width, alturaFranja);

        var textoPrincipal = "SIMULACION -- sin IA real";
        ctx.textAlign = "center";
        var tamanoPrincipal = ajustarFuenteParaCaber(
          ctx, textoPrincipal, anchoDisponible, "bold ", Math.max(14, Math.round(alturaFranja * 0.3)), 10
        );
        ctx.fillStyle = "#e4c58a";
        ctx.font = "bold " + tamanoPrincipal + "px sans-serif";
        ctx.fillText(textoPrincipal, img.width / 2, img.height - alturaFranja * 0.55);

        var textoSecundario = String(textoInstruccion || "").slice(0, 40);
        if (textoSecundario) {
          var tamanoSecundario = ajustarFuenteParaCaber(
            ctx, textoSecundario, anchoDisponible, "", Math.max(11, Math.round(alturaFranja * 0.2)), 8
          );
          ctx.fillStyle = "#a29da8";
          ctx.font = tamanoSecundario + "px sans-serif";
          ctx.fillText(textoSecundario, img.width / 2, img.height - alturaFranja * 0.2);
        }

        resolve(lienzo.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = function () {
        reject(new Error("No se pudo leer la fotografia seleccionada."));
      };
      img.src = fotoDataUrl;
    });
  }

  var proveedorMock = {
    nombre: "mock-local",
    generar: function (solicitud) {
      if (!solicitud || !solicitud.fotoDataUrl) {
        return Promise.resolve({ ok: false, error: "Falta la fotografia." });
      }
      return new Promise(function (resolve) {
        setTimeout(function () {
          dibujarAviso(solicitud.fotoDataUrl, solicitud.instruccion)
            .then(function (imagenDataUrl) {
              resolve({ ok: true, imagenDataUrl: imagenDataUrl });
            })
            .catch(function (error) {
              resolve({ ok: false, error: error.message });
            });
        }, 900);
      });
    },
  };

  return proveedorMock;
});
