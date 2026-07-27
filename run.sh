#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib.sh
source "${ROOT}/scripts/lib.sh"

MODE="auto"

show_help() {
  cat <<EOF
Uso: ./run.sh [--mode auto|docker|local]

Atalho para subir tudo. Para controle separado, use:
  sh db.sh up          banco
  sh db.sh migrate     migrations
  sh dev.sh            API + Web local (dev)
  sh docker-app.sh up  API + Web Docker (prod)

Modos:
  auto   (padrão) Docker se disponível, senão local
  docker sobe banco + apps com Docker
  local  sobe banco + apps em modo dev

Opções:
  -h, --help  exibe esta ajuda
EOF
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
        show_help
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

start_docker_stack() {
  "$ROOT/db.sh" up
  "$ROOT/db.sh" migrate
  "$ROOT/docker-app.sh" up
}

start_local_stack() {
  require_node

  step "Instalando dependências..."
  npm install

  ensure_env_files

  if docker_daemon_running; then
    "$ROOT/db.sh" up
    "$ROOT/db.sh" migrate
    "$ROOT/db.sh" seed
  else
    warn_if_mysql_down_local
  fi

  free_dev_ports

  step "Iniciando API e Web em modo desenvolvimento..."
  show_urls
  echo "Pressione Ctrl+C para parar."
  echo ""
  npm run dev
}

warn_if_mysql_down_local() {
  if docker_installed; then
    warn "Docker instalado, mas não está rodando. Abra o Docker Desktop."
    warn "Usando MySQL local na porta 3306. Confira DATABASE_URL em apps/api/.env"
  else
    warn "Docker não encontrado. Usando MySQL local na porta 3306."
    warn "Confira DATABASE_URL em apps/api/.env"
  fi
}

main() {
  parse_args "$@"

  echo "Refeno Manager - setup e start"

  local use_docker="false"

  case "$MODE" in
    docker)
      require_docker
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
