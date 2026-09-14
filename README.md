# App Visagismo Barbero — Motor de recomendación

Estado actual del proyecto: **motor de recomendación implementado y probado, con capa de entrada/salida por terminal y una interfaz visual mínima en el navegador**.

## Qué existe hoy

- `src/catalogo/` — base de conocimiento congelada (grupo A: datos). 6 formas de rostro con su objetivo de visagismo, 15 cortes-base, 60 relaciones corte×textura, 15 mecanismos, 8 excepciones técnicas por textura. Ningún valor aquí se calcula: todo es dato curado.
- `src/diagnostico.py` — estructura del diagnóstico de un cliente (grupo C): solo forma de rostro, textura, densidad y grosor. Sin datos personales.
- `src/motor/` — el motor de recomendación (grupo B: reglas). Implementa gates, puntajes, etiquetado (SÓLIDO/ACEPTABLE/DÉBIL), el ranking lexicográfico y la generación de explicaciones/advertencias, exactamente según la especificación formal validada con 9 casos de prueba. La función de auditoría de cobertura (24 combinaciones rostro×textura) vive separada en `src/motor/auditoria.py`.
- `src/entrada_salida/` — único punto de contacto entre el mundo exterior y el motor: valida los 4 campos crudos contra los enums cerrados (`validacion.py`), lista las opciones válidas de cada campo para que cualquier interfaz las use sin duplicarlas (`opciones.py`), construye el diagnóstico y llama al motor sin modificarlo (`servicio.py`), y expone una CLI mínima (`cli.py`). No contiene ninguna regla de negocio.
- `src/interfaz_web/` — servidor HTTP mínimo (solo librería estándar, sin frameworks) que sirve la interfaz visual y expone `entrada_salida` como una pequeña API JSON (`/api/opciones`, `/api/recomendacion`). Nunca importa `motor` ni `catalogo` directamente — solo pasa por `entrada_salida`.
- `main.py` — CLI: `python3 main.py --rostro ... --textura ... --densidad ... --grosor ...`.
- `web.py` — interfaz visual: `python3 web.py` (abre el navegador automáticamente).
- `tests/` — 41 pruebas automatizadas en total: los 9 casos de validación del motor, la tabla exhaustiva de 18 combinaciones de etiquetado, integridad estructural del catálogo, validación de entrada, orquestación extremo a extremo, smoke test de la CLI, e integración HTTP de la interfaz web.

## Qué NO existe todavía (fuera de alcance de esta etapa)

Cámara, reconocimiento facial, IA, login, gestión de clientes, historial, citas, pagos, catálogo administrativo ni ninguna funcionalidad comercial — nada de esto está implementado ni planeado en esta etapa.

## Cómo probar la recomendación

Desde el navegador (recomendado):
```
python3 web.py
```
Abre `http://localhost:8000/` automáticamente. Un asistente guía al barbero paso a paso (rostro → textura → densidad → grosor) y muestra hasta 3 recomendaciones con su etiqueta, efectos de visagismo, mecanismo, advertencias y mantenimiento.

Desde la terminal:
```
python3 main.py --rostro redondo --textura afro --densidad baja --grosor fino
```

## Cómo ejecutar las pruebas

```
python3 -m unittest discover -s tests -t .
```

No requiere ninguna dependencia externa (solo la librería estándar de Python 3, incluida la interfaz web: `http.server` sin frameworks).

## Nota de implementación

El lenguaje elegido (Python 3, sin dependencias) es una decisión de esta etapa, no algo que el barbero haya pedido explícitamente — se eligió por ser gratuito, legible y ejecutable en cualquier entorno sin instalación compleja. Si el siguiente paso es una app móvil, esta lógica es puro cálculo sin efectos secundarios y se puede portar a otro lenguaje sin cambiar ninguna regla.
