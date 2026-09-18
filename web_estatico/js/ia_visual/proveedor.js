// Motor 2 -- IA Visual: contrato de proveedor intercambiable.
//
// Cualquier proveedor de visualizacion (el mock local de pruebas, o
// en el futuro un backend que hable con Nano Banana Pro u otro
// servicio -- ver docs/INTEGRACION_NANO_BANANA_PRO.md) debe exponer
// exactamente esta forma:
//
//   {
//     nombre: string,
//     generar: function(solicitud) -> Promise<ResultadoGeneracion>
//   }
//
// solicitud          = { fotoDataUrl, instruccion, nombreCorte }
// ResultadoGeneracion (exito) = { ok: true,  imagenDataUrl }
// ResultadoGeneracion (fallo) = { ok: false, error }
//
// motor2.js nunca importa un proveedor por su nombre de archivo --
// siempre pasa por este registro. Cambiar de proveedor (ej. activar
// uno real en lugar del mock) nunca requiere tocar motor2.js.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    global.PROVEEDOR_IA = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var registro = {};
  var nombreActivo = null;

  function registrar(nombre, proveedor) {
    if (!nombre || !proveedor || typeof proveedor.generar !== "function") {
      throw new Error("Proveedor invalido: se requiere un 'nombre' y un metodo 'generar'.");
    }
    registro[nombre] = proveedor;
    if (nombreActivo === null) nombreActivo = nombre;
  }

  function activar(nombre) {
    if (!Object.prototype.hasOwnProperty.call(registro, nombre)) {
      throw new Error("No hay ningun proveedor registrado con el nombre '" + nombre + "'.");
    }
    nombreActivo = nombre;
  }

  function obtenerActivo() {
    if (nombreActivo === null) return null;
    return registro[nombreActivo];
  }

  function nombreProveedorActivo() {
    return nombreActivo;
  }

  function listar() {
    return Object.keys(registro);
  }

  return {
    registrar: registrar,
    activar: activar,
    obtenerActivo: obtenerActivo,
    nombreProveedorActivo: nombreProveedorActivo,
    listar: listar,
  };
});
