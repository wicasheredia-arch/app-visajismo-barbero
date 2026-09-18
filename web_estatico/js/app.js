"use strict";

// Capa de PRESENTACION del asistente VISAGE. No calcula nada de
// visagismo: solo arma el DOM alrededor de lo que ya devuelven
// ENTRADA_SALIDA.listarOpciones() y ENTRADA_SALIDA.generarRecomendacion()
// (motor.js / entrada_salida.js, sin tocar). Cambiar este archivo
// nunca puede cambiar una recomendacion, solo como se muestra.

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

// Frases orientativas MUY cortas para ayudar a reconocer cada forma a
// simple vista. Son solo texto de presentacion en la tarjeta de
// seleccion -- nunca se envian al motor ni participan en ningun
// calculo; el motor solo recibe el valor (ovalado/redondo/...) que ya
// selecciona el barbero.
const DESCRIPCION_ROSTRO = {
  ovalado: "Más largo que ancho",
  redondo: "Ancho y de líneas suaves",
  cuadrado: "Mandíbula marcada",
  alargado: "Rostro notablemente largo",
  triangular: "Mandíbula más ancha",
  corazon: "Frente más ancha, mentón estrecho",
};

// Etiqueta de posicion en el informe de resultados: solo distingue
// "la recomendacion principal" del resto ("alternativa"); no
// reordena, no oculta ni reinterpreta lo que ya decidio el motor.
function etiquetaPosicion(posicion) {
  return posicion === 1 ? "Recomendación principal" : "Alternativa";
}

// Correcciones tipograficas de presentacion (acentos en español) que
// no existen en el valor crudo del enum (por diseño, los valores del
// catalogo son ASCII: "corazon", no "corazón"). Esto NUNCA se usa
// para calcular nada -- solo para mostrar el nombre correctamente
// escrito; el valor real que via al motor sigue siendo "corazon".
const CORRECCION_TIPOGRAFICA = { Corazon: "Corazón" };

function etiquetaVisible(texto) {
  return CORRECCION_TIPOGRAFICA[texto] || texto;
}

const opciones = ENTRADA_SALIDA.listarOpciones();
let paso = 0;
const seleccion = { forma_rostro: null, textura: null, densidad: null, grosor: null };

const el = (id) => document.getElementById(id);

function opcionPorValor(campo, valor) {
  return opciones[campo].find((o) => o.valor === valor);
}

// Quita y vuelve a poner una clase de animacion para que se repita
// cada vez (un cambio de paso, un nuevo informe), no solo la primera
// vez que el elemento aparece en el DOM. Puramente cosmetico.
function reiniciarAnimacion(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

// -- Marca (logo de bienvenida + logo compacto del encabezado) --------
// ICONOS.LOGO() genera un id de degradado nuevo en cada llamada para
// que las dos instancias en la pagina no choquen de id.

el("intro-logo").innerHTML = ICONOS.LOGO();
el("marca-logo").innerHTML = ICONOS.LOGO();
el("intro-nota").innerHTML = ICONOS.UTIL.info + " Todo el cálculo ocurre en este navegador, sin conexión.";
el("nota-pie").innerHTML = ICONOS.UTIL.info + " Todo el cálculo ocurre en este mismo navegador, sin conexión.";

// -- Navegacion entre secciones ---------------------------------------

function mostrarSeccion(idVisible) {
  el("intro").hidden = idVisible !== "intro";
  el("marca-header").hidden = idVisible === "intro";
  el("nota-pie").hidden = idVisible === "intro";
  el("stepper").hidden = idVisible !== "asistente";
  el("asistente").hidden = idVisible !== "asistente";
  el("resultados").hidden = idVisible !== "resultados";
}

el("btn-comenzar").addEventListener("click", () => {
  renderPaso();
});

function ocultarError() {
  el("error-global").hidden = true;
}

function mostrarError(mensaje) {
  el("error-global").innerHTML = ICONOS.UTIL.error + `<span>${mensaje}</span>`;
  el("error-global").hidden = false;
}

// -- Paso a paso --------------------------------------------------------

function renderPaso() {
  ocultarError();
  mostrarSeccion("asistente");
  reiniciarAnimacion(el("asistente"), "paso-entra");

  const campo = CAMPOS[paso];
  el("eyebrow-paso").textContent = `Paso ${paso + 1} de ${CAMPOS.length} — ${ETIQUETAS_PASO[campo]}`;
  el("titulo-paso").textContent = PREGUNTAS_PASO[campo];

  const contenedor = el("opciones-paso");
  contenedor.innerHTML = "";
  const glifos = GLIFOS_POR_CAMPO[campo];

  const esRostro = campo === "forma_rostro";

  opciones[campo].forEach((opcion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tarjeta-opcion" + (esRostro ? " tarjeta-opcion--rostro" : "");
    if (seleccion[campo] === opcion.valor) boton.classList.add("seleccionada");
    boton.setAttribute("aria-pressed", seleccion[campo] === opcion.valor ? "true" : "false");
    const descripcion = esRostro && DESCRIPCION_ROSTRO[opcion.valor]
      ? `<span class="descripcion-rostro">${DESCRIPCION_ROSTRO[opcion.valor]}</span>`
      : "";
    boton.innerHTML =
      `<span class="glifo">${glifos[opcion.valor] || ""}</span>` +
      `<span>${etiquetaVisible(opcion.etiqueta)}</span>` +
      descripcion +
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

  const btnSiguiente = el("btn-siguiente");
  const habilitadoAntes = !btnSiguiente.disabled;
  const habilitadoAhora = Boolean(seleccion[campoActual]);
  btnSiguiente.disabled = !habilitadoAhora;
  btnSiguiente.textContent = paso === CAMPOS.length - 1 ? "Generar recomendaciones" : "Siguiente";
  if (habilitadoAhora && !habilitadoAntes) {
    reiniciarAnimacion(btnSiguiente, "recien-habilitado");
  }
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

// -- Generacion de recomendaciones ---------------------------------------

function generarRecomendaciones() {
  // Micro-interaccion breve en el boton antes de mostrar el informe
  // (el calculo en si es instantaneo: no hay red ni espera real).
  const boton = el("btn-siguiente");
  boton.classList.add("procesando");
  window.setTimeout(() => {
    boton.classList.remove("procesando");
    try {
      const resultado = ENTRADA_SALIDA.generarRecomendacion(
        seleccion.forma_rostro, seleccion.textura, seleccion.densidad, seleccion.grosor,
      );
      mostrarResultados(resultado);
    } catch (error) {
      if (error instanceof ENTRADA_SALIDA.DiagnosticoInvalido) {
        mostrarError(error.message);
      } else {
        mostrarError("Ocurrió un error inesperado generando la recomendación.");
        throw error;
      }
    }
  }, 180);
}

// -- Informe de resultados -----------------------------------------------

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
  reiniciarAnimacion(el("resultados"), "paso-entra");
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
  // implementada aun, sin datos ficticios): aqui se podria anadir,
  // por recomendacion, un bloque "Acabado sugerido" (producto de
  // finalizacion / pomada-cera-arcilla-crema / cuidado) reutilizando
  // la clase .bloque-porque ya definida en estilos.css. No se
  // renderiza nada hasta que exista un dato real del motor para ello.
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
  tarjeta.className =
    "tarjeta-recomendacion" +
    (esTop ? " tarjeta-recomendacion--top" : "") +
    ` tarjeta-recomendacion--${rec.etiqueta}`;
  tarjeta.style.setProperty("--retraso", `${(posicion - 1) * 90}ms`);

  const cabecera = document.createElement("div");
  cabecera.className = "tarjeta-recomendacion-cabecera";

  const numeral = document.createElement("span");
  numeral.className = "numeral";
  numeral.textContent = `0${posicion}`;

  const titulos = document.createElement("div");
  titulos.className = "tarjeta-recomendacion-titulos";
  titulos.innerHTML =
    `<span class="eyebrow-posicion">${etiquetaPosicion(posicion)}</span>` +
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

  // Motor 2 -- IA Visual (opcional): el corte que se le pasa aqui es
  // exactamente el que ya decidio Motor 1 (rec.nombre/rec.familia).
  // Este boton nunca aparece marcado ni activado por defecto.
  if (typeof abrirPanelIaVisual === "function") {
    const botonIa = document.createElement("button");
    botonIa.type = "button";
    botonIa.className = "boton-ia-visual";
    botonIa.innerHTML = ICONOS.UTIL.info + "<span>Visualizar con IA (opcional)</span>";
    botonIa.addEventListener("click", () => abrirPanelIaVisual({ nombre: rec.nombre, familia: rec.familia }));
    tarjeta.appendChild(botonIa);
  }

  return tarjeta;
}

// -- Motor 2 -- IA Visual (opcional) --------------------------------------
// Todo este bloque es aditivo y nunca toca ENTRADA_SALIDA ni MOTOR: solo
// reacciona a un corte que Motor 1 ya recomendo (ver crearTarjetaRecomendacion
// mas arriba). Si por algun motivo MOTOR2/PROVEEDOR_IA no estuvieran
// cargados, este bloque no se ejecuta, abrirPanelIaVisual no se define,
// y el boton "Visualizar con IA" simplemente no aparece -- el resto de
// la app sigue funcionando exactamente igual.
if (typeof MOTOR2 !== "undefined" && typeof PROVEEDOR_IA !== "undefined") {
  let motor2 = MOTOR2.crearMotor2({ proveedor: PROVEEDOR_IA.obtenerActivo() });
  const PASOS_IA = MOTOR2.PASOS;
  const TITULOS_GENERANDO = {};
  TITULOS_GENERANDO[PASOS_IA.VALIDANDO_CALIDAD] = "Comprobando la fotografía…";
  TITULOS_GENERANDO[PASOS_IA.PREPARANDO_SOLICITUD] = "Preparando la solicitud…";
  TITULOS_GENERANDO[PASOS_IA.GENERANDO] = "Generando visualización…";

  const PASOS_IDS_IA = ["ia-paso-consentimiento", "ia-paso-foto", "ia-paso-generando", "ia-paso-resultado", "ia-paso-error"];

  function renderPanelIa(estado) {
    if (estado.paso === PASOS_IA.INACTIVO) {
      el("panel-ia-visual").hidden = true;
      return;
    }

    el("panel-ia-visual").hidden = false;
    PASOS_IDS_IA.forEach((id) => { el(id).hidden = true; });

    if (estado.paso === PASOS_IA.CONSENTIMIENTO) {
      el("ia-paso-consentimiento").hidden = false;
    } else if (estado.paso === PASOS_IA.SELECCION_FOTO) {
      el("ia-paso-foto").hidden = false;
      el("ia-error-foto").hidden = true;
    } else if (estado.paso === PASOS_IA.CALIDAD_RECHAZADA) {
      el("ia-paso-foto").hidden = false;
      el("ia-error-foto").textContent = estado.error;
      el("ia-error-foto").hidden = false;
    } else if (TITULOS_GENERANDO[estado.paso]) {
      el("ia-paso-generando").hidden = false;
      el("ia-generando-titulo").textContent = TITULOS_GENERANDO[estado.paso];
    } else if (estado.paso === PASOS_IA.RESULTADO) {
      el("ia-paso-resultado").hidden = false;
      el("ia-imagen-resultado").src = estado.resultado;
    } else if (estado.paso === PASOS_IA.ERROR) {
      el("ia-paso-error").hidden = false;
      el("ia-mensaje-error").textContent = estado.error;
    }
  }

  motor2.suscribir(renderPanelIa);

  // Punto de entrada unico: una tarjeta de resultado ya calculada por
  // Motor 1 pasa su corte aqui. Motor 2 nunca elige por su cuenta.
  //
  // Se recrea motor2 en cada apertura, tomando el proveedor activo en
  // ESE momento (PROVEEDOR_IA.obtenerActivo()) -- si no se hiciera
  // asi, activar un proveedor distinto (ej. nano-banana-pro en lugar
  // del mock) despues de cargar la pagina nunca tendria efecto,
  // porque la instancia original quedaria atada para siempre al
  // proveedor que estaba activo en el momento de crearla.
  window.abrirPanelIaVisual = function abrirPanelIaVisual(corte) {
    motor2 = MOTOR2.crearMotor2({ proveedor: PROVEEDOR_IA.obtenerActivo() });
    motor2.suscribir(renderPanelIa);
    motor2.iniciar(corte);
  };

  function cerrarPanelIa() {
    // La fotografia solo vivio en la variable de estado de motor2 (en
    // memoria); al volver al original se descarta la referencia, sin
    // haber tocado localStorage, IndexedDB ni ningun almacenamiento.
    el("ia-input-foto").value = "";
    motor2.volverAResultadoOriginal();
  }

  el("ia-btn-cerrar").addEventListener("click", cerrarPanelIa);
  el("ia-btn-volver-resultado").addEventListener("click", cerrarPanelIa);
  el("ia-btn-volver-error").addEventListener("click", cerrarPanelIa);
  el("ia-btn-cancelar-consentimiento").addEventListener("click", cerrarPanelIa);
  el("ia-btn-cancelar-generando").addEventListener("click", cerrarPanelIa);

  el("ia-btn-aceptar-consentimiento").addEventListener("click", () => {
    motor2.darConsentimiento();
  });

  el("ia-input-foto").addEventListener("change", (evento) => {
    const archivo = evento.target.files && evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      // Orden pedido: seleccion de foto -> consentimiento -> validacion
      // de calidad (ver motor2.js: seleccionarFoto() ya avanza a
      // CONSENTIMIENTO, la validacion ocurre recien al aceptar).
      motor2.seleccionarFoto(lector.result);
    };
    lector.onerror = () => {
      el("ia-error-foto").textContent = "No se pudo leer la fotografía. Intenta con otra.";
      el("ia-error-foto").hidden = false;
    };
    lector.readAsDataURL(archivo);
  });
}

mostrarSeccion("intro");
