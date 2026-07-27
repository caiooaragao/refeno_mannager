#!/usr/bin/env bash

REFENO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRISMA_VERSION="6.19.3"

step() {
  echo ""
  echo "==> $1"
}

ok() {
  echo "$1"
}

warn() {
  echo "$1"
}

fail() {
  echo "$1" >&2
  exit 1
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

setup_docker_path() {
  if has_command docker; then
    return 0
  fi

  local docker_dirs=(
    "/c/Program Files/Docker/Docker/resources/bin"
    "${PROGRAMFILES:-}/Docker/Docker/resources/bin"
  )

  for dir in "${docker_dirs[@]}"; do
    if [[ -f "${dir}/docker.exe" ]]; then
      export PATH="${dir}:${PATH}"
      return 0
    fi
  done

  return 1
}

docker_installed() {
  setup_docker_path || return 1
  has_command docker
}

docker_daemon_running() {
  docker_installed && docker info >/dev/null 2>&1
}

require_docker() {
  docker_installed || fail "Docker não encontrado. Instale o Docker Desktop."
  docker_daemon_running || fail "Docker não está rodando. Abra o Docker Desktop."
}

require_node() {
  has_command node || fail "Node.js não encontrado. Instale Node.js 20+ e tente novamente."
}

mysql_container_running() {
  docker compose ps mysql --status running -q 2>/dev/null | grep -q .
}

load_root_env() {
  if [[ -f "${REFENO_ROOT}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${REFENO_ROOT}/.env"
    set +a
  fi

  MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
  MYSQL_DATABASE="${MYSQL_DATABASE:-refeno_manager}"
  MYSQL_USER="${MYSQL_USER:-refeno}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD:-refeno}"
  JWT_SECRET="${JWT_SECRET:-change-me-in-production}"
  JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-24h}"
  FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
  SEED_ADMIN_LOGIN="${SEED_ADMIN_LOGIN:-dantenovaes}"
  SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-danterefeno}"
  NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3333}"
  NEXT_PUBLIC_ADMIN_USER="${NEXT_PUBLIC_ADMIN_USER:-dantenovaes}"
  NEXT_PUBLIC_ADMIN_PASSWORD="${NEXT_PUBLIC_ADMIN_PASSWORD:-danterefeno}"
}

ensure_env_files() {
  load_root_env

  if [[ ! -f "${REFENO_ROOT}/.env" ]]; then
    cp "${REFENO_ROOT}/.env.example" "${REFENO_ROOT}/.env"
    load_root_env
    ok "Criado .env"
  fi

  if [[ ! -f "${REFENO_ROOT}/apps/api/.env" ]]; then
    cat > "${REFENO_ROOT}/apps/api/.env" <<EOF
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:3306/${MYSQL_DATABASE}
API_PORT=3333
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
FRONTEND_URL=${FRONTEND_URL}
SEED_ADMIN_LOGIN=${SEED_ADMIN_LOGIN}
SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD}
EOF
    ok "Criado apps/api/.env"
  fi

  if [[ ! -f "${REFENO_ROOT}/apps/web/.env.local" ]]; then
    cat > "${REFENO_ROOT}/apps/web/.env.local" <<EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_ADMIN_USER=${NEXT_PUBLIC_ADMIN_USER}
NEXT_PUBLIC_ADMIN_PASSWORD=${NEXT_PUBLIC_ADMIN_PASSWORD}
EOF
    ok "Criado apps/web/.env.local"
  fi
}

wait_mysql() {
  load_root_env

  step "Aguardando MySQL ficar pronto..."

  for _ in $(seq 1 30); do
    if docker compose exec -T mysql mysqladmin ping -h localhost -u root "-p${MYSQL_ROOT_PASSWORD}" --silent 2>/dev/null; then
      ok "MySQL pronto."
      return 0
    fi
    sleep 2
  done

  fail "MySQL não respondeu a tempo. Veja: sh db.sh logs"
}

wait_api() {
  step "Aguardando API ficar pronta..."

  for _ in $(seq 1 30); do
    if curl -sf "http://localhost:3333/api/health" >/dev/null 2>&1; then
      ok "API pronta."
      return 0
    fi
    sleep 2
  done

  fail "API não respondeu a tempo. Veja: sh docker-app.sh logs"
}

run_prisma() {
  local prisma_bin="${REFENO_ROOT}/node_modules/.bin/prisma"

  (
    cd "${REFENO_ROOT}/apps/api"
    if [[ -x "$prisma_bin" ]]; then
      "$prisma_bin" "$@"
    else
      npx --yes "prisma@${PRISMA_VERSION}" "$@"
    fi
  )
}

run_migrations() {
  run_prisma migrate deploy
  ok "Migrations aplicadas."
}

run_seed() {
  run_prisma db seed
  ok "Usuário admin criado/atualizado."
}

free_dev_ports() {
  local ports=(3000 3333)

  step "Liberando portas de desenvolvimento (3000, 3333)..."

  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      foreach (\$port in @(3000, 3333)) {
        \$conns = Get-NetTCPConnection -LocalPort \$port -State Listen -ErrorAction SilentlyContinue
        if (\$conns) {
          \$conns | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            Stop-Process -Id \$_ -Force -ErrorAction SilentlyContinue
          }
        }
      }
    " >/dev/null 2>&1 || true
  elif has_command lsof; then
    for port in "${ports[@]}"; do
      lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
    done
  elif has_command fuser; then
    for port in "${ports[@]}"; do
      fuser -k "${port}/tcp" 2>/dev/null || true
    done
  fi

  ok "Portas liberadas."
}

show_urls() {
  echo ""
  ok "URLs"
  echo "  Web:    http://localhost:3000"
  echo "  Form:   http://localhost:3000/forms/refeno"
  echo "  Admin:  http://localhost:3000/admin"
  echo "  API:    http://localhost:3333"
  echo "  Health: http://localhost:3333/api/health"
  echo ""
}
