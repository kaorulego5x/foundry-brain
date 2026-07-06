#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${FOUNDRY_VISUALIZER_LOG:-/tmp/foundry-brain-visualizer.log}"
PORT="${PORT:-3000}"
LOCK_FILE="$ROOT/.next/dev/lock"
URL="http://localhost:$PORT"

port_pid() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":$PORT" 2>/dev/null | head -1
    return
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -tlnp 2>/dev/null | grep ":$PORT " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1
  fi
}

lock_pid() {
  if [ -f "$LOCK_FILE" ]; then
    node -e "try{const l=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(l.pid||''))}catch(e){}" "$LOCK_FILE" 2>/dev/null || true
  fi
}

running_pid() {
  local pid
  pid="$(lock_pid)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "$pid"
    return 0
  fi
  pid="$(port_pid)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "$pid"
    return 0
  fi
  return 1
}

cmd_start() {
  local pid
  if pid="$(running_pid 2>/dev/null)"; then
    echo "Dev server already running (pid $pid) → $URL"
    exit 0
  fi

  cd "$ROOT"
  if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
  fi

  : >> "$LOG_FILE"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] starting dev server on port $PORT" >> "$LOG_FILE"

  # Fully detach from the invoking shell so the process survives Cursor task cleanup.
  # (setsid is Linux-only; macOS falls back to plain nohup)
  if command -v setsid >/dev/null 2>&1; then
    setsid nohup npm run dev >> "$LOG_FILE" 2>&1 < /dev/null &
  else
    nohup npm run dev >> "$LOG_FILE" 2>&1 < /dev/null &
  fi
  disown

  for _ in $(seq 1 60); do
    if pid="$(running_pid 2>/dev/null)"; then
      echo "Dev server ready (pid $pid) → $URL"
      echo "Log: $LOG_FILE"
      exit 0
    fi
    sleep 0.5
  done

  echo "Dev server did not become ready within 30s. Check $LOG_FILE" >&2
  tail -20 "$LOG_FILE" >&2 || true
  exit 1
}

cmd_stop() {
  local pid
  if ! pid="$(running_pid 2>/dev/null)"; then
    echo "Dev server not running"
    exit 0
  fi
  kill "$pid" 2>/dev/null || true
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi
  echo "Stopped dev server (pid $pid)"
}

cmd_status() {
  local pid
  if pid="$(running_pid 2>/dev/null)"; then
    echo "running (pid $pid) → $URL"
  else
    echo "stopped"
    exit 1
  fi
}

case "${1:-start}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart)
    cmd_stop || true
    cmd_start
    ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
esac
