# App Visagismo Barbero — Motor de recomendación

Estado actual del proyecto: **motor de recomendación implementado y probado, con una capa mínima de entrada/salida por terminal**. Todavía sin interfaz visual.

## Qué existe hoy

- `src/catalogo/` — base de conocimiento congelada (grupo A: datos). 6 formas de rostro con su objetivo de visagismo, 15 cortes-base, 60 relaciones corte×textura, 15 mecanismos, 8 excepciones técnicas por textura. Ningún valor aquí se calcula: todo es dato curado.
- `src/diagnostico.py` — estructura del diagnóstico de un cliente (grupo C): solo forma de rostro, textura, densidad y grosor. Sin datos personales.
- `src/motor/` — el motor de recomendación (grupo B: reglas). Implementa gates, puntajes, etiquetado (SÓLIDO/ACEPTABLE/DÉBIL), el ranking lexicográfico y la generación de explicaciones/advertencias, exactamente según la especificación formal validada con 9 casos de prueba. La función de auditoría de cobertura (24 combinaciones rostro×textura) vive separada en `src/motor/auditoria.py`.
- `src/entrada_salida/` — capa de entrada/salida: valida los 4 campos crudos contra los enums cerrados (`validacion.py`), construye el diagnóstico y llama al motor sin modificarlo (`servicio.py`), y expone una CLI mínima para probarlo desde la terminal (`cli.py`). No contiene ninguna regla de negocio.
- `main.py` — punto de entrada de conveniencia en la raíz: `python3 main.py --rostro ... --textura ... --densidad ... --grosor ...`.
- `tests/test_motor.py` y `tests/test_entrada_salida.py` — 34 pruebas automatizadas en total: los 9 casos de validación del motor, la tabla exhaustiva de 18 combinaciones de etiquetado, integridad estructural del catálogo, validación de entrada, orquestación extremo a extremo y un smoke test de la CLI.

## Qué NO existe todavía (fuera de alcance de esta etapa)

Interfaz visual, captura de fotos/medición real, reconocimiento facial, agenda, pagos, inventario, gestión de clientes, marketing — nada de esto está implementado ni planeado en este motor. La CLI es solo el medio más simple para probar la entrada/salida, no la interfaz final.

## Cómo probar la recomendación desde la terminal

```
python3 main.py --rostro redondo --textura afro --densidad baja --grosor fino
```

## Cómo ejecutar las pruebas

```
python3 -m unittest discover -s tests -t .
```

No requiere ninguna dependencia externa (solo la librería estándar de Python 3).

## Nota de implementación

El lenguaje elegido (Python 3, sin dependencias) es una decisión de esta etapa, no algo que el barbero haya pedido explícitamente — se eligió por ser gratuito, legible y ejecutable en cualquier entorno sin instalación compleja. Si el siguiente paso es una app móvil, esta lógica es puro cálculo sin efectos secundarios y se puede portar a otro lenguaje sin cambiar ninguna regla.
