#!/bin/bash
# Clo Widgets — Install Script
# Compiles schemas and copies the extension to the GNOME extensions directory.

set -e

EXTENSION_UUID="clo-widgets@mitkumar.dev"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════╗"
echo "║       Clo Widgets — Installer        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Compile GSettings schemas
echo "▸ Compiling GSettings schemas..."
glib-compile-schemas "$SOURCE_DIR/schemas/"
echo "  ✓ Schemas compiled"

# Create target directory
echo "▸ Installing to $EXTENSION_DIR..."
mkdir -p "$EXTENSION_DIR"

# Copy files (exclude .git and dev files)
rsync -av --delete \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='install.sh' \
    "$SOURCE_DIR/" "$EXTENSION_DIR/"

echo ""
echo "  ✓ Extension installed!"
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Next steps:                                         ║"
echo "║                                                      ║"
echo "║  1. Restart GNOME Shell:                             ║"
echo "║     X11:    Alt+F2 → type 'r' → Enter                ║"
echo "║     Wayland: Log out and back in                     ║"
echo "║                                                      ║"
echo "║  2. Enable the extension:                            ║"
echo "║     gnome-extensions enable $EXTENSION_UUID          ║"
echo "║                                                      ║"
echo "║  3. Open preferences:                                ║"
echo "║     gnome-extensions prefs $EXTENSION_UUID           ║"
echo "╚══════════════════════════════════════════════════════╝"
