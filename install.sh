#!/usr/bin/env bash
# dsh-skill · DeepSeek Harness Official Plugin & Skill Development Kit Installer
# Supports one-line install via: curl -fsSL https://raw.githubusercontent.com/realchendahuang/dsh-skill/main/install.sh | bash

set -euo pipefail

REPO="realchendahuang/dsh-skill"

# ANSI colors
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
BOLD='\033[1m'
NC='\033[0m'

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    return 1
  fi
}

print_banner() {
  printf "${CYAN}
   ___  _____ __  __   ____  __ ___ __   __
  / _ \\/ __/ // / /  / __/ / //_// // / / /
 / // /\\ \\/ _  / /__ \\ \\  / ,<  / // /_/ /_
/____/___/_//_/____/___/ /_/|_|/_//_/____(_)
  DeepSeek Harness Plugin & Skill Development Kit
${NC}\n"
}

print_banner

# Determine home directory
USER_HOME="${HOME:-$(getent passwd "$(whoami)" | cut -d: -f6)}"

# Target agent paths
DSH_DIR="${DSH_HOME:-$USER_HOME/.dsh}/skills/dsh-plugin-dev"
CLAUDE_DIR="$USER_HOME/.claude/skills/dsh-plugin-dev"
CODEX_DIR="$USER_HOME/.agents/skills/dsh-plugin-dev"
ANTIGRAVITY_DIR="$USER_HOME/.gemini/config/skills/dsh-plugin-dev"
LOCAL_BIN="$USER_HOME/.local/bin"

TEMP_DIR=""
cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

# Check if running inside cloned repo or need download
SOURCE_DIR=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"

if [ -f "${SCRIPT_DIR}/SKILL.md" ] && [ -d "${SCRIPT_DIR}/references" ]; then
  SOURCE_DIR="$SCRIPT_DIR"
  echo "Installing from local repository: ${SOURCE_DIR}"
else
  TEMP_DIR="$(mktemp -d)"
  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    printf "${RED}Error: curl or wget is required to download dsh-skill.${NC}\n" >&2
    exit 1
  fi

  # Pin to the latest GitHub release tag for reproducible installs.
  # Override with DSH_SKILL_VERSION=<tag|main>, e.g. DSH_SKILL_VERSION=v0.2.1 install.sh
  REF="${DSH_SKILL_VERSION:-}"
  if [ -z "$REF" ]; then
    echo "Resolving latest dsh-skill release..."
    REF="$(fetch "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4 || true)"
  fi
  if [ -z "$REF" ]; then
    printf "${YELLOW}Warning: could not resolve the latest release; falling back to the main branch.${NC}\n"
    REF="main"
  fi

  if [ "$REF" = "main" ]; then
    TARBALL_URL="https://github.com/${REPO}/archive/refs/heads/main.tar.gz"
  else
    TARBALL_URL="https://github.com/${REPO}/archive/refs/tags/${REF}.tar.gz"
  fi
  echo "Fetching dsh-skill ${REF} from GitHub..."
  fetch "$TARBALL_URL" | tar -xz -C "$TEMP_DIR" --strip-components=1
  SOURCE_DIR="$TEMP_DIR"
fi

install_to() {
  local target_name="$1"
  local target_dir="$2"

  mkdir -p "$target_dir"
  for item in SKILL.md references playbooks templates bin cordis.patch.yml install.ps1; do
    if [ -e "${SOURCE_DIR}/${item}" ]; then
      cp -R "${SOURCE_DIR}/${item}" "${target_dir}/"
    fi
  done
  printf "  ${GREEN}✔${NC} %-14s -> %s\n" "$target_name" "$target_dir"
}

echo ""
echo "Deploying skills to AI Agent discovery directories:"
install_to "DSH" "$DSH_DIR"
install_to "Claude Code" "$CLAUDE_DIR"
install_to "Codex / Universal" "$CODEX_DIR"
install_to "Antigravity" "$ANTIGRAVITY_DIR"

# Install CLI shim to ~/.local/bin/dsh-skill
mkdir -p "$LOCAL_BIN"
SHIM_PATH="${LOCAL_BIN}/dsh-skill"
NODE_SCRIPT="${CODEX_DIR}/bin/dsh-skill.mjs"

cat <<EOF > "$SHIM_PATH"
#!/usr/bin/env bash
if command -v node >/dev/null 2>&1; then
  exec node "${NODE_SCRIPT}" "\$@"
else
  echo "Error: Node.js is required to execute dsh-skill CLI." >&2
  exit 1
fi
EOF

chmod +x "$SHIM_PATH"
printf "  ${GREEN}✔${NC} %-14s -> %s\n" "CLI (PATH)" "$SHIM_PATH"

echo ""
printf "${BOLD}${GREEN}Installation succeeded!${NC}\n"

# Verify PATH
case ":$PATH:" in
  *":$LOCAL_BIN:"*) ;;
  *)
    printf "${YELLOW}Note: %s is not in your \$PATH. Add this to your shell config (~/.zshrc or ~/.bashrc):${NC}\n" "$LOCAL_BIN"
    printf "  export PATH=\"\$PATH:%s\"\n\n" "$LOCAL_BIN"
    ;;
esac

echo "You can now run:"
printf "  ${CYAN}dsh-skill status${NC}              # Verify agent platforms\n"
printf "  ${CYAN}dsh-skill init dsh-my-tools${NC}   # Scaffold a new DSH plugin\n"
printf "  ${CYAN}dsh-skill check .${NC}             # Audit plugin specification compliance\n"
echo ""
