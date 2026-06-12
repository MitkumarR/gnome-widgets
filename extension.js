/**
 * Clo Widgets — Main Extension Entry Point
 * Orchestrates all widget managers and lifecycle.
 */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { SettingsManager } from './managers/settingsManager.js';
import { LayoutManager } from './managers/layoutManager.js';
import { WidgetManager } from './managers/widgetManager.js';
import * as Log from './utils/logger.js';

export default class CloWidgetsExtension extends Extension {
    enable() {
        Log.info('Enabling Clo Widgets…');

        this._settingsManager = new SettingsManager(this);
        this._layoutManager = new LayoutManager();
        this._widgetManager = new WidgetManager(
            this._settingsManager,
            this._layoutManager,
            this,
        );

        this._widgetManager.enable();
        Log.info('Clo Widgets enabled ✓');
    }

    disable() {
        Log.info('Disabling Clo Widgets…');

        this._widgetManager?.disable();
        this._layoutManager?.destroy();
        this._settingsManager?.destroy();

        this._widgetManager = null;
        this._layoutManager = null;
        this._settingsManager = null;

        Log.info('Clo Widgets disabled ✓');
    }
}