#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib.sh
source "${ROOT}/scripts/lib.sh"

COMMAND="${1:-up}"

show_help() {
  cat <<EOF
Uso: ./db.sh [comando]

Comandos:
  up, start     (padrão) sobe apenas o MySQL no Docker
  down, stop    para o MySQL (mantém os dados no volume)
  migrate       aplica migrations no banco
  seed          popula dados iniciais (admin)
  studio        abre o Prisma Studio
  logs          exibe logs do MySQL
  status        mostra status do container MySQL
  reset         APAGA o banco e recria do zero (destrutivo)

Exemplos:
  ./db.sh up
  ./db.sh migrate
  ./db.sh studio
EOF
}

parse_args() {
  case "${1:-up}" in
    up|start|down|stop|migrate|seed|studio|logs|status|reset)
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

cmd_up() {
  require_docker

  if mysql_container_running; then
    ok "MySQL já está rodando."
    wait_mysql
    return 0
  fi

  step "Subindo MySQL no Docker..."
  docker compose up -d mysql
  wait_mysql
  ok "MySQL rodando na porta 3306."
  echo "Para parar: sh db.sh stop"
}

cmd_down() {
  require_docker

  step "Parando MySQL..."
  docker compose stop mysql
  ok "MySQL parado. Os dados permanecem no volume mysql_data."
}

cmd_migrate() {
  require_node
  ensure_env_files

  if docker_daemon_running && ! mysql_container_running; then
    cmd_up
  elif ! docker_daemon_running; then
    warn "Docker não está rodando. Usando MySQL local (porta 3306)."
  fi

  run_migrations
}

cmd_seed() {
  require_node
  ensure_env_files

  if docker_daemon_running && ! mysql_container_running; then
    cmd_up
  elif ! docker_daemon_running; then
    warn "Docker não está rodando. Usando MySQL local (porta 3306)."
  fi

  run_seed
}

cmd_studio() {
  require_node
  ensure_env_files

  if docker_daemon_running && ! mysql_container_running; then
    cmd_up
  elif ! docker_daemon_running; then
    warn "Docker não está rodando. Usando MySQL local (porta 3306)."
  fi

  (
    cd apps/api
    npm run db:studio
  )
}

cmd_logs() {
  require_docker
  docker compose logs -f mysql
}

cmd_status() {
  require_docker
  docker compose ps mysql
}

cmd_reset() {
  require_docker
  require_node
  ensure_env_files

  warn "ATENÇÃO: isso vai APAGAR todos os dados do banco."
  read -r -p "Digite 'sim' para confirmar: " confirm

  if [[ "$confirm" != "sim" ]]; then
    ok "Reset cancelado."
    exit 0
  fi

  step "Removendo MySQL e volume de dados..."
  docker compose stop mysql 2>/dev/null || true
  docker compose rm -f mysql 2>/dev/null || true

  local volume_name
  volume_name="$(docker volume ls -q --filter name=mysql_data | head -n 1)"

  if [[ -n "$volume_name" ]]; then
    docker volume rm "$volume_name"
    ok "Volume $volume_name removido."
  fi

  cmd_up
  run_migrations
  run_seed
  ok "Banco recriado do zero."
}

main() {
  parse_args "${1:-up}"

  echo "Refeno Manager - banco de dados"

  case "$COMMAND" in
    up|start) cmd_up ;;
    down|stop) cmd_down ;;
    migrate) cmd_migrate ;;
    seed) cmd_seed ;;
    studio) cmd_studio ;;
    logs) cmd_logs ;;
    status) cmd_status ;;
    reset) cmd_reset ;;
    *) fail "Comando inválido: $COMMAND" ;;
  esac
}

main "$@"
