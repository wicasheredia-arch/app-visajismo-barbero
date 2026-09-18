# Backend VISAGE -- Motor 2 / IA Visual

Servicio minimo para Cloud Run. Un unico endpoint (`POST /generar`) que
recibe `{ fotoDataUrl, instruccion, nombreCorte }`, llama a Gemini
(`gemini-3-pro-image`, API v1beta) con la auth key guardada en Secret
Manager, y devuelve `{ ok: true, imagenDataUrl }` o `{ ok: false, error }`
-- el mismo contrato que ya consume `motor2.js` en el frontend.

No tiene base de datos, no guarda fotografias, no decide que corte es
correcto (eso ya lo decidio Motor 1). Cero dependencias npm.

## Correr localmente (para pruebas, sin desplegar)

```bash
cd backend
cp .env.example .env   # completar con una auth key real solo en local, nunca commitear .env
node servidor.js
```

## Pruebas

```bash
node test_servidor.js
```

Las pruebas usan una funcion `llamarGemini` inyectada (simulada), igual
que `motor2.js` prueba con proveedores falsos -- no hacen ninguna
llamada de red real ni requieren una clave.

## Desplegar a Cloud Run (pendiente, NO ejecutado todavia)

```bash
gcloud secrets create gemini-auth-key --data-file=- <<< "TU_AUTH_KEY_REAL"

gcloud run deploy visage-backend \
  --source backend/ \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_AUTH_KEY=gemini-auth-key:latest \
  --set-env-vars ALLOWED_ORIGIN=https://wicasheredia-arch.github.io \
  --timeout 30s \
  --max-instances 3
```

`--max-instances 3` es una primera red de seguridad barata contra un
pico de trafico inesperado, ademas de las Budget Alerts que se deben
configurar en la consola de GCP (ver `docs/INTEGRACION_NANO_BANANA_PRO.md`).

## Que NO hace este servicio (a proposito)

- No autentica usuarios finales (solo CORS + rate limiting basico).
- No guarda fotografias ni resultados en ningun almacenamiento.
- No re-decide que corte es tecnicamente correcto.
- No expone la auth key en ninguna respuesta ni log.
