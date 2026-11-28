#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${RENDER_EXTERNAL_HOSTNAME:?RENDER_EXTERNAL_HOSTNAME must be set}"

if [ -z "${KC_HOSTNAME:-}" ]; then
  export KC_HOSTNAME="https://${RENDER_EXTERNAL_HOSTNAME}"
fi

case "$DATABASE_URL" in
  postgresql://*) database_url="${DATABASE_URL#postgresql://}" ;;
  *)
    echo "DATABASE_URL must use the postgresql:// scheme" >&2
    exit 1
    ;;
esac

credentials="${database_url%%@*}"
address="${database_url#*@}"
host_port="${address%%/*}"
database="${address#*/}"
database="${database%%\?*}"
username="${credentials%%:*}"
password="${credentials#*:}"
host="${host_port%%:*}"
port="${host_port#*:}"

case "$credentials" in
  *:*) ;;
  *)
    echo "DATABASE_URL must include a username and password" >&2
    exit 1
    ;;
esac

case "$host_port" in
  *:*) ;;
  *)
    echo "DATABASE_URL must include a database port" >&2
    exit 1
    ;;
esac

if [ "$credentials" = "$database_url" ] || [ -z "$username" ] || [ -z "$password" ] \
  || [ -z "$host" ] || [ -z "$port" ] || [ -z "$database" ]; then
  echo "DATABASE_URL is missing a database connection component" >&2
  exit 1
fi

export KC_DB_URL="jdbc:postgresql://${host}:${port}/${database}?user=${username}&password=${password}"

exec /opt/keycloak/bin/kc.sh "$@"
