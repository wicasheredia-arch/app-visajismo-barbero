"""Motor de recomendacion (grupo B: reglas).

Implementa, sin ninguna desviacion, la especificacion formal validada
con los 9 casos de prueba. No contiene datos del catalogo (eso vive en
`src.catalogo`) ni datos del cliente mas alla de lo que llega en
`DiagnosticoCliente`.

Determinista: la misma entrada produce siempre la misma salida.
Trazable: cada decision (gate, puntaje, etiqueta, orden) es una
funcion pura, independiente, que puede probarse por separado.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from ..catalogo.enums import (
    Densidad,
    Eje,
    Etiqueta,
    FormaRostro,
    Grosor,
    ModoEvaluacion,
    ObjetivoZona,
    Textura,
    Volumen,
    Zona,
)
from ..catalogo.compatibilidad import COMPATIBILIDAD_POR_CORTE_Y_TEXTURA
from ..catalogo.cortes import CORTES, Corte
from ..catalogo.excepciones import EXCEPCIONES_POR_CORTE_Y_TEXTURA
from ..catalogo.mecanismos import MECANISMOS_POR_ID
from ..catalogo.rostros import ROSTROS, DefinicionRostro
from ..diagnostico import DiagnosticoCliente


# ---------------------------------------------------------------------------
# FASE 1a -- Puntaje de rostro (0/1/2), condicional por modo de evaluacion.
# ---------------------------------------------------------------------------

def _volumen_de_zona(corte: Corte, zona: Zona) -> Volumen:
    return {
        Zona.ARRIBA: corte.volumen_arriba,
        Zona.LATERAL: corte.volumen_lateral,
        Zona.POSTERIOR: corte.volumen_posterior,
    }[zona]


def _nivel_para_objetivo_zona(objetivo: ObjetivoZona, volumen: Volumen) -> Optional[int]:
    """Tabla congelada de la especificacion (seccion 4.1)."""
    if objetivo == ObjetivoZona.SIN_OBJETIVO:
        return None
    if objetivo == ObjetivoZona.SUMAR:
        if volumen == Volumen.ALTO:
            return 2
        if volumen == Volumen.MEDIO:
            return 1
        return 0  # BAJO o NINGUNO
    if objetivo == ObjetivoZona.REDUCIR:
        if volumen in (Volumen.NINGUNO, Volumen.BAJO):
            return 2
        if volumen == Volumen.MEDIO:
            return 1
        return 0  # ALTO
    raise ValueError(f"Objetivo de zona desconocido: {objetivo}")


def _rostro_por_zona(corte: Corte, definicion: DefinicionRostro) -> int:
    niveles = [
        n for n in (
            _nivel_para_objetivo_zona(objetivo, _volumen_de_zona(corte, zona))
            for zona, objetivo in definicion.objetivos_zona.items()
        )
        if n is not None
    ]
    # El puntaje es el MINIMO entre las zonas con objetivo: un corte no
    # puede tapar con una zona excelente el hecho de contradecir el
    # objetivo en otra.
    return min(niveles) if niveles else 2


def _rostro_por_eje(corte: Corte, definicion: DefinicionRostro) -> int:
    umbral = definicion.objetivo_eje_minimo
    if corte.eje >= umbral:
        return 2
    if corte.eje == Eje.NEUTRO:
        return 1
    return 0


def _rostro_por_equilibrio(corte: Corte) -> int:
    zonas_en_alto = sum(
        1 for v in (corte.volumen_arriba, corte.volumen_lateral, corte.volumen_posterior)
        if v == Volumen.ALTO
    )
    # Unica condicion de ruptura del equilibrio: las 3 zonas en "alto"
    # a la vez, sin ningun punto de control. Con el catalogo actual
    # esto nunca ocurre (verificado en la validacion de 9 casos).
    return 0 if zonas_en_alto == 3 else 2


def evaluar_rostro(corte: Corte, forma: FormaRostro) -> int:
    definicion = ROSTROS[forma]
    if definicion.modo == ModoEvaluacion.POR_ZONA:
        return _rostro_por_zona(corte, definicion)
    if definicion.modo == ModoEvaluacion.POR_EJE:
        return _rostro_por_eje(corte, definicion)
    if definicion.modo == ModoEvaluacion.POR_EQUILIBRIO:
        return _rostro_por_equilibrio(corte)
    raise ValueError(f"Modo de evaluacion desconocido: {definicion.modo}")


# ---------------------------------------------------------------------------
# FASE 1b -- Puntaje de textura (0/1/2): lookup directo, nunca distancia.
# ---------------------------------------------------------------------------

def evaluar_textura(corte: Corte, textura: Textura) -> int:
    return COMPATIBILIDAD_POR_CORTE_Y_TEXTURA[(corte.id, textura)].valor


# ---------------------------------------------------------------------------
# FASE 1c -- Puntaje de densidad y grosor: deficit unilateral respecto a la
# referencia. "Mas de lo requerido" nunca penaliza.
# ---------------------------------------------------------------------------

def _nivel_por_deficit(referencia: int, real: int) -> int:
    if real >= referencia:
        return 2
    deficit = referencia - real
    if deficit == 1:
        return 1
    return 0  # deficit == 2, unico otro caso posible en una escala de 3 niveles


def evaluar_densidad(corte: Corte, densidad_cliente: Densidad) -> int:
    return _nivel_por_deficit(int(corte.densidad_referencia), int(densidad_cliente))


def evaluar_grosor(corte: Corte, grosor_cliente: Grosor) -> int:
    return _nivel_por_deficit(int(corte.grosor_referencia), int(grosor_cliente))


# ---------------------------------------------------------------------------
# FASE 3 -- Etiquetado SOLIDO / ACEPTABLE / DEBIL (tabla congelada y
# verificada exhaustiva sobre las 18 combinaciones posibles).
# ---------------------------------------------------------------------------

def etiquetar(rostro: int, densidad: int, grosor: int) -> Etiqueta:
    ambos_en_cero = densidad == 0 and grosor == 0
    algun_eje_en_cero = densidad == 0 or grosor == 0

    if rostro == 2 and not ambos_en_cero:
        return Etiqueta.SOLIDO
    if rostro == 1 and algun_eje_en_cero:
        return Etiqueta.DEBIL
    return Etiqueta.ACEPTABLE


# ---------------------------------------------------------------------------
# Candidato: resultado intermedio de evaluar un corte contra un diagnostico.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Candidato:
    corte: Corte
    rostro: int
    textura: int
    densidad: int
    grosor: int
    etiqueta: Etiqueta


def evaluar_candidatos(diagnostico: DiagnosticoCliente) -> List[Candidato]:
    """FASE 1 + FASE 2 (gates). Recorre los 15 cortes y descarta los que
    no pasan los UNICOS dos gates (rostro=0, textura=0)."""
    candidatos: List[Candidato] = []
    for corte in CORTES:
        rostro = evaluar_rostro(corte, diagnostico.forma_rostro)
        if rostro == 0:
            continue  # gate: contradice el objetivo de visagismo
        textura = evaluar_textura(corte, diagnostico.textura)
        if textura == 0:
            continue  # gate: imposible de ejecutar con esta textura
        densidad = evaluar_densidad(corte, diagnostico.densidad)
        grosor = evaluar_grosor(corte, diagnostico.grosor)
        etiqueta = etiquetar(rostro, densidad, grosor)
        candidatos.append(Candidato(corte, rostro, textura, densidad, grosor, etiqueta))
    return candidatos


# ---------------------------------------------------------------------------
# FASE 4 -- Comparador lexicografico completo.
# rostro > textura > min(densidad,grosor) > suma(densidad+grosor)
#        > mantenimiento (asc) > nombre (alfabetico, ultimo recurso).
# ---------------------------------------------------------------------------

def _clave_orden(c: Candidato) -> Tuple:
    return (
        -c.rostro,
        -c.textura,
        -min(c.densidad, c.grosor),
        -(c.densidad + c.grosor),
        int(c.corte.mantenimiento),
        c.corte.nombre,
    )


def ordenar(candidatos: List[Candidato]) -> List[Candidato]:
    return sorted(candidatos, key=_clave_orden)


# ---------------------------------------------------------------------------
# FASE 6 -- Explicacion y advertencias.
# ---------------------------------------------------------------------------

_PLANTILLA_ADVERTENCIA = {
    0: "Advertencia fuerte: {articulo} {atributo} del cliente ({real}) esta muy por "
       "debajo de la referencia de este corte ({referencia}); el resultado puede "
       "verse notablemente comprometido.",
    1: "Advertencia leve: {articulo} {atributo} del cliente ({real}) esta un escalon "
       "por debajo de la referencia de este corte ({referencia}); el corte es viable "
       "con un ajuste tecnico menor.",
}


def _advertencias(corte: Corte, diagnostico: DiagnosticoCliente,
                   densidad_score: int, grosor_score: int) -> List[str]:
    advertencias = []
    if densidad_score in (0, 1):
        advertencias.append(_PLANTILLA_ADVERTENCIA[densidad_score].format(
            articulo="la",
            atributo="densidad",
            real=diagnostico.densidad.name.lower(),
            referencia=corte.densidad_referencia.name.lower(),
        ))
    if grosor_score in (0, 1):
        advertencias.append(_PLANTILLA_ADVERTENCIA[grosor_score].format(
            articulo="el",
            atributo="grosor",
            real=diagnostico.grosor.name.lower(),
            referencia=corte.grosor_referencia.name.lower(),
        ))
    return advertencias


@dataclass(frozen=True)
class Recomendacion:
    corte_id: int
    nombre: str
    familia: str
    etiqueta: Etiqueta
    efectos_atendidos: List[str]
    mecanismo: str
    nota_tecnica_textura: Optional[str]
    advertencias: List[str]
    mantenimiento: str


def generar_explicacion(candidato: Candidato, diagnostico: DiagnosticoCliente) -> Recomendacion:
    corte = candidato.corte
    mecanismo = MECANISMOS_POR_ID[corte.mecanismo_id]
    excepcion = EXCEPCIONES_POR_CORTE_Y_TEXTURA.get((corte.id, diagnostico.textura))
    return Recomendacion(
        corte_id=corte.id,
        nombre=corte.nombre,
        familia=corte.familia,
        etiqueta=candidato.etiqueta,
        efectos_atendidos=[e.value for e in mecanismo.efectos],
        mecanismo=mecanismo.principio_tecnico,
        nota_tecnica_textura=excepcion.texto if excepcion else None,
        advertencias=_advertencias(corte, diagnostico, candidato.densidad, candidato.grosor),
        mantenimiento=corte.mantenimiento.name.lower(),
    )


# ---------------------------------------------------------------------------
# FASE 5 -- Seleccion final (maximo 3, nunca fabricado) + mensaje de vacio.
# ---------------------------------------------------------------------------

MENSAJE_CATALOGO_VACIO = (
    "Ningun corte de la base de conocimiento actual cumple simultaneamente con "
    "el objetivo de visagismo de este rostro y con la viabilidad de esta "
    "textura/densidad/grosor. Se recomienda que el barbero aplique su criterio "
    "profesional directamente; este caso queda registrado como un hueco de "
    "cobertura del catalogo."
)


@dataclass(frozen=True)
class ResultadoRecomendacion:
    recomendaciones: List[Recomendacion] = field(default_factory=list)
    mensaje_vacio: Optional[str] = None


def recomendar(diagnostico: DiagnosticoCliente) -> ResultadoRecomendacion:
    candidatos = evaluar_candidatos(diagnostico)
    if not candidatos:
        return ResultadoRecomendacion(recomendaciones=[], mensaje_vacio=MENSAJE_CATALOGO_VACIO)

    ordenados = ordenar(candidatos)
    top = ordenados[:3]
    recomendaciones = [generar_explicacion(c, diagnostico) for c in top]
    return ResultadoRecomendacion(recomendaciones=recomendaciones, mensaje_vacio=None)
