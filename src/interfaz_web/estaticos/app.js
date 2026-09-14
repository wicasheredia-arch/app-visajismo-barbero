"use strict";

// Capa de PRESENTACION del asistente VISAGE (version servida por
// Python). No calcula nada de visagismo: pide los datos a
// /api/opciones y /api/recomendacion (backend en src/entrada_salida,
// sin tocar) y solo decide como mostrarlos.

const CAMPOS = ["forma_rostro", "textura", "densidad", "grosor"];

const ETIQUETAS_PASO = {
  forma_rostro: "Forma del rostro",
  textura: "Textura del cabello",
  densidad: "Densidad",
  grosor: "Grosor",
};

const PREGUNTAS_PASO = {
  forma_rostro: "¿Qué forma de rostro tiene el cliente?",
  textura: "¿Qué textura de cabello tiene?",
  densidad: "¿Qué densidad de cabello tiene?",
  grosor: "¿Qué grosor de cabello tiene?",
};

const GLIFOS_POR_CAMPO = {
  forma_rostro: ICONOS.ROSTRO,
  textura: ICONOS.TEXTURA,
  densidad: ICONOS.DENSIDAD,
  grosor: ICONOS.GROSOR,
};

const ETIQUETA_TEXTO = { solido: "Sólido", aceptable: "Aceptable", debil: "Débil" };

// Correccion tipografica de presentacion (acentos), nunca usada para
// calcular nada -- ver equivalente en web_estatico/js/app.js.
const CORRECCION_TIPOGRAFICA = { Corazon: "Corazón" };
function etiquetaVisible(texto) {
  return CORRECCION_TIPOGRAFICA[texto] || texto;
}

let opciones = null;
let paso = 0;
const seleccion = { forma_rostro: null, textura: null, densidad: null, grosor: null };

const el = (id) => document.getElementById(id);

function opcionPorValor(campo, valor) {
  return opciones[campo].find((o) => o.valor === valor);
}

el("marca-logo").innerHTML = ICONOS.LOGO;
el("nota-pie").innerHTML = ICONOS.UTIL.info + " Calculado por el motor de visagismo en el servidor.";

async function cargarOpciones() {
  const respuesta = await fetch("/api/opciones");
  if (!respuesta.ok) throw new Error("No se pudieron cargar las opciones.");
  opciones = await respuesta.json();
}

function mostrarSeccion(idVisible) {
  ["asistente", "cargando", "resultados"].forEach((id) => {
    el(id).hidden = id !== idVisible;
  });
  el("stepper").hidden = idVisible !== "asistente";
}

function ocultarError() {
  el("error-global").hidden = true;
}

function mostrarError(mensaje) {
  el("error-global").innerHTML = ICONOS.UTIL.error + `<span>${mensaje}</span>`;
  el("error-global").hidden = false;
}

function renderPaso() {
  ocultarError();
  mostrarSeccion("asistente");

  const campo = CAMPOS[paso];
  el("eyebrow-paso").textContent = `Paso ${paso + 1} de ${CAMPOS.length} — ${ETIQUETAS_PASO[campo]}`;
  el("titulo-paso").textContent = PREGUNTAS_PASO[campo];

  const contenedor = el("opciones-paso");
  contenedor.innerHTML = "";
  const glifos = GLIFOS_POR_CAMPO[campo];

  opciones[campo].forEach((opcion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tarjeta-opcion";
    if (seleccion[campo] === opcion.valor) boton.classList.add("seleccionada");
    boton.setAttribute("aria-pressed", seleccion[campo] === opcion.valor ? "true" : "false");
    boton.innerHTML =
      `<span class="glifo">${glifos[opcion.valor] || ""}</span>` +
      `<span>${etiquetaVisible(opcion.etiqueta)}</span>` +
      `<span class="marca-check">${ICONOS.UTIL.check}</span>`;
    boton.addEventListener("click", () => seleccionar(campo, opcion.valor));
    contenedor.appendChild(boton);
  });

  actualizarStepper();
  actualizarNavegacion();
}

function seleccionar(campo, valor) {
  seleccion[campo] = valor;
  renderPaso();
}

function actualizarStepper() {
  const avance = (paso / (CAMPOS.length - 1)) * 100;
  el("stepper").style.setProperty("--avance", `${avance}%`);
  document.querySelectorAll("#stepper .paso").forEach((li, indice) => {
    li.classList.toggle("activo", indice === paso);
    li.classList.toggle("completo", indice < paso);
  });
}

function actualizarNavegacion() {
  const campoActual = CAMPOS[paso];
  const btnAtras = el("btn-atras");
  btnAtras.hidden = paso === 0;
  btnAtras.innerHTML = ICONOS.UTIL.flecha + "<span>Atrás</span>";
  el("btn-siguiente").disabled = !seleccion[campoActual];
  el("btn-siguiente").textContent = paso === CAMPOS.length - 1 ? "Generar recomendaciones" : "Siguiente";
}

el("btn-atras").addEventListener("click", () => {
  paso = Math.max(0, paso - 1);
  renderPaso();
});

el("btn-siguiente").addEventListener("click", () => {
  if (paso < CAMPOS.length - 1) {
    paso += 1;
    renderPaso();
  } else {
    generarRecomendaciones();
  }
});

el("btn-reiniciar").addEventListener("click", () => {
  paso = 0;
  CAMPOS.forEach((campo) => { seleccion[campo] = null; });
  renderPaso();
});

async function generarRecomendaciones() {
  mostrarSeccion("cargando");
  try {
    const respuesta = await fetch("/api/recomendacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rostro: seleccion.forma_rostro,
        textura: seleccion.textura,
        densidad: seleccion.densidad,
        grosor: seleccion.grosor,
      }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      renderPaso();
      mostrarError(datos.error || "Ocurrió un error inesperado.");
      return;
    }
    mostrarResultados(datos);
  } catch (error) {
    renderPaso();
    mostrarError("No se pudo conectar con el servidor.");
  }
}

function renderResumenDiagnostico() {
  const contenedor = el("resumen-diagnostico");
  contenedor.innerHTML = "";
  CAMPOS.forEach((campo) => {
    const opcion = opcionPorValor(campo, seleccion[campo]);
    const glifo = GLIFOS_POR_CAMPO[campo][seleccion[campo]] || "";
    const item = document.createElement("div");
    item.className = "resumen-item";
    item.innerHTML =
      `<span class="glifo">${glifo}</span>` +
      `<span class="resumen-etiqueta">${ETIQUETAS_PASO[campo]}</span>` +
      `<span class="resumen-valor">${opcion ? etiquetaVisible(opcion.etiqueta) : "—"}</span>`;
    contenedor.appendChild(item);
  });
}

function mostrarResultados(datos) {
  mostrarSeccion("resultados");
  renderResumenDiagnostico();

  const bloqueRecomendaciones = el("bloque-recomendaciones");
  const vacio = el("mensaje-vacio");
  const lista = el("lista-recomendaciones");
  lista.innerHTML = "";

  if (datos.mensaje_vacio) {
    bloqueRecomendaciones.hidden = true;
    vacio.innerHTML = ICONOS.UTIL.advertencia + `<span>${datos.mensaje_vacio}</span>`;
    vacio.hidden = false;
    return;
  }

  vacio.hidden = true;
  bloqueRecomendaciones.hidden = false;
  datos.recomendaciones.forEach((rec, indice) => {
    lista.appendChild(crearTarjetaRecomendacion(rec, indice + 1));
  });

  // Punto de extension preparado para una futura etapa (no
  // implementada aun, sin datos ficticios): ver la misma nota en
  // web_estatico/js/app.js -- aqui se podria anadir, por
  // recomendacion, un bloque "Acabado sugerido" reutilizando
  // .bloque-porque cuando exista un dato real del motor para ello.
}

function crearBloque(titulo, texto) {
  const div = document.createElement("div");
  div.className = "bloque-porque";
  div.innerHTML = `<span class="subtitulo-bloque">${titulo}</span><p>${texto}</p>`;
  return div;
}

function crearTarjetaRecomendacion(rec, posicion) {
  const esTop = posicion === 1;
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-recomendacion" + (esTop ? " tarjeta-recomendacion--top" : "");
  tarjeta.style.setProperty("--retraso", `${(posicion - 1) * 90}ms`);

  const cabecera = document.createElement("div");
  cabecera.className = "tarjeta-recomendacion-cabecera";

  const numeral = document.createElement("span");
  numeral.className = "numeral";
  numeral.textContent = `0${posicion}`;

  const titulos = document.createElement("div");
  titulos.className = "tarjeta-recomendacion-titulos";
  titulos.innerHTML =
    `<h3>${rec.nombre}</h3>` +
    `<div class="meta-tarjeta">` +
    `<span class="insignia insignia-${rec.etiqueta}">${ETIQUETA_TEXTO[rec.etiqueta] || rec.etiqueta}</span>` +
    `<span class="familia">${rec.familia}</span>` +
    `</div>`;

  cabecera.append(numeral, titulos);
  tarjeta.appendChild(cabecera);

  if (rec.efectos_visagismo && rec.efectos_visagismo.length) {
    const chips = document.createElement("div");
    chips.className = "chips";
    rec.efectos_visagismo.forEach((efecto) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = efecto.replace(/_/g, " ");
      chips.appendChild(chip);
    });
    tarjeta.appendChild(chips);
  }

  tarjeta.appendChild(crearBloque("¿Por qué funciona?", rec.mecanismo));

  if (rec.nota_tecnica_textura) {
    const nota = document.createElement("div");
    nota.className = "nota-tecnica";
    nota.innerHTML = ICONOS.UTIL.info + `<span><strong>Nota técnica para esta textura:</strong> ${rec.nota_tecnica_textura}</span>`;
    tarjeta.appendChild(nota);
  }

  if (rec.advertencias && rec.advertencias.length) {
    const bloqueAdvertencias = document.createElement("div");
    bloqueAdvertencias.className = "advertencias";
    rec.advertencias.forEach((texto) => {
      const item = document.createElement("div");
      item.className = "advertencia";
      item.innerHTML = ICONOS.UTIL.advertencia + `<span>${texto}</span>`;
      bloqueAdvertencias.appendChild(item);
    });
    tarjeta.appendChild(bloqueAdvertencias);
  }

  const pie = document.createElement("div");
  pie.className = "pie-tarjeta";
  pie.innerHTML =
    `<span class="glifo">${ICONOS.UTIL.mantenimiento}</span>` +
    `<span>Mantenimiento: <strong>${rec.mantenimiento}</strong></span>`;
  tarjeta.appendChild(pie);

  return tarjeta;
}

(async function iniciar() {
  try {
    await cargarOpciones();
    renderPaso();
  } catch (error) {
    mostrarSeccion("asistente");
    mostrarError("No se pudieron cargar las opciones del diagnóstico. Recarga la página.");
  }
})();
