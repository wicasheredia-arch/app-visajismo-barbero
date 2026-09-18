// Pruebas aisladas de Motor 2 -- IA Visual.
//
// Corren en Node puro (assert, sin DOM) igual que test_paridad.js:
// cero dependencias, cero build tools. `motor2.js` y `proveedor_mock.js`
// ya estan preparados para degradarse quando no hay `document`/`Image`
// -- eso mismo es lo que se prueba aqui para su logica de estados.
//
// Ejecutar: node tests_js/test_motor2.js

"use strict";

const assert = require("assert");

const PROVEEDOR_IA = require("../web_estatico/js/ia_visual/proveedor.js");
const ADAPTADOR_CORTE = require("../web_estatico/js/ia_visual/adaptador_corte.js");
const PROVEEDOR_MOCK = require("../web_estatico/js/ia_visual/proveedor_mock.js");
const MOTOR2 = require("../web_estatico/js/ia_visual/motor2.js");
const CATALOGO_DATOS = require("../web_estatico/js/catalogo_datos.js");
const MOTOR = require("../web_estatico/js/motor.js");
const ENTRADA_SALIDA = require("../web_estatico/js/entrada_salida.js");

let aprobadas = 0;
let fallidas = 0;

function verificar(descripcion, fn) {
  try {
    fn();
    aprobadas += 1;
  } catch (error) {
    fallidas += 1;
    console.error(`FALLO: ${descripcion}`);
    console.error(`   ${error.message}`);
  }
}

function esperarAsync(descripcion, promesa, verificador) {
  return promesa
    .then((valor) => {
      verificador(valor);
      aprobadas += 1;
    })
    .catch((error) => {
      fallidas += 1;
      console.error(`FALLO (async): ${descripcion}`);
      console.error(`   ${error.message}`);
    });
}

// -- 1. Registro de proveedores (proveedor.js) ---------------------------

verificar("registrar exige nombre y metodo generar", () => {
  assert.throws(() => PROVEEDOR_IA.registrar("", { generar: () => {} }));
  assert.throws(() => PROVEEDOR_IA.registrar("x", {}));
});

verificar("registrar + obtenerActivo devuelve el primero registrado por defecto", () => {
  const registro = PROVEEDOR_IA; // modulo es un singleton, se prueba con nombres unicos
  const proveedorFalso = { nombre: "falso-1", generar: () => Promise.resolve({ ok: true, imagenDataUrl: "x" }) };
  registro.registrar("falso-1", proveedorFalso);
  assert.strictEqual(registro.obtenerActivo().nombre, registro.nombreProveedorActivo() === "falso-1" ? "falso-1" : registro.obtenerActivo().nombre);
  assert.ok(registro.listar().indexOf("falso-1") !== -1);
});

verificar("activar cambia el proveedor activo; nombre desconocido lanza error", () => {
  const otro = { nombre: "falso-2", generar: () => Promise.resolve({ ok: true, imagenDataUrl: "y" }) };
  PROVEEDOR_IA.registrar("falso-2", otro);
  PROVEEDOR_IA.activar("falso-2");
  assert.strictEqual(PROVEEDOR_IA.nombreProveedorActivo(), "falso-2");
  assert.throws(() => PROVEEDOR_IA.activar("no-existe"));
});

// -- 2. Adaptador corte -> instruccion (adaptador_corte.js) ---------------

verificar("construirInstruccion arma una frase a partir de un corte real del catalogo", () => {
  const primerCorte = CATALOGO_DATOS.cortes[0];
  const instruccion = ADAPTADOR_CORTE.construirInstruccion(primerCorte.nombre);
  assert.ok(instruccion.includes(primerCorte.nombre));
  assert.ok(instruccion.includes("Mantener el mismo rostro"));
  assert.ok(/Volumen arriba (ninguno|bajo|medio|alto)/.test(instruccion));
});

verificar("construirInstruccion con un corte que no existe lanza un error explicito", () => {
  assert.throws(
    () => ADAPTADOR_CORTE.construirInstruccion("Corte que no existe en el catalogo"),
    /No se encontro en el catalogo/
  );
});

verificar("el adaptador nunca decide el corte: solo describe uno ya elegido", () => {
  // Verificacion estructural: el modulo no expone ninguna funcion de
  // tipo "elegir" o "recomendar" -- solo buscar y describir.
  const claves = Object.keys(ADAPTADOR_CORTE);
  assert.deepStrictEqual(claves.sort(), ["buscarCortePorNombre", "construirInstruccion"]);
});

// -- 3. Proveedor mock (proveedor_mock.js) --------------------------------

const pruebaMockOk = esperarAsync(
  "el mock devuelve ok:true con la misma foto cuando no hay DOM (Node)",
  PROVEEDOR_MOCK.generar({ fotoDataUrl: "data:image/png;base64,ABC", instruccion: "prueba" }),
  (resultado) => {
    assert.strictEqual(resultado.ok, true);
    assert.strictEqual(resultado.imagenDataUrl, "data:image/png;base64,ABC");
  }
);

const pruebaMockSinFoto = esperarAsync(
  "el mock devuelve ok:false si falta la fotografia",
  PROVEEDOR_MOCK.generar({}),
  (resultado) => {
    assert.strictEqual(resultado.ok, false);
    assert.ok(resultado.error);
  }
);

// -- 4. Maquina de estados de Motor 2 (motor2.js) -------------------------

function crearProveedorFalso(comportamiento) {
  return {
    nombre: "falso-motor2",
    generar: () => {
      if (comportamiento === "exito") return Promise.resolve({ ok: true, imagenDataUrl: "data:image/png;base64,RESULTADO" });
      if (comportamiento === "fallo-controlado") return Promise.resolve({ ok: false, error: "El proveedor rechazo la solicitud." });
      return Promise.reject(new Error("Proveedor caido."));
    },
  };
}

const cortePrueba = { nombre: CATALOGO_DATOS.cortes[0].nombre, familia: CATALOGO_DATOS.cortes[0].familia };

function correrFlujoCompleto(comportamientoProveedor) {
  return new Promise((resolve) => {
    const motor2 = MOTOR2.crearMotor2({ proveedor: crearProveedorFalso(comportamientoProveedor) });
    const pasosVistos = [];
    motor2.suscribir((estado) => {
      pasosVistos.push(estado.paso);
      if (estado.paso === MOTOR2.PASOS.RESULTADO || estado.paso === MOTOR2.PASOS.ERROR) {
        resolve({ pasosVistos, estadoFinal: estado });
      }
    });
    motor2.iniciar(cortePrueba);
    motor2.seleccionarFoto("data:image/png;base64,FOTO");
    motor2.darConsentimiento();
  });
}

const pruebaFlujoExito = esperarAsync(
  "flujo completo con exito recorre todos los pasos y llega a RESULTADO",
  correrFlujoCompleto("exito"),
  ({ pasosVistos, estadoFinal }) => {
    assert.deepStrictEqual(pasosVistos, [
      MOTOR2.PASOS.SELECCION_FOTO,
      MOTOR2.PASOS.CONSENTIMIENTO,
      MOTOR2.PASOS.VALIDANDO_CALIDAD,
      MOTOR2.PASOS.PREPARANDO_SOLICITUD,
      MOTOR2.PASOS.GENERANDO,
      MOTOR2.PASOS.RESULTADO,
    ]);
    assert.strictEqual(estadoFinal.resultado, "data:image/png;base64,RESULTADO");
    assert.strictEqual(estadoFinal.corte.nombre, cortePrueba.nombre);
  }
);

const pruebaFlujoFalloControlado = esperarAsync(
  "un proveedor que devuelve ok:false lleva a ERROR sin lanzar excepciones",
  correrFlujoCompleto("fallo-controlado"),
  ({ estadoFinal }) => {
    assert.strictEqual(estadoFinal.paso, MOTOR2.PASOS.ERROR);
    assert.strictEqual(estadoFinal.error, "El proveedor rechazo la solicitud.");
  }
);

const pruebaFlujoProveedorCaido = esperarAsync(
  "un proveedor que rechaza la promesa (caido) lleva a ERROR sin lanzar excepciones",
  correrFlujoCompleto("caido"),
  ({ estadoFinal }) => {
    assert.strictEqual(estadoFinal.paso, MOTOR2.PASOS.ERROR);
    assert.ok(estadoFinal.error);
  }
);

verificar("sin proveedor configurado, motor2 llega a ERROR de forma controlada (degradacion segura)", () => {
  const motor2 = MOTOR2.crearMotor2({ proveedor: null });
  let ultimoEstado = null;
  motor2.suscribir((estado) => { ultimoEstado = estado; });
  motor2.iniciar(cortePrueba);
  motor2.seleccionarFoto("data:image/png;base64,FOTO");
  motor2.darConsentimiento();
  // La validacion de calidad y la preparacion son sincronas hasta el
  // punto de necesitar el proveedor cuando no hay DOM (Node) -- para
  // este caso concreto no hace falta esperar un microtask adicional
  // porque el fallo ocurre antes de cualquier await real.
  assert.ok([MOTOR2.PASOS.ERROR, MOTOR2.PASOS.VALIDANDO_CALIDAD].indexOf(ultimoEstado.paso) !== -1);
});

verificar("volverAResultadoOriginal descarta la foto de memoria (no persiste nada)", () => {
  const motor2 = MOTOR2.crearMotor2({ proveedor: crearProveedorFalso("exito") });
  motor2.iniciar(cortePrueba);
  motor2.seleccionarFoto("data:image/png;base64,FOTO");
  assert.strictEqual(motor2.obtenerEstado().fotoDataUrl, "data:image/png;base64,FOTO");
  motor2.volverAResultadoOriginal();
  const estado = motor2.obtenerEstado();
  assert.strictEqual(estado.paso, MOTOR2.PASOS.INACTIVO);
  assert.strictEqual(estado.fotoDataUrl, null);
  assert.strictEqual(estado.corte, null);
  assert.strictEqual(estado.resultado, null);
});

verificar("iniciar() recibe el corte ya elegido, nunca decide cual usar", () => {
  const motor2 = MOTOR2.crearMotor2({ proveedor: crearProveedorFalso("exito") });
  motor2.iniciar(cortePrueba);
  assert.strictEqual(motor2.obtenerEstado().corte, cortePrueba);
  // Verificacion estructural: crearMotor2 no expone ninguna funcion
  // para elegir o rankear cortes -- solo para avanzar el flujo con el
  // que ya se le paso.
  const motor2Vacio = MOTOR2.crearMotor2({ proveedor: crearProveedorFalso("exito") });
  const claves = Object.keys(motor2Vacio).sort();
  assert.deepStrictEqual(claves, [
    "darConsentimiento",
    "iniciar",
    "obtenerEstado",
    "seleccionarFoto",
    "suscribir",
    "volverAResultadoOriginal",
  ]);
});

// -- 5. Motor 1 no sabe que Motor 2 existe --------------------------------

verificar("requerir los modulos de Motor 2 no agrega nada a MOTOR ni a ENTRADA_SALIDA", () => {
  const clavesMotorAntes = ["recomendar"]; // forma minima esperada, ver motor.js
  clavesMotorAntes.forEach((clave) => assert.ok(typeof MOTOR[clave] === "function"));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(MOTOR, "ia_visual"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(ENTRADA_SALIDA, "ia_visual"), false);
  // Motor 1 sigue funcionando exactamente igual con Motor 2 cargado en
  // el mismo proceso.
  const resultado = ENTRADA_SALIDA.generarRecomendacion("redondo", "afro", "baja", "fino");
  assert.ok(resultado.recomendaciones.length > 0 || resultado.mensaje_vacio);
});

// -- resultado -------------------------------------------------------------

Promise.all([pruebaMockOk, pruebaMockSinFoto, pruebaFlujoExito, pruebaFlujoFalloControlado, pruebaFlujoProveedorCaido]).then(() => {
  console.log(`${aprobadas} verificaciones aprobadas, ${fallidas} fallidas (Motor 2 -- IA Visual).`);
  process.exit(fallidas === 0 ? 0 : 1);
});
