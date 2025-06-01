# ┌───────────────────────────────────────────────────────────────────────┐
# │ 1) Usamos una imagen Debian-based que incluye libssl1.1 nativamente │
# └───────────────────────────────────────────────────────────────────────┘
FROM node:20-bullseye-slim

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 2) Instalamos build-essential y certificados para compilar          │
# │    dependencias nativas (ej. bcrypt) y asegurar que OpenSSL esté    │
# │    disponible para Prisma.                                           │
# └───────────────────────────────────────────────────────────────────────┘
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 3) Copiamos package.json y package-lock.json (ambos deben existir)  │
# └───────────────────────────────────────────────────────────────────────┘
COPY package*.json tsconfig.json ./

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 4) Instalamos dependencias exactas usando package-lock.json         │
# └───────────────────────────────────────────────────────────────────────┘
RUN npm ci

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 5) Copiamos el directorio prisma y generamos el cliente Prisma       │
# └───────────────────────────────────────────────────────────────────────┘
COPY prisma ./prisma
RUN npx prisma generate

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 6) Copiamos el código fuente TypeScript                             │
# └───────────────────────────────────────────────────────────────────────┘
COPY src ./src

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 7) Compilamos el proyecto TS → saldrán archivos en /app/build        │
# └───────────────────────────────────────────────────────────────────────┘
RUN npm run build

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 8) Exponemos el puerto que usa el servidor (4000)                    │
# └───────────────────────────────────────────────────────────────────────┘
EXPOSE 4000

# ┌───────────────────────────────────────────────────────────────────────┐
# │ 9) Lanzamos en modo producción                                       │
# └───────────────────────────────────────────────────────────────────────┘
CMD ["npm", "run", "start:prod"]

