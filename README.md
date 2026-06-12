# Clo Widgets — GNOME Shell Extension

Beautiful, minimal desktop widgets for your GNOME top panel. Monitor your system at a glance.

![GNOME 45–50](https://img.shields.io/badge/GNOME-45%E2%80%9350-blue?style=flat-square)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Widgets

| Widget | Description |
|--------|-------------|
| **CPU** | Live CPU usage % with per-core breakdown dropdown |
| **Memory** | RAM usage % with used/available/total/swap/cached details |
| **Network Speed** | Real-time ↓ download / ↑ upload speed per interface |
| **Weather** | Current temperature & conditions via [Open-Meteo](https://open-meteo.com/) (no API key!) |

## Install

```bash
# Clone and install
git clone https://github.com/MitkumarR/gnome-widgets.git
cd gnome-widgets
./install.sh

# Then restart GNOME Shell:
#   X11:  Alt+F2 → type 'r' → Enter
#   Wayland:  Log out and back in

# Enable the extension
gnome-extensions enable clo-widgets@mitkumar.dev
```

## Configuration

Open preferences via:
```bash
gnome-extensions prefs clo-widgets@mitkumar.dev
```

Or use the **Extensions** app / **Extension Manager**.

### Available Settings

- **Panel Position** — Place widgets on the left, center, or right of the top panel
- **Per-widget toggles** — Enable/disable each widget independently
- **Update intervals** — Control refresh rates (1–30s for system monitors, 1–60min for weather)
- **Weather location** — Auto-detect via IP or enter a city name
- **Temperature units** — Celsius or Fahrenheit

## Architecture

```
gnome-widgets/
├── extension.js          # Entry point — lifecycle orchestration
├── prefs.js              # Settings UI (libadwaita)
├── stylesheet.css        # Panel & popup styling
├── metadata.json         # Extension metadata
├── schemas/              # GSettings schema
├── managers/
│   ├── settingsManager.js   # GSettings wrapper
│   ├── layoutManager.js     # Panel placement
│   └── widgetManager.js     # Widget registry & lifecycle
├── utils/
│   ├── constants.js      # Shared constants & WMO codes
│   ├── helpers.js        # File I/O, HTTP, formatting
│   └── logger.js         # Prefixed logging
└── widgets/
    ├── processors/       # CPU widget
    ├── memory/           # Memory widget
    ├── netspeed/         # Network speed widget
    └── weather/          # Weather widget + API
```

## Debugging

```bash
# Watch extension logs in real-time
journalctl -f -o cat GNOME_SHELL_EXTENSION_UUID=clo-widgets@mitkumar.dev

# Or filter by prefix
journalctl -f | grep "Clo Widgets"
```

## License

MIT — see [LICENSE](LICENSE) for details.
