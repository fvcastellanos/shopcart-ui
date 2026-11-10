# syntax=docker/dockerfile:1

# =============================================================================
# Etapa 1: build — compila la SPA (Vite + TypeScript) a dist/
# =============================================================================
# IMPORTANTE: se usa Debian (glibc) porque TypeScript 7 (tsc) es un binario
# nativo que NO publica build para musl/Alpine. Usar Alpine aquí haría fallar
# `npm run build` (mismo criterio que shopcart-api).
FROM node:26-bookworm-slim AS builder

WORKDIR /app

# 1) Instalar dependencias (build reproducible gracias al package-lock.json).
#    Incluye la dependencia opcional de TypeScript 7 para Linux x64 (glibc).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) Copiar fuentes y configuración necesaria para el build.
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY index.html vite.config.ts ./
COPY public ./public
COPY src ./src

# 3) Compilar: tsc -b (chequeo de tipos) + vite build → dist/
RUN npm run build

# =============================================================================
# Etapa 2: runtime — sirve los estáticos con nginx (SPA + proxy /v1)
# =============================================================================
FROM nginx:1.27-alpine

# Configuración de nginx: fallback SPA (history routing) + proxy /v1 a la API.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Estáticos compilados.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck con wget (busybox) contra el index.html servido.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
