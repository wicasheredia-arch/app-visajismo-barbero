"use strict";

// Asistente paso a paso: rostro -> textura -> densidad -> grosor -> recomendaciones.
// Las opciones de cada paso NO estan hardcodeadas aqui: se piden a
// /api/opciones, que las lee de los mismos enums cerrados del
// catalogo (una sola fuente de verdad).

const CAMPOS = ["forma_rostro", "textura", "densidad", "grosor"];
const TITULOS = {
  forma_rostro: "¿Qué forma de rostro tiene el cliente?",
  textura: "¿Qué textura de cabello tiene?",
  densidad: "¿Qué densidad de cabello tiene?",
  grosor: "¿Qué grosor de cabello tiene?",
};
const ETIQUETA_TEXTO = { solido: "SÓLIDO", aceptable: "ACEPTABLE", debil: "DÉBIL" };

let opciones = null;
let paso = 0;
const seleccion = { forma_rostro: null, textura: null, densidad: null, grosor: null };

const el = (id) => document.getElementById(id);

async function cargarOpciones() {
  const respuesta = await fetch("/api/opciones");
  if (!respuesta.ok) throw new Error("No se pudieron cargar las opciones.");
  opciones = await respuesta.json();
}

function mostrarSeccion(idVisible) {
  ["asistente", "cargando", "resultados"].forEach((id) => {
    el(id).hidden = id !== idVisible;
  });
}

function ocultarError() {
  el("error-global").hidden = true;
}

function mostrarError(mensaje) {
  el("error-global").textContent = mensaje;
  el("error-global").hidden = false;
}

function renderPaso() {
  ocultarError();
  mostrarSeccion("asistente");

  const campo = CAMPOS[paso];
  el("titulo-paso").textContent = TITULOS[campo];

  const contenedor = el("opciones-paso");
  contenedor.innerHTML = "";
  for (const opcion of opciones[campo]) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tarjeta-opcion";
    if (seleccion[campo] === opcion.valor) boton.classList.add("seleccionada");
    boton.textContent = opcion.etiqueta;
    boton.addEventListener("click", () => seleccionar(campo, opcion.valor));
    contenedor.appendChild(boton);
  }

  actualizarProgreso();
  actualizarNavegacion();
}

function seleccionar(campo, valor) {
  seleccion[campo] = valor;
  renderPaso();
}

function actualizarProgreso() {
  document.querySelectorAll("#progreso li").forEach((li, indice) => {
    li.classList.toggle("activo", indice === paso);
    li.classList.toggle("completo", indice < paso);
  });
}

function actualizarNavegacion() {
  const campoActual = CAMPOS[paso];
  el("btn-atras").hidden = paso === 0;
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

function mostrarResultados(datos) {
  mostrarSeccion("resultados");
  const lista = el("lista-recomendaciones");
  const vacio = el("mensaje-vacio");
  lista.innerHTML = "";

  if (datos.mensaje_vacio) {
    vacio.textContent = datos.mensaje_vacio;
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;
  datos.recomendaciones.forEach((rec, indice) => {
    lista.appendChild(crearTarjetaRecomendacion(rec, indice + 1));
  });
}

function crearBloque(titulo, texto, claseExtra) {
  const div = document.createElement("div");
  div.className = claseExtra ? `bloque ${claseExtra}` : "bloque";
  const fuerte = document.createElement("strong");
  fuerte.textContent = `${titulo}: `;
  div.appendChild(fuerte);
  div.appendChild(document.createTextNode(texto));
  return div;
}

function crearTarjetaRecomendacion(rec, posicion) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-recomendacion";

  const encabezado = document.createElement("div");
  encabezado.className = "tarjeta-encabezado";

  const posicionSpan = document.createElement("span");
  posicionSpan.className = "posicion";
  posicionSpan.textContent = `#${posicion}`;

  const titulo = document.createElement("h3");
  titulo.textContent = rec.nombre;

  const insignia = document.createElement("span");
  insignia.className = `insignia insignia-${rec.etiqueta}`;
  insignia.textContent = ETIQUETA_TEXTO[rec.etiqueta] || rec.etiqueta;

  encabezado.append(posicionSpan, titulo, insignia);
  tarjeta.appendChild(encabezado);

  const familia = document.createElement("p");
  familia.className = "familia";
  familia.textContent = `Familia: ${rec.familia}`;
  tarjeta.appendChild(familia);

  if (rec.efectos_visagismo && rec.efectos_visagismo.length) {
    const chips = document.createElement("div");
    chips.className = "chips";
    rec.efectos_visagismo.forEach((efecto) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = efecto.replaceAll("_", " ");
      chips.appendChild(chip);
    });
    tarjeta.appendChild(chips);
  }

  tarjeta.appendChild(crearBloque("Mecanismo", rec.mecanismo));

  if (rec.nota_tecnica_textura) {
    tarjeta.appendChild(crearBloque("Nota técnica para esta textura", rec.nota_tecnica_textura, "nota-tecnica"));
  }

  if (rec.advertencias && rec.advertencias.length) {
    const bloqueAdvertencias = document.createElement("div");
    bloqueAdvertencias.className = "bloque advertencias";
    rec.advertencias.forEach((advertencia) => {
      const p = document.createElement("p");
      p.textContent = advertencia;
      bloqueAdvertencias.appendChild(p);
    });
    tarjeta.appendChild(bloqueAdvertencias);
  }

  const mantenimiento = document.createElement("p");
  mantenimiento.className = "mantenimiento";
  mantenimiento.textContent = `Mantenimiento: ${rec.mantenimiento}`;
  tarjeta.appendChild(mantenimiento);

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
