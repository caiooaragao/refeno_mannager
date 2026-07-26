#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MODE="auto"

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

docker_ready() {
  docker_daemon_running
}

stop_compose_containers() {
  if ! docker_daemon_running; then
    return 0
  fi

  step "Parando containers anteriores..."
  docker compose down --remove-orphans
  ok "Containers anteriores encerrados."
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --mode|-m)
        MODE="${2:-}"
        shift 2
        ;;
      auto|docker|local)
        MODE="$1"
        shift
        ;;
      -h|--help)
        cat <<EOF
Uso: ./run.sh [--mode auto|docker|local]

  auto   (padrão) usa Docker se disponível, senão modo local
  docker sobe MySQL + API + Web com Docker Compose
  local  instala deps, sobe MySQL (se Docker existir) e roda npm run dev
EOF
        exit 0
        ;;
      *)
        fail "Argumento inválido: $1 (use --help)"
        ;;
    esac
  done

  case "$MODE" in
    auto|docker|local) ;;
    *) fail "Modo inválido: $MODE (use auto, docker ou local)" ;;
  esac
}

ensure_env_files() {
  if [[ ! -f "apps/api/.env" ]]; then
    cp ".env.example" "apps/api/.env"
    ok "Criado apps/api/.env"
  fi

  if [[ ! -f "apps/web/.env.local" ]]; then
    cat > "apps/web/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_ADMIN_USER=dantenovas
NEXT_PUBLIC_ADMIN_PASSWORD=danterefeno
EOF
    ok "Criado apps/web/.env.local"
  fi
}

wait_mysql() {
  step "Aguardando MySQL ficar pronto..."

  for _ in $(seq 1 30); do
    if docker compose exec -T mysql mysqladmin ping -h localhost -u root -proot --silent 2>/dev/null; then
      ok "MySQL pronto."
      return 0
    fi
    sleep 2
  done

  fail "MySQL não respondeu a tempo. Veja: docker compose logs mysql"
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

  fail "API não respondeu a tempo. Veja: docker compose logs api"
}

run_migrations() {
  (
    cd apps/api
    npx prisma migrate deploy
  )
  ok "Migrations aplicadas."
}

run_seed() {
  (
    cd apps/api
    npx prisma db seed
  )
  ok "Usuário admin criado/atualizado."
}

show_success() {
  local startup_mode="$1"

  echo ""
  ok "Pronto! ($startup_mode)"
  echo "  Web:    http://localhost:3000"
  echo "  Form:   http://localhost:3000/forms/refeno"
  echo "  Admin:  http://localhost:3000/admin"
  echo "  API:    http://localhost:3333"
  echo "  Health: http://localhost:3333/api/health"
  echo ""
}

start_docker_stack() {
  stop_compose_containers

  step "Subindo MySQL, API e Web com Docker..."
  docker compose up --build -d

  wait_mysql
  wait_api
  show_success "Docker"
  echo "Para parar: docker compose down"
  echo "Para logs:  docker compose logs -f"
}

start_local_stack() {
  step "Instalando dependências..."
  npm install

  ensure_env_files

  if docker_daemon_running; then
    stop_compose_containers
    step "Subindo apenas o MySQL no Docker..."
    docker compose up -d mysql
    wait_mysql
  elif docker_installed; then
    warn "Docker instalado, mas não está rodando. Abra o Docker Desktop."
    warn "Usando MySQL local na porta 3306. Confira DATABASE_URL em apps/api/.env"
  else
    warn "Docker não encontrado. Usando MySQL local na porta 3306."
    warn "Confira DATABASE_URL em apps/api/.env"
  fi

  run_migrations
  run_seed

  step "Iniciando API e Web em modo desenvolvimento..."
  show_success "Local"
  echo "Pressione Ctrl+C para parar."
  echo ""
  npm run dev
}

main() {
  parse_args "$@"

  echo "Refeno Manager - setup e start"

  has_command node || fail "Node.js não encontrado. Instale Node.js 20+ e tente novamente."

  local use_docker="false"

  case "$MODE" in
    docker)
      if ! docker_installed; then
        fail "Modo docker solicitado, mas o comando docker não foi encontrado.
Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/
Depois feche e reabra o terminal."
      fi
      if ! docker_daemon_running; then
        fail "Docker está instalado, mas o daemon não está rodando.
Abra o Docker Desktop e aguarde ficar 'Running', depois rode novamente."
      fi
      use_docker="true"
      ;;
    local)
      use_docker="false"
      ;;
    auto)
      if docker_daemon_running; then
        use_docker="true"
      elif docker_installed; then
        warn "Docker instalado, mas não está rodando."
        warn "Abra o Docker Desktop e aguarde ficar 'Running', depois rode: sh run.sh --mode docker"
        warn "Usando modo local por enquanto."
        use_docker="false"
      else
        warn "Docker não encontrado no PATH."
        warn "Se já instalou o Docker Desktop, feche e reabra o terminal."
        warn "Usando modo local."
        use_docker="false"
      fi
      ;;
  esac

  if [[ "$use_docker" == "true" ]]; then
    start_docker_stack
  else
    start_local_stack
  fi
}

main "$@"
