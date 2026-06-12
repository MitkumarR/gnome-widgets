/**
 * Clo Widgets — Memory Widget
 * Displays live RAM usage percentage in the top panel with a dropdown
 * showing detailed memory breakdown.
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { readFile, formatBytes, clamp } from '../../utils/helpers.js';
import { SysPath, UsageThreshold } from '../../utils/constants.js';
import * as Log from '../../utils/logger.js';

// ── Panel indicator ─────────────────────────────────────────────────
const MemoryIndicator = GObject.registerClass(
class MemoryIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Clo Memory Widget', false);

        this._box = new St.BoxLayout({
            style_class: 'clo-widget-box clo-mem-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._box);

        this._icon = new St.Icon({
            icon_name: 'drive-harddisk-symbolic',
            style_class: 'clo-widget-icon',
        });
        this._box.add_child(this._icon);

        this._label = new St.Label({
            text: '…',
            style_class: 'clo-widget-label clo-mem-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._box.add_child(this._label);

        // ── Popup menu ──────────────────────────────────────────
        const headerItem = new PopupMenu.PopupMenuItem('Memory', {
            reactive: false,
            style_class: 'clo-popup-header',
        });
        this.menu.addMenuItem(headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._usedItem = new PopupMenu.PopupMenuItem('Used: …', { reactive: false });
        this._availItem = new PopupMenu.PopupMenuItem('Available: …', { reactive: false });
        this._totalItem = new PopupMenu.PopupMenuItem('Total: …', { reactive: false });
        this._swapItem = new PopupMenu.PopupMenuItem('Swap: …', { reactive: false });
        this._cachedItem = new PopupMenu.PopupMenuItem('Cached: …', { reactive: false });

        this.menu.addMenuItem(this._usedItem);
        this.menu.addMenuItem(this._availItem);
        this.menu.addMenuItem(this._totalItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._swapItem);
        this.menu.addMenuItem(this._cachedItem);
    }

    setUsage(percent, used, available, total, swap, cached) {
        const p = clamp(Math.round(percent), 0, 100);
        this._label.set_text(`${p}%`);

        // Color coding
        if (p >= UsageThreshold.HIGH)
            this._label.style_class = 'clo-widget-label clo-mem-label clo-usage-critical';
        else if (p >= UsageThreshold.MEDIUM)
            this._label.style_class = 'clo-widget-label clo-mem-label clo-usage-warning';
        else
            this._label.style_class = 'clo-widget-label clo-mem-label clo-usage-normal';

        // Popup details
        this._usedItem.label.set_text(`Used: ${formatBytes(used)}`);
        this._availItem.label.set_text(`Available: ${formatBytes(available)}`);
        this._totalItem.label.set_text(`Total: ${formatBytes(total)}`);
        this._swapItem.label.set_text(`Swap: ${formatBytes(swap.used)} / ${formatBytes(swap.total)}`);
        this._cachedItem.label.set_text(`Cached: ${formatBytes(cached)}`);
    }

    setIconVisible(visible) {
        this._icon.visible = visible;
    }
});

// ── Widget controller ───────────────────────────────────────────────
export class MemoryWidget {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._indicator = null;
        this._timerId = null;
    }

    get indicator() {
        return this._indicator;
    }

    enable() {
        this._indicator = new MemoryIndicator();
        this._indicator.setIconVisible(this._settings.getBool('memory-show-icon'));

        this._settings.connect('memory-show-icon', () => {
            this._indicator?.setIconVisible(this._settings.getBool('memory-show-icon'));
        });
        this._settings.connect('memory-update-interval', () => {
            this._restartTimer();
        });

        this._startTimer();
        Log.info('Memory widget enabled');
    }

    disable() {
        this._stopTimer();
        this._indicator = null;
        Log.info('Memory widget disabled');
    }

    _startTimer() {
        const interval = this._settings.getInt('memory-update-interval');
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
     * Parse /proc/meminfo and update the indicator.
     */
    _update() {
        const raw = readFile(SysPath.PROC_MEMINFO);
        if (!raw) return;

        const info = {};
        for (const line of raw.split('\n')) {
            const match = line.match(/^(\w+):\s+(\d+)/);
            if (match)
                info[match[1]] = parseInt(match[2], 10) * 1024; // kB → bytes
        }

        const total = info['MemTotal'] || 0;
        const available = info['MemAvailable'] || 0;
        const used = total - available;
        const cached = (info['Cached'] || 0) + (info['SReclaimable'] || 0) - (info['Shmem'] || 0);
        const swapTotal = info['SwapTotal'] || 0;
        const swapFree = info['SwapFree'] || 0;
        const swapUsed = swapTotal - swapFree;

        const percent = total > 0 ? (used / total) * 100 : 0;

        this._indicator?.setUsage(
            percent, used, available, total,
            { total: swapTotal, used: swapUsed },
            cached
        );
    }
}
