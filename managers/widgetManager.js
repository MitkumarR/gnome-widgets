/**
 * Clo Widgets — Widget Manager
 * Central registry that creates, enables, disables and destroys all widgets
 * based on user settings.
 */

import { WidgetId } from '../utils/constants.js';
import * as Log from '../utils/logger.js';

// Widget imports
import { CpuWidget } from '../widgets/processors/widget.js';
import { MemoryWidget } from '../widgets/memory/widget.js';
import { NetSpeedWidget } from '../widgets/netspeed/widget.js';
import { WeatherWidget } from '../widgets/weather/widget.js';

export class WidgetManager {
    /**
     * @param {SettingsManager} settingsManager
     * @param {LayoutManager} layoutManager
     * @param {Extension} extension
     */
    constructor(settingsManager, layoutManager, extension) {
        this._settings = settingsManager;
        this._layout = layoutManager;
        this._extension = extension;
        this._widgets = new Map();
        this._settingHandlers = [];

        Log.info('WidgetManager initialized');
    }

    /**
     * Initialize all widgets based on current settings.
     */
    enable() {
        const position = this._settings.getString('panel-position');

        // Register widget factories
        const registry = [
            {
                id: WidgetId.CPU,
                enableKey: 'cpu-enabled',
                factory: () => new CpuWidget(this._settings, this._extension),
            },
            {
                id: WidgetId.MEMORY,
                enableKey: 'memory-enabled',
                factory: () => new MemoryWidget(this._settings, this._extension),
            },
            {
                id: WidgetId.NETSPEED,
                enableKey: 'netspeed-enabled',
                factory: () => new NetSpeedWidget(this._settings, this._extension),
            },
            {
                id: WidgetId.WEATHER,
                enableKey: 'weather-enabled',
                factory: () => new WeatherWidget(this._settings, this._extension),
            },
        ];

        for (const entry of registry) {
            // Create and enable if setting is on
            if (this._settings.getBool(entry.enableKey)) {
                this._createWidget(entry, position);
            }

            // Watch for toggle changes
            const handlerId = this._settings.connect(entry.enableKey, () => {
                const enabled = this._settings.getBool(entry.enableKey);
                const pos = this._settings.getString('panel-position');
                if (enabled && !this._widgets.has(entry.id)) {
                    this._createWidget(entry, pos);
                } else if (!enabled && this._widgets.has(entry.id)) {
                    this._destroyWidget(entry.id);
                }
            });
            this._settingHandlers.push(handlerId);
        }

        // Watch for panel position changes
        const posHandler = this._settings.connect('panel-position', () => {
            Log.info('Panel position changed, repositioning widgets...');
            this._repositionAll();
        });
        this._settingHandlers.push(posHandler);

        Log.info('WidgetManager enabled — active widgets:', [...this._widgets.keys()].join(', '));
    }

    /**
     * Create and mount a single widget.
     */
    _createWidget(entry, position) {
        try {
            const widget = entry.factory();
            widget.enable();
            this._layout.addToPanel(entry.id, widget.indicator, position);
            this._widgets.set(entry.id, widget);
            Log.info(`Widget "${entry.id}" created`);
        } catch (e) {
            Log.error(`Failed to create widget "${entry.id}": ${e.message}`);
        }
    }

    /**
     * Destroy a single widget.
     */
    _destroyWidget(widgetId) {
        const widget = this._widgets.get(widgetId);
        if (widget) {
            widget.disable();
            this._layout.removeFromPanel(widgetId);
            this._widgets.delete(widgetId);
            Log.info(`Widget "${widgetId}" destroyed`);
        }
    }

    /**
     * Reposition all active widgets (destroy and re-add to new panel box).
     */
    _repositionAll() {
        const position = this._settings.getString('panel-position');
        for (const [id, widget] of this._widgets) {
            this._layout.removeFromPanel(id);
            this._layout.addToPanel(id, widget.indicator, position);
        }
    }

    /**
     * Disable and clean up all widgets.
     */
    disable() {
        for (const [id, widget] of this._widgets) {
            try {
                widget.disable();
            } catch (e) {
                Log.error(`Error disabling widget "${id}": ${e.message}`);
            }
        }
        this._widgets.clear();
        this._settingHandlers = [];
        Log.info('WidgetManager disabled');
    }
}
