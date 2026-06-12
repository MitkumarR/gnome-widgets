/**
 * Clo Widgets — Layout Manager
 * Handles placing and removing widgets from the GNOME Shell top panel.
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { PanelPosition } from '../utils/constants.js';
import * as Log from '../utils/logger.js';

export class LayoutManager {
    constructor() {
        this._indicators = new Map(); // widgetId → PanelMenu.Button
        Log.info('LayoutManager initialized');
    }

    /**
     * Add a widget indicator to the panel.
     * @param {string} widgetId - Unique identifier for the widget
     * @param {PanelMenu.Button} indicator - The panel button widget
     * @param {string} position - 'left', 'center', or 'right'
     */
    addToPanel(widgetId, indicator, position = PanelPosition.RIGHT) {
        if (this._indicators.has(widgetId)) {
            Log.warn(`Widget "${widgetId}" already in panel, removing old one first`);
            this.removeFromPanel(widgetId);
        }

        // Map position string → panel box name
        const boxName = this._resolveBox(position);
        Main.panel.addToStatusArea(`clo-${widgetId}`, indicator, -1, boxName);
        this._indicators.set(widgetId, indicator);
        Log.info(`Added widget "${widgetId}" to panel (${boxName})`);
    }

    /**
     * Remove a widget from the panel.
     * @param {string} widgetId
     */
    removeFromPanel(widgetId) {
        const indicator = this._indicators.get(widgetId);
        if (indicator) {
            indicator.destroy();
            this._indicators.delete(widgetId);
            Log.info(`Removed widget "${widgetId}" from panel`);
        }
    }

    /**
     * Remove all widgets from the panel.
     */
    removeAll() {
        for (const [widgetId] of this._indicators) {
            this.removeFromPanel(widgetId);
        }
    }

    /**
     * Resolve position string to GNOME panel box identifier.
     * @param {string} position
     * @returns {string}
     */
    _resolveBox(position) {
        switch (position) {
            case PanelPosition.LEFT:
                return 'left';
            case PanelPosition.CENTER:
                return 'center';
            case PanelPosition.RIGHT:
            default:
                return 'right';
        }
    }

    /**
     * Clean up.
     */
    destroy() {
        this.removeAll();
        Log.info('LayoutManager destroyed');
    }
}
