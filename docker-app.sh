#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib.sh
source "${ROOT}/scripts/lib.sh"

COMMAND="${1:-up}"

show_help() {
  cat <<EOF
Uso: ./docker-app.sh [comando]

Comandos:
  up, start     (padrão) sobe API + Web com Docker (não reinicia o banco)
  down, stop    para API + Web (mantém o MySQL rodando)
  api           rebuild e sobe apenas a API
  web           rebuild e sobe apenas o Web
  logs          logs de API + Web
  status        status dos containers da aplicação

Pré-requisito:
  MySQL rodando (sh db.sh up)

Exemplos:
  ./docker-app.sh up
  ./docker-app.sh web
  ./docker-app.sh down
EOF
}

parse_args() {
  case "${1:-up}" in
    up|start|down|stop|api|web|logs|status)
      COMMAND="$1"
      ;;
    -h|--help|help)
      show_help
      exit 0
      ;;
    *)
      fail "Comando inválido: $1 (use --help)"
      ;;
  esac
}

require_mysql() {
  require_docker

  if ! mysql_container_running; then
    fail "MySQL não está rodando. Execute primeiro: sh db.sh up"
  fi
}

cmd_up() {
  require_mysql

  step "Subindo API e Web com Docker..."
  docker compose up --build -d api web

  wait_api
  show_urls
  ok "Aplicação Docker rodando."
  echo "Para parar apps: sh docker-app.sh stop"
  echo "Para logs:      sh docker-app.sh logs"
}

cmd_down() {
  require_docker

  step "Parando API e Web..."
  docker compose stop api web
  ok "API e Web parados. O MySQL continua rodando."
}

cmd_api() {
  require_mysql

  step "Rebuild e start da API..."
  docker compose up --build -d api
  wait_api
  ok "API rodando em http://localhost:3333"
}

cmd_web() {
  require_mysql

  step "Rebuild e start do Web..."
  docker compose up --build -d web
  ok "Web rodando em http://localhost:3000"
}

cmd_logs() {
  require_docker
  docker compose logs -f api web
}

cmd_status() {
  require_docker
  docker compose ps api web
}

main() {
  parse_args "${1:-up}"

  echo "Refeno Manager - apps (Docker)"

  case "$COMMAND" in
    up|start) cmd_up ;;
    down|stop) cmd_down ;;
    api) cmd_api ;;
    web) cmd_web ;;
    logs) cmd_logs ;;
    status) cmd_status ;;
    *) fail "Comando inválido: $COMMAND" ;;
  esac
}

main "$@"
