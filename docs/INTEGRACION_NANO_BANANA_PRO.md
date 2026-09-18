# Integración de un proveedor real (Nano Banana Pro) para Motor 2 — IA Visual

Este documento explica qué falta para conectar un proveedor de IA
generativa real (Nano Banana Pro u otro que cumpla el mismo contrato)
en lugar del proveedor mock que hoy corre por defecto. No es una guía
de implementación paso a paso de ese backend — es la explicación de
por qué GitHub Pages no alcanza por sí solo, y qué pieza nueva hace
falta.

## Por qué el sitio estático actual no permite una integración segura

`web_estatico/` se publica en GitHub Pages como archivos estáticos:
HTML, CSS y JavaScript que corren enteramente en el navegador del
barbero, sin ningún servidor propio. Eso es exactamente lo que le da a
Motor 1 (el motor de visagismo) su garantía más importante: funciona
sin conexión y sin ningún costo recurrente.

Un proveedor de IA generativa real, en cambio, necesita una clave de
API secreta para autenticar cada solicitud. **Esa clave nunca puede
vivir en el frontend** — cualquier código JavaScript que corre en el
navegador es visible para cualquiera que abra las herramientas de
desarrollador. Poner la clave ahí equivale a publicarla.

Por eso, mientras VISAGE siga siendo un sitio 100% estático, no existe
ninguna forma segura de que el navegador del barbero llame
directamente a Nano Banana Pro (ni a ningún otro proveedor que
requiera una clave). Esta es la razón por la que, en esta primera
versión, se construyó primero la separación de interfaces
(`web_estatico/js/ia_visual/proveedor.js`) y un proveedor mock
(`proveedor_mock.js`) que no necesita ninguna clave — así todo el
resto del flujo (consentimiento, validación, estados, UI) queda
construido y probado, listo para recibir un proveedor real el día que
exista un backend seguro.

## Qué backend/serverless hace falta

Se necesita un intermediario (proxy) entre el navegador y Nano Banana
Pro, que sea el único lugar donde vive la clave de API:

```
Navegador del barbero          Backend/serverless (nuevo)         Nano Banana Pro
  (sin clave)          ----->     guarda la API key       ----->   (proveedor real)
  foto + instruccion              reenvía la solicitud
                        <-----    devuelve la imagen       <-----
```

Características que ese backend necesita, como mínimo:

- **Un único endpoint** que reciba `{ fotoDataUrl, instruccion, nombreCorte }` (exactamente la misma forma que ya usa `proveedor.generar()` en el frontend) y devuelva `{ ok, imagenDataUrl }` o `{ ok: false, error }` — el mismo contrato, para que el frontend no necesite cambiar nada más que activar el proveedor.
- **La clave de Nano Banana Pro guardada como variable de entorno del backend**, nunca en el repositorio ni en ningún archivo que termine en el sitio estático.
- **Sin estado persistente de las fotos**: el backend debe reenviar la imagen y descartarla, no guardarla en disco ni en una base de datos, para mantener la misma política de "no se almacena permanentemente por defecto" que ya tiene el frontend.
- **Límite de tamaño de solicitud** razonable (una foto de celular puede pesar varios MB) y manejo explícito de tiempo de espera, ya que una generación real puede tardar varios segundos.
- **CORS configurado** para aceptar solicitudes solo desde el dominio donde se publique VISAGE (GitHub Pages), no desde cualquier origen.

Opciones típicas para este tipo de proxy (categorías, no una elección
tomada aquí): una función serverless (ej. Cloudflare Workers, Vercel
Functions, AWS Lambda) o un servicio pequeño dedicado. La elección
concreta es una decisión de infraestructura que queda fuera de esta
etapa — ver `docs/VISAGE_ARQUITECTURA_DOS_MOTORES` (documento de
producto) para el resto de las preguntas a investigar antes de elegir
proveedor y hosting.

## Cómo se activaría, del lado del código

Una vez exista ese backend, conectar el proveedor real es aditivo y no
requiere tocar `motor2.js` ni ningún archivo de Motor 1:

1. Crear un nuevo archivo, ej. `web_estatico/js/ia_visual/proveedor_nano_banana.js`, que implemente el mismo contrato de `proveedor.js` (`{ nombre, generar(solicitud) }`), llamando por `fetch` al endpoint del backend (nunca directo a Nano Banana Pro).
2. Cargarlo en `index.html` junto a los demás scripts de `ia_visual/`.
3. Activarlo con `PROVEEDOR_IA.activar("nano-banana-pro")` (o el nombre que se le dé) en lugar del mock.
4. Si ese `fetch` falla o no hay conexión, el mismo manejo de errores que ya existe en `motor2.js` lleva al estado `ERROR` sin afectar a Motor 1 — no hace falta ningún cambio ahí.

## Lo que queda pendiente, explícitamente

- Elegir y contratar el backend/serverless.
- Decidir el proveedor definitivo tras el prototipo de validación de calidad con fotos reales (ver el documento de arquitectura de dos motores, sección "Qué construir primero").
- Definir el modelo de costos/premium que mencionaron que se decidirá más adelante — no se diseñó aquí a propósito.
- Pruebas de carga y de manejo de errores del backend real (más allá del proveedor mock, que ya está probado).
