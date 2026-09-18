// Backend VISAGE -- unico punto donde vive la clave de Gemini.
//
// Este servicio es deliberadamente delgado: un solo endpoint HTTP,
// sin base de datos, sin sesiones, sin logica de negocio propia. No
// decide que corte es correcto (eso ya lo decidio Motor 1) ni analiza
// nada del rostro/cabello -- solo reenvia una foto + una instruccion
// ya armada por adaptador_corte.js hacia Gemini, y devuelve el
// resultado en el mismo contrato que ya espera motor2.js:
//   { ok: true, imagenDataUrl } | { ok: false, error }
//
// Solo libreria estandar de Node (http, https via fetch global) --
// cero dependencias, mismo espiritu que el resto del proyecto.
//
// Dependencias inyectables (llamarGemini, ahora, log) para poder
// probar el servidor completo con un Gemini simulado, sin red real --
// mismo patron que ya usa motor2.js con proveedores inyectados.

"use strict";

const http = require("http");

const MODELO = "gemini-3-pro-image";
const VERSION_API = "v1beta";
const ENDPOINT_GEMINI = `https://generativelanguage.googleapis.com/${VERSION_API}/models/${MODELO}:generateContent`;

const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB, ver docs/INTEGRACION_NANO_BANANA_PRO.md
const MIME_PERMITIDOS = new Set(["image/jpeg", "image/png"]);
const TIMEOUT_GEMINI_MS = 28000;
const LONGITUD_MAXIMA_INSTRUCCION = 2000;

// -- Llamada real a Gemini (produccion) -----------------------------------

function extraerMimeYBase64(dataUrl) {
  const coincidencia = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!coincidencia) return null;
  return { mime: coincidencia[1], base64: coincidencia[2] };
}

async function llamarGeminiReal(datos, claveApi) {
  const { fotoMime, fotoBase64, instruccion } = datos;
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_GEMINI_MS);

  try {
    const respuesta = await fetch(ENDPOINT_GEMINI, {
      method: "POST",
      signal: controlador.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": claveApi,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: instruccion },
              { inlineData: { mimeType: fotoMime, data: fotoBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { imageSize: "2K" },
        },
      }),
    });

    if (!respuesta.ok) {
      return { ok: false, error: `El proveedor respondio con estado ${respuesta.status}.` };
    }

    const cuerpo = await respuesta.json();
    const partes = cuerpo?.candidates?.[0]?.content?.parts || [];
    const parteImagen = partes.find((p) => p.inlineData && p.inlineData.data);

    if (!parteImagen) {
      return { ok: false, error: "El proveedor no devolvio ninguna imagen generada." };
    }

    const mimeSalida = parteImagen.inlineData.mimeType || "image/png";
    return { ok: true, imagenDataUrl: `data:${mimeSalida};base64,${parteImagen.inlineData.data}` };
  } catch (error) {
    if (error.name === "AbortError") {
      return { ok: false, error: "Tiempo de espera agotado generando la visualizacion." };
    }
    return { ok: false, error: "No se pudo contactar al proveedor de IA visual." };
  } finally {
    clearTimeout(temporizador);
  }
}

// -- Validacion de la solicitud entrante -----------------------------------

function validarSolicitud(cuerpo) {
  if (!cuerpo || typeof cuerpo !== "object") {
    return { valida: false, error: "Cuerpo de solicitud invalido." };
  }
  const { fotoDataUrl, instruccion, nombreCorte } = cuerpo;

  const datosFoto = extraerMimeYBase64(fotoDataUrl);
  if (!datosFoto) {
    return { valida: false, error: "Falta la fotografia o no tiene un formato valido." };
  }
  if (!MIME_PERMITIDOS.has(datosFoto.mime)) {
    return { valida: false, error: "Formato de imagen no admitido (solo JPEG o PNG)." };
  }
  // Tamano aproximado del binario original a partir del base64.
  const tamanoAproximado = Math.floor((datosFoto.base64.length * 3) / 4);
  if (tamanoAproximado > TAMANO_MAXIMO_BYTES) {
    return { valida: false, error: "La fotografia excede el tamano maximo permitido (8 MB)." };
  }
  if (typeof instruccion !== "string" || !instruccion.trim()) {
    return { valida: false, error: "Falta la instruccion del corte." };
  }
  if (instruccion.length > LONGITUD_MAXIMA_INSTRUCCION) {
    return { valida: false, error: "La instruccion del corte es demasiado larga." };
  }
  if (typeof nombreCorte !== "string" || !nombreCorte.trim()) {
    return { valida: false, error: "Falta el nombre del corte." };
  }

  return {
    valida: true,
    datos: { fotoMime: datosFoto.mime, fotoBase64: datosFoto.base64, instruccion, nombreCorte },
  };
}

// -- Limitador de tasa muy simple, por IP, en memoria ----------------------
// Nota honesta: Cloud Run puede correr varias instancias, asi que este
// contador NO es un limite global estricto -- es una primera capa
// barata. El limite de gasto real debe venir de Budget Alerts en GCP
// (ver docs/INTEGRACION_NANO_BANANA_PRO.md), no de este contador.

function crearLimitadorTasa(maximoPorMinuto) {
  const contadores = new Map();
  return function permitido(ip) {
    const ahoraMs = Date.now();
    const ventana = Math.floor(ahoraMs / 60000);
    const clave = `${ip}:${ventana}`;
    const actual = (contadores.get(clave) || 0) + 1;
    contadores.set(clave, actual);
    // Limpieza perezosa de ventanas viejas.
    if (contadores.size > 1000) {
      for (const k of contadores.keys()) {
        if (!k.endsWith(`:${ventana}`)) contadores.delete(k);
      }
    }
    return actual <= maximoPorMinuto;
  };
}

// -- Manejador principal (testeable, sin HTTP real) ------------------------

async function manejarGeneracion(cuerpoJson, dependencias) {
  const { llamarGemini, claveApi, log } = dependencias;
  const inicio = Date.now();

  const validacion = validarSolicitud(cuerpoJson);
  if (!validacion.valida) {
    log({ resultado: "rechazada", motivo: validacion.error, duracionMs: Date.now() - inicio });
    return { estadoHttp: 400, cuerpo: { ok: false, error: validacion.error } };
  }

  if (!claveApi) {
    log({ resultado: "error", motivo: "sin credencial configurada", duracionMs: Date.now() - inicio });
    return { estadoHttp: 500, cuerpo: { ok: false, error: "El servicio no esta configurado correctamente." } };
  }

  const resultado = await llamarGemini(validacion.datos, claveApi);

  // Nunca se loguea la foto, la clave, ni el contenido de la imagen
  // generada -- solo metadatos no sensibles.
  log({
    resultado: resultado.ok ? "exito" : "error",
    nombreCorte: validacion.datos.nombreCorte,
    duracionMs: Date.now() - inicio,
    ...(resultado.ok ? {} : { motivo: resultado.error }),
  });

  return { estadoHttp: 200, cuerpo: resultado };
}

// -- Servidor HTTP -----------------------------------------------------------

function crearServidor(opciones) {
  opciones = opciones || {};
  const claveApi = opciones.claveApi !== undefined ? opciones.claveApi : process.env.GEMINI_AUTH_KEY;
  const origenPermitido = opciones.origenPermitido || process.env.ALLOWED_ORIGIN || "";
  const llamarGemini = opciones.llamarGemini || ((datos, clave) => llamarGeminiReal(datos, clave));
  const log = opciones.log || ((info) => console.log(JSON.stringify({ ts: new Date().toISOString(), ...info })));
  const limiteTasaPorMinuto = opciones.limiteTasaPorMinuto || 10;
  const permitidoPorTasa = crearLimitadorTasa(limiteTasaPorMinuto);

  return http.createServer((req, res) => {
    const origen = req.headers.origin || "";
    if (origenPermitido && origen === origenPermitido) {
      res.setHeader("Access-Control-Allow-Origin", origen);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== "POST" || req.url !== "/generar") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Ruta no encontrada." }));
      return;
    }

    const ip = req.socket.remoteAddress || "desconocida";
    if (!permitidoPorTasa(ip)) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Demasiadas solicitudes, intenta de nuevo en un minuto." }));
      return;
    }

    const trozos = [];
    let bytesRecibidos = 0;
    req.on("data", (trozo) => {
      bytesRecibidos += trozo.length;
      if (bytesRecibidos > TAMANO_MAXIMO_BYTES * 2) {
        // *2 porque base64 infla el tamano original ~33%, mas margen JSON.
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Solicitud demasiado grande." }));
        req.destroy();
        return;
      }
      trozos.push(trozo);
    });

    req.on("end", async () => {
      if (res.writableEnded) return;
      let cuerpoJson;
      try {
        cuerpoJson = JSON.parse(Buffer.concat(trozos).toString("utf8"));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "El cuerpo de la solicitud no es JSON valido." }));
        return;
      }

      const resultado = await manejarGeneracion(cuerpoJson, { llamarGemini, claveApi, log });
      res.writeHead(resultado.estadoHttp, { "Content-Type": "application/json" });
      res.end(JSON.stringify(resultado.cuerpo));
    });

    req.on("error", () => {
      // El cliente corto la conexion (ej. boton "Cancelar" del panel de
      // Motor 2) -- no hay nada que responder, no se factura mas de lo
      // que ya se hizo.
    });
  });
}

if (require.main === module) {
  const puerto = process.env.PORT || 8080;
  const servidor = crearServidor({});
  servidor.listen(puerto, () => {
    console.log(`Backend VISAGE escuchando en el puerto ${puerto}`);
  });
}

module.exports = {
  crearServidor,
  manejarGeneracion,
  validarSolicitud,
  extraerMimeYBase64,
  crearLimitadorTasa,
  MODELO,
  VERSION_API,
  ENDPOINT_GEMINI,
  TAMANO_MAXIMO_BYTES,
};
