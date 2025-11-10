#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-5000}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}/api}"
ADMIN_EMAIL="${VERIFY_ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${VERIFY_ADMIN_PASSWORD:-Password@123}"
ADMIN_ROLE="${VERIFY_ADMIN_ROLE:-Admin}"

SERVER_PID=""

log_ok() { echo "[OK] $1"; }
log_info() { echo "[INFO] $1"; }
log_fail() { echo "[FAIL] $1"; exit 1; }

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

check_db_connection() {
  if ! echo 'SELECT 1;' | npx prisma db execute --stdin --schema prisma/schema.prisma >/dev/null 2>&1; then
    log_fail "PostgreSQL connection failed"
  fi
  log_ok "PostgreSQL connection verified"
}

check_prisma_client() {
  if ! node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(()=>prisma.\$disconnect()).then(()=>process.exit(0)).catch(()=>process.exit(1));"; then
    log_fail "Prisma client failed to load"
  fi
  log_ok "Prisma client loads successfully"
}

ensure_server() {
  if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
    log_info "Server already running at $BASE_URL"
    return
  fi

  log_info "Starting server for verification"
  npm run start >/tmp/cineticket-runtime-verify.log 2>&1 &
  SERVER_PID=$!

  for _ in {1..40}; do
    if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
      log_ok "Server is responding"
      return
    fi
    sleep 1
  done

  log_fail "Server did not start. Check /tmp/cineticket-runtime-verify.log"
}

check_status_200() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -sS -o /tmp/verify-response.json -w "%{http_code}" "$url")
  [[ "$code" == "200" ]] || log_fail "$name failed with status $code"
  log_ok "$name"
}

check_auth_and_routes() {
  local login_body login_code access_token refresh_token show_id

  login_body=$(curl -sS -o /tmp/verify-login.json -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "content-type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"role\":\"$ADMIN_ROLE\"}")
  login_code="$login_body"
  [[ "$login_code" == "201" || "$login_code" == "200" ]] || log_fail "Auth login failed with status $login_code"

  access_token=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('/tmp/verify-login.json','utf8')); process.stdout.write(j.data?.accessToken||j.accessToken||'');")
  refresh_token=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('/tmp/verify-login.json','utf8')); process.stdout.write(j.data?.refreshToken||j.refreshToken||'');")
  [[ -n "$access_token" && -n "$refresh_token" ]] || log_fail "Auth login response missing token pair"
  log_ok "Auth login route"

  check_status_200 "Events route" "$BASE_URL/events"
  check_status_200 "Shows route" "$BASE_URL/shows"

  show_id=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('/tmp/verify-response.json','utf8')); const list=j.data?.data||j.data||j; const first=Array.isArray(list)?list[0]:null; process.stdout.write(first?.id||'');")
  [[ -n "$show_id" ]] || log_fail "No show found for seat verification"

  check_status_200 "Seat loading route" "$BASE_URL/shows/$show_id/seats"

  local refresh_code logout_code
  refresh_code=$(curl -sS -o /tmp/verify-refresh.json -w "%{http_code}" -X POST "$BASE_URL/auth/refresh" \
    -H "content-type: application/json" \
    -d "{\"refreshToken\":\"$refresh_token\"}")
  [[ "$refresh_code" == "201" || "$refresh_code" == "200" ]] || log_fail "Auth refresh failed with status $refresh_code"
  log_ok "Auth refresh route"

  logout_code=$(curl -sS -o /tmp/verify-logout.json -w "%{http_code}" -X POST "$BASE_URL/auth/logout" \
    -H "content-type: application/json" \
    -d "{\"refreshToken\":\"$refresh_token\"}")
  [[ "$logout_code" == "201" || "$logout_code" == "200" ]] || log_fail "Auth logout failed with status $logout_code"
  log_ok "Auth logout route"
}

log_info "Runtime verification started ($BASE_URL)"
check_db_connection
check_prisma_client
ensure_server
check_status_200 "Health endpoint" "$BASE_URL/health"
check_auth_and_routes
log_ok "All runtime checks passed"
