#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMMAND="start"
SKIP_INSTALL="false"

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

stop_compose_containers() {
  if ! docker_daemon_running; then
    return 0
  fi

  step "Parando containers anteriores..."
  docker compose down --remove-orphans
  ok "Containers anteriores encerrados."
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

ensure_mysql() {
  if docker_daemon_running; then
    stop_compose_containers
    step "Subindo MySQL no Docker..."
    docker compose up -d mysql
    wait_mysql
    return 0
  fi

  if docker_installed; then
    warn "Docker instalado, mas não está rodando. Abra o Docker Desktop."
  else
    warn "Docker não encontrado."
  fi

  warn "Usando MySQL local na porta 3306. Confira DATABASE_URL em apps/api/.env"
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

show_urls() {
  echo ""
  ok "Ambiente de desenvolvimento"
  echo "  Web:    http://localhost:3000"
  echo "  Form:   http://localhost:3000/forms/refeno"
  echo "  Admin:  http://localhost:3000/admin"
  echo "  API:    http://localhost:3333"
  echo "  Health: http://localhost:3333/api/health"
  echo ""
}

show_help() {
  cat <<EOF
Uso: ./dev.sh [comando] [opções]

Comandos:
  start       (padrão) instala deps, sobe MySQL, aplica migrations e inicia API + Web
  migrate     aplica migrations no banco
  seed        popula o banco com dados iniciais
  studio      abre o Prisma Studio
  db          sobe apenas o MySQL no Docker
  api         inicia apenas a API em modo dev
  web         inicia apenas o Web em modo dev

Opções:
  --no-install   pula npm install no comando start
  -h, --help     exibe esta ajuda

Exemplos:
  ./dev.sh
  ./dev.sh start --no-install
  ./dev.sh migrate
  ./dev.sh studio
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      start|migrate|seed|studio|db|api|web)
        COMMAND="$1"
        shift
        ;;
      --no-install)
        SKIP_INSTALL="true"
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        fail "Argumento inválido: $1 (use --help)"
        ;;
    esac
  done
}

cmd_start() {
  has_command node || fail "Node.js não encontrado. Instale Node.js 20+ e tente novamente."

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    step "Instalando dependências..."
    npm install
  fi

  ensure_env_files
  ensure_mysql
  run_migrations
  run_seed

  step "Iniciando API e Web com hot reload..."
  show_urls
  echo "Pressione Ctrl+C para parar."
  echo ""
  npm run dev
}

cmd_migrate() {
  ensure_env_files
  ensure_mysql
  run_migrations
  run_seed
}

cmd_seed() {
  ensure_env_files
  ensure_mysql
  (
    cd apps/api
    npm run db:seed
  )
  ok "Seed concluído."
}

cmd_studio() {
  ensure_env_files
  ensure_mysql
  (
    cd apps/api
    npm run db:studio
  )
}

cmd_db() {
  docker_installed || fail "Docker não encontrado. Instale o Docker Desktop."
  docker_daemon_running || fail "Docker não está rodando. Abra o Docker Desktop."

  stop_compose_containers
  step "Subindo MySQL no Docker..."
  docker compose up -d mysql
  wait_mysql
  ok "MySQL rodando na porta 3306."
  echo "Para parar: docker compose stop mysql"
}

cmd_api() {
  has_command node || fail "Node.js não encontrado. Instale Node.js 20+ e tente novamente."
  ensure_env_files
  ensure_mysql

  step "Iniciando API em modo dev..."
  echo "  API:    http://localhost:3333"
  echo "  Health: http://localhost:3333/api/health"
  echo ""
  npm run dev -w apps/api
}

cmd_web() {
  has_command node || fail "Node.js não encontrado. Instale Node.js 20+ e tente novamente."
  ensure_env_files

  step "Iniciando Web em modo dev..."
  echo "  Web: http://localhost:3000"
  echo ""
  npm run dev -w apps/web
}

main() {
  parse_args "$@"

  echo "Refeno Manager - desenvolvimento local"

  case "$COMMAND" in
    start) cmd_start ;;
    migrate) cmd_migrate ;;
    seed) cmd_seed ;;
    studio) cmd_studio ;;
    db) cmd_db ;;
    api) cmd_api ;;
    web) cmd_web ;;
    *) fail "Comando inválido: $COMMAND" ;;
  esac
}

main "$@"
