#!/usr/bin/env bash
# Install the web-design skill for Claude Code by symlinking it into ~/.claude/skills.
#   ./install.sh            install (symlink, so `git pull` updates the skill)
#   ./install.sh --copy     copy instead of symlink
#   ./install.sh --project  install into ./.claude/skills of the current directory
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills/web-design"
DEST_ROOT="${HOME}/.claude/skills"
MODE=link
for arg in "$@"; do
  case "$arg" in
    --copy) MODE=copy ;;
    --project) DEST_ROOT="$(pwd)/.claude/skills" ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done
mkdir -p "$DEST_ROOT"
DEST="$DEST_ROOT/web-design"
if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  echo "replacing existing $DEST"
  rm -rf "$DEST"
fi
if [ "$MODE" = copy ]; then cp -R "$SRC" "$DEST"; else ln -s "$SRC" "$DEST"; fi
echo "installed web-design -> $DEST ($MODE)"
echo "template dependencies: (cd \"$SRC/template\" && npm install && npx playwright install chromium)"
