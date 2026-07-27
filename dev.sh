#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib.sh
source "${ROOT}/scripts/lib.sh"

COMMAND="start"
SKIP_INSTALL="false"

show_help() {
  cat <<EOF
Uso: ./dev.sh [comando] [opções]

Comandos (API + Web em modo desenvolvimento local):
  start       (padrão) instala deps e inicia API + Web com hot reload
  api         inicia apenas a API em modo dev
  web         inicia apenas o Web em modo dev

Opções:
  --no-install   pula npm install no comando start
  -h, --help     exibe esta ajuda

Banco de dados (script separado):
  sh db.sh up       sobe o MySQL
  sh db.sh migrate  aplica migrations
  sh db.sh seed     popula admin
  sh db.sh studio   Prisma Studio

Exemplos:
  sh db.sh up && sh db.sh migrate
  ./dev.sh
  ./dev.sh web
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      start|api|web)
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

warn_if_mysql_down() {
  if docker_daemon_running && ! mysql_container_running; then
    warn "MySQL não está rodando no Docker."
    warn "Execute: sh db.sh up && sh db.sh migrate"
  elif ! docker_daemon_running; then
    warn "Docker não está rodando. Confira DATABASE_URL em apps/api/.env"
  fi
}

cmd_start() {
  require_node

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    step "Instalando dependências..."
    npm install
  fi

  ensure_env_files
  warn_if_mysql_down
  free_dev_ports

  step "Iniciando API e Web com hot reload..."
  show_urls
  echo "Pressione Ctrl+C para parar."
  echo ""
  npm run dev
}

cmd_api() {
  require_node
  ensure_env_files
  warn_if_mysql_down
  free_dev_ports

  step "Iniciando API em modo dev..."
  echo "  API:    http://localhost:3333"
  echo "  Health: http://localhost:3333/api/health"
  echo ""
  npm run dev -w apps/api
}

cmd_web() {
  require_node
  ensure_env_files
  free_dev_ports

  step "Iniciando Web em modo dev..."
  echo "  Web: http://localhost:3000"
  echo ""
  npm run dev -w apps/web
}

main() {
  parse_args "$@"

  echo "Refeno Manager - desenvolvimento (API + Web)"

  case "$COMMAND" in
    start) cmd_start ;;
    api) cmd_api ;;
    web) cmd_web ;;
    *) fail "Comando inválido: $COMMAND" ;;
  esac
}

main "$@"
