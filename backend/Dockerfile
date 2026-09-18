# Imagen minima para Cloud Run. Sin dependencias npm -- solo Node.
FROM node:20-slim

WORKDIR /app
COPY package.json ./
COPY servidor.js ./

ENV NODE_ENV=production
EXPOSE 8080

# GEMINI_AUTH_KEY y ALLOWED_ORIGIN se inyectan en tiempo de despliegue
# (Secret Manager + variables de entorno de Cloud Run), nunca aqui.
CMD ["node", "servidor.js"]
