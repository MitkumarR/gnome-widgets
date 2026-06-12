/**
 * Clo Widgets — CPU Widget
 * Displays live CPU usage percentage in the top panel with a dropdown
 * showing per-core breakdown.
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { readFile, clamp } from '../../utils/helpers.js';
import { SysPath, UsageThreshold } from '../../utils/constants.js';
import * as Log from '../../utils/logger.js';

// ── Panel indicator (top bar button) ────────────────────────────────
const CpuIndicator = GObject.registerClass(
class CpuIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Clo CPU Widget', false);

        // Container box
        this._box = new St.BoxLayout({
            style_class: 'clo-widget-box clo-cpu-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._box);

        // Icon
        this._icon = new St.Icon({
            icon_name: 'utilities-system-monitor-symbolic',
            style_class: 'clo-widget-icon',
        });
        this._box.add_child(this._icon);

        // Label
        this._label = new St.Label({
            text: '…',
            style_class: 'clo-widget-label clo-cpu-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._box.add_child(this._label);

        // ── Popup menu header ───────────────────────────────────────
        const headerItem = new PopupMenu.PopupMenuItem('CPU Usage', {
            reactive: false,
            style_class: 'clo-popup-header',
        });
        this.menu.addMenuItem(headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Container for per-core items (added dynamically)
        this._coreItems = [];
    }

    /**
     * Update the displayed percentage on the panel.
     */
    setUsage(percent) {
        const p = clamp(Math.round(percent), 0, 100);
        this._label.set_text(`${p}%`);

        // Color coding
        if (p >= UsageThreshold.HIGH)
            this._label.style_class = 'clo-widget-label clo-cpu-label clo-usage-critical';
        else if (p >= UsageThreshold.MEDIUM)
            this._label.style_class = 'clo-widget-label clo-cpu-label clo-usage-warning';
        else
            this._label.style_class = 'clo-widget-label clo-cpu-label clo-usage-normal';
    }

    /**
     * Update per-core breakdown in the popup menu.
     * @param {number[]} corePercents
     */
    setCoreUsage(corePercents) {
        // Create items on first call
        if (this._coreItems.length === 0) {
            for (let i = 0; i < corePercents.length; i++) {
                const item = new PopupMenu.PopupMenuItem('', { reactive: false });
                this.menu.addMenuItem(item);
                this._coreItems.push(item);
            }
        }

        for (let i = 0; i < corePercents.length; i++) {
            const p = clamp(Math.round(corePercents[i]), 0, 100);
            const bar = this._miniBar(p);
            if (this._coreItems[i])
                this._coreItems[i].label.set_text(`Core ${i}  ${bar}  ${p}%`);
        }
    }

    /**
     * Render a tiny ASCII bar for the popup.
     */
    _miniBar(percent) {
        const filled = Math.round(percent / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
    }

    setIconVisible(visible) {
        this._icon.visible = visible;
    }
});

// ── Widget controller ───────────────────────────────────────────────
export class CpuWidget {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._indicator = null;
        this._timerId = null;
        this._prevTotal = null;
        this._prevIdle = null;
        this._prevCoreTotal = null;
        this._prevCoreIdle = null;
    }

    get indicator() {
        return this._indicator;
    }

    enable() {
        this._indicator = new CpuIndicator();
        this._indicator.setIconVisible(this._settings.getBool('cpu-show-icon'));

        // Listen for setting changes
        this._settings.connect('cpu-show-icon', () => {
            this._indicator?.setIconVisible(this._settings.getBool('cpu-show-icon'));
        });
        this._settings.connect('cpu-update-interval', () => {
            this._restartTimer();
        });

        this._startTimer();
        Log.info('CPU widget enabled');
    }

    disable() {
        this._stopTimer();
        // Indicator is destroyed by LayoutManager
        this._indicator = null;
        this._prevTotal = null;
        this._prevIdle = null;
        this._prevCoreTotal = null;
        this._prevCoreIdle = null;
        Log.info('CPU widget disabled');
    }

    _startTimer() {
        const interval = this._settings.getInt('cpu-update-interval');
        // Immediate first read
        this._update();
        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                this._update();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopTimer() {
        if (this._timerId) {
            GLib.Source.remove(this._timerId);
            this._timerId = null;
        }
    }

    _restartTimer() {
        this._stopTimer();
        this._startTimer();
    }

    /**
     * Read /proc/stat and calculate overall + per-core CPU usage.
     */
    _update() {
        const raw = readFile(SysPath.PROC_STAT);
        if (!raw) return;

        const lines = raw.split('\n');

        // ── Overall CPU ─────────────────────────────────────────
        const cpuLine = lines[0]; // "cpu  user nice system idle iowait irq softirq ..."
        const cols = cpuLine.trim().split(/\s+/).slice(1).map(Number);
        const total = cols.reduce((a, b) => a + b, 0);
        const idle = cols[3] + (cols[4] || 0); // idle + iowait

        if (this._prevTotal !== null) {
            const dTotal = total - this._prevTotal;
            const dIdle = idle - this._prevIdle;
            const usage = dTotal > 0 ? ((dTotal - dIdle) / dTotal) * 100 : 0;
            this._indicator?.setUsage(usage);
        }

        this._prevTotal = total;
        this._prevIdle = idle;

        // ── Per-core ────────────────────────────────────────────
        const corePercents = [];
        const coreLines = lines.filter(l => /^cpu\d+/.test(l));

        if (!this._prevCoreTotal) {
            this._prevCoreTotal = new Array(coreLines.length).fill(0);
            this._prevCoreIdle = new Array(coreLines.length).fill(0);
        }

        for (let i = 0; i < coreLines.length; i++) {
            const cc = coreLines[i].trim().split(/\s+/).slice(1).map(Number);
            const ct = cc.reduce((a, b) => a + b, 0);
            const ci = cc[3] + (cc[4] || 0);
            const dct = ct - (this._prevCoreTotal[i] || 0);
            const dci = ci - (this._prevCoreIdle[i] || 0);
            const usage = dct > 0 ? ((dct - dci) / dct) * 100 : 0;
            corePercents.push(usage);
            this._prevCoreTotal[i] = ct;
            this._prevCoreIdle[i] = ci;
        }

        this._indicator?.setCoreUsage(corePercents);
    }
}
