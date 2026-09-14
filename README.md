# App Visagismo Barbero — Motor de recomendación

Estado actual del proyecto: **motor de recomendación de cortes implementado y probado**, sin interfaz todavía.

## Qué existe hoy

- `src/catalogo/` — base de conocimiento congelada (grupo A: datos). 6 formas de rostro con su objetivo de visagismo, 15 cortes-base, 60 relaciones corte×textura, 15 mecanismos, 8 excepciones técnicas por textura. Ningún valor aquí se calcula: todo es dato curado.
- `src/diagnostico.py` — estructura del diagnóstico de un cliente (grupo C): solo forma de rostro, textura, densidad y grosor. Sin datos personales.
- `src/motor/` — el motor de recomendación (grupo B: reglas). Implementa gates, puntajes, etiquetado (SÓLIDO/ACEPTABLE/DÉBIL), el ranking lexicográfico y la generación de explicaciones/advertencias, exactamente según la especificación formal validada con 9 casos de prueba. La función de auditoría de cobertura (24 combinaciones rostro×textura) vive separada en `src/motor/auditoria.py`.
- `tests/test_motor.py` — pruebas automatizadas: los 9 casos de validación, la tabla exhaustiva de 18 combinaciones de etiquetado, e integridad estructural del catálogo (15 cortes, 60 compatibilidades, 24 combinaciones de auditoría, sin huecos de cobertura).

## Qué NO existe todavía (fuera de alcance de esta etapa)

Interfaz de usuario, captura de fotos/medición real, reconocimiento facial, agenda, pagos, inventario, gestión de clientes, marketing — nada de esto está implementado ni planeado en este motor.

## Cómo ejecutar las pruebas

```
python3 -m unittest discover -s tests -t .
```

No requiere ninguna dependencia externa (solo la librería estándar de Python 3).

## Nota de implementación

El lenguaje elegido (Python 3, sin dependencias) es una decisión de esta etapa, no algo que el barbero haya pedido explícitamente — se eligió por ser gratuito, legible y ejecutable en cualquier entorno sin instalación compleja. Si el siguiente paso es una app móvil, esta lógica es puro cálculo sin efectos secundarios y se puede portar a otro lenguaje sin cambiar ninguna regla.
