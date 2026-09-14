// Sistema de iconografia de VISAGE: logo de marca + glifos de
// diagnostico, todos como SVG en linea (sin imagenes externas, sin
// dependencias). Puramente presentacional -- no contiene ningun dato
// ni regla del catalogo o del motor.
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    global.ICONOS = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Marca VISAGE: una "V" solida en degrade dorado (de Visage, y a
  // la vez la forma de una mandibula/perfil en barberia) con un
  // perfil facial minimalista trazado en el espacio negativo
  // interior. A tamano grande se lee como rostro + V; a tamano de
  // favicon el detalle del perfil se simplifica visualmente y queda
  // una V limpia y solida -- nunca un icono roto o con huecos.
  // Es una funcion (no un string fijo) porque el degradado necesita
  // un id unico por cada instancia insertada en la pagina (aparece
  // tanto en la pantalla de bienvenida como en el encabezado).
  var _contadorLogo = 0;
  function LOGO() {
    _contadorLogo += 1;
    var idGrad = "gradoVisage" + _contadorLogo;
    return (
      '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VISAGE">' +
      '<defs><linearGradient id="' + idGrad + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#f0d9a8"/><stop offset="55%" stop-color="#c9a15e"/><stop offset="100%" stop-color="#8a6530"/>' +
      "</linearGradient></defs>" +
      '<path d="M16,8 L48,80 L80,8" stroke="url(#' + idGrad + ')" stroke-width="14" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M38,18 C45,16 51,20 52,26 C53,31 51,35 53,39 C55,43 57,45 55,49 C53,53 48,55 43,54" ' +
      'stroke="#f4efe6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  // Glifos de forma de rostro: siluetas cerradas, mismo lenguaje de
  // linea, proporciones distintas para que cada forma se reconozca
  // sin necesidad de leer el nombre.
  var ROSTRO = {
    ovalado:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M32,6 C20,6 12,14 10,26 C8,36 11,46 18,52 C24,57 28,58 32,58 C36,58 40,57 46,52 C53,46 56,36 54,26 C52,14 44,6 32,6 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    redondo:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M32,8 C18,8 9,17 8,30 C7,41 14,50 22,54 C26,56.5 29,57 32,57 C35,57 38,56.5 42,54 C50,50 57,41 56,30 C55,17 46,8 32,8 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    cuadrado:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M32,8 C21,8 13,14 12,24 L12,38 C12,46 17,52 24,55 L40,55 C47,52 52,46 52,38 L52,24 C51,14 43,8 32,8 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    alargado:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M32,4 C22,4 15,10 14,20 C13,30 14,40 16,48 C18,54 24,60 32,60 C40,60 46,54 48,48 C50,40 51,30 50,20 C49,10 42,4 32,4 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    triangular:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M29,10 L35,10 C37,10 38.5,11.5 39,14 L47,42 C49.5,50 46,55 39,57 L25,57 C18,55 14.5,50 17,42 L25,14 C25.5,11.5 27,10 29,10 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    corazon:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M32,8 C20,8 11,13 10,22 C9,29 13,35 18,40 L26,52 C28,56 30,58 32,58 C34,58 36,56 38,52 L46,40 C51,35 55,29 54,22 C53,13 44,8 32,8 Z" ' +
      'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };

  // Glifos de textura: cuatro mechones estilizados con distinto
  // patron de linea (recta, ondulada, rizada, apretada).
  function mechonesTextura(patron) {
    var lineas = {
      liso: [
        "M14,10 C14,10 14,40 14,54",
        "M26,10 C26,10 26,40 26,54",
        "M38,10 C38,10 38,40 38,54",
        "M50,10 C50,10 50,40 50,54",
      ],
      ondulado: [
        "M14,8 C20,16 8,24 14,32 C20,40 8,48 14,54",
        "M28,8 C34,16 22,24 28,32 C34,40 22,48 28,54",
        "M42,8 C48,16 36,24 42,32 C48,40 36,48 42,54",
      ],
      rizado: [
        "M16,8 C28,10 28,20 16,22 C4,24 4,34 16,36 C28,38 28,48 16,50",
        "M38,8 C50,10 50,20 38,22 C26,24 26,34 38,36 C50,38 50,48 38,50",
      ],
      afro: [
        "M10,14 Q14,8 18,14 Q22,20 18,26 Q14,32 18,38 Q22,44 18,50",
        "M25,12 Q29,6 33,12 Q37,18 33,24 Q29,30 33,36 Q37,42 33,48 Q29,54 33,58",
        "M42,14 Q46,8 50,14 Q54,20 50,26 Q46,32 50,38 Q54,44 50,50",
      ],
    };
    var trazos = lineas[patron] || lineas.liso;
    var contenido = trazos
      .map(function (d) {
        return '<path d="' + d + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
      })
      .join("");
    return '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' + contenido + "</svg>";
  }

  var TEXTURA = {
    liso: mechonesTextura("liso"),
    ondulado: mechonesTextura("ondulado"),
    rizado: mechonesTextura("rizado"),
    afro: mechonesTextura("afro"),
  };

  // Medidor de nivel (1 a 3 barras) para densidad y grosor.
  function medidorNivel(nivel) {
    var alturas = [22, 34, 46];
    var y0 = [36, 24, 12];
    var barras = [0, 1, 2]
      .map(function (i) {
        var activa = i < nivel;
        var color = activa ? "currentColor" : "currentColor";
        var opacidad = activa ? "1" : "0.25";
        var x = 14 + i * 16;
        return (
          '<rect x="' + x + '" y="' + y0[i] + '" width="10" height="' + alturas[i] +
          '" rx="2.5" fill="' + color + '" fill-opacity="' + opacidad + '"/>'
        );
      })
      .join("");
    return '<svg viewBox="0 0 64 58" fill="none" xmlns="http://www.w3.org/2000/svg">' + barras + "</svg>";
  }

  var DENSIDAD = { baja: medidorNivel(1), media: medidorNivel(2), alta: medidorNivel(3) };
  var GROSOR = { fino: medidorNivel(1), medio: medidorNivel(2), grueso: medidorNivel(3) };

  // Utilitarios de interfaz.
  var UTIL = {
    check:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flecha:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M12 11v5.5M12 8v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    advertencia:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 3.5 22 20.5H2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M12 10v4.5M12 17.2v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    mantenimiento:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.55 1.55M7.15 16.85l-1.55 1.55M18.4 18.4l-1.55-1.55M7.15 7.15 5.6 5.6" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    candado:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="1.6"/></svg>',
  };

  // Retrato editorial de la pantalla de bienvenida: silueta de un
  // busto de perfil con cabello con volumen, trazo de borde en
  // degradado dorado (efecto de luz de contorno/rim light) sobre el
  // fondo oscuro. Es una ilustracion vectorial deliberadamente
  // abstracta -- no una fotografia (no tenemos forma de generar ni
  // de licenciar una foto real) -- pensada para transmitir el mismo
  // estado de animo cinematografico de barberia premium.
  var _contadorRetrato = 0;
  function RETRATO() {
    _contadorRetrato += 1;
    var idGrad = "gradoRetrato" + _contadorRetrato;
    return (
      '<svg viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="' + idGrad + '-oro" x1="0%" y1="0%" x2="60%" y2="100%">' +
      '<stop offset="0%" stop-color="#f0d9a8"/><stop offset="100%" stop-color="#8a6530"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + idGrad + '-piel" x1="20%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#2a2830"/><stop offset="100%" stop-color="#0b0b0d"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<path d="M70,255 C68,210 72,180 92,162 C82,152 76,138 78,124 C72,116 70,104 76,92 ' +
      "C74,78 82,64 98,55 C108,49 120,47 130,50 C142,44 155,48 160,58 C168,60 172,68 168,76 " +
      "C174,84 172,94 164,98 C166,108 160,118 150,120 C152,134 146,148 134,156 " +
      'C150,176 156,206 156,255 Z" ' +
      'fill="url(#' + idGrad + '-piel)" stroke="url(#' + idGrad + '-oro)" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M98,55 C90,64 84,74 84,86 C84,96 88,104 94,110 C90,118 90,126 96,132 C100,140 108,146 118,148" ' +
      'fill="none" stroke="url(#' + idGrad + '-oro)" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>' +
      "</svg>"
    );
  }

  return { LOGO: LOGO, RETRATO: RETRATO, ROSTRO: ROSTRO, TEXTURA: TEXTURA, DENSIDAD: DENSIDAD, GROSOR: GROSOR, UTIL: UTIL };
});
