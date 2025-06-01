#!/usr/bin/env bash
#
# run.sh — Script para levantar desde cero todo el stack AURA:
#   1. Elimina contenedores y volúmenes previos
#   2. Construye imagen de aura-backend (sin migraciones en host aún)
#   3. Arranca Postgres + aura-backend
#   4. Genera migraciones Prisma DENTRO del contenedor aura-backend
#   5. Copia las migraciones generadas al host, ajustando permisos
#   6. Reconstruye imagen de aura-backend (ahora con migraciones incluidas)
#   7. Vuelve a arrancar Postgres + aura-backend
#   8. Aplica migraciones en producción
#   9. Levanta el frontend (Vite + React + Tailwind)
#
# Pasos:
#   chmod +x run.sh
#   ./run.sh
#
# Asegúrate de tener: Docker, Docker Compose, Node.js y npm instalados.
#

set -euo pipefail

# ------------------------------------------------------------------------
# Funciones de log en color
# ------------------------------------------------------------------------
info()  { echo -e "\e[1;34m[INFO]\e[0m  $*"; }
warn()  { echo -e "\e[1;33m[WARN]\e[0m  $*"; }
error() { echo -e "\e[1;31m[ERROR]\e[0m $*"; exit 1; }

# ------------------------------------------------------------------------
# 1. Movernos a la raíz del proyecto (suponiendo run.sh está en ~/aura-stack/)
# ------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Directorio actual: $SCRIPT_DIR"

# ------------------------------------------------------------------------
# 2. Detener y eliminar contenedores y volúmenes previos
# ------------------------------------------------------------------------
info "Deteniendo y eliminando contenedores/volúmenes anteriores..."
sudo docker compose down --volumes
info "Contenedores y volúmenes eliminados."

# ------------------------------------------------------------------------
# 3. Construir imagen de aura-backend (aún sin migraciones en host)
# ------------------------------------------------------------------------
info "Construyendo imagen Docker de aura-backend (sin migraciones en host)..."
sudo docker compose build aura-backend

# ------------------------------------------------------------------------
# 4. Arrancar Postgres + aura-backend en modo detached
# ------------------------------------------------------------------------
info "Arrancando contenedores Postgres y aura-backend en segundo plano..."
sudo docker compose up -d postgres aura-backend

info "Esperando 8 segundos para que aura-backend se inicialice..."
sleep 8

# ------------------------------------------------------------------------
# 5. Generar migraciones Prisma DENTRO del contenedor aura-backend
# ------------------------------------------------------------------------
info "Generando migraciones Prisma dentro del contenedor aura-backend..."

# Identificar el nombre del contenedor aura-backend
CONTAINER_BACKEND=$(sudo docker ps --filter "name=aura-stack-aura-backend" --format "{{.Names}}" | head -n1)
if [ -z "$CONTAINER_BACKEND" ]; then
  error "No se encontró el contenedor aura-stack-aura-backend corriendo."
fi

info "Ejecutando: npx prisma migrate dev --name init_users en $CONTAINER_BACKEND..."
sudo docker compose exec aura-backend npx prisma migrate dev --name init_users

# ------------------------------------------------------------------------
# 6. Copiar las migraciones generadas del contenedor al host (con permisos)
# ------------------------------------------------------------------------
info "Copiando migraciones Prisma del contenedor al host..."

HOST_PRISMA_DIR="$SCRIPT_DIR/aura-backend/prisma"
HOST_MIGRATIONS_DIR="$HOST_PRISMA_DIR/migrations"

# a) Eliminar cualquier migración previa en el host
if [ -d "$HOST_MIGRATIONS_DIR" ]; then
  info "Eliminando carpeta previa de migraciones en el host: $HOST_MIGRATIONS_DIR"
  sudo rm -rf "$HOST_MIGRATIONS_DIR"
fi

# b) Asegurar que el directorio padre prisma/ exista y sea de tu usuario
if [ ! -d "$HOST_PRISMA_DIR" ]; then
  info "Creando carpeta padre en el host: $HOST_PRISMA_DIR"
  sudo mkdir -p "$HOST_PRISMA_DIR"
fi
info "Ajustando propietario de $HOST_PRISMA_DIR a tu usuario actual"
sudo chown "$(id -u):$(id -g)" "$HOST_PRISMA_DIR"

# c) Copiar la carpeta migrations desde el contenedor al host/prisma
info "Ejecutando docker cp para traer migrations→ $HOST_PRISMA_DIR"
sudo docker cp "$CONTAINER_BACKEND:/app/prisma/migrations" "$HOST_PRISMA_DIR"

# d) Ajustar permisos de la carpeta migrations en el host
info "Ajustando permisos de $HOST_MIGRATIONS_DIR (propietario a tu usuario)…"
sudo chown -R "$(id -u):$(id -g)" "$HOST_MIGRATIONS_DIR"

info "Migraciones copiadas al host. Listado final:"
ls -R "$HOST_MIGRATIONS_DIR" || true

# ------------------------------------------------------------------------
# 7. Detener contenedores para reconstruir imagen con migraciones incluidas
# ------------------------------------------------------------------------
info "Deteniendo contenedores para reconstruir la imagen con migraciones incluidas..."
sudo docker compose down --volumes

# ------------------------------------------------------------------------
# 8. Reconstruir imagen de aura-backend (con migraciones ya en host)
# ------------------------------------------------------------------------
info "Reconstruyendo imagen Docker de aura-backend (ahora con migrations)…"
sudo docker compose build aura-backend

# ------------------------------------------------------------------------
# 9. Volver a arrancar Postgres + aura-backend
# ------------------------------------------------------------------------
info "Arrancando nuevamente Postgres y aura-backend en segundo plano..."
sudo docker compose up -d postgres aura-backend

info "Esperando 8 segundos para que aura-backend se inicialice..."
sleep 8

# ------------------------------------------------------------------------
# 10. Aplicar migraciones en producción
# ------------------------------------------------------------------------
info "Aplicando migraciones en producción dentro de aura-backend…"
sudo docker compose exec aura-backend npx prisma migrate deploy
sudo docker compose exec aura-backend npx prisma db seed

# ------------------------------------------------------------------------
# 11. Verificar que la tabla User existe en Postgres
# ------------------------------------------------------------------------
info "Verificando tablas en la base de datos 'aura' (psql \\dt)…"
sudo docker compose exec postgres psql -U postgres -d aura -c "\dt"

# ------------------------------------------------------------------------
# 12. Probar endpoint /auth/register con curl (inline)
# ------------------------------------------------------------------------
info "Probando endpoint POST /auth/register con curl..."
# Hacemos que curl guarde el body y la cabecera de status en variables para mostrar
set +e
RESPONSE_BODY=$(curl -s -w "\nHTTP_STATUS: %{http_code}" \
  -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"UsuarioScript","email":"script@uni.es","password":"123456"}')
set -e
info "Respuesta completa de curl:"
echo "$RESPONSE_BODY"

# ------------------------------------------------------------------------
# 13. Levantar el frontend (Vite + React + Tailwind)
# ------------------------------------------------------------------------
FRONTEND_DIR="$SCRIPT_DIR/aura-frontend"
info "Instalando dependencias de frontend en $FRONTEND_DIR..."
cd "$FRONTEND_DIR"
npm install

info "Arrancando Vite en modo desarrollo…"
npm run dev &

# ------------------------------------------------------------------------
# 14. Mensaje final de estado
# ------------------------------------------------------------------------
info "------------------------------------------------------------"
info "✔ Backend AURA corriendo en http://localhost:4000"
info "✔ Frontend AURA corriendo en http://localhost:5173"
info "✔ Revisa las consolas de Docker y Vite para logs detallados."
info "------------------------------------------------------------"

exit 0

