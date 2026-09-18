// Pruebas del backend VISAGE. Cero red real: `llamarGemini` se
// inyecta simulado en cada caso (exito, error, timeout, respuesta
// invalida) -- mismo patron que ya usa tests_js/test_motor2.js con
// proveedores falsos. Node puro, sin dependencias.
//
// Ejecutar: node backend/test_servidor.js

"use strict";

const assert = require("assert");
const http = require("http");

const {
  crearServidor,
  manejarGeneracion,
  validarSolicitud,
  extraerMimeYBase64,
  crearLimitadorTasa,
} = require("./servidor.js");

let aprobadas = 0;
let fallidas = 0;

async function verificar(descripcion, fn) {
  try {
    await fn();
    aprobadas += 1;
  } catch (error) {
    fallidas += 1;
    console.error(`FALLO: ${descripcion}`);
    console.error(`   ${error.message}`);
  }
}

const FOTO_VALIDA = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="; // fragmento base64 valido como formato, no una foto real
const SOLICITUD_VALIDA = { fotoDataUrl: FOTO_VALIDA, instruccion: "Corte de prueba", nombreCorte: "Corte X" };

async function ejecutarPruebas() {

// -- Validacion de la solicitud --------------------------------------------

await verificar("extraerMimeYBase64 reconoce un data URL valido", async () => {
  const r = extraerMimeYBase64(FOTO_VALIDA);
  assert.strictEqual(r.mime, "image/jpeg");
});

await verificar("extraerMimeYBase64 devuelve null si no es un data URL", async () => {
  assert.strictEqual(extraerMimeYBase64("no-es-una-foto"), null);
  assert.strictEqual(extraerMimeYBase64(undefined), null);
});

await verificar("validarSolicitud rechaza sin fotografia", async () => {
  const r = validarSolicitud({ instruccion: "x", nombreCorte: "y" });
  assert.strictEqual(r.valida, false);
});

await verificar("validarSolicitud rechaza MIME no admitido", async () => {
  const r = validarSolicitud({
    fotoDataUrl: "data:image/gif;base64,AAAA",
    instruccion: "x",
    nombreCorte: "y",
  });
  assert.strictEqual(r.valida, false);
  assert.ok(/no admitido/.test(r.error));
});

await verificar("validarSolicitud rechaza fotografia demasiado grande", async () => {
  const base64Enorme = "A".repeat(12 * 1024 * 1024); // simula > 8MB decodificado
  const r = validarSolicitud({
    fotoDataUrl: `data:image/jpeg;base64,${base64Enorme}`,
    instruccion: "x",
    nombreCorte: "y",
  });
  assert.strictEqual(r.valida, false);
  assert.ok(/tamano maximo/.test(r.error));
});

await verificar("validarSolicitud rechaza sin instruccion", async () => {
  const r = validarSolicitud({ fotoDataUrl: FOTO_VALIDA, nombreCorte: "y" });
  assert.strictEqual(r.valida, false);
});

await verificar("validarSolicitud acepta una solicitud completa y valida", async () => {
  const r = validarSolicitud(SOLICITUD_VALIDA);
  assert.strictEqual(r.valida, true);
  assert.strictEqual(r.datos.nombreCorte, "Corte X");
});

// -- manejarGeneracion (sin HTTP, logica pura) ------------------------------

await verificar("manejarGeneracion: exito, devuelve 200 y ok:true", async () => {
  const logs = [];
  const resultado = await manejarGeneracion(SOLICITUD_VALIDA, {
    claveApi: "clave-de-prueba",
    llamarGemini: async () => ({ ok: true, imagenDataUrl: "data:image/png;base64,RESULTADO" }),
    log: (info) => logs.push(info),
  });
  assert.strictEqual(resultado.estadoHttp, 200);
  assert.strictEqual(resultado.cuerpo.ok, true);
  assert.strictEqual(resultado.cuerpo.imagenDataUrl, "data:image/png;base64,RESULTADO");
  assert.strictEqual(logs[0].resultado, "exito");
  // El log nunca debe contener la foto ni la clave.
  assert.ok(!JSON.stringify(logs[0]).includes("clave-de-prueba"));
  assert.ok(!JSON.stringify(logs[0]).includes(FOTO_VALIDA));
});

await verificar("manejarGeneracion: solicitud invalida nunca llega a llamar a Gemini", async () => {
  let llamado = false;
  const resultado = await manejarGeneracion({ instruccion: "x" }, {
    claveApi: "clave-de-prueba",
    llamarGemini: async () => { llamado = true; return { ok: true, imagenDataUrl: "x" }; },
    log: () => {},
  });
  assert.strictEqual(resultado.estadoHttp, 400);
  assert.strictEqual(resultado.cuerpo.ok, false);
  assert.strictEqual(llamado, false);
});

await verificar("manejarGeneracion: error controlado del proveedor (ok:false) se propaga sin lanzar", async () => {
  const resultado = await manejarGeneracion(SOLICITUD_VALIDA, {
    claveApi: "clave-de-prueba",
    llamarGemini: async () => ({ ok: false, error: "El proveedor rechazo la solicitud." }),
    log: () => {},
  });
  assert.strictEqual(resultado.cuerpo.ok, false);
  assert.strictEqual(resultado.cuerpo.error, "El proveedor rechazo la solicitud.");
});

await verificar("manejarGeneracion: timeout simulado se maneja sin lanzar excepciones", async () => {
  const resultado = await manejarGeneracion(SOLICITUD_VALIDA, {
    claveApi: "clave-de-prueba",
    llamarGemini: async () => ({ ok: false, error: "Tiempo de espera agotado generando la visualizacion." }),
    log: () => {},
  });
  assert.strictEqual(resultado.cuerpo.ok, false);
  assert.ok(/Tiempo de espera/.test(resultado.cuerpo.error));
});

await verificar("manejarGeneracion: respuesta invalida del proveedor (sin imagen) se normaliza a error", async () => {
  const resultado = await manejarGeneracion(SOLICITUD_VALIDA, {
    claveApi: "clave-de-prueba",
    llamarGemini: async () => ({ ok: false, error: "El proveedor no devolvio ninguna imagen generada." }),
    log: () => {},
  });
  assert.strictEqual(resultado.cuerpo.ok, false);
});

await verificar("manejarGeneracion: sin credencial configurada, error controlado (nunca revienta)", async () => {
  const resultado = await manejarGeneracion(SOLICITUD_VALIDA, {
    claveApi: "",
    llamarGemini: async () => ({ ok: true, imagenDataUrl: "no deberia llegar aqui" }),
    log: () => {},
  });
  assert.strictEqual(resultado.estadoHttp, 500);
  assert.strictEqual(resultado.cuerpo.ok, false);
});

// -- Limitador de tasa -------------------------------------------------------

await verificar("crearLimitadorTasa bloquea despues del maximo por minuto", async () => {
  const permitido = crearLimitadorTasa(3);
  assert.strictEqual(permitido("1.2.3.4"), true);
  assert.strictEqual(permitido("1.2.3.4"), true);
  assert.strictEqual(permitido("1.2.3.4"), true);
  assert.strictEqual(permitido("1.2.3.4"), false);
  // Otra IP no se ve afectada.
  assert.strictEqual(permitido("9.9.9.9"), true);
});

// -- Servidor HTTP real (localhost), con Gemini simulado -------------------

function peticion(servidor, opciones, cuerpo) {
  return new Promise((resolve, reject) => {
    const direccion = servidor.address();
    const req = http.request(
      { host: "127.0.0.1", port: direccion.port, method: opciones.method || "POST", path: opciones.path || "/generar", headers: opciones.headers || { "Content-Type": "application/json" } },
      (res) => {
        const trozos = [];
        res.on("data", (t) => trozos.push(t));
        res.on("end", () => {
          const texto = Buffer.concat(trozos).toString("utf8");
          let json = null;
          try { json = JSON.parse(texto); } catch (e) { /* no siempre hay cuerpo JSON */ }
          resolve({ estado: res.statusCode, headers: res.headers, cuerpo: json, texto });
        });
      }
    );
    req.on("error", reject);
    if (cuerpo !== undefined) req.write(JSON.stringify(cuerpo));
    req.end();
  });
}

await verificar("servidor HTTP real: flujo completo VISAGE -> backend -> [Gemini simulado] -> backend -> VISAGE", async () => {
  const servidor = crearServidor({
    claveApi: "clave-de-prueba-nunca-real",
    origenPermitido: "https://wicasheredia-arch.github.io",
    llamarGemini: async (datos) => {
      assert.strictEqual(datos.fotoMime, "image/jpeg");
      assert.strictEqual(datos.instruccion, SOLICITUD_VALIDA.instruccion);
      return { ok: true, imagenDataUrl: "data:image/png;base64,SIMULADO_OK" };
    },
    log: () => {},
  });
  await new Promise((resolve) => servidor.listen(0, resolve));
  try {
    const respuesta = await peticion(servidor, { headers: { "Content-Type": "application/json", Origin: "https://wicasheredia-arch.github.io" } }, SOLICITUD_VALIDA);
    assert.strictEqual(respuesta.estado, 200);
    assert.strictEqual(respuesta.cuerpo.ok, true);
    assert.strictEqual(respuesta.cuerpo.imagenDataUrl, "data:image/png;base64,SIMULADO_OK");
    assert.strictEqual(respuesta.headers["access-control-allow-origin"], "https://wicasheredia-arch.github.io");
  } finally {
    servidor.close();
  }
});

await verificar("servidor HTTP real: origen no permitido no recibe el header CORS", async () => {
  const servidor = crearServidor({
    claveApi: "x",
    origenPermitido: "https://wicasheredia-arch.github.io",
    llamarGemini: async () => ({ ok: true, imagenDataUrl: "x" }),
    log: () => {},
  });
  await new Promise((resolve) => servidor.listen(0, resolve));
  try {
    const respuesta = await peticion(servidor, { headers: { "Content-Type": "application/json", Origin: "https://sitio-ajeno.example" } }, SOLICITUD_VALIDA);
    assert.strictEqual(respuesta.headers["access-control-allow-origin"], undefined);
  } finally {
    servidor.close();
  }
});

await verificar("servidor HTTP real: ruta desconocida devuelve 404", async () => {
  const servidor = crearServidor({ claveApi: "x", llamarGemini: async () => ({ ok: true, imagenDataUrl: "x" }), log: () => {} });
  await new Promise((resolve) => servidor.listen(0, resolve));
  try {
    const respuesta = await peticion(servidor, { path: "/otra-ruta" }, SOLICITUD_VALIDA);
    assert.strictEqual(respuesta.estado, 404);
  } finally {
    servidor.close();
  }
});

await verificar("servidor HTTP real: rate limiting devuelve 429 al superar el limite", async () => {
  const servidor = crearServidor({
    claveApi: "x",
    llamarGemini: async () => ({ ok: true, imagenDataUrl: "x" }),
    log: () => {},
    limiteTasaPorMinuto: 2,
  });
  await new Promise((resolve) => servidor.listen(0, resolve));
  try {
    await peticion(servidor, {}, SOLICITUD_VALIDA);
    await peticion(servidor, {}, SOLICITUD_VALIDA);
    const tercera = await peticion(servidor, {}, SOLICITUD_VALIDA);
    assert.strictEqual(tercera.estado, 429);
  } finally {
    servidor.close();
  }
});

await verificar("servidor HTTP real: la clave de API nunca aparece en la respuesta al cliente", async () => {
  const CLAVE_SECRETA = "SUPER-SECRETA-1234567890";
  const servidor = crearServidor({
    claveApi: CLAVE_SECRETA,
    llamarGemini: async () => ({ ok: true, imagenDataUrl: "data:image/png;base64,OK" }),
    log: () => {},
  });
  await new Promise((resolve) => servidor.listen(0, resolve));
  try {
    const respuesta = await peticion(servidor, {}, SOLICITUD_VALIDA);
    assert.ok(!respuesta.texto.includes(CLAVE_SECRETA), "la clave no debe aparecer en el cuerpo de la respuesta");
    assert.ok(!JSON.stringify(respuesta.headers).includes(CLAVE_SECRETA), "la clave no debe aparecer en ningun header de respuesta");
  } finally {
    servidor.close();
  }
});

}

ejecutarPruebas().then(() => {
  console.log(`${aprobadas} verificaciones aprobadas, ${fallidas} fallidas (backend VISAGE).`);
  process.exit(fallidas === 0 ? 0 : 1);
});
