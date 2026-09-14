# App Visagismo Barbero — Motor de recomendación

Estado actual del proyecto: **motor de recomendación implementado y probado, con capa de entrada/salida por terminal, interfaz visual servida por un backend Python, y una versión estática autocontenida (puerto a JavaScript) que corre 100% en el navegador sin ningún servidor**.

## Qué existe hoy

- `src/catalogo/` — base de conocimiento congelada (grupo A: datos). 6 formas de rostro con su objetivo de visagismo, 15 cortes-base, 60 relaciones corte×textura, 15 mecanismos, 8 excepciones técnicas por textura. Ningún valor aquí se calcula: todo es dato curado.
- `src/diagnostico.py` — estructura del diagnóstico de un cliente (grupo C): solo forma de rostro, textura, densidad y grosor. Sin datos personales.
- `src/motor/` — el motor de recomendación (grupo B: reglas). Implementa gates, puntajes, etiquetado (SÓLIDO/ACEPTABLE/DÉBIL), el ranking lexicográfico y la generación de explicaciones/advertencias, exactamente según la especificación formal validada con 9 casos de prueba. La función de auditoría de cobertura (24 combinaciones rostro×textura) vive separada en `src/motor/auditoria.py`.
- `src/entrada_salida/` — único punto de contacto entre el mundo exterior y el motor: valida los 4 campos crudos contra los enums cerrados (`validacion.py`), lista las opciones válidas de cada campo para que cualquier interfaz las use sin duplicarlas (`opciones.py`), construye el diagnóstico y llama al motor sin modificarlo (`servicio.py`), y expone una CLI mínima (`cli.py`). No contiene ninguna regla de negocio.
- `src/interfaz_web/` — servidor HTTP mínimo (solo librería estándar, sin frameworks) que sirve la interfaz visual y expone `entrada_salida` como una pequeña API JSON (`/api/opciones`, `/api/recomendacion`). Nunca importa `motor` ni `catalogo` directamente — solo pasa por `entrada_salida`.
- `main.py` — CLI: `python3 main.py --rostro ... --textura ... --densidad ... --grosor ...`.
- `web.py` — interfaz visual servida por Python: `python3 web.py` (abre el navegador automáticamente; requiere tener el servidor corriendo).
- `web_estatico/` — **puerto a JavaScript** del catálogo y el motor (`js/catalogo_datos.js` generado desde Python, `js/motor.js`, `js/entrada_salida.js`, `js/app.js`), con el mismo HTML/CSS que la interfaz Python. Corre enteramente en el navegador, sin backend ni red. `catalogo_datos.js` no se edita a mano: se regenera desde `src/catalogo` con `scripts/generar_catalogo_js.py` para que nunca pueda desviarse de los datos Python.
- `docs/index.html` — **la misma página de `web_estatico/` pero en un único archivo autocontenido** (CSS y los 5 JS inlineados), generado con `scripts/generar_pagina_autocontenida.py`. Se puede abrir con doble clic (`file://`, sin servidor), subir a cualquier hosting estático (el nombre `docs/` es el que usa GitHub Pages), o publicar como página autocontenida en cualquier otro medio.
- **Identidad visual "VISAGE":** paleta onyx/champán/marfil, tipografía Fraunces (display) + Manrope (cuerpo), logo propio y glifos de diagnóstico (rostro, textura, densidad, grosor) como SVG en línea sin imágenes externas — ver `js/iconos.js`, compartido entre `web_estatico/` y `src/interfaz_web/estaticos/`. Es una capa puramente de presentación: no participa en ningún cálculo.
- `tests/` — 41 pruebas automatizadas de Python (motor, entrada/salida, interfaz web) + `tests/fixtures/paridad_216_casos.json`, generado desde el motor Python real con `scripts/generar_fixture_paridad.py` (barre las 216 combinaciones posibles de diagnóstico).
- `tests_js/test_paridad.js` — prueba de paridad en Node.js: corre las 216 combinaciones del fixture contra el motor JavaScript y compara la salida byte a byte con la del motor Python, además de verificar nombradamente los 9 casos de validación históricos. Sin dependencias (solo `assert`/`fs` de Node).

## Qué NO existe todavía (fuera de alcance de esta etapa)

Cámara, reconocimiento facial, IA, login, gestión de clientes, historial, citas, pagos, catálogo administrativo ni ninguna funcionalidad comercial — nada de esto está implementado ni planeado en esta etapa.

## Cómo probar la recomendación

**Sin servidor, abriendo un archivo (recomendado para probar rápido, incluso desde el celular):** abre `docs/index.html` directamente en cualquier navegador.

**Con el backend Python:**
```
python3 web.py
```
Abre `http://localhost:8000/` automáticamente.

**Desde la terminal:**
```
python3 main.py --rostro redondo --textura afro --densidad baja --grosor fino
```

En los tres casos el flujo es el mismo: un asistente guía al barbero paso a paso (rostro → textura → densidad → grosor) y muestra hasta 3 recomendaciones con su etiqueta, efectos de visagismo, mecanismo, nota técnica de textura cuando existe, advertencias y mantenimiento.

## Cómo ejecutar las pruebas

```
python3 -m unittest discover -s tests -t .   # 41 pruebas Python
node tests_js/test_paridad.js                # 240 verificaciones de paridad JS <-> Python
```

Ninguna de las dos requiere instalar nada: solo librería estándar de Python 3 y Node.js.

## Cómo regenerar la versión JavaScript si cambia el catálogo o el motor Python

```
python3 scripts/generar_catalogo_js.py          # datos -> web_estatico/js/catalogo_datos.js
python3 scripts/generar_fixture_paridad.py       # fixture de paridad -> tests/fixtures/
node tests_js/test_paridad.js                    # confirma que motor.js sigue siendo identico
python3 scripts/generar_pagina_autocontenida.py  # empaqueta todo -> docs/index.html
```
El motor JavaScript (`web_estatico/js/motor.js`) está portado a mano (JavaScript no puede importar Python), así que si se toca una regla en `src/motor/motor.py`, hay que reflejar el mismo cambio en `motor.js` y volver a correr `test_paridad.js` para confirmar que ambos siguen coincidiendo.

## Nota de implementación

El lenguaje elegido para el motor (Python 3, sin dependencias) es una decisión de esta etapa, no algo que el barbero haya pedido explícitamente. La versión JavaScript existe únicamente para poder correr la interfaz sin backend (en un navegador, incluido el de un celular, sin instalar nada) — el motor Python sigue siendo la implementación de referencia; la de JavaScript es una traducción equivalente, validada exhaustivamente contra ella, no un reemplazo.
