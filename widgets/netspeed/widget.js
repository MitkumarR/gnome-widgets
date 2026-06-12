/**
 * Clo Widgets — Network Speed Widget
 * Displays live upload/download speeds in the top panel.
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { readFile, formatSpeed } from '../../utils/helpers.js';
import { SysPath } from '../../utils/constants.js';
import * as Log from '../../utils/logger.js';

const NetSpeedIndicator = GObject.registerClass(
class NetSpeedIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Clo Network Speed Widget', false);

        this._box = new St.BoxLayout({
            style_class: 'clo-widget-box clo-net-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._box);

        this._icon = new St.Icon({
            icon_name: 'network-transmit-receive-symbolic',
            style_class: 'clo-widget-icon',
        });
        this._box.add_child(this._icon);

        this._speedBox = new St.BoxLayout({
            vertical: true,
            style_class: 'clo-net-speed-stack',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._box.add_child(this._speedBox);

        this._downLabel = new St.Label({ text: '↓ …', style_class: 'clo-net-speed-label clo-net-down' });
        this._upLabel = new St.Label({ text: '↑ …', style_class: 'clo-net-speed-label clo-net-up' });
        this._speedBox.add_child(this._downLabel);
        this._speedBox.add_child(this._upLabel);

        const headerItem = new PopupMenu.PopupMenuItem('Network Speed', { reactive: false, style_class: 'clo-popup-header' });
        this.menu.addMenuItem(headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._ifaceItems = new Map();
    }

    setSpeeds(downBps, upBps) {
        this._downLabel.set_text(`↓ ${formatSpeed(downBps)}`);
        this._upLabel.set_text(`↑ ${formatSpeed(upBps)}`);
    }

    setInterfaceSpeeds(interfaces) {
        for (const [name, data] of Object.entries(interfaces)) {
            if (!this._ifaceItems.has(name)) {
                const item = new PopupMenu.PopupMenuItem('', { reactive: false });
                this.menu.addMenuItem(item);
                this._ifaceItems.set(name, item);
            }
            this._ifaceItems.get(name).label.set_text(`${name}  ↓ ${formatSpeed(data.down)}  ↑ ${formatSpeed(data.up)}`);
        }
    }

    setIconVisible(visible) { this._icon.visible = visible; }
});

export class NetSpeedWidget {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._indicator = null;
        this._timerId = null;
        this._prevData = null;
        this._prevTime = null;
    }

    get indicator() { return this._indicator; }

    enable() {
        this._indicator = new NetSpeedIndicator();
        this._indicator.setIconVisible(this._settings.getBool('netspeed-show-icon'));
        this._settings.connect('netspeed-show-icon', () => {
            this._indicator?.setIconVisible(this._settings.getBool('netspeed-show-icon'));
        });
        this._settings.connect('netspeed-update-interval', () => this._restartTimer());
        this._startTimer();
        Log.info('Network speed widget enabled');
    }

    disable() {
        this._stopTimer();
        this._indicator = null;
        this._prevData = null;
        this._prevTime = null;
        Log.info('Network speed widget disabled');
    }

    _startTimer() {
        const interval = this._settings.getInt('netspeed-update-interval');
        this._update();
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
            this._update();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopTimer() {
        if (this._timerId) { GLib.Source.remove(this._timerId); this._timerId = null; }
    }

    _restartTimer() { this._stopTimer(); this._startTimer(); }

    _update() {
        const raw = readFile(SysPath.PROC_NET_DEV);
        if (!raw) return;

        const now = GLib.get_monotonic_time() / 1000000;
        const lines = raw.split('\n').slice(2);
        const currentData = {};

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const parts = trimmed.split(/[:\s]+/);
            const iface = parts[0];
            if (iface === 'lo') continue;
            currentData[iface] = { rx: parseInt(parts[1], 10) || 0, tx: parseInt(parts[9], 10) || 0 };
        }

        if (this._prevData && this._prevTime) {
            const dt = now - this._prevTime;
            if (dt > 0) {
                let totalDown = 0, totalUp = 0;
                const ifaceSpeeds = {};
                for (const [iface, cur] of Object.entries(currentData)) {
                    const prev = this._prevData[iface];
                    if (!prev) continue;
                    const down = Math.max(0, (cur.rx - prev.rx) / dt);
                    const up = Math.max(0, (cur.tx - prev.tx) / dt);
                    totalDown += down;
                    totalUp += up;
                    ifaceSpeeds[iface] = { down, up };
                }
                this._indicator?.setSpeeds(totalDown, totalUp);
                this._indicator?.setInterfaceSpeeds(ifaceSpeeds);
            }
        }

        this._prevData = currentData;
        this._prevTime = now;
    }
}
