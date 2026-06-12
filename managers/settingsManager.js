/**
 * Clo Widgets — Settings Manager
 * Wraps GSettings for convenient, type-safe access to extension preferences.
 */

import * as Log from '../utils/logger.js';

export class SettingsManager {
    /**
     * @param {object} extension - The Extension instance (provides getSettings())
     */
    constructor(extension) {
        this._extension = extension;
        this._settings = extension.getSettings();
        this._handlers = [];
        Log.info('SettingsManager initialized');
    }

    /**
     * Get a boolean setting.
     * @param {string} key
     * @returns {boolean}
     */
    getBool(key) {
        return this._settings.get_boolean(key);
    }

    /**
     * Get an integer setting.
     * @param {string} key
     * @returns {number}
     */
    getInt(key) {
        return this._settings.get_int(key);
    }

    /**
     * Get a string setting.
     * @param {string} key
     * @returns {string}
     */
    getString(key) {
        return this._settings.get_string(key);
    }

    /**
     * Connect to a setting change signal.
     * @param {string} key
     * @param {Function} callback
     */
    connect(key, callback) {
        const id = this._settings.connect(`changed::${key}`, () => {
            callback(key);
        });
        this._handlers.push(id);
        return id;
    }

    /**
     * Get the raw GSettings object (used for prefs binding).
     * @returns {Gio.Settings}
     */
    get raw() {
        return this._settings;
    }

    /**
     * Disconnect all signal handlers and clean up.
     */
    destroy() {
        for (const id of this._handlers) {
            try {
                this._settings.disconnect(id);
            } catch (e) {
                Log.warn(`Failed to disconnect settings handler: ${e.message}`);
            }
        }
        this._handlers = [];
        this._settings = null;
        Log.info('SettingsManager destroyed');
    }
}
